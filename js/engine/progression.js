// ASHEN TACTICS: EMBERS OF LORDRAN — progression engine (CONTRACT.md §5.4).
// Stats, battle-unit assembly, character/player experience, ascension, traces, estus.

window.DS = window.DS || {};

(function () {
  const ESTUS_REGEN_MS = 360000; // one estus restored per 6 minutes

  const STAT_TIME_KEYS = ['atkPct', 'hpPct', 'defPct', 'spdPct', 'critRate', 'critDmg',
    'breakEffect', 'healBoost', 'energyRegen', 'dmgBoostElement'];
  const BATTLE_TIME_KEYS = ['battleStartEnergy', 'battleStartShieldPct', 'spOnBattleStart',
    'dmgVsBrokenPct', 'dmgVsDebuffedPct', 'ultDmgPct', 'skillDmgPct', 'basicDmgPct',
    'followUpDmgPct', 'onBreakEnergy', 'onKillAtkPct', 'lowHpDmgReduction', 'dotDmgPct',
    'healOnUltPct', 'energyOnHitTaken'];

  // Ascension cost curve, index = current ascension rank (asc N -> N+1).
  // Endpoints fixed by contract: 0->1 = ember_asc_1 x3 + 20k souls,
  // 5->6 = ember_asc_3 x6 + boss_soul_fragment x3 + 200k souls.
  const ASC_COSTS = [
    { souls: 20000, items: { ember_asc_1: 3 } },
    { souls: 45000, items: { ember_asc_1: 6 } },
    { souls: 80000, items: { ember_asc_2: 3, demon_core: 2 } },
    { souls: 120000, items: { ember_asc_2: 6, demon_core: 4 } },
    { souls: 160000, items: { ember_asc_3: 3, boss_soul_fragment: 2 } },
    { souls: 200000, items: { ember_asc_3: 6, boss_soul_fragment: 3 } },
  ];

  // ---------- lookups ----------

  function charDef(charId) {
    return DS.CHARACTERS ? (DS.CHARACTERS.find((c) => c.id === charId) || null) : null;
  }

  function weaponDef(defId) {
    return DS.WEAPONS ? (DS.WEAPONS.find((w) => w.id === defId) || null) : null;
  }

  function relicSet(setId) {
    return DS.RELIC_SETS ? (DS.RELIC_SETS.find((s) => s.id === setId) || null) : null;
  }

  function rosterOf(charId) {
    return (DS.State && DS.State.roster && DS.State.roster[charId]) || null;
  }

  function itemName(id) {
    const def = DS.ITEMS ? DS.ITEMS.find((i) => i.id === id) : null;
    return def ? def.name : id;
  }

  function isBattleKey(key) {
    return BATTLE_TIME_KEYS.indexOf(key) >= 0;
  }

  function round4(v) {
    return Math.round(v * 10000) / 10000;
  }

  function posInt(n) {
    n = Math.floor(Number(n));
    return isFinite(n) && n > 0 ? n : 0;
  }

  // Pull a single numeric magnitude out of an fx params blob (number or {pct|value|amount}).
  function fxNum(params) {
    if (typeof params === 'number') return params;
    if (params && typeof params === 'object') {
      if (typeof params.pct === 'number') return params.pct;
      if (typeof params.value === 'number') return params.value;
      if (typeof params.amount === 'number') return params.amount;
    }
    return 0;
  }

  // Merge a weapon fx entry's params with its perRefine gains for the given refine rank (1..5).
  function refineParams(fx, refine) {
    const ranks = Math.max(0, (refine || 1) - 1);
    const base = fx.params;
    const per = fx.perRefine;
    if (typeof base === 'number') {
      const perVal = typeof per === 'number' ? per : fxNum(per);
      return base + perVal * ranks;
    }
    const out = {};
    if (base && typeof base === 'object') {
      Object.keys(base).forEach((k) => { out[k] = base[k]; });
    }
    if (per && ranks > 0) {
      if (typeof per === 'number') {
        if (typeof out.pct === 'number') out.pct += per * ranks;
        else if (typeof out.amount === 'number') out.amount += per * ranks;
        else if (typeof out.value === 'number') out.value += per * ranks;
        else out.pct = per * ranks;
      } else if (typeof per === 'object') {
        Object.keys(per).forEach((k) => {
          if (typeof per[k] === 'number') {
            out[k] = (typeof out[k] === 'number' ? out[k] : 0) + per[k] * ranks;
          }
        });
      }
    }
    return out;
  }

  // Battle engine reads named props off params; if data supplied a bare number, offer it
  // under every common name so any EFFECT_KEYS hook can read it.
  function wrapParams(params) {
    if (typeof params === 'number') return { pct: params, amount: params, value: params };
    return params || {};
  }

  // ---------- weapon UI helpers: live current-value readouts ----------
  // The passive.desc string on a weapon def is hand-written flavor text describing the
  // BASE (refine 1) numbers plus the per-refine rule in prose — it never changes. These
  // helpers compute the weapon's ACTUAL current numbers (from its real level/refine) for
  // display, so the Bottomless Box / Weapon tab can show live stats instead of stale text.
  const WEAPON_FX_LABEL = {
    atkPct: 'ATK', hpPct: 'Max HP', defPct: 'DEF', spdPct: 'SPD',
    critRate: 'CRIT Rate', critDmg: 'CRIT DMG', breakEffect: 'Break Effect',
    healBoost: 'Healing Boost', energyRegen: 'Energy Regen',
    dmgVsBrokenPct: 'Damage to Broken enemies', dmgVsDebuffedPct: 'Damage to debuffed enemies',
    ultDmgPct: 'Ultimate damage', skillDmgPct: 'Skill damage', basicDmgPct: 'Basic damage',
    followUpDmgPct: 'Follow-up damage', dotDmgPct: 'DoT damage',
    healOnUltPct: 'Heal on Ultimate (% Max HP)', battleStartShieldPct: 'Battle-start shield (% Max HP)',
    onKillAtkPct: 'ATK on kill', lowHpDmgReduction: 'Damage reduction at low HP',
    battleStartEnergy: 'Battle-start Energy', energyOnHitTaken: 'Energy on hit taken',
  };
  function pctStr(v) { return (Math.round(v * 1000) / 10) + '%'; }

  function weaponFxNowLabel(fx, refine) {
    const p = refineParams(fx, refine);
    const label = WEAPON_FX_LABEL[fx.key] || fx.key;
    if (fx.key === 'dmgBoostElement') return (p.element || '') + ' damage +' + pctStr(typeof p.pct === 'number' ? p.pct : fxNum(p));
    if (fx.key === 'battleStartEnergy' || fx.key === 'energyOnHitTaken') {
      return label + ' +' + (Math.round((typeof p.amount === 'number' ? p.amount : fxNum(p)) * 10) / 10);
    }
    if (fx.key === 'spOnBattleStart') return 'Battle-start SP +' + (Math.round((typeof p.amount === 'number' ? p.amount : fxNum(p)) * 100) / 100);
    const pct = typeof p.pct === 'number' ? p.pct : fxNum(p);
    let extra = '';
    if (fx.key === 'onKillAtkPct' && p.turns) extra = ' for ' + p.turns + ' turns';
    if (fx.key === 'lowHpDmgReduction' && typeof p.threshold === 'number') extra = ' below ' + Math.round(p.threshold * 100) + '% HP';
    return label + ' +' + pctStr(pct) + extra;
  }

  // Array of current human-readable passive value strings, e.g. ['ATK +27.0%', 'Damage to Broken enemies +36.0%'].
  function weaponPassiveNow(uid) {
    const w = DS.State.inventory.weapons[uid];
    const wdef = w ? weaponDef(w.defId) : null;
    if (!w || !wdef || !wdef.passive || !wdef.passive.fx) return [];
    return wdef.passive.fx.map((fx) => weaponFxNowLabel(fx, w.refine));
  }

  // Weapon's raw ATK/HP/DEF contribution at its current level (refine does not affect these).
  function weaponStatsNow(uid) {
    const w = DS.State.inventory.weapons[uid];
    const wdef = w ? weaponDef(w.defId) : null;
    if (!w || !wdef) return null;
    const scale = 1 + 0.08 * (Math.max(1, w.level || 1) - 1);
    return {
      atk: Math.round((wdef.baseAtk || 0) * scale),
      hp: Math.round((wdef.baseHp || 0) * scale),
      def: Math.round((wdef.baseDef || 0) * scale),
    };
  }

  // ---------- stat accumulation ----------

  function applyStatKey(acc, key, value) {
    const v = typeof value === 'number' ? value : 0;
    if (!v) return;
    switch (key) {
      case 'hpPct': acc.pct.hp += v; break;
      case 'atkPct': acc.pct.atk += v; break;
      case 'defPct': acc.pct.def += v; break;
      case 'spdPct': acc.pct.spd += v; break;
      case 'hpFlat': case 'hp': acc.flat.hp += v; break;
      case 'atkFlat': case 'atk': acc.flat.atk += v; break;
      case 'defFlat': case 'def': acc.flat.def += v; break;
      case 'spd': acc.flat.spd += v; break;
      case 'critRate': case 'critDmg': case 'breakEffect': case 'effectHitRate':
      case 'effectRes': case 'healBoost': case 'energyRegen':
        acc[key] += v; break;
      default: break;
    }
  }

  function applyStatFx(acc, key, params) {
    if (key === 'dmgBoostElement') {
      const el = params && params.element;
      if (el) acc.dmgBoost[el] = (acc.dmgBoost[el] || 0) + fxNum(params);
      return;
    }
    applyStatKey(acc, key, fxNum(params));
  }

  function collectSetCounts(r) {
    const counts = {};
    if (!DS.State || !DS.State.inventory || !DS.State.inventory.relics) return counts;
    DS.SLOTS.forEach((slot) => {
      const uid = r.relics ? r.relics[slot] : null;
      const rel = uid ? DS.State.inventory.relics[uid] : null;
      if (rel && rel.setId) counts[rel.setId] = (counts[rel.setId] || 0) + 1;
    });
    return counts;
  }

  function equippedWeapon(r) {
    if (!r || !r.weaponUid || !DS.State || !DS.State.inventory) return null;
    return DS.State.inventory.weapons[r.weaponUid] || null;
  }

  // ---------- computeStats ----------

  function computeStats(charId) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r || !def.base || !def.growth) return null;
    const level = Math.max(1, r.level || 1);
    const ascMult = 1 + 0.12 * (r.asc || 0);

    let baseHp = (def.base.hp + def.growth.hp * (level - 1)) * ascMult;
    let baseAtk = (def.base.atk + def.growth.atk * (level - 1)) * ascMult;
    let baseDef = (def.base.def + def.growth.def * (level - 1)) * ascMult;
    const baseSpd = def.base.spd || 100;

    const w = equippedWeapon(r);
    const wdef = w ? weaponDef(w.defId) : null;
    if (w && wdef) {
      const scale = 1 + 0.08 * (Math.max(1, w.level || 1) - 1);
      baseHp += (wdef.baseHp || 0) * scale;
      baseAtk += (wdef.baseAtk || 0) * scale;
      baseDef += (wdef.baseDef || 0) * scale;
    }

    const acc = {
      pct: { hp: 0, atk: 0, def: 0, spd: 0 },
      flat: { hp: 0, atk: 0, def: 0, spd: 0 },
      critRate: typeof def.critRate === 'number' ? def.critRate : 0.05,
      critDmg: typeof def.critDmg === 'number' ? def.critDmg : 0.5,
      breakEffect: 0,
      effectHitRate: 0,
      effectRes: 0,
      healBoost: 0,
      energyRegen: 0,
      dmgBoost: {},
    };

    // Trace nodes: 'stat' nodes plus stat-time 'bonus' nodes.
    const tree = DS.TRACES ? DS.TRACES[charId] : null;
    const nodes = tree && Array.isArray(tree.nodes) ? tree.nodes : [];
    nodes.forEach((node) => {
      if (!node || !r.traces || !r.traces[node.id]) return;
      if (node.kind === 'stat' && node.stat) {
        applyStatKey(acc, node.stat.key, node.stat.value);
      } else if (node.kind === 'bonus' && node.bonus && !isBattleKey(node.bonus.key)) {
        applyStatFx(acc, node.bonus.key, node.bonus.params);
      }
    });

    // Weapon passive stat-time fx, scaled by refine rank.
    if (w && wdef && wdef.passive && Array.isArray(wdef.passive.fx)) {
      wdef.passive.fx.forEach((f) => {
        if (!f || isBattleKey(f.key)) return;
        applyStatFx(acc, f.key, refineParams(f, w.refine));
      });
    }

    // Relics: main stat + substats.
    if (DS.State.inventory && DS.State.inventory.relics) {
      DS.SLOTS.forEach((slot) => {
        const uid = r.relics ? r.relics[slot] : null;
        const rel = uid ? DS.State.inventory.relics[uid] : null;
        if (!rel) return;
        if (rel.mainStat) applyStatKey(acc, rel.mainStat.key, rel.mainStat.value);
        (rel.subStats || []).forEach((s) => {
          if (s) applyStatKey(acc, s.key, s.value);
        });
      });
    }

    // Relic set bonuses (stat-time portion; battle-time keys merge in buildBattleUnit).
    const counts = collectSetCounts(r);
    Object.keys(counts).forEach((setId) => {
      const set = relicSet(setId);
      if (!set) return;
      if (counts[setId] >= 2 && set.bonus2 && set.bonus2.fx && !isBattleKey(set.bonus2.fx.key)) {
        applyStatFx(acc, set.bonus2.fx.key, set.bonus2.fx.params);
      }
      if (counts[setId] >= 4 && set.bonus4 && set.bonus4.fx && !isBattleKey(set.bonus4.fx.key)) {
        applyStatFx(acc, set.bonus4.fx.key, set.bonus4.fx.params);
      }
    });

    // Remembrance stat-time fx for every unlocked tier.
    const remLevel = r.remembrance || 0;
    (def.remembrance || []).forEach((entry) => {
      if (!entry || (entry.level || 0) > remLevel || !entry.fx) return;
      const list = Array.isArray(entry.fx) ? entry.fx : [entry.fx];
      list.forEach((f) => {
        if (f && !isBattleKey(f.key)) applyStatFx(acc, f.key, f.params);
      });
    });

    const dmgBoost = {};
    Object.keys(acc.dmgBoost).forEach((el) => { dmgBoost[el] = round4(acc.dmgBoost[el]); });

    return {
      hp: Math.max(1, Math.round(baseHp * (1 + acc.pct.hp) + acc.flat.hp)),
      atk: Math.max(1, Math.round(baseAtk * (1 + acc.pct.atk) + acc.flat.atk)),
      def: Math.max(0, Math.round(baseDef * (1 + acc.pct.def) + acc.flat.def)),
      spd: Math.round((baseSpd * (1 + acc.pct.spd) + acc.flat.spd) * 10) / 10,
      critRate: round4(acc.critRate),
      critDmg: round4(acc.critDmg),
      breakEffect: round4(acc.breakEffect),
      effectHitRate: round4(acc.effectHitRate),
      effectRes: round4(acc.effectRes),
      healBoost: round4(acc.healBoost),
      energyRegen: round4(acc.energyRegen),
      dmgBoost,
    };
  }

  // ---------- battle unit assembly ----------

  // Total power multiplier for one ability slot from unlocked 'abilityUp' trace nodes.
  function tracePowerMult(charId, slot) {
    const r = rosterOf(charId);
    const tree = DS.TRACES ? DS.TRACES[charId] : null;
    const nodes = tree && Array.isArray(tree.nodes) ? tree.nodes : [];
    let mult = 1;
    if (!r) return mult;
    nodes.forEach((node) => {
      if (!node || !r.traces || !r.traces[node.id] || node.kind !== 'abilityUp') return;
      const which = typeof node.ability === 'string'
        ? node.ability
        : (node.ability && (node.ability.slot || node.ability.which)) || null;
      if (which !== slot) return;
      let pct = typeof node.powerPct === 'number'
        ? node.powerPct
        : (node.ability && typeof node.ability.powerPct === 'number' ? node.ability.powerPct : 0);
      if (pct >= 1) pct = pct / 100; // tolerate whole-percent data (e.g. 12 -> 0.12)
      mult += pct;
    });
    return mult;
  }

  function scaledAbility(ab, mult) {
    if (!ab) return null;
    const copy = {};
    Object.keys(ab).forEach((k) => { copy[k] = ab[k]; });
    if (typeof copy.power === 'number') {
      copy.power = Math.round(copy.power * mult * 1000) / 1000;
    }
    return copy;
  }

  function buildBattleUnit(charId) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r) return null;
    const stats = computeStats(charId);
    if (!stats) return null;

    const abilities = {
      basic: scaledAbility(def.basic, tracePowerMult(charId, 'basic')),
      skill: scaledAbility(def.skill, tracePowerMult(charId, 'skill')),
      ult: scaledAbility(def.ult, tracePowerMult(charId, 'ult')),
      talent: def.talent || null,
      technique: def.technique || null,
    };

    const fx = [];

    // Weapon passive battle-time fx, refine-scaled.
    const w = equippedWeapon(r);
    const wdef = w ? weaponDef(w.defId) : null;
    if (w && wdef && wdef.passive && Array.isArray(wdef.passive.fx)) {
      wdef.passive.fx.forEach((f) => {
        if (f && isBattleKey(f.key)) {
          fx.push({ key: f.key, params: wrapParams(refineParams(f, w.refine)) });
        }
      });
    }

    // Relic set battle-time fx (2pc and 4pc, whichever hold battle keys).
    const counts = collectSetCounts(r);
    Object.keys(counts).forEach((setId) => {
      const set = relicSet(setId);
      if (!set) return;
      if (counts[setId] >= 2 && set.bonus2 && set.bonus2.fx && isBattleKey(set.bonus2.fx.key)) {
        fx.push({ key: set.bonus2.fx.key, params: wrapParams(set.bonus2.fx.params) });
      }
      if (counts[setId] >= 4 && set.bonus4 && set.bonus4.fx && isBattleKey(set.bonus4.fx.key)) {
        fx.push({ key: set.bonus4.fx.key, params: wrapParams(set.bonus4.fx.params) });
      }
    });

    // Remembrance battle-time fx.
    const remLevel = r.remembrance || 0;
    (def.remembrance || []).forEach((entry) => {
      if (!entry || (entry.level || 0) > remLevel || !entry.fx) return;
      const list = Array.isArray(entry.fx) ? entry.fx : [entry.fx];
      list.forEach((f) => {
        if (f && isBattleKey(f.key)) fx.push({ key: f.key, params: wrapParams(f.params) });
      });
    });

    // Trace 'bonus' nodes carrying battle-time keys.
    const tree = DS.TRACES ? DS.TRACES[charId] : null;
    const nodes = tree && Array.isArray(tree.nodes) ? tree.nodes : [];
    nodes.forEach((node) => {
      if (!node || !r.traces || !r.traces[node.id]) return;
      if (node.kind === 'bonus' && node.bonus && isBattleKey(node.bonus.key)) {
        fx.push({ key: node.bonus.key, params: wrapParams(node.bonus.params) });
      }
    });

    return {
      uid: 'ally_' + charId,
      defId: charId,
      name: def.name,
      element: def.element,
      path: def.path,
      rarity: def.rarity,
      art: def.art,
      level: Math.max(1, r.level || 1),
      stats,
      maxEnergy: def.maxEnergy || 100,
      abilities,
      fx,
    };
  }

  // ---------- character experience & ascension ----------

  // The ascension track (DS.LEVEL_CAPS) is only half of a character's level cap —
  // the other half is the player's own Bonfire Level, so the roster can't be pumped
  // straight to Lv.20+ on turn one. Every Bonfire Level raises this ceiling by
  // exactly one, so growing the roster further always means going out and earning
  // another Bonfire Level first.
  // Bonfire Level unlocks the character-level cap in coarse tiers rather than
  // 1:1 — Bonfire Lv.1 → cap 20, Lv.2 → 40, Lv.3 → 60, Lv.4+ → 80 (the
  // ascension system's own ceiling anyway, so nothing above 80 would ever
  // matter here regardless of how high Bonfire Level climbs).
  const BONFIRE_CHAR_CAP_TIERS = [20, 40, 60, 80];
  function bonfireLevelCap() {
    const lvl = (DS.State && DS.State.player && DS.State.player.level) || 1;
    const idx = Math.max(0, Math.min(BONFIRE_CHAR_CAP_TIERS.length - 1, lvl - 1));
    return BONFIRE_CHAR_CAP_TIERS[idx];
  }

  function charLevelCap(charId) {
    const r = rosterOf(charId);
    const ascCap = DS.LEVEL_CAPS[Math.min((r && r.asc) || 0, DS.LEVEL_CAPS.length - 1)];
    return Math.min(ascCap, bonfireLevelCap());
  }

  function applyCharLevels(r) {
    const ascCap = DS.LEVEL_CAPS[Math.min(r.asc || 0, DS.LEVEL_CAPS.length - 1)];
    const cap = Math.min(ascCap, bonfireLevelCap());
    let levels = 0;
    while (r.level < cap && r.exp >= DS.CURVES.charXp(r.level)) {
      r.exp -= DS.CURVES.charXp(r.level);
      r.level += 1;
      levels += 1;
    }
    return { levels, cap };
  }

  // Adds exp only; consumes nothing (DS.Inventory feeds materials, then calls this).
  // Overflow past the cap is banked and unlocks levels on the next ascension (or the
  // next Bonfire Level, whichever cap was actually binding).
  // Does not persist — callers that loop (feedSoulsToMax) persist once at the end.
  function addExpNoSave(charId, amount) {
    const r = rosterOf(charId);
    if (!r) return { levels: 0, cap: 0 };
    // Doubled here — the single choke point every character-exp source (soul items,
    // future rewards) funnels through — so levelling up stays fast even with the
    // new Bonfire-Level cap in place above.
    r.exp = (r.exp || 0) + posInt(amount) * 2;
    return applyCharLevels(r);
  }

  function gainCharExp(charId, amount) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r) return { ok: false, reason: 'Unknown character.' };
    const res = addExpNoSave(charId, amount);
    DS.Save.persist();
    return { ok: true, levels: res.levels, level: r.level, exp: r.exp, cap: res.cap, atCap: r.level >= res.cap };
  }

  // Feeds souls from the bottomless box, biggest denomination first, one at a time,
  // stopping the instant the level cap for the current ascension is reached or the
  // box runs dry — mirrors clicking each soul card by hand, just automated.
  const SOUL_FEED_IDS = ['soul_hero', 'soul_large', 'soul_small'];

  function feedSoulsToMax(charId) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r) return { ok: false, reason: 'Unknown character.' };
    const ascCap = DS.LEVEL_CAPS[r.asc || 0];
    const bfCap = bonfireLevelCap();
    const cap = Math.min(ascCap, bfCap);
    if (r.level >= cap) {
      const reason = bfCap < ascCap
        ? 'Reach Bonfire Level ' + (bfCap + 1) + ' before they can grow further.'
        : 'They stand at the level cap for this ascension.';
      return { ok: false, reason, levels: 0, cap };
    }
    const inv = DS.State.inventory.items;
    let totalLevels = 0;
    const fed = {};
    while (r.level < cap) {
      const id = SOUL_FEED_IDS.find((sid) => (inv[sid] || 0) > 0);
      if (!id) break;
      inv[id] -= 1;
      if (inv[id] <= 0) delete inv[id];
      fed[id] = (fed[id] || 0) + 1;
      const itemDef = DS.ITEMS ? DS.ITEMS.find((i) => i.id === id) : null;
      const res = addExpNoSave(charId, (itemDef && itemDef.xp) || 500);
      totalLevels += res.levels;
    }
    if (!Object.keys(fed).length) return { ok: false, reason: 'No souls to offer.', levels: 0, cap };
    DS.Save.persist();
    return { ok: true, levels: totalLevels, fed, level: r.level, cap, atCap: r.level >= cap };
  }

  function ascendCost(charId) {
    const r = rosterOf(charId);
    if (!r) return null;
    const asc = r.asc || 0;
    if (asc >= ASC_COSTS.length) return null;
    return { asc, cost: ASC_COSTS[asc], levelReq: DS.LEVEL_CAPS[asc], newCap: DS.LEVEL_CAPS[asc + 1] };
  }

  function canAscend(charId) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r) return { ok: false, reason: 'Unknown character.' };
    const info = ascendCost(charId);
    if (!info) return { ok: false, reason: 'They stand at the summit of their strength.' };
    const cost = info.cost;
    if ((r.level || 1) < info.levelReq) {
      return { ok: false, reason: 'Reach level ' + info.levelReq + ' before the flame will take them higher.', cost, levelReq: info.levelReq };
    }
    if (DS.State.currencies.souls < (cost.souls || 0)) {
      return { ok: false, reason: 'Not enough souls.', cost };
    }
    const items = cost.items || {};
    const missing = Object.keys(items).find((id) => (DS.State.inventory.items[id] || 0) < items[id]);
    if (missing) {
      return { ok: false, reason: 'Missing ' + itemName(missing) + ' ×' + items[missing] + '.', cost };
    }
    return { ok: true, cost, newCap: info.newCap };
  }

  function ascend(charId) {
    const chk = canAscend(charId);
    if (!chk.ok) return chk;
    const r = rosterOf(charId);
    const cost = chk.cost;
    DS.State.currencies.souls -= cost.souls || 0;
    const items = cost.items || {};
    Object.keys(items).forEach((id) => {
      DS.State.inventory.items[id] -= items[id];
      if (DS.State.inventory.items[id] <= 0) delete DS.State.inventory.items[id];
    });
    r.asc = (r.asc || 0) + 1;
    const lv = applyCharLevels(r); // banked exp may cash in immediately
    DS.Save.persist();
    return { ok: true, asc: r.asc, newCap: DS.LEVEL_CAPS[r.asc], levelsFromBanked: lv.levels };
  }

  // ---------- traces ----------

  function unlockTrace(charId, nodeId) {
    const def = charDef(charId);
    const r = rosterOf(charId);
    if (!def || !r) return { ok: false, reason: 'Unknown character.' };
    const tree = DS.TRACES ? DS.TRACES[charId] : null;
    const node = tree && Array.isArray(tree.nodes)
      ? tree.nodes.find((n) => n && n.id === nodeId)
      : null;
    if (!node) return { ok: false, reason: 'Unknown trace.' };
    if (!r.traces) r.traces = {};
    if (r.traces[nodeId]) return { ok: false, reason: 'That trace is already kindled.' };
    const reqs = node.requires || [];
    const unmet = reqs.find((reqId) => !r.traces[reqId]);
    if (unmet) return { ok: false, reason: 'A prior trace must be kindled first.', requires: unmet };
    const cost = node.cost || {};
    const souls = cost.souls || 0;
    if (DS.State.currencies.souls < souls) return { ok: false, reason: 'Not enough souls.', cost };
    const items = cost.items || {};
    const missing = Object.keys(items).find((id) => (DS.State.inventory.items[id] || 0) < items[id]);
    if (missing) {
      return { ok: false, reason: 'Missing ' + itemName(missing) + ' ×' + items[missing] + '.', cost };
    }
    DS.State.currencies.souls -= souls;
    Object.keys(items).forEach((id) => {
      DS.State.inventory.items[id] -= items[id];
      if (DS.State.inventory.items[id] <= 0) delete DS.State.inventory.items[id];
    });
    r.traces[nodeId] = true;
    DS.Save.persist();
    return { ok: true, node };
  }

  // ---------- display power ----------

  function charPower(charId) {
    const s = computeStats(charId);
    if (!s) return 0;
    let boost = 0;
    Object.keys(s.dmgBoost).forEach((el) => { boost += s.dmgBoost[el]; });
    const offense = s.atk * (1 + s.critRate * s.critDmg) * (1 + boost * 0.5);
    const bulk = s.hp * 0.25 + s.def * 0.6;
    const tempo = s.spd * 9;
    const util = (s.breakEffect + s.effectHitRate + s.effectRes + s.healBoost + s.energyRegen) * 220;
    return Math.round(offense + bulk + tempo + util);
  }

  // ---------- bonfire (player) level & estus ----------

  function gainPlayerExp(amount) {
    if (!DS.State || !DS.State.player) return 0;
    const p = DS.State.player;
    // Doubled — Bonfire Level now also gates the roster's own level cap (see
    // charLevelCap above), so it needs to climb fast enough that lock doesn't stall
    // out how quickly the whole roster can grow.
    p.exp = (p.exp || 0) + posInt(amount) * 2;
    let levels = 0;
    while (p.exp >= DS.CURVES.playerXp(p.level)) {
      p.exp -= DS.CURVES.playerXp(p.level);
      p.level += 1;
      levels += 1;
      p.estusMax += 5;
      p.estus = p.estusMax; // each bonfire level refills the flask
      p.lastEstusTs = Date.now();
    }
    DS.Save.persist();
    return levels;
  }

  function estusTick() {
    const p = DS.State ? DS.State.player : null;
    if (!p) return { estus: 0, estusMax: 0, msToNext: null };
    const now = Date.now();
    if (!p.lastEstusTs || p.lastEstusTs > now) p.lastEstusTs = now;
    if (p.estus >= p.estusMax) {
      p.lastEstusTs = now;
      return { estus: p.estus, estusMax: p.estusMax, msToNext: null };
    }
    const gained = Math.floor((now - p.lastEstusTs) / ESTUS_REGEN_MS);
    if (gained > 0) {
      p.estus = Math.min(p.estusMax, p.estus + gained);
      p.lastEstusTs = p.estus >= p.estusMax ? now : p.lastEstusTs + gained * ESTUS_REGEN_MS;
      DS.Save.persist();
    }
    const msToNext = p.estus >= p.estusMax
      ? null
      : Math.max(0, p.lastEstusTs + ESTUS_REGEN_MS - now);
    return { estus: p.estus, estusMax: p.estusMax, msToNext };
  }

  function spendEstus(n) {
    n = posInt(n);
    estusTick();
    const p = DS.State ? DS.State.player : null;
    if (!p) return { ok: false, reason: 'No save loaded.' };
    if (p.estus < n) {
      return { ok: false, reason: 'Not enough Estus. Rest a while, or crush a shard.', estus: p.estus };
    }
    const wasFull = p.estus >= p.estusMax;
    p.estus -= n;
    if (wasFull) p.lastEstusTs = Date.now(); // regen clock starts the moment the flask dips
    DS.Save.persist();
    return { ok: true, estus: p.estus };
  }

  DS.Progression = {
    computeStats,
    buildBattleUnit,
    tracePowerMult,
    gainCharExp,
    charLevelCap,
    feedSoulsToMax,
    canAscend,
    ascend,
    ascendCost,
    ascensionCosts: ASC_COSTS,
    unlockTrace,
    charPower,
    gainPlayerExp,
    spendEstus,
    estusTick,
    ESTUS_REGEN_MS,
    STAT_TIME_KEYS,
    BATTLE_TIME_KEYS,
    weaponPassiveNow,
    weaponStatsNow,
  };
})();
