// ASHEN TACTICS — trace trees (CONTRACT.md §4.2), generated from per-character specs.
// Node layout per character (ids <charId>_t1..t9):
//   t1 stat → t2 basic+ → t4 skill+ → t6 ult+ → t8 unique battle bonus
//        └──→ t3 stat  → t5 stat   → t7 stat  ┘        t9 capstone (5★ only)

window.DS = window.DS || {};

(function () {
  // Per-character distinctive stats/bonus. s1/s3/s5/s7 = stat nodes; b8 = battle-time bonus; s9 = capstone.
  const SPECS = {
    chosen_undead: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['critRate', 0.027], s7: ['atkPct', 0.06], b8: ['onKillAtkPct', { pct: 0.10, turns: 2 }, 'Slayer\'s Momentum: killing blows grant ATK +10% for 2 turns.'] },
    oscar: { s1: ['hpPct', 0.05], s3: ['defPct', 0.075], s5: ['effectRes', 0.04], s7: ['hpPct', 0.08], b8: ['battleStartShieldPct', { pct: 0.10 }, 'Doorwarden: begin battle with a 10% Max HP shield.'] },
    solaire: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['healBoost', 0.06], s7: ['atkPct', 0.06], b8: ['healOnUltPct', { pct: 0.08 }, 'Sunrise Vow: his Ultimate also heals Solaire 8% Max HP.'], s9: ['healBoost', 0.08] },
    ornstein: { s1: ['atkPct', 0.04], s3: ['spd', 3], s5: ['critRate', 0.027], s7: ['critDmg', 0.08], b8: ['dmgVsBrokenPct', { pct: 0.15 }, 'Perfect Opening: +15% damage to Broken enemies.'], s9: ['atkPct', 0.08] },
    smough: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['breakEffect', 0.08], s7: ['atkPct', 0.06], b8: ['dmgVsBrokenPct', { pct: 0.18 }, 'Sentence Carried Out: +18% damage to Broken enemies.'], s9: ['hpPct', 0.08] },
    gwyn: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['critDmg', 0.08], s7: ['atkPct', 0.06], b8: ['ultDmgPct', { pct: 0.12 }, 'Cinders Unbound: Ultimate damage +12%.'], s9: ['atkPct', 0.08] },
    artorias: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['critRate', 0.027], s7: ['critDmg', 0.08], b8: ['lowHpDmgReduction', { threshold: 0.5, pct: 0.15 }, 'Wolf\'s Endurance: below half HP, damage taken −15%.'], s9: ['atkPct', 0.08] },
    quelaag: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['atkPct', 0.06], b8: ['dotDmgPct', { pct: 0.20 }, 'Slow Furnace: damage over time dealt +20%.'], s9: ['atkPct', 0.08] },
    seath: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['critDmg', 0.08], b8: ['dmgVsDebuffedPct', { pct: 0.15 }, 'Controlled Variables: +15% damage to debuffed enemies.'], s9: ['atkPct', 0.08] },
    nito: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['hpPct', 0.08], b8: ['dotDmgPct', { pct: 0.20 }, 'Compound Interest: damage over time dealt +20%.'], s9: ['atkPct', 0.08] },
    manus: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['critDmg', 0.08], s7: ['atkPct', 0.06], b8: ['energyOnHitTaken', { amount: 4 }, 'Bottomless Grief: +4 extra Energy when struck.'], s9: ['critDmg', 0.10] },
    priscilla: { s1: ['spd', 3], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['atkPct', 0.06], b8: ['spOnBattleStart', { amount: 1 }, 'Quiet Preparations: begin battle with +1 Skill Point.'] },
    fourkings: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['critRate', 0.027], s7: ['atkPct', 0.06], b8: ['ultDmgPct', { pct: 0.12 }, 'Royal Assent: Ultimate damage +12%.'] },
    havel: { s1: ['defPct', 0.075], s3: ['hpPct', 0.06], s5: ['effectRes', 0.04], s7: ['hpPct', 0.08], b8: ['battleStartShieldPct', { pct: 0.12 }, 'Bedrock: begin battle with a 12% Max HP shield.'] },
    siegmeyer: { s1: ['hpPct', 0.05], s3: ['defPct', 0.075], s5: ['effectRes', 0.04], s7: ['hpPct', 0.08], b8: ['battleStartEnergy', { amount: 20 }, 'Already Awake: begin battle with 20 Energy.'] },
    lautrec: { s1: ['atkPct', 0.04], s3: ['critRate', 0.027], s5: ['spd', 3], s7: ['critDmg', 0.08], b8: ['dmgVsDebuffedPct', { pct: 0.15 }, 'Kick Them While Down: +15% damage to debuffed enemies.'] },
    gwyndolin: { s1: ['atkPct', 0.04], s3: ['effectHitRate', 0.05], s5: ['spd', 3], s7: ['atkPct', 0.06], b8: ['skillDmgPct', { pct: 0.15 }, 'Second Act: Skill damage +15%.'] },
    logan: { s1: ['atkPct', 0.04], s3: ['critRate', 0.027], s5: ['effectHitRate', 0.05], s7: ['critDmg', 0.08], b8: ['skillDmgPct', { pct: 0.15 }, 'Annotated Casting: Skill damage +15%.'] },
    sif: { s1: ['spd', 3], s3: ['atkPct', 0.05], s5: ['critRate', 0.027], s7: ['atkPct', 0.06], b8: ['ultDmgPct', { pct: 0.12 }, 'Last Loyalty: Ultimate damage +12%.'] },
    quelana: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['atkPct', 0.06], b8: ['dotDmgPct', { pct: 0.18 }, 'Measured Flame: damage over time dealt +18%.'] },
    gwynevere: { s1: ['hpPct', 0.05], s3: ['healBoost', 0.06], s5: ['effectRes', 0.04], s7: ['hpPct', 0.08], b8: ['battleStartEnergy', { amount: 20 }, 'Morning Court: begin battle with 20 Energy.'] },
    ciaran: { s1: ['atkPct', 0.04], s3: ['spd', 3], s5: ['critRate', 0.027], s7: ['critDmg', 0.08], b8: ['basicDmgPct', { pct: 0.15 }, 'Practiced Cut: Basic attack damage +15%.'] },
    gough: { s1: ['hpPct', 0.05], s3: ['atkPct', 0.05], s5: ['breakEffect', 0.08], s7: ['defPct', 0.075], b8: ['ultDmgPct', { pct: 0.12 }, 'Long Draw: Ultimate damage +12%.'] },
    laurentius: { s1: ['atkPct', 0.04], s3: ['hpPct', 0.06], s5: ['effectHitRate', 0.05], s7: ['atkPct', 0.06], b8: ['dotDmgPct', { pct: 0.15 }, 'Steady Simmer: damage over time dealt +15%.'] },
    petrus: { s1: ['hpPct', 0.05], s3: ['healBoost', 0.06], s5: ['defPct', 0.075], s7: ['hpPct', 0.08], b8: ['healOnUltPct', { pct: 0.08 }, 'Self-Care Doctrine: his Ultimate also heals Petrus 8% Max HP.'] },
  };

  const STAT_NAMES = {
    atkPct: 'Whetted Edge', hpPct: 'Hardened Frame', defPct: 'Braced Guard', spd: 'Quickened Step',
    critRate: 'Keen Eye', critDmg: 'Killing Intent', healBoost: 'Mender\'s Touch',
    effectHitRate: 'Hexer\'s Grip', effectRes: 'Warded Mind', breakEffect: 'Sundering Arm',
  };

  function label(key, value) {
    const pct = ['atkPct', 'hpPct', 'defPct', 'critRate', 'critDmg', 'healBoost', 'effectHitRate', 'effectRes', 'breakEffect'];
    const v = pct.includes(key) ? (value * 100).toFixed(1).replace(/\.0$/, '') + '%' : String(value);
    return (DS.STAT_LABEL[key] || key) + ' +' + v;
  }

  function buildTree(charId, rarity, spec) {
    const id = (n) => charId + '_t' + n;
    const statNode = (n, pair, tier, cost) => ({
      id: id(n), name: STAT_NAMES[pair[0]] || 'Tempering', desc: label(pair[0], pair[1]),
      kind: 'stat', stat: { key: pair[0], value: pair[1] },
      cost, requires: n === 1 ? [] : [id(n - 2 >= 1 ? n - 2 : 1)], tier,
    });
    const abilityNode = (n, slot, req, tier, cost) => ({
      id: id(n), name: { basic: 'Honed Instinct', skill: 'Deepened Art', ult: 'Kindled Apex' }[slot],
      desc: (slot === 'basic' ? 'Basic' : slot === 'skill' ? 'Skill' : 'Ultimate') + ' power +15%.',
      kind: 'abilityUp', ability: slot, powerPct: 0.15,
      cost, requires: [id(req)], tier,
    });

    const nodes = [
      statNode(1, spec.s1, 1, { souls: 4000, items: { ember_asc_1: 1 } }),
      abilityNode(2, 'basic', 1, 1, { souls: 8000, items: { ember_asc_1: 2 } }),
      statNode(3, spec.s3, 1, { souls: 8000, items: { ember_asc_1: 2 } }),
      abilityNode(4, 'skill', 2, 2, { souls: 20000, items: { ember_asc_2: 2, titanite_shard: 4 } }),
      statNode(5, spec.s5, 2, { souls: 20000, items: { ember_asc_2: 2 } }),
      abilityNode(6, 'ult', 4, 3, { souls: 45000, items: { ember_asc_3: 2, demon_core: 2 } }),
      statNode(7, spec.s7, 2, { souls: 30000, items: { ember_asc_2: 3 } }),
      {
        id: id(8), name: 'Secret Art', desc: spec.b8[2],
        kind: 'bonus', bonus: { key: spec.b8[0], params: spec.b8[1] },
        cost: { souls: 60000, items: { ember_asc_3: 3, boss_soul_fragment: 1 } },
        requires: [id(6), id(7)], tier: 3,
      },
    ];
    if (rarity === 5 && spec.s9) {
      nodes.push({
        id: id(9), name: 'Lord\'s Capstone', desc: label(spec.s9[0], spec.s9[1]),
        kind: 'stat', stat: { key: spec.s9[0], value: spec.s9[1] },
        cost: { souls: 100000, items: { boss_soul_fragment: 2 } },
        requires: [id(8)], tier: 3,
      });
    }
    return { nodes };
  }

  DS.TRACES = {};
  (DS.CHARACTERS || []).forEach((c) => {
    const spec = SPECS[c.id];
    if (spec) DS.TRACES[c.id] = buildTree(c.id, c.rarity, spec);
  });
})();
