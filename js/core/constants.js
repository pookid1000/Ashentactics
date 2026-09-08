// ASHEN TACTICS: EMBERS OF LORDRAN — shared constants (see CONTRACT.md §2)
// Unofficial, non-commercial fan project. All original code and writing.

window.DS = window.DS || {};

(function () {
  DS.ELEMENTS = ['Physical', 'Fire', 'Frost', 'Lightning', 'Magic', 'Dark', 'Holy'];

  DS.ELEMENT_META = {
    Physical:  { color: '#b8b3a4', icon: '⚔' },
    Fire:      { color: '#e2662c', icon: '🔥' },
    Frost:     { color: '#7ec8e3', icon: '❄' },
    Lightning: { color: '#e8c840', icon: '⚡' },
    Magic:     { color: '#7a86e8', icon: '✦' },
    Dark:      { color: '#8b5fbf', icon: '●' },
    Holy:      { color: '#e8dc9a', icon: '☀' },
  };

  // Elemental advantage wheel: attacker element -> { strongVs, weakVs } (±10% damage).
  // Physical has no entry (always neutral). Holy/Dark is a mutual rivalry (strongVs only,
  // no weakVs — both sides simply deal +10% to each other, never a penalty).
  DS.ELEMENT_ADVANTAGE_PCT = 0.10;
  DS.ELEMENT_ADVANTAGE = {
    Fire:      { strongVs: 'Frost',     weakVs: 'Magic' },
    Frost:     { strongVs: 'Lightning', weakVs: 'Fire' },
    Lightning: { strongVs: 'Magic',     weakVs: 'Frost' },
    Magic:     { strongVs: 'Fire',      weakVs: 'Lightning' },
    Holy:      { strongVs: 'Dark' },
    Dark:      { strongVs: 'Holy' },
  };

  DS.PATHS = {
    Warrior:    { icon: '🗡', desc: 'Balanced fighters who both deal damage and hold the line.' },
    Sentinel:   { icon: '🛡', desc: 'Tanks who shield and protect the party.' },
    Assassin:   { icon: '🏹', desc: 'Physical damage dealers who erase priority threats.' },
    Mage:       { icon: '☄', desc: 'Magic damage dealers who scour the field.' },
    Cleric:     { icon: '✚', desc: 'Healers who keep the company standing.' },
    Herald:     { icon: '🎺', desc: 'Standard-bearers who buff the whole team.' },
    Occultist:  { icon: '☠', desc: 'Debuffers who rot the enemy from within.' },
  };

  DS.RARITY_META = {
    1: { name: 'Common',    color: '#8a8a8a' },
    2: { name: 'Uncommon',  color: '#5f9e6e' },
    3: { name: 'Rare',      color: '#4f7ec2' },
    4: { name: 'Epic',      color: '#9b59b6' },
    5: { name: 'Legendary', color: '#d4af37' },
  };

  DS.STATUS = {
    burn:          { name: 'Burn',           kind: 'dot',     icon: '🔥' },
    bleed:         { name: 'Bleed',          kind: 'dot',     icon: '🩸' },
    poison:        { name: 'Poison',         kind: 'dot',     icon: '☠' },
    shock:         { name: 'Shock',          kind: 'dot',     icon: '⚡' },
    curse:         { name: 'Curse',          kind: 'debuff',  icon: '🕯' },
    blind:         { name: 'Blind',          kind: 'debuff',  icon: '🌫' },
    freeze:        { name: 'Freeze',         kind: 'control', icon: '❄' },
    hex:           { name: 'Hex',            kind: 'debuff',  icon: '🌀' },
    atkUp:         { name: 'ATK Up',         kind: 'buff',    icon: '⬆' },
    atkDown:       { name: 'ATK Down',       kind: 'debuff',  icon: '⬇' },
    defUp:         { name: 'DEF Up',         kind: 'buff',    icon: '🛡' },
    defDown:       { name: 'DEF Down',       kind: 'debuff',  icon: '💔' },
    spdUp:         { name: 'SPD Up',         kind: 'buff',    icon: '💨' },
    spdDown:       { name: 'SPD Down',       kind: 'debuff',  icon: '🐌' },
    vulnerability: { name: 'Vulnerable',     kind: 'debuff',  icon: '🎯' },
    dmgUp:         { name: 'DMG Up',         kind: 'buff',    icon: '🗡' },
    evasionUp:     { name: 'Evasion Up',     kind: 'buff',    icon: '👻' },
    taunt:         { name: 'Taunt',          kind: 'buff',    icon: '⚔' },
    counterStance: { name: 'Counter Stance', kind: 'buff',    icon: '🔁' },
    judgment:      { name: 'Judgment',       kind: 'debuff',  icon: '☀' },
    immobilize:    { name: 'Immobilized',    kind: 'control', icon: '🌿' },
    curseToken:    { name: 'Curse Token',    kind: 'debuff',  icon: '🕯', killAtStacks: 3 },
  };

  DS.BREAK_EFFECTS = {
    Physical:  { status: 'bleed',    desc: 'Break inflicts Bleed.' },
    Fire:      { status: 'burn',     desc: 'Break inflicts Burn.' },
    Frost:     { status: 'freeze',   desc: 'Break Freezes the target, skipping its next action.' },
    Lightning: { status: 'shock',    desc: 'Break inflicts Shock.' },
    Dark:      { status: 'curse',    desc: 'Break inflicts Curse, deepening damage taken.' },
    Holy:      { status: 'judgment', desc: 'Break smites with bonus damage and drains enemy energy.' },
    Magic:     { status: 'hex',      desc: 'Break inflicts Hex, further delaying the target\'s action.' },
  };

  DS.SLOTS = ['helm', 'armor', 'ring', 'talisman'];

  DS.RELIC_MAINSTATS = {
    helm:     ['hpFlat'],
    armor:    ['atkFlat'],
    ring:     ['hpPct', 'atkPct', 'defPct', 'critRate', 'critDmg', 'healBoost'],
    talisman: ['hpPct', 'atkPct', 'defPct', 'spd', 'breakEffect', 'energyRegen'],
  };

  DS.RELIC_SUBSTATS = ['hpPct', 'atkPct', 'defPct', 'hpFlat', 'atkFlat', 'defFlat',
    'spd', 'critRate', 'critDmg', 'breakEffect', 'effectHitRate', 'effectRes'];

  // Per-roll substat values (relic enhancement). Flat values scale with rarity elsewhere.
  DS.SUBSTAT_ROLL = {
    hpPct: 0.035, atkPct: 0.035, defPct: 0.045, hpFlat: 34, atkFlat: 17, defFlat: 17,
    spd: 2, critRate: 0.027, critDmg: 0.054, breakEffect: 0.052, effectHitRate: 0.036, effectRes: 0.036,
  };
  DS.MAINSTAT_BASE = {
    hpFlat: 110, atkFlat: 56, hpPct: 0.069, atkPct: 0.069, defPct: 0.086,
    critRate: 0.051, critDmg: 0.103, healBoost: 0.055, spd: 4, breakEffect: 0.103, energyRegen: 0.031,
  };
  DS.MAINSTAT_PER_LEVEL = 0.20; // main stat grows +20% of base per enhancement level

  DS.STAT_LABEL = {
    hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD',
    hpFlat: 'HP', atkFlat: 'ATK', defFlat: 'DEF',
    hpPct: 'HP %', atkPct: 'ATK %', defPct: 'DEF %',
    critRate: 'CRIT Rate', critDmg: 'CRIT DMG', breakEffect: 'Break Effect',
    effectHitRate: 'Effect Hit', effectRes: 'Effect RES', healBoost: 'Healing Boost',
    energyRegen: 'Energy Regen',
  };

  DS.EFFECT_KEYS = [
    // stat-time
    'atkPct', 'hpPct', 'defPct', 'spdPct', 'critRate', 'critDmg', 'breakEffect', 'healBoost',
    'energyRegen', 'dmgBoostElement',
    // battle-time
    'battleStartEnergy', 'battleStartShieldPct', 'spOnBattleStart', 'dmgVsBrokenPct',
    'dmgVsDebuffedPct', 'ultDmgPct', 'skillDmgPct', 'basicDmgPct', 'followUpDmgPct',
    'onBreakEnergy', 'onKillAtkPct', 'lowHpDmgReduction', 'dotDmgPct', 'healOnUltPct',
    'energyOnHitTaken',
  ];

  DS.LEVEL_CAPS = [20, 30, 40, 50, 60, 70, 80];

  // Global difficulty knob applied to every tier:'boss' enemy's hp/atk/def at spawn time
  // (see buildEnemyUnit, js/engine/battle.js) — one dial instead of hand-tuning ~20 bosses.
  DS.BOSS_DIFFICULTY_MULT = 0.8;

  // A second, HP-only knob layered on top of BOSS_DIFFICULTY_MULT above —
  // boss fights were running too long relative to their damage output, so
  // this trims health specifically without also touching their ATK/DEF (see
  // buildEnemyUnit, js/engine/battle.js). 0.7 = 30% less current boss HP.
  DS.BOSS_HP_MULT = 0.7;

  // Player damage felt too weak — one dial multiplying every point of damage
  // a non-enemy unit deals (see resolveAbility, js/engine/battle.js), applied
  // at the same final post-processing step as the existing reduction/dmgScale
  // multiplier so it composes predictably rather than getting diluted by
  // stacking into the additive dmgBoost terms further up the same function.
  DS.PLAYER_DMG_MULT = 2.5;

  // Ember (ascension material) rewards felt too scarce given how many systems
  // consume them — multiplies every ember_asc_* item reward at the single
  // DS.Save.grant() choke point (see js/core/save.js) rather than hand-editing
  // every reward table.
  DS.EMBER_REWARD_MULT = 2;

  DS.CURVES = {
    charXp(level) { return Math.round(80 * level + 12 * level * level); },
    playerXp(level) { return Math.round(400 + 220 * level * level); },
    weaponXp(level) { return Math.round(60 * level + 8 * level * level); },
    enemyHp(base, level) { return Math.round(base * (1 + 0.22 * (level - 1) + 0.012 * (level - 1) * (level - 1))); },
    enemyAtk(base, level) { return Math.round(base * (1 + 0.10 * (level - 1) + 0.003 * (level - 1) * (level - 1))); },
    enemyDef(base, level) { return Math.round(base * (1 + 0.09 * (level - 1))); },
    breakBaseDmg(level) { return Math.round(120 + 55 * level); },
  };

  DS.GACHA_RATES = { five: 0.006, four: 0.051, three: 0.33, two: 0.28, softPityStart: 74, hardPity: 90, fourPity: 10 };
  DS.PULL_COST_HUMANITY = 160;

  // Player-facing explanations for scripted boss mechanics that a phase banner
  // or ability description doesn't already make clear on its own (see the
  // enemy's own onTurnStart/phase hooks in js/data/enemies.js for the actual
  // logic) — shown in the enemy card tooltip, see enemyMechanicsText() in
  // js/ui/battle-ui.js.
  DS.ENEMY_MECHANIC_NOTES = {
    fourkings_boss: 'Every ~3 turns, another King unfolds from the dark to join the fight — up to 4 in total across the whole battle, each a little weaker than the last.',
    witch_of_izalith: 'Once her threads snap (past the 50% HP break), the loosed chaos flame burns every one of your warriors a little at the start of each of her turns.',
  };
})();
