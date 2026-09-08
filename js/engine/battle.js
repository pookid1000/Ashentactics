// ASHEN TACTICS — core battle engine (CONTRACT.md §5.2).
// AV timeline, ult interrupts, enemy-only toughness/weakness break, statuses/DoTs,
// multi-phase bosses, effect-key hooks, and a typed event queue for the UI.
//
// Buff convention: additive `mult` — stat × (1 + Σ mult), e.g. +0.25 / -0.12.

window.DS = window.DS || {};

(function () {
  const GAUGE = 10000;

  // ───────────────────────── unit construction ─────────────────────────

  function buildEnemyUnit(spawn, idx) {
    const def = (DS.ENEMIES || []).find((e) => e.id === spawn.id);
    if (!def) return null;
    const level = Math.max(1, spawn.level || 1);
    const bossFactor = def.tier === 'boss' ? (DS.BOSS_DIFFICULTY_MULT || 1) : 1;
    const bossHpFactor = def.tier === 'boss' ? (DS.BOSS_HP_MULT || 1) : 1;
    const mult = (spawn.statMult || 1) * bossFactor;
    const stats = {
      hp: Math.round(DS.CURVES.enemyHp(def.base.hp, level) * mult * bossHpFactor),
      atk: Math.round(DS.CURVES.enemyAtk(def.base.atk, level) * mult),
      def: Math.round(DS.CURVES.enemyDef(def.base.def, level) * mult),
      spd: def.base.spd,
      critRate: 0.05, critDmg: 0.5, breakEffect: 0, effectHitRate: 0, effectRes: 0,
      healBoost: 0, energyRegen: 0, dmgBoost: {},
    };
    return {
      uid: 'foe_' + spawn.id + '_' + idx,
      defId: spawn.id, def, name: def.name, element: def.element,
      rarity: def.tier === 'boss' ? 5 : def.tier === 'elite' ? 4 : 2,
      art: def.art, level, isEnemy: true, stats,
      hp: stats.hp, shieldHp: 0, alive: true,
      maxToughness: Math.round((def.toughness || 0) * mult), toughness: Math.round((def.toughness || 0) * mult),
      broken: false, weak: def.weak || [],
      maxEnergy: def.maxEnergy || 100, energy: 0,
      buffs: [], statuses: [], dots: [], tauntTurns: 0,
      gauge: Math.random() * GAUGE * 0.2,
      moveset: 'default', phaseIdx: -1,
      fx: [], abilities: { talent: null, technique: null },
    };
  }

  function buildAllyUnit(spec) {
    return {
      uid: spec.uid, defId: spec.defId, name: spec.name, element: spec.element,
      path: spec.path, rarity: spec.rarity, art: spec.art, level: spec.level,
      isEnemy: false, stats: spec.stats,
      hp: spec.stats.hp, shieldHp: 0, alive: true,
      maxToughness: 0, toughness: 0, broken: false, weak: [],
      maxEnergy: spec.maxEnergy || 100, energy: 0,
      buffs: [], statuses: [], dots: [], tauntTurns: 0,
      gauge: Math.random() * GAUGE * 0.2,
      abilities: spec.abilities, fx: spec.fx || [],
    };
  }

  // ───────────────────────── stat helpers ─────────────────────────

  function buffSum(unit, stat) {
    let s = 0;
    (unit.buffs || []).forEach((b) => { if (b.stat === stat) s += b.mult; });
    return s;
  }

  function hasBuff(unit, stat) { return (unit.buffs || []).some((b) => b.stat === stat); }

  function statusEntry(unit, id) { return (unit.statuses || []).find((s) => s.id === id); }

  function fxSum(unit, key) {
    let s = 0;
    (unit.fx || []).forEach((f) => { if (f.key === key) s += (f.params && (f.params.pct !== undefined ? f.params.pct : f.params.amount)) || 0; });
    return s;
  }

  function fxEntries(unit, key) { return (unit.fx || []).filter((f) => f.key === key); }

  function effAtk(unit) {
    let mult = 1 + buffSum(unit, 'atk');
    const talent = unit.abilities && unit.abilities.talent;
    if (talent && talent.passiveHpThresholdBuff && talent.passiveHpThresholdBuff.stat === 'atk') {
      if (unit.hp / unit.stats.hp < talent.passiveHpThresholdBuff.thresholdHpPct) mult += talent.passiveHpThresholdBuff.mult;
    }
    // onKillAtkPct temp buffs are normal 'atk' buffs added on kill.
    return Math.max(1, unit.stats.atk * mult);
  }
  function effDef(unit) { return Math.max(0, unit.stats.def * (1 + buffSum(unit, 'def'))); }
  function effSpd(unit) {
    let s = unit.stats.spd * (1 + buffSum(unit, 'spd'));
    if (statusEntry(unit, 'hex')) s *= 0.9;
    return Math.max(1, s);
  }

  // ───────────────────────── Battle class ─────────────────────────

  class Battle {
    constructor(opts) {
      this.party = (opts.party || []).map(buildAllyUnit);
      this.enemies = (opts.spawns || []).map(buildEnemyUnit).filter(Boolean);
      this.background = opts.background || 'burg';
      this.onEvent = opts.onEvent || null;
      this.eventQueue = [];
      this.teamSp = 3;
      this.maxSp = 5;
      this.over = false;
      this.result = null;
      this.awaitingInput = false;
      this.currentActor = null;
      this.turnCount = 0;
      this.deaths = 0; // party deaths, for star rating

      this.units().forEach((u) => { u.gauge = 0; });

      // Battle-start effect keys + techniques.
      this.party.forEach((u) => {
        fxEntries(u, 'battleStartEnergy').forEach((f) => { u.energy = Math.min(u.maxEnergy, u.energy + (f.params.amount || 0)); });
        fxEntries(u, 'battleStartShieldPct').forEach((f) => { u.shieldHp += Math.round(u.stats.hp * (f.params.pct || 0)); });
        fxEntries(u, 'spOnBattleStart').forEach((f) => { this.teamSp = Math.min(this.maxSp, this.teamSp + (f.params.amount || 1)); });
      });
      const ctx = this.ctx();
      this.party.forEach((u) => {
        const t = u.abilities && u.abilities.technique;
        if (t && t.effect) {
          try { t.effect(ctx, u, this.party, this.enemies); this.emit({ t: 'log', text: '✦ ' + u.name + ' — ' + t.name }); } catch (e) { console.error(e); }
        }
      });
    }

    units() { return this.party.concat(this.enemies); }
    aliveParty() { return this.party.filter((u) => u.alive); }
    aliveEnemies() { return this.enemies.filter((u) => u.alive); }
    sideOf(u) { return u.isEnemy ? this.enemies : this.party; }
    foesOf(u) { return u.isEnemy ? this.party : this.enemies; }
    unitByUid(uid) { return this.units().find((u) => u.uid === uid) || null; }

    emit(evt) {
      this.eventQueue.push(evt);
      if (this.onEvent) { try { this.onEvent(evt); } catch (e) { console.error(e); } }
    }
    drainEvents() { const q = this.eventQueue; this.eventQueue = []; return q; }
    log(text) { this.emit({ t: 'log', text }); }

    // ───────────── ctx API (abilities/talents/techniques) ─────────────
    ctx() {
      const B = this;
      return {
        rng: () => Math.random(),
        log: (text) => B.log(text),
        party: (u) => B.sideOf(u),
        foes: (u) => B.foesOf(u),
        turnCount: () => B.turnCount,

        buff(unit, o) {
          if (!unit || !unit.alive) return;
          unit.buffs.push({ stat: o.stat, mult: o.mult, duration: o.duration || 2, name: o.name || o.stat });
          if (!o.quiet) B.emit({ t: 'status', uid: unit.uid, name: o.name || o.stat, kind: o.mult >= 0 ? 'buff' : 'debuff' });
          if (o.mult < 0) B.fireHook(B.foesOf(unit), 'enemyDebuffed', { target: unit });
        },
        debuff(unit, o) { this.buff(unit, o); },

        addStatus(unit, id, o) {
          if (!unit || !unit.alive) return;
          o = o || {};
          // Effect resistance check for debuffs/controls on a live target.
          const meta = DS.STATUS[id] || { kind: 'debuff' };
          if (meta.kind !== 'buff') {
            if (unit.element === 'Physical') return; // Physical is immune to all negative status effects
            const res = (unit.stats.effectRes || 0) - 0; // hit rate handled by applier's stats implicitly
            if (Math.random() < Math.max(0, Math.min(0.6, res))) {
              B.emit({ t: 'log', text: unit.name + ' resists ' + (meta.name || id) + '.' });
              return;
            }
          }
          const ex = statusEntry(unit, id);
          if (ex) {
            ex.duration = Math.max(ex.duration, o.duration || 1);
            if (o.stack) ex.potency = (ex.potency || 1) + 1;
          } else {
            unit.statuses.push({ id, duration: o.duration || 1, potency: o.potency || 1 });
          }
          B.emit({ t: 'status', uid: unit.uid, id, name: (DS.STATUS[id] || {}).name || id, kind: meta.kind, potency: (statusEntry(unit, id) || {}).potency || 1 });
          if (meta.kind !== 'buff') B.fireHook(B.foesOf(unit), 'enemyDebuffed', { target: unit });
          // Some statuses (e.g. stacking curses) instantly kill once enough stacks land.
          const cur = statusEntry(unit, id);
          if (cur && meta.killAtStacks && cur.potency >= meta.killAtStacks) {
            B.emit({ t: 'log', text: unit.name + ' succumbs to the ' + (meta.name || id) + '.' });
            B.kill(unit);
          }
        },
        hasStatus: (unit, id) => !!statusEntry(unit, id),

        heal(unit, amount, healer) {
          if (!unit || !unit.alive || amount <= 0) return;
          let amt = amount;
          if (healer && healer.stats) amt = Math.round(amt * (1 + (healer.stats.healBoost || 0)));
          const before = unit.hp;
          unit.hp = Math.min(unit.stats.hp, unit.hp + amt);
          B.emit({ t: 'heal', uid: unit.uid, amount: unit.hp - before });
        },
        shield(unit, amount) {
          if (!unit || !unit.alive || amount <= 0) return;
          unit.shieldHp = (unit.shieldHp || 0) + Math.round(amount);
          B.emit({ t: 'shield', uid: unit.uid, amount: Math.round(amount) });
          B.fireHook(B.sideOf(unit), 'allyShielded', { target: unit });
        },
        dot(unit, o) {
          if (!unit || !unit.alive) return;
          if (unit.element === 'Physical') return; // Physical is immune to damage-over-time effects
          const ex = (unit.dots || []).find((d) => d.name === o.name);
          if (ex) {
            if (o.stacking) ex.stacks = Math.min((ex.stacks || 1) + 1, 10);
            ex.dmgPerTurn = Math.max(ex.dmgPerTurn, o.dmgPerTurn);
            ex.duration = Math.max(ex.duration, o.duration);
            ex.maxDuration = Math.max(ex.maxDuration || o.duration, o.duration);
          } else {
            unit.dots.push({ name: o.name, dmgPerTurn: o.dmgPerTurn, duration: o.duration, maxDuration: o.duration, stacks: 1, srcUid: o.srcUid || null });
          }
          B.emit({ t: 'status', uid: unit.uid, name: o.name, kind: 'dot' });
        },
        cleanse(unit) {
          if (!unit) return;
          unit.buffs = (unit.buffs || []).filter((b) => b.mult >= 0);
          unit.statuses = (unit.statuses || []).filter((s) => (DS.STATUS[s.id] || {}).kind === 'buff');
          unit.dots = [];
          B.emit({ t: 'log', text: unit.name + ' is cleansed.' });
        },
        taunt(unit, turns) {
          if (!unit) return;
          unit.tauntTurns = Math.max(unit.tauntTurns || 0, turns);
          B.emit({ t: 'status', uid: unit.uid, name: 'Taunt', kind: 'buff' });
        },
        actionAdvance(unit, pct) { if (unit) unit.gauge = Math.min(GAUGE, unit.gauge + GAUGE * pct); },
        actionDelay(unit, pct) { if (unit) unit.gauge = Math.max(-GAUGE, unit.gauge - GAUGE * pct); },
        gainEnergy(unit, amount) {
          if (!unit || !unit.alive || !amount) return;
          const mult = 1 + (unit.stats.energyRegen || 0);
          unit.energy = Math.min(unit.maxEnergy, unit.energy + amount * mult);
          B.emit({ t: 'energy', uid: unit.uid, energy: unit.energy });
        },
        drainEnergy(unit, amount) {
          if (!unit) return;
          unit.energy = Math.max(0, unit.energy - amount);
          B.emit({ t: 'energy', uid: unit.uid, energy: unit.energy });
        },
        gainSp: (n) => { B.teamSp = Math.min(B.maxSp, B.teamSp + (n || 1)); B.emit({ t: 'sp', sp: B.teamSp }); },
        execute(unit) {
          if (!unit || !unit.alive) return;
          B.emit({ t: 'log', text: '☠ ' + unit.name + ' is executed outright!' });
          unit.hp = 0;
          B.kill(unit);
        },
        dealBonusTrueDamage(user, target, amount) {
          if (!target || !target.alive || amount <= 0) return;
          amount = Math.round(amount);
          target.hp = Math.max(0, target.hp - amount);
          B.emit({ t: 'hit', src: user.uid, uid: target.uid, amount, crit: false, weak: false, element: user.element, isTrue: true });
          if (target.hp <= 0) B.kill(target);
        },
        getDotStacks: (unit, name) => { const d = (unit.dots || []).find((x) => x.name === name); return d ? (d.stacks || 1) : 0; },
        refreshDots(unit) { (unit.dots || []).forEach((d) => { d.duration = d.maxDuration || d.duration; }); },
        summonReinforcement(unit, spawn) {
          if (!unit || !unit.isEnemy || B.enemies.filter((e) => e.alive).length >= 5) return null;
          const nu = buildEnemyUnit({ id: spawn.id, level: spawn.level || unit.level, statMult: spawn.statMult }, B.enemies.length + Math.floor(Math.random() * 1000));
          if (nu) {
            B.enemies.push(nu);
            B.emit({ t: 'log', text: '⚠ ' + nu.name + ' joins the fray!' });
            B.emit({ t: 'summon', uid: nu.uid });
          }
          return nu || null;
        },
      };
    }

    fireHook(sideArr, eventName, data) {
      const ctx = this.ctx();
      sideArr.forEach((u) => {
        const t = u.abilities && u.abilities.talent;
        if (u.alive && t && t.on === eventName && t.effect) {
          try { t.effect(ctx, u, data, sideArr); } catch (e) { console.error(e); }
        }
      });
    }

    kill(unit) {
      if (!unit.alive) return;
      unit.alive = false;
      unit.hp = 0;
      unit.buffs = []; unit.statuses = []; unit.dots = [];
      this.emit({ t: 'death', uid: unit.uid, name: unit.name });
      if (!unit.isEnemy) this.deaths += 1;
      this.fireHook(this.sideOf(unit), 'allyDown', { fallen: unit });
      this.fireHook(this.foesOf(unit), 'enemyDown', { fallen: unit });
      // Boss duo hooks (e.g. the survivor enrages).
      if (unit.isEnemy) {
        const ctx = this.ctx();
        this.enemies.forEach((e) => {
          if (e.alive && e.def && e.def.onAllyDeath) {
            try { e.def.onAllyDeath(ctx, e, unit); } catch (err) { console.error(err); }
          }
        });
      }
      this.checkEnd();
    }

    checkEnd() {
      if (this.over) return;
      if (!this.aliveParty().length) { this.over = true; this.result = 'defeat'; this.emit({ t: 'defeat' }); }
      else if (!this.aliveEnemies().length) { this.over = true; this.result = 'victory'; this.emit({ t: 'victory', stars: this.deaths === 0 ? 3 : this.deaths === 1 ? 2 : 1 }); }
    }

    // ───────────── damage resolution ─────────────

    resolveHit(user, target, ability, opts) {
      opts = opts || {};
      if (!target || !target.alive) return 0;

      // Protected core: some bosses are untouchable while named guardian(s) still live.
      if (target.def && Array.isArray(target.def.invulnerableWhileAlive)) {
        const guarded = target.def.invulnerableWhileAlive.some((id) => this.enemies.some((e) => e.alive && e.defId === id));
        if (guarded) {
          this.emit({ t: 'hit', src: user.uid, uid: target.uid, amount: 0, guarded: true });
          this.emit({ t: 'log', text: target.name + ' is warded — destroy its guardians first.' });
          return 0;
        }
      }

      // Hit/evasion.
      const acc = buffSum(user, 'accuracy') - (statusEntry(user, 'blind') ? 0.3 : 0);
      const eva = buffSum(target, 'evasion');
      if (!DS.Formulas.hitRoll(acc, eva)) {
        this.emit({ t: 'hit', src: user.uid, uid: target.uid, amount: 0, miss: true });
        this.fireHook([target], 'selfEvaded', { attacker: user });
        return 0;
      }

      // Parry/riposte: some bosses have a chance to parry any landing attack and counter it.
      if (!opts.isCounter && target.def && target.def.parryChance && Math.random() < target.def.parryChance) {
        this.emit({ t: 'log', text: target.name + ' parries the blow and ripostes!' });
        this.emit({ t: 'parry', uid: target.uid });
        this.resolveHit(target, user, { name: 'Riposte', power: 1.5, toughnessDmg: 0 }, { isCounter: true });
        return 0;
      }

      const element = ability.element || user.element;
      const isWeak = target.isEnemy && (target.weak || []).includes(element);
      const elemMult = DS.Formulas.elementMult(element, target.element);

      // Crit.
      let critRate = (user.stats.critRate || 0.05) + (ability.critChanceBonus || 0) + buffSum(user, 'critRate');
      let guaranteed = hasBuff(user, 'guaranteedCrit');
      const isCrit = guaranteed || DS.Formulas.critRoll(critRate);
      if (guaranteed) user.buffs = user.buffs.filter((b) => b.stat !== 'guaranteedCrit');
      const critMult = isCrit ? 1 + (user.stats.critDmg || 0.5) + buffSum(user, 'critDmg') : 1;

      // Damage boosts.
      let dmgBoost = (user.stats.dmgBoost && user.stats.dmgBoost[element]) || 0;
      dmgBoost += buffSum(user, 'dmg');
      if (opts.slot === 'ult') dmgBoost += fxSum(user, 'ultDmgPct');
      if (opts.slot === 'skill') dmgBoost += fxSum(user, 'skillDmgPct');
      if (opts.slot === 'basic') dmgBoost += fxSum(user, 'basicDmgPct');
      if (target.broken) dmgBoost += fxSum(user, 'dmgVsBrokenPct');
      const targetDebuffed = (target.buffs || []).some((b) => b.mult < 0) || (target.statuses || []).some((s) => (DS.STATUS[s.id] || {}).kind !== 'buff');
      if (targetDebuffed) dmgBoost += fxSum(user, 'dmgVsDebuffedPct');
      if (isWeak) dmgBoost += 0.2;

      const talent = user.abilities && user.abilities.talent;
      if (talent) {
        if (talent.passiveDamageBonusVsBroken && target.broken) dmgBoost += talent.passiveDamageBonusVsBroken;
        if (talent.passiveDamageBonusVsLowHp && target.hp / target.stats.hp < talent.passiveDamageBonusVsLowHp.thresholdHpPct) dmgBoost += talent.passiveDamageBonusVsLowHp.bonus;
        if (talent.passiveDamageBonusVsDebuff && statusEntry(target, talent.passiveDamageBonusVsDebuff.debuffName)) dmgBoost += talent.passiveDamageBonusVsDebuff.bonus;
      }
      if (ability.bonusVsBroken && target.broken) dmgBoost += ability.bonusVsBroken;
      if (ability.bonusVsDebuffed && targetDebuffed) dmgBoost += ability.bonusVsDebuffed;

      // Vulnerability & broken multipliers.
      let vulnMult = 1 + Math.max(0, buffSum(target, 'vulnerability'));
      if (statusEntry(target, 'vulnerability')) vulnMult += 0.15;
      if (statusEntry(target, 'curse')) vulnMult += 0.10;
      const brokenMult = target.broken ? 1.25 : 1;

      // Target damage reduction.
      let reduction = 0;
      const tTalent = target.abilities && target.abilities.talent;
      if (tTalent && tTalent.passiveDamageReduction && target.hp / target.stats.hp < tTalent.passiveDamageReduction.thresholdHpPct) {
        reduction += tTalent.passiveDamageReduction.reduction;
      }
      fxEntries(target, 'lowHpDmgReduction').forEach((f) => {
        if (target.hp / target.stats.hp < (f.params.threshold || 0.5)) reduction += f.params.pct || 0;
      });
      reduction = Math.min(0.75, reduction);

      let dmg = DS.Formulas.dmg({
        atk: effAtk(user) * (opts.powerMult || 1),
        power: ability.power,
        dmgBoost, critMult, brokenMult, vulnMult, elemMult,
        defender: { def: effDef(target) },
        attackerLevel: user.level,
        defPierce: ability.defPierce || 0,
      });
      const playerMult = !user.isEnemy ? (DS.PLAYER_DMG_MULT || 1) : 1;
      dmg = Math.max(1, Math.round(dmg * (1 - reduction) * (opts.dmgScale || 1) * playerMult));

      // Shield absorption.
      let absorbed = 0;
      if (target.shieldHp > 0) {
        absorbed = Math.min(target.shieldHp, dmg);
        target.shieldHp -= absorbed;
      }
      const taken = dmg - absorbed;
      target.hp = Math.max(0, target.hp - taken);

      this.emit({ t: 'hit', src: user.uid, uid: target.uid, amount: dmg, absorbed, crit: isCrit, weak: isWeak, element, broken: target.broken });

      // Toughness (enemies only; only weakness-element hits chip it).
      if (!opts.isSplash && target.isEnemy && target.maxToughness > 0 && !target.broken && isWeak) {
        const tDmg = (ability.toughnessDmg || 0) * (1 + (user.stats.breakEffect || 0) * 0.5);
        target.toughness = Math.max(0, target.toughness - tDmg);
        if (target.toughness <= 0) this.doBreak(user, target, element);
      }

      // Reactive hooks.
      if (!opts.isCounter) {
        const ctx = this.ctx();
        if (target.alive) {
          ctx.gainEnergy(target, Math.min(10, 5 + Math.round(taken / target.stats.hp * 40)));
          fxEntries(target, 'energyOnHitTaken').forEach((f) => ctx.gainEnergy(target, f.params.amount || 0));
          this.fireHook([target], 'damageTaken', { amount: taken, from: user });
        }
        if (isCrit) this.fireHook([user], 'selfCrit', { target });
      }

      if (target.hp <= 0 && target.alive) {
        this.kill(target);
        // On-kill effects.
        const ctx = this.ctx();
        ctx.gainEnergy(user, 10);
        fxEntries(user, 'onKillAtkPct').forEach((f) => {
          ctx.buff(user, { stat: 'atk', mult: f.params.pct || 0.1, duration: f.params.turns || 2, name: 'Slayer\'s Momentum' });
        });
      } else if (target.alive && !opts.isCounter && hasBuff(target, 'counterStance')) {
        target.buffs = target.buffs.filter((b) => b.stat !== 'counterStance');
        this.emit({ t: 'log', text: '↩ ' + target.name + ' counters!' });
        this.resolveHit(target, user, { name: 'Counter', power: 0.8, toughnessDmg: 5 }, { isCounter: true });
      }

      return dmg;
    }

    doBreak(breaker, target, element) {
      target.broken = true;
      target.gauge = Math.max(-GAUGE, target.gauge - GAUGE * 0.25);
      const be = DS.BREAK_EFFECTS[element] || {};
      const ctx = this.ctx();
      const bDmg = DS.Formulas.breakDmg(breaker.level, breaker.stats.breakEffect, element);
      target.hp = Math.max(0, target.hp - bDmg);
      this.emit({ t: 'break', uid: target.uid, src: breaker.uid, element, amount: bDmg });
      if (be.status === 'judgment') {
        ctx.drainEnergy(target, 20);
        ctx.dealBonusTrueDamage(breaker, target, Math.round(bDmg * 0.5));
      } else if (be.status === 'hex') {
        target.gauge = Math.max(-GAUGE, target.gauge - GAUGE * 0.25);
        ctx.addStatus(target, 'hex', { duration: 2 });
      } else if (be.status === 'freeze') {
        ctx.addStatus(target, 'freeze', { duration: 1 });
      } else if (be.status) {
        if (['burn', 'bleed', 'poison', 'shock'].includes(be.status)) {
          ctx.dot(target, { name: (DS.STATUS[be.status] || {}).name || be.status, dmgPerTurn: Math.round(bDmg * 0.35), duration: 2 });
        } else {
          ctx.addStatus(target, be.status, { duration: 2 });
        }
      }
      if (target.hp <= 0) this.kill(target);
      // Breaker-side rewards.
      fxEntries(breaker, 'onBreakEnergy').forEach((f) => ctx.gainEnergy(breaker, f.params.amount || 0));
      this.fireHook(this.sideOf(breaker), 'allyBreak', { breaker, broken: target });
    }

    // ───────────── ability resolution ─────────────

    targetList(user, ability, chosen) {
      const foes = this.foesOf(user).filter((u) => u.alive);
      const own = this.sideOf(user).filter((u) => u.alive);
      const taunters = foes.filter((f) => f.tauntTurns > 0);
      const pool = taunters.length ? taunters : foes;
      switch (ability.target) {
        case 'singleEnemy': return pool.length ? [chosen && pool.includes(chosen) ? chosen : pool[0]] : [];
        case 'allEnemies': return foes;
        case 'randomEnemies': return []; // resolved per-hit
        case 'self': return [user];
        case 'allAllies': return own;
        case 'singleAlly': return own.length ? [chosen && own.includes(chosen) ? chosen : own[0]] : [];
        case 'allyLowestHp': return own.length ? [own.reduce((a, b) => (a.hp / a.stats.hp < b.hp / b.stats.hp ? a : b))] : [];
        default: return pool.length ? [pool[0]] : [];
      }
    }

    resolveAbility(user, slot, ability, chosen) {
      if (!ability) return;
      this.emit({ t: 'ability', uid: user.uid, slot, name: ability.name, anim: ability.anim || null, target: ability.target });
      const foes = this.foesOf(user).filter((u) => u.alive);
      const targets = this.targetList(user, ability, chosen);
      let total = 0;
      const hits = ability.hits || 0;

      for (let h = 0; h < hits; h++) {
        let hitTargets;
        if (ability.target === 'randomEnemies') {
          const alive = this.foesOf(user).filter((u) => u.alive);
          const taunters = alive.filter((f) => f.tauntTurns > 0);
          const pool = taunters.length ? taunters : alive;
          hitTargets = pool.length ? [pool[Math.floor(Math.random() * pool.length)]] : [];
        } else {
          hitTargets = targets.filter((t) => t.alive || t === user);
        }
        hitTargets.forEach((t) => {
          if (ability.power > 0 && t !== user && this.foesOf(user).includes(t)) {
            const dealt = this.resolveHit(user, t, ability, { slot });
            total += dealt;
            if (ability.splash) {
              const others = this.foesOf(user).filter((x) => x.alive && x !== t);
              if (others.length) {
                const st = others[Math.floor(Math.random() * others.length)];
                total += this.resolveHit(user, st, { ...ability, power: ability.power * ability.splash, toughnessDmg: 0 }, { slot, isSplash: true });
              }
            }
          }
        });
      }

      // Extra effects.
      if (ability.extra) {
        const allies = this.sideOf(user).filter((u) => u.alive);
        const extraTargets = ability.target === 'randomEnemies' ? foes : (targets.length ? targets : foes);
        try { ability.extra(this.ctx(), user, extraTargets, allies, total); } catch (e) { console.error(e); }
      }

      // Economy.
      const ctx = this.ctx();
      if (slot === 'ult') {
        user.energy = 5;
        fxEntries(user, 'healOnUltPct').forEach((f) => ctx.heal(user, Math.round(user.stats.hp * (f.params.pct || 0)), user));
      } else if (ability.energyGain) {
        ctx.gainEnergy(user, ability.energyGain);
      }
      if (!user.isEnemy) {
        if (slot === 'basic') { this.teamSp = Math.min(this.maxSp, this.teamSp + 1); this.emit({ t: 'sp', sp: this.teamSp }); }
        if (slot === 'skill') { this.teamSp = Math.max(0, this.teamSp - 1); this.emit({ t: 'sp', sp: this.teamSp }); }
      }

      if (slot === 'skill') this.fireHook([user], 'selfSkill', {});
      this.fireHook([user], 'selfAction', { slot });
      this.checkEnd();
    }

    // ───────────── player actions ─────────────

    playerAct(slot, targetUid) {
      const user = this.currentActor;
      if (!user || user.isEnemy || !this.awaitingInput || this.over) return false;
      const ability = user.abilities[slot];
      if (!ability) return false;
      if (slot === 'skill' && this.teamSp < 1) return false;
      const chosen = targetUid ? this.unitByUid(targetUid) : null;
      this.awaitingInput = false;
      this.resolveAbility(user, slot, ability, chosen);
      return true;
    }

    // Ult interrupt — legal whenever energy is full and battle is live.
    castUlt(uid, targetUid) {
      const user = this.party.find((u) => u.uid === uid);
      if (!user || !user.alive || this.over) return false;
      const ult = user.abilities.ult;
      if (!ult || user.energy < user.maxEnergy) return false;
      const chosen = targetUid ? this.unitByUid(targetUid) : null;
      this.emit({ t: 'cutin', uid: user.uid, name: ult.name, cutin: ult.cutin || null, art: user.art, anim: ult.anim || null });
      this.resolveAbility(user, 'ult', ult, chosen);
      return true;
    }

    // ───────────── turn engine ─────────────

    startTurn(unit) {
      this.turnCount += 1;
      const ctx = this.ctx();

      // Toughness recovery.
      if (unit.broken) {
        unit.broken = false;
        unit.toughness = unit.maxToughness;
        this.emit({ t: 'log', text: unit.name + ' recovers their footing.' });
      }

      // DoT ticks.
      let died = false;
      (unit.dots || []).forEach((d) => {
        if (died || !unit.alive) return;
        let dmg = Math.round(d.dmgPerTurn * (d.stacks || 1));
        const src = d.srcUid ? this.unitByUid(d.srcUid) : null;
        if (src) dmg = Math.round(dmg * (1 + fxSum(src, 'dotDmgPct')));
        unit.hp = Math.max(0, unit.hp - dmg);
        this.emit({ t: 'dot', uid: unit.uid, name: d.name, amount: dmg });
        d.duration -= 1;
        if (unit.hp <= 0) { this.kill(unit); died = true; }
      });
      unit.dots = (unit.dots || []).filter((d) => d.duration > 0);
      if (died || !unit.alive) return 'dead';

      // Status durations & control (any 'control'-kind status skips the turn, e.g. freeze/immobilize).
      let frozen = false;
      let controlName = '';
      unit.statuses = (unit.statuses || []).filter((s) => {
        const meta = DS.STATUS[s.id] || {};
        if (meta.kind === 'control' && s.duration > 0) { frozen = true; controlName = meta.name || s.id; }
        s.duration -= 1;
        return s.duration > 0;
      });
      unit.buffs = (unit.buffs || []).map((b) => ({ ...b, duration: b.duration - 1 })).filter((b) => b.duration > 0);
      if (unit.tauntTurns > 0) unit.tauntTurns -= 1;

      // Boss phase transitions.
      if (unit.isEnemy && unit.def && Array.isArray(unit.def.phases)) {
        unit.def.phases.forEach((ph, idx) => {
          if (idx > unit.phaseIdx && unit.hp / unit.stats.hp <= ph.hpPct) {
            unit.phaseIdx = idx;
            unit.moveset = ph.moveset || 'phase2';
            unit.toughness = unit.maxToughness;
            unit.broken = false;
            unit.buffs = unit.buffs.filter((b) => b.mult >= 0);
            unit.statuses = unit.statuses.filter((s) => (DS.STATUS[s.id] || {}).kind === 'buff');
            this.emit({ t: 'phase', uid: unit.uid, name: ph.name || 'Phase ' + (idx + 2), banner: ph.banner || '' });
            if (ph.onEnter) { try { ph.onEnter(ctx, unit); } catch (e) { console.error(e); } }
          }
        });
      }

      // Per-turn bespoke enemy behavior (e.g. periodic reinforcement spawns).
      if (unit.isEnemy && unit.def && typeof unit.def.onTurnStart === 'function') {
        try { unit.def.onTurnStart(ctx, unit); } catch (e) { console.error(e); }
      }

      this.fireHook([unit], 'turnStart', {});
      this.emit({ t: 'turnStart', uid: unit.uid, name: unit.name });

      if (frozen) {
        const phrase = controlName === 'Freeze' ? 'frozen solid' : controlName.toLowerCase();
        this.emit({ t: 'log', text: unit.name + ' is ' + phrase + ' and loses their turn!' });
        return 'skip';
      }
      return 'act';
    }

    nextActor() {
      let guard = 0;
      while (guard++ < 500) {
        const alive = this.units().filter((u) => u.alive);
        if (!alive.length) return null;
        let minTime = Infinity;
        alive.forEach((u) => {
          const t = (GAUGE - u.gauge) / effSpd(u);
          if (t < minTime) minTime = t;
        });
        if (minTime > 0) alive.forEach((u) => { u.gauge += effSpd(u) * minTime; });
        const ready = alive.filter((u) => u.gauge >= GAUGE - 0.001).sort((a, b) => effSpd(b) - effSpd(a));
        if (ready.length) {
          const actor = ready[0];
          actor.gauge -= GAUGE;
          return actor;
        }
      }
      return null;
    }

    previewTimeline(n) {
      const sims = this.units().filter((u) => u.alive).map((u) => ({
        uid: u.uid, defId: u.defId, name: u.name, isEnemy: u.isEnemy, art: u.art, element: u.element,
        spd: effSpd(u), gauge: u.gauge,
      }));
      const order = [];
      for (let i = 0; i < n && sims.length; i++) {
        let minTime = Infinity;
        sims.forEach((u) => { const t = (GAUGE - u.gauge) / u.spd; if (t < minTime) minTime = t; });
        sims.forEach((u) => { u.gauge += u.spd * minTime; });
        const ready = sims.filter((u) => u.gauge >= GAUGE - 0.001).sort((a, b) => b.spd - a.spd);
        const actor = ready[0];
        if (!actor) break;
        actor.gauge -= GAUGE;
        order.push({ uid: actor.uid, defId: actor.defId, name: actor.name, isEnemy: actor.isEnemy, art: actor.art, element: actor.element });
      }
      return order;
    }

    // Runs enemy turns until a player must act or the battle ends.
    advance() {
      if (this.over) return;
      let guard = 0;
      while (guard++ < 200) {
        const actor = this.nextActor();
        if (!actor) return;
        this.currentActor = actor;
        const state = this.startTurn(actor);
        this.checkEnd();
        if (this.over) return;
        if (state === 'dead' || state === 'skip') continue;
        if (!actor.isEnemy) {
          this.awaitingInput = true;
          return;
        }
        DS.AI.takeTurn(this, actor);
        this.checkEnd();
        if (this.over) return;
      }
    }
  }

  DS.Battle = Battle;
  DS.BattleInternals = { effAtk, effDef, effSpd, buffSum, GAUGE };
})();
