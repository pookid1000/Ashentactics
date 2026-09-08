// ASHEN TACTICS — enemy AI + party auto-battle (CONTRACT.md §5.3).

window.DS = window.DS || {};

(function () {
  function pickFoe(battle, actor) {
    const foes = battle.foesOf(actor).filter((u) => u.alive);
    if (!foes.length) return null;
    const taunters = foes.filter((f) => f.tauntTurns > 0);
    const pool = taunters.length ? taunters : foes;
    if (Math.random() < 0.65) {
      return pool.reduce((a, b) => (a.hp / a.stats.hp < b.hp / b.stats.hp ? a : b));
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function enemyTurn(battle, actor) {
    const def = actor.def;
    // Enemy ult meter.
    actor.energy = Math.min(actor.maxEnergy, actor.energy + 12);
    if (def && def.ult && actor.energy >= actor.maxEnergy) {
      actor.energy = 0;
      battle.emit({ t: 'cutin', uid: actor.uid, name: def.ult.name, cutin: def.ult.cutin || { title: def.ult.name, line: '' }, art: actor.art, enemy: true, anim: def.ult.anim || null });
      battle.resolveAbility(actor, 'ult', def.ult, pickFoe(battle, actor));
      return;
    }
    const moves = (def && def.movesets && def.movesets[actor.moveset]) || (def && def.movesets && def.movesets.default) || [];
    if (!moves.length) {
      battle.resolveAbility(actor, 'basic', { name: 'Strike', power: 1.0, hits: 1, toughnessDmg: 0, target: 'singleEnemy' }, pickFoe(battle, actor));
      return;
    }
    const foesAlive = battle.foesOf(actor).filter((u) => u.alive).length;
    // Avoid wasting AoE-weighted picks on a single survivor when alternatives exist.
    let usable = moves;
    if (foesAlive === 1) {
      const single = moves.filter((m) => m.ability.target === 'singleEnemy' || m.ability.target === 'self' || m.ability.target === 'allyLowestHp');
      if (single.length) usable = single.concat(moves.filter((m) => !single.includes(m) && Math.random() < 0.3));
    }
    const chosen = DS.RNG.weighted(usable, 'weight');
    battle.resolveAbility(actor, chosen === moves[0] ? 'basic' : 'skill2', chosen.ability, pickFoe(battle, actor));
  }

  function allyAuto(battle, actor) {
    // Auto-battle for party units: ult when full is handled by battle-ui;
    // here choose skill when SP is plentiful, else basic.
    const useSkill = battle.teamSp > 2 && actor.abilities.skill;
    const slot = useSkill ? 'skill' : 'basic';
    const ability = actor.abilities[slot];
    let target = null;
    if (ability.target === 'singleEnemy') target = pickFoe(battle, actor);
    else if (ability.target === 'singleAlly') {
      const own = battle.sideOf(actor).filter((u) => u.alive);
      target = own.reduce((a, b) => (a.hp / a.stats.hp < b.hp / b.stats.hp ? a : b));
    }
    battle.awaitingInput = false;
    battle.resolveAbility(actor, slot, ability, target);
  }

  DS.AI = {
    takeTurn(battle, actor) {
      if (actor.isEnemy) enemyTurn(battle, actor);
      else allyAuto(battle, actor);
    },
  };
})();
