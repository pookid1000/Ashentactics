// ASHEN TACTICS — inventory engine (CONTRACT.md §5.5).
// Weapons (exp/refine/equip), relics (roll/enhance/equip/salvage), items.

window.DS = window.DS || {};

(function () {
  const WEAPON_XP = { titanite_shard: 300, titanite_large: 1200, titanite_chunk: 4800 };
  const SALVAGE_DUST = { 3: 8, 4: 20, 5: 50 };
  const MAX_RELIC_LEVEL = 15;
  const MAX_REFINE = 5;
  const MAX_RELICS = 300;

  function itemDef(id) { return (DS.ITEMS || []).find((i) => i.id === id) || null; }
  function weaponDef(id) { return (DS.WEAPONS || []).find((w) => w.id === id) || null; }
  function relicSet(id) { return (DS.RELIC_SETS || []).find((s) => s.id === id) || null; }
  function inv() { return DS.State.inventory; }

  function addItem(id, count) {
    count = count === undefined ? 1 : count;
    inv().items[id] = (inv().items[id] || 0) + count;
    DS.Save.persist();
    return { ok: true, count: inv().items[id] };
  }

  function removeItem(id, count) {
    count = count === undefined ? 1 : count;
    if ((inv().items[id] || 0) < count) return { ok: false, reason: 'Not enough ' + (itemDef(id) ? itemDef(id).name : id) + '.' };
    inv().items[id] -= count;
    if (inv().items[id] <= 0) delete inv().items[id];
    DS.Save.persist();
    return { ok: true };
  }

  function has(id, count) { return (inv().items[id] || 0) >= (count === undefined ? 1 : count); }

  // ── Weapons ──

  function createWeapon(defId) {
    const def = weaponDef(defId);
    if (!def) return null;
    const uid = DS.RNG.uuid();
    // Reward weapons come out already meaningfully leveled rather than
    // starting from scratch — 4/5-star ones especially, since those are rare
    // enough that a fresh Lv.1 felt bad relative to how hard they are to earn.
    const startLevel = def.rarity >= 5 ? 60 : def.rarity === 4 ? 30 : 1;
    inv().weapons[uid] = { uid, defId, level: Math.min(startLevel, def.maxLevel || startLevel), exp: 0, refine: 1, locked: false, equippedBy: null };
    DS.Save.persist();
    return uid;
  }

  function weaponGainExp(uid, feeds) {
    // feeds: {itemId: count}
    const w = inv().weapons[uid];
    if (!w) return { ok: false, reason: 'Unknown weapon.' };
    const def = weaponDef(w.defId);
    const cap = def ? def.maxLevel : 60;
    if (w.level >= cap) return { ok: false, reason: 'This weapon is at its limit.' };
    let xp = 0;
    for (const [id, count] of Object.entries(feeds || {})) {
      const per = WEAPON_XP[id];
      if (!per || count <= 0) continue;
      const takeRes = removeItem(id, count);
      if (!takeRes.ok) return takeRes;
      xp += per * count;
    }
    if (xp <= 0) return { ok: false, reason: 'Nothing offered to the forge.' };
    w.exp += xp;
    let levels = 0;
    while (w.level < cap && w.exp >= DS.CURVES.weaponXp(w.level)) {
      w.exp -= DS.CURVES.weaponXp(w.level);
      w.level += 1;
      levels += 1;
    }
    DS.Save.persist();
    return { ok: true, levels, level: w.level, atCap: w.level >= cap };
  }

  // Feeds titanite biggest-first, one unit at a time, stopping the instant the weapon
  // hits its level cap or the box runs dry — same shape as Progression.feedSoulsToMax.
  const TITANITE_FEED_IDS = ['titanite_chunk', 'titanite_large', 'titanite_shard'];

  function feedTitaniteToMax(uid) {
    const w = inv().weapons[uid];
    if (!w) return { ok: false, reason: 'Unknown weapon.' };
    const def = weaponDef(w.defId);
    const cap = def ? def.maxLevel : 60;
    if (w.level >= cap) return { ok: false, reason: 'This weapon is at its limit.', levels: 0, cap };
    const fed = {};
    let totalLevels = 0;
    while (w.level < cap) {
      const id = TITANITE_FEED_IDS.find((tid) => (inv().items[tid] || 0) > 0);
      if (!id) break;
      inv().items[id] -= 1;
      if (inv().items[id] <= 0) delete inv().items[id];
      fed[id] = (fed[id] || 0) + 1;
      w.exp += WEAPON_XP[id];
      while (w.level < cap && w.exp >= DS.CURVES.weaponXp(w.level)) {
        w.exp -= DS.CURVES.weaponXp(w.level);
        w.level += 1;
        totalLevels += 1;
      }
    }
    if (!Object.keys(fed).length) return { ok: false, reason: 'No titanite to offer.', levels: 0, cap };
    DS.Save.persist();
    return { ok: true, levels: totalLevels, fed, level: w.level, cap, atCap: w.level >= cap };
  }

  function refineWeapon(uid, fodderUid) {
    const w = inv().weapons[uid];
    if (!w) return { ok: false, reason: 'Unknown weapon.' };
    if (w.refine >= MAX_REFINE) return { ok: false, reason: 'Fully refined.' };
    if (fodderUid) {
      const f = inv().weapons[fodderUid];
      if (!f || f.uid === uid) return { ok: false, reason: 'Invalid offering.' };
      if (f.defId !== w.defId) return { ok: false, reason: 'Refinement needs a duplicate of the same weapon.' };
      if (f.locked) return { ok: false, reason: 'That weapon is locked.' };
      if (f.equippedBy) return { ok: false, reason: 'That duplicate is equipped.' };
      delete inv().weapons[fodderUid];
    } else {
      const takeRes = removeItem('titanite_slab', 1);
      if (!takeRes.ok) return { ok: false, reason: 'Requires a duplicate weapon or a Titanite Slab.' };
    }
    w.refine += 1;
    DS.Save.persist();
    return { ok: true, refine: w.refine };
  }

  function equipWeapon(charId, uid) {
    const r = DS.State.roster[charId];
    if (!r) return { ok: false, reason: 'Unknown character.' };
    const cdef = (DS.CHARACTERS || []).find((c) => c.id === charId);
    if (uid === null) {
      if (r.weaponUid && inv().weapons[r.weaponUid]) inv().weapons[r.weaponUid].equippedBy = null;
      r.weaponUid = null;
      DS.Save.persist();
      return { ok: true };
    }
    const w = inv().weapons[uid];
    if (!w) return { ok: false, reason: 'Unknown weapon.' };
    const wdef = weaponDef(w.defId);
    if (wdef && cdef && wdef.path !== cdef.path) return { ok: false, reason: 'Only the ' + wdef.path + ' path may wield this.' };
    // Unequip from previous owner.
    if (w.equippedBy && DS.State.roster[w.equippedBy]) DS.State.roster[w.equippedBy].weaponUid = null;
    // Unequip current weapon of this character.
    if (r.weaponUid && inv().weapons[r.weaponUid]) inv().weapons[r.weaponUid].equippedBy = null;
    r.weaponUid = uid;
    w.equippedBy = charId;
    DS.Save.persist();
    return { ok: true };
  }

  // ── Relics ──

  function rollSubstat(exclude) {
    const pool = DS.RELIC_SUBSTATS.filter((k) => !exclude.includes(k));
    return DS.RNG.pick(pool.length ? pool : DS.RELIC_SUBSTATS);
  }

  function substatValue(key, rarity) {
    let v = DS.SUBSTAT_ROLL[key] || 0.03;
    const flat = ['hpFlat', 'atkFlat', 'defFlat', 'spd'].includes(key);
    if (flat && rarity === 3) v = v * 0.6;
    if (flat && rarity === 4) v = v * 0.8;
    if (!flat && rarity === 3) v = v * 0.7;
    if (!flat && rarity === 4) v = v * 0.85;
    return v;
  }

  function relicCount() { return Object.keys(inv().relics).length; }

  function rollRelic(setId, slot, rarity) {
    rarity = rarity || 4;
    if (relicCount() >= MAX_RELICS) return null;
    const set = setId ? relicSet(setId) : DS.RNG.pick(DS.RELIC_SETS || []);
    if (!set) return null;
    slot = slot || DS.RNG.pick(DS.SLOTS);
    const mainKey = DS.RNG.pick(DS.RELIC_MAINSTATS[slot] || ['hpFlat']);
    const nSubs = rarity >= 5 ? 4 : rarity === 4 ? 3 : 2;
    const subs = [];
    const used = [mainKey];
    for (let i = 0; i < nSubs; i++) {
      const key = rollSubstat(used);
      used.push(key);
      subs.push({ key, value: substatValue(key, rarity) });
    }
    const uid = DS.RNG.uuid();
    const rel = {
      uid, defId: set.id + '_' + slot, setId: set.id, slot, rarity,
      level: 0,
      mainStat: { key: mainKey, value: DS.MAINSTAT_BASE[mainKey] || 0.05 },
      subStats: subs,
      locked: false, equippedBy: null,
    };
    inv().relics[uid] = rel;
    // Relic rewards come out fully attuned — this is the one place every
    // rolled relic reward passes through (Fortress elite/boss/event/shop
    // drops, Covenant Trial grants, etc.), so bringing it straight to
    // MAX_RELIC_LEVEL here covers all of them without touching each caller.
    applyRelicLevelUps(rel, MAX_RELIC_LEVEL);
    DS.Save.persist();
    return uid;
  }

  // Shared level-up math (mainStat rescale + a new/improved substat every 3
  // levels) — used both by enhanceRelic (which pays dust for it) and by
  // rollRelic (which grants it for free on a reward relic, see below).
  // Mutates rel directly; does not touch inventory/dust.
  function applyRelicLevelUps(rel, count) {
    const gains = [];
    for (let i = 0; i < count && rel.level < MAX_RELIC_LEVEL; i++) {
      rel.level += 1;
      rel.mainStat.value = (DS.MAINSTAT_BASE[rel.mainStat.key] || 0.05) * (1 + DS.MAINSTAT_PER_LEVEL * rel.level);
      if (rel.level % 3 === 0) {
        if (rel.subStats.length < 4) {
          const key = rollSubstat([rel.mainStat.key].concat(rel.subStats.map((s) => s.key)));
          rel.subStats.push({ key, value: substatValue(key, rel.rarity) });
          gains.push('New substat: ' + (DS.STAT_LABEL[key] || key));
        } else {
          const s = DS.RNG.pick(rel.subStats);
          s.value += substatValue(s.key, rel.rarity);
          gains.push((DS.STAT_LABEL[s.key] || s.key) + ' improved');
        }
      }
    }
    return gains;
  }

  function enhanceRelic(uid, dustCount) {
    dustCount = dustCount === undefined ? 1 : dustCount;
    const rel = inv().relics[uid];
    if (!rel) return { ok: false, reason: 'Unknown relic.' };
    if (rel.level >= MAX_RELIC_LEVEL) return { ok: false, reason: 'Fully attuned.' };
    dustCount = Math.min(dustCount, MAX_RELIC_LEVEL - rel.level);
    const takeRes = removeItem('relic_dust', dustCount);
    if (!takeRes.ok) return takeRes;
    const gains = applyRelicLevelUps(rel, dustCount);
    if (DS.QuestLog && DS.QuestLog.checkDaily) DS.QuestLog.checkDaily('daily_enhance');
    DS.Save.persist();
    return { ok: true, level: rel.level, gains };
  }

  function equipRelic(charId, uid) {
    const r = DS.State.roster[charId];
    if (!r) return { ok: false, reason: 'Unknown character.' };
    const rel = inv().relics[uid];
    if (!rel) return { ok: false, reason: 'Unknown relic.' };
    const slot = rel.slot;
    if (rel.equippedBy && DS.State.roster[rel.equippedBy]) DS.State.roster[rel.equippedBy].relics[slot] = null;
    const currentUid = r.relics[slot];
    if (currentUid && inv().relics[currentUid]) inv().relics[currentUid].equippedBy = null;
    r.relics[slot] = uid;
    rel.equippedBy = charId;
    DS.Save.persist();
    return { ok: true };
  }

  function unequipRelic(charId, slot) {
    const r = DS.State.roster[charId];
    if (!r) return { ok: false, reason: 'Unknown character.' };
    const uid = r.relics[slot];
    if (uid && inv().relics[uid]) inv().relics[uid].equippedBy = null;
    r.relics[slot] = null;
    DS.Save.persist();
    return { ok: true };
  }

  function salvage(uids) {
    let dust = 0;
    let count = 0;
    (uids || []).forEach((uid) => {
      const rel = inv().relics[uid];
      if (!rel || rel.locked || rel.equippedBy) return;
      dust += (SALVAGE_DUST[rel.rarity] || 8) + rel.level * 2;
      delete inv().relics[uid];
      count += 1;
    });
    if (count === 0) return { ok: false, reason: 'Nothing was salvaged.' };
    addItem('relic_dust', dust);
    return { ok: true, dust, count };
  }

  function useConsumable(itemId, count) {
    count = count === undefined ? 1 : count;
    const def = itemDef(itemId);
    if (!def || !def.use) return { ok: false, reason: 'That cannot be used.' };
    if (!has(itemId, count)) return { ok: false, reason: 'Not enough.' };
    removeItem(itemId, count);
    const A = DS.Assets;
    const summary = [];
    if (def.use.estus) {
      const p = DS.State.player;
      p.estus = Math.min(p.estusMax, p.estus + def.use.estus * count);
      summary.push({ icon: '🧪', img: A && A.currency('estus'), text: 'Estus +' + def.use.estus * count });
    }
    if (def.use.humanity) { DS.State.currencies.humanity += def.use.humanity * count; summary.push({ icon: '🖤', img: A && A.currency('humanity'), text: 'Humanity +' + def.use.humanity * count }); }
    if (def.use.souls) { DS.State.currencies.souls += def.use.souls * count; summary.push({ icon: '👻', img: A && A.currency('souls'), text: 'Souls +' + def.use.souls * count }); }
    DS.Save.persist();
    return { ok: true, summary };
  }

  DS.Inventory = {
    addItem, removeItem, has,
    createWeapon, weaponGainExp, feedTitaniteToMax, refineWeapon, equipWeapon,
    rollRelic, enhanceRelic, equipRelic, unequipRelic, salvage, relicCount,
    useConsumable,
    // Exposed so callers can build a fully-leveled, realistic relic object
    // OUTSIDE DS.State.inventory (e.g. Arena's ghost-opponent loadouts,
    // js/engine/arena.js) — mutates the plain object passed in, never
    // touches inventory/dust/persist itself, so it's safe to call on a
    // throwaway relic that never gets a real uid.
    applyRelicLevelUps,
    WEAPON_XP, MAX_RELIC_LEVEL, MAX_REFINE, MAX_RELICS,
  };
})();
