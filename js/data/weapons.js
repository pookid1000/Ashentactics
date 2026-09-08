// ASHEN TACTICS: EMBERS OF LORDRAN — weapon definitions (CONTRACT.md §4.3)
// Owner: data-equipment. All lore/flavor text is original writing.
// Schema: { id, name, rarity, path, baseAtk, baseHp, baseDef, maxLevel,
//           art:{icon,palette:[c1,c2]}, lore,
//           passive:{ name, desc, fx:[{key, params, perRefine}] } }
// Level scaling is applied by the engine: stat × (1 + 0.08 × (level - 1)).
// perRefine = value ADDED per refine rank beyond 1 (refine 1..5).

window.DS = window.DS || {};

(function () {
  DS.WEAPONS = [

    // ══════════════════════════ 5★ (one per path) ══════════════════════════
    {
      id: 'zweihander', name: 'Zweihander', rarity: 5, path: 'Warrior',
      baseAtk: 36, baseHp: 110, baseDef: 12, maxLevel: 80,
      art: { icon: '⚔', palette: ['#9aa0a8', '#4a4e57'] },
      lore: 'A slab of iron more gravestone than sword; those who master its weight stop digging graves for themselves.',
      passive: {
        name: 'Grave-Toppler',
        desc: 'ATK +18%. Damage dealt to Broken enemies +24%. Each Refine rank: +4.5% ATK, +6% Broken damage.',
        fx: [
          { key: 'atkPct', params: { pct: 0.18 }, perRefine: { pct: 0.045 } },
          { key: 'dmgVsBrokenPct', params: { pct: 0.24 }, perRefine: { pct: 0.06 } },
        ],
      },
    },
    {
      id: 'grant', name: 'Grant', rarity: 5, path: 'Sentinel',
      baseAtk: 26, baseHp: 160, baseDef: 22, maxLevel: 80,
      art: { icon: '🔨', palette: ['#e8dc9a', '#7a6a3a'] },
      lore: 'The blessed great hammer of a paladin who walked into the Catacombs and never once asked the way back.',
      passive: {
        name: 'Undefeated Vigil',
        desc: 'Max HP +20%. Begin battle with a shield equal to 16% of Max HP. Each Refine rank: +5% HP, +4% shield.',
        fx: [
          { key: 'hpPct', params: { pct: 0.20 }, perRefine: { pct: 0.05 } },
          { key: 'battleStartShieldPct', params: { pct: 0.16 }, perRefine: { pct: 0.04 } },
        ],
      },
    },
    {
      id: 'dragonslayer_spear', name: 'Dragonslayer Spear', rarity: 5, path: 'Assassin',
      baseAtk: 34, baseHp: 100, baseDef: 12, maxLevel: 80,
      art: { icon: '🔱', palette: ['#e8c840', '#8a6a1f'] },
      lore: 'A cross spear from the age of dragon hunts; lightning still remembers its shape and answers when it is thrown.',
      passive: {
        name: 'Wyrm-Piercer',
        desc: 'CRIT Rate +10%. Lightning damage +18%. Each Refine rank: +2% CRIT Rate, +4.5% Lightning damage.',
        fx: [
          { key: 'critRate', params: { pct: 0.10 }, perRefine: { pct: 0.02 } },
          { key: 'dmgBoostElement', params: { element: 'Lightning', pct: 0.18 }, perRefine: { pct: 0.045 } },
        ],
      },
    },
    {
      id: 'moonlight_greatsword', name: 'Moonlight Greatsword', rarity: 5, path: 'Mage',
      baseAtk: 34, baseHp: 105, baseDef: 12, maxLevel: 80,
      art: { icon: '🌙', palette: ['#9fe8d8', '#3a6a8a'] },
      lore: 'Carved from the pale tail of the scaleless dragon; it swings arcs of a moon this world was never given.',
      passive: {
        name: 'Tide of Moonlight',
        desc: 'Skill damage +24%. Magic damage +14%. Each Refine rank: +6% Skill damage, +3.5% Magic damage.',
        fx: [
          { key: 'skillDmgPct', params: { pct: 0.24 }, perRefine: { pct: 0.06 } },
          { key: 'dmgBoostElement', params: { element: 'Magic', pct: 0.14 }, perRefine: { pct: 0.035 } },
        ],
      },
    },
    {
      id: 'sunlight_talisman', name: 'Sunlight Talisman', rarity: 5, path: 'Cleric',
      baseAtk: 24, baseHp: 150, baseDef: 18, maxLevel: 80,
      art: { icon: '☀', palette: ['#f2e6a0', '#c2842a'] },
      lore: 'A knight of the sun pressed his faith into this cloth until it learned to shine back.',
      passive: {
        name: 'Borrowed Daylight',
        desc: 'Healing given +16%. After casting an Ultimate, recover 12% of Max HP. Each Refine rank: +4% healing, +3% recovery.',
        fx: [
          { key: 'healBoost', params: { pct: 0.16 }, perRefine: { pct: 0.04 } },
          { key: 'healOnUltPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'channelers_trident', name: 'Channeler\'s Trident', rarity: 5, path: 'Herald',
      baseAtk: 26, baseHp: 140, baseDef: 16, maxLevel: 80,
      art: { icon: '🌀', palette: ['#7a86e8', '#2f2a4f'] },
      lore: 'Six-eyed servants of the pale dragon dance with this trident, and the mad find the rhythm strangely kind.',
      passive: {
        name: 'Maddening Cadence',
        desc: 'Energy Regen +10%. Begin battle with 20 extra Energy. Each Refine rank: +2.5% regen, +5 Energy.',
        fx: [
          { key: 'energyRegen', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
          { key: 'battleStartEnergy', params: { amount: 20 }, perRefine: { amount: 5 } },
        ],
      },
    },
    {
      id: 'lifehunt_scythe', name: 'Lifehunt Scythe', rarity: 5, path: 'Occultist',
      baseAtk: 33, baseHp: 105, baseDef: 11, maxLevel: 80,
      art: { icon: '⚰', palette: ['#e8e8f2', '#6a5a7a'] },
      lore: 'A reaper honed on the life of gods; every harvest costs its own wielder a little red.',
      passive: {
        name: 'Harvest of the Pale',
        desc: 'Damage over time dealt +24%. Damage to debuffed enemies +16%. Each Refine rank: +6% DoT, +4% vs debuffed.',
        fx: [
          { key: 'dotDmgPct', params: { pct: 0.24 }, perRefine: { pct: 0.06 } },
          { key: 'dmgVsDebuffedPct', params: { pct: 0.16 }, perRefine: { pct: 0.04 } },
        ],
      },
    },

    // ══════════════════════════ 4★ (two per path) ══════════════════════════
    {
      id: 'black_knight_halberd', name: 'Black Knight Halberd', rarity: 4, path: 'Warrior',
      baseAtk: 28, baseHp: 90, baseDef: 10, maxLevel: 70,
      art: { icon: '🪓', palette: ['#3a3a3f', '#e2662c'] },
      lore: 'The charred halberd of a knight who followed his lord into the flame and simply kept marching.',
      passive: {
        name: 'Ash-Knight Momentum',
        desc: 'ATK +14%. Defeating an enemy grants a further +10% ATK for 2 turns. Each Refine rank: +3.5% ATK, +2.5% on-kill ATK.',
        fx: [
          { key: 'atkPct', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
          { key: 'onKillAtkPct', params: { pct: 0.10, turns: 2 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'quelaags_furysword', name: 'Quelaag\'s Furysword', rarity: 4, path: 'Warrior',
      baseAtk: 27, baseHp: 90, baseDef: 10, maxLevel: 70,
      art: { icon: '🔥', palette: ['#e2662c', '#5a1f1f'] },
      lore: 'A sword of chitin and grief drawn from a daughter of chaos; it purrs while it burns.',
      passive: {
        name: 'Chaos-Tempered Edge',
        desc: 'Fire damage +16%. Damage over time dealt +12%. Each Refine rank: +4% Fire damage, +3% DoT.',
        fx: [
          { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.16 }, perRefine: { pct: 0.04 } },
          { key: 'dotDmgPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'dragon_tooth', name: 'Dragon Tooth', rarity: 4, path: 'Sentinel',
      baseAtk: 20, baseHp: 120, baseDef: 18, maxLevel: 70,
      art: { icon: '🦴', palette: ['#d8d2c0', '#7a7264'] },
      lore: 'A tooth pulled whole from an everlasting dragon; the arm that lifts it borrows a little of forever.',
      passive: {
        name: 'Ancient Bulwark',
        desc: 'DEF +16%. Below 50% HP, damage taken is reduced by 16%. Each Refine rank: +4% DEF, +4% reduction.',
        fx: [
          { key: 'defPct', params: { pct: 0.16 }, perRefine: { pct: 0.04 } },
          { key: 'lowHpDmgReduction', params: { threshold: 0.5, pct: 0.16 }, perRefine: { pct: 0.04 } },
        ],
      },
    },
    {
      id: 'crest_shield', name: 'Crest Shield', rarity: 4, path: 'Sentinel',
      baseAtk: 18, baseHp: 130, baseDef: 16, maxLevel: 70,
      art: { icon: '🛡', palette: ['#4f7ec2', '#d8d2c0'] },
      lore: 'Borne by an elite knight of Astora; the crest outlived the man, as crests are made to do.',
      passive: {
        name: 'Oath Unbroken',
        desc: 'Max HP +14%. Gain 3 extra Energy when struck. Each Refine rank: +3.5% HP, +1 Energy.',
        fx: [
          { key: 'hpPct', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
          { key: 'energyOnHitTaken', params: { amount: 3 }, perRefine: { amount: 1 } },
        ],
      },
    },
    {
      id: 'black_bow_of_pharis', name: 'Black Bow of Pharis', rarity: 4, path: 'Assassin',
      baseAtk: 27, baseHp: 80, baseDef: 8, maxLevel: 70,
      art: { icon: '🏹', palette: ['#4a4e3a', '#8a8258'] },
      lore: 'The longbow of a hunter so quiet the forest forgot to mark her passing.',
      passive: {
        name: 'Silent Volley',
        desc: 'CRIT DMG +20%. Basic attack damage +16%. Each Refine rank: +5% CRIT DMG, +4% Basic damage.',
        fx: [
          { key: 'critDmg', params: { pct: 0.20 }, perRefine: { pct: 0.05 } },
          { key: 'basicDmgPct', params: { pct: 0.16 }, perRefine: { pct: 0.04 } },
        ],
      },
    },
    {
      id: 'dark_silver_tracer', name: 'Dark Silver Tracer', rarity: 4, path: 'Assassin',
      baseAtk: 26, baseHp: 85, baseDef: 9, maxLevel: 70,
      art: { icon: '🗡', palette: ['#c8d2e8', '#3a3f57'] },
      lore: 'The off-hand fang of the Lord\'s Blade; it signs its work in a script only the dead can read.',
      passive: {
        name: 'Tracer\'s Rite',
        desc: 'CRIT Rate +8%. Damage to debuffed enemies +14%. Each Refine rank: +2% CRIT Rate, +3.5% vs debuffed.',
        fx: [
          { key: 'critRate', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
          { key: 'dmgVsDebuffedPct', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
        ],
      },
    },
    {
      id: 'tin_crystallization_catalyst', name: 'Tin Crystallization Catalyst', rarity: 4, path: 'Mage',
      baseAtk: 28, baseHp: 78, baseDef: 8, maxLevel: 70,
      art: { icon: '🪄', palette: ['#bfd8e8', '#5a7a9e'] },
      lore: 'A great sorcerer traded steadiness for raw power and called the bargain scholarship.',
      passive: {
        name: 'Reckless Scholarship',
        desc: 'Skill damage +20%. ATK +10%. Each Refine rank: +5% Skill damage, +2.5% ATK.',
        fx: [
          { key: 'skillDmgPct', params: { pct: 0.20 }, perRefine: { pct: 0.05 } },
          { key: 'atkPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'ascended_pyromancy_flame', name: 'Ascended Pyromancy Flame', rarity: 4, path: 'Mage',
      baseAtk: 26, baseHp: 88, baseDef: 9, maxLevel: 70,
      art: { icon: '☄', palette: ['#e2662c', '#8a3a1f'] },
      lore: 'A flame raised patiently by a mother of pyromancy until it learned to feed itself.',
      passive: {
        name: 'Furtive Blaze',
        desc: 'Fire damage +14%. Ultimate damage +14%. Each Refine rank: +3.5% to both.',
        fx: [
          { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.14 }, perRefine: { pct: 0.035 } },
          { key: 'ultDmgPct', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
        ],
      },
    },
    {
      id: 'ivory_talisman', name: 'Ivory Talisman', rarity: 4, path: 'Cleric',
      baseAtk: 18, baseHp: 120, baseDef: 14, maxLevel: 70,
      art: { icon: '📿', palette: ['#f2ede0', '#b8a88a'] },
      lore: 'Carved bone-white for maidens of the white church, whose mercy arrives like an order.',
      passive: {
        name: 'Maiden\'s Devotion',
        desc: 'Healing given +14%. Max HP +10%. Each Refine rank: +3.5% healing, +2.5% HP.',
        fx: [
          { key: 'healBoost', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
          { key: 'hpPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'canvas_talisman', name: 'Canvas Talisman', rarity: 4, path: 'Cleric',
      baseAtk: 19, baseHp: 112, baseDef: 13, maxLevel: 70,
      art: { icon: '🧵', palette: ['#d8cbb0', '#8a7a5a'] },
      lore: 'Rough cloth for wandering clerics who pray with cracked and calloused hands.',
      passive: {
        name: 'Pilgrim\'s Patience',
        desc: 'Energy Regen +10%. After casting an Ultimate, recover 8% of Max HP. Each Refine rank: +2.5% regen, +2% recovery.',
        fx: [
          { key: 'energyRegen', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
          { key: 'healOnUltPct', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
        ],
      },
    },
    {
      id: 'grass_crest_shield', name: 'Grass Crest Shield', rarity: 4, path: 'Herald',
      baseAtk: 20, baseHp: 110, baseDef: 13, maxLevel: 70,
      art: { icon: '🌿', palette: ['#7a9e5f', '#3f5a2f'] },
      lore: 'The grass crest blesses its bearer with tireless breath; travellers trust it above most gods.',
      passive: {
        name: 'Tireless Crest',
        desc: 'Energy Regen +8%. Party begins battle with +1 Skill Point (+1 more at Refine 5). Each Refine rank: +2% regen, +0.25 SP (rounded down).',
        fx: [
          { key: 'energyRegen', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
          { key: 'spOnBattleStart', params: { amount: 1 }, perRefine: { amount: 0.25 } },
        ],
      },
    },
    {
      id: 'crystal_ring_shield', name: 'Crystal Ring Shield', rarity: 4, path: 'Herald',
      baseAtk: 18, baseHp: 105, baseDef: 16, maxLevel: 70,
      art: { icon: '💠', palette: ['#bfe8e3', '#5f8a9e'] },
      lore: 'A halo of hardened crystal that rings when struck, turning every parry into a chorus.',
      passive: {
        name: 'Resonant Guard',
        desc: 'Begin battle with a shield equal to 10% of Max HP. DEF +12%. Each Refine rank: +2.5% shield, +3% DEF.',
        fx: [
          { key: 'battleStartShieldPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
          { key: 'defPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'velkas_talisman', name: 'Velka\'s Talisman', rarity: 4, path: 'Occultist',
      baseAtk: 25, baseHp: 90, baseDef: 10, maxLevel: 70,
      art: { icon: '🪶', palette: ['#3a2f3f', '#8b5fbf'] },
      lore: 'An occult talisman sworn to the goddess of sin, who keeps her ledgers in the dark.',
      passive: {
        name: 'Ledger of Sin',
        desc: 'Dark damage +14%. Ultimate damage +12%. Each Refine rank: +3.5% Dark damage, +3% Ultimate damage.',
        fx: [
          { key: 'dmgBoostElement', params: { element: 'Dark', pct: 0.14 }, perRefine: { pct: 0.035 } },
          { key: 'ultDmgPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'gravelord_sword', name: 'Gravelord Sword', rarity: 4, path: 'Occultist',
      baseAtk: 26, baseHp: 88, baseDef: 9, maxLevel: 70,
      art: { icon: '☠', palette: ['#4a4a52', '#8a8258'] },
      lore: 'A blade grown, not forged, from the coffin of the first of the dead; it sweats a patient venom.',
      passive: {
        name: 'Miasma of the Grave',
        desc: 'Damage over time dealt +18%. Break Effect +12%. Each Refine rank: +4.5% DoT, +3% Break Effect.',
        fx: [
          { key: 'dotDmgPct', params: { pct: 0.18 }, perRefine: { pct: 0.045 } },
          { key: 'breakEffect', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },

    // ══════════════════════════ 3★ (one+ per path) ══════════════════════════
    {
      id: 'claymore', name: 'Claymore', rarity: 3, path: 'Warrior',
      baseAtk: 21, baseHp: 70, baseDef: 8, maxLevel: 60,
      art: { icon: '⚔', palette: ['#b8b3a4', '#5a5a5f'] },
      lore: 'An honest greatsword with no legend of its own; each hand that grips it writes one.',
      passive: {
        name: 'Trusted Steel',
        desc: 'ATK +12%. Each Refine rank: +3% ATK.',
        fx: [
          { key: 'atkPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'tower_kite_shield', name: 'Tower Kite Shield', rarity: 3, path: 'Sentinel',
      baseAtk: 14, baseHp: 90, baseDef: 13, maxLevel: 60,
      art: { icon: '🛡', palette: ['#8a94a8', '#4a4e57'] },
      lore: 'Painted with a tower no one has ever found; soldiers trust the promise more than the place.',
      passive: {
        name: 'Steady Wall',
        desc: 'DEF +14%. Each Refine rank: +3.5% DEF.',
        fx: [
          { key: 'defPct', params: { pct: 0.14 }, perRefine: { pct: 0.035 } },
        ],
      },
    },
    {
      id: 'estoc', name: 'Estoc', rarity: 3, path: 'Assassin',
      baseAtk: 20, baseHp: 62, baseDef: 7, maxLevel: 60,
      art: { icon: '🗡', palette: ['#c8c8d0', '#6a6a72'] },
      lore: 'A slender thrusting sword that treats armour as a rumour.',
      passive: {
        name: 'Needle Through Mail',
        desc: 'CRIT Rate +6%. Each Refine rank: +1.5% CRIT Rate.',
        fx: [
          { key: 'critRate', params: { pct: 0.06 }, perRefine: { pct: 0.015 } },
        ],
      },
    },
    {
      id: 'uchigatana', name: 'Uchigatana', rarity: 3, path: 'Assassin',
      baseAtk: 20, baseHp: 60, baseDef: 6, maxLevel: 60,
      art: { icon: '🔪', palette: ['#d8d8e0', '#3a3a3f'] },
      lore: 'A curved blade from a distant land; it prefers the first cut to be the last.',
      passive: {
        name: 'Drawn in One Breath',
        desc: 'SPD +6%. Each Refine rank: +1.5% SPD.',
        fx: [
          { key: 'spdPct', params: { pct: 0.06 }, perRefine: { pct: 0.015 } },
        ],
      },
    },
    {
      id: 'pyromancy_flame', name: 'Pyromancy Flame', rarity: 3, path: 'Mage',
      baseAtk: 21, baseHp: 60, baseDef: 6, maxLevel: 60,
      art: { icon: '🔥', palette: ['#e2662c', '#3f2a1f'] },
      lore: 'A handful of living flame passed from teacher to pupil; it grows exactly as its bearer does.',
      passive: {
        name: 'Kindling',
        desc: 'Fire damage +10%. Each Refine rank: +2.5% Fire damage.',
        fx: [
          { key: 'dmgBoostElement', params: { element: 'Fire', pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'thorolund_talisman', name: 'Thorolund Talisman', rarity: 3, path: 'Cleric',
      baseAtk: 14, baseHp: 88, baseDef: 10, maxLevel: 60,
      art: { icon: '📿', palette: ['#e8dc9a', '#9e8a5a'] },
      lore: 'A sturdy talisman stitched in the lecture halls of Thorolund; faith by rote, but faith.',
      passive: {
        name: 'Rustic Blessing',
        desc: 'Healing given +10%. Each Refine rank: +2.5% healing.',
        fx: [
          { key: 'healBoost', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'caduceus_round_shield', name: 'Caduceus Round Shield', rarity: 3, path: 'Herald',
      baseAtk: 15, baseHp: 82, baseDef: 10, maxLevel: 60,
      art: { icon: '🐍', palette: ['#c25f5f', '#d8d2c0'] },
      lore: 'A round shield bearing twin serpents; standard-bearers rap it to set the marching pace.',
      passive: {
        name: 'Marching Order',
        desc: 'Energy Regen +6%. Each Refine rank: +1.5% regen.',
        fx: [
          { key: 'energyRegen', params: { pct: 0.06 }, perRefine: { pct: 0.015 } },
        ],
      },
    },
    {
      id: 'notched_whip', name: 'Notched Whip', rarity: 3, path: 'Occultist',
      baseAtk: 19, baseHp: 64, baseDef: 7, maxLevel: 60,
      art: { icon: '🪢', palette: ['#6a5a3f', '#8a4a3a'] },
      lore: 'A cruel whip whose teeth were filed in, not worn in; the wounds it leaves refuse to close politely.',
      passive: {
        name: 'Festering Notches',
        desc: 'Damage over time dealt +12%. Each Refine rank: +3% DoT.',
        fx: [
          { key: 'dotDmgPct', params: { pct: 0.12 }, perRefine: { pct: 0.03 } },
        ],
      },
    },
    {
      id: 'bastard_sword', name: 'Bastard Sword', rarity: 3, path: 'Warrior',
      baseAtk: 20, baseHp: 68, baseDef: 7, maxLevel: 60,
      art: { icon: '🗡', palette: ['#a8a49a', '#5a564e'] },
      lore: 'Neither knight\'s blade nor soldier\'s sidearm, it serves whoever grips it hardest.',
      passive: {
        name: 'Quickened Grip',
        desc: 'CRIT Rate +6%. Each Refine rank: +1.5% CRIT Rate.',
        fx: [
          { key: 'critRate', params: { pct: 0.06 }, perRefine: { pct: 0.015 } },
        ],
      },
    },
    {
      id: 'silver_knight_shield', name: 'Silver Knight Shield', rarity: 3, path: 'Sentinel',
      baseAtk: 13, baseHp: 92, baseDef: 14, maxLevel: 60,
      art: { icon: '🛡', palette: ['#c8ccd8', '#5f6472'] },
      lore: 'Polished each dawn by a knight who no longer remembers which city he still guards.',
      passive: {
        name: 'Steadfast Bulwark',
        desc: 'Max HP +10%. Each Refine rank: +2.5% HP.',
        fx: [
          { key: 'hpPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'chaos_blade', name: 'Chaos Blade', rarity: 3, path: 'Mage',
      baseAtk: 21, baseHp: 58, baseDef: 6, maxLevel: 60,
      art: { icon: '🔪', palette: ['#e2662c', '#2f1a1a'] },
      lore: 'Grown in the flame beneath Izalith, this blade drinks its wielder\'s vigor as readily as its foe\'s.',
      passive: {
        name: 'Bloodstained Edge',
        desc: 'Damage over time dealt +10%. Each Refine rank: +2.5% DoT.',
        fx: [
          { key: 'dotDmgPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'prayer_beads', name: 'Prayer Beads', rarity: 3, path: 'Cleric',
      baseAtk: 13, baseHp: 90, baseDef: 11, maxLevel: 60,
      art: { icon: '📿', palette: ['#e0d8c0', '#8a7a5a'] },
      lore: 'Worn smooth by a hand that counted each bead against a name it refused to forget.',
      passive: {
        name: 'Ashen Ward',
        desc: 'DEF +8%. Each Refine rank: +2% DEF.',
        fx: [
          { key: 'defPct', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
        ],
      },
    },
    {
      id: 'heralds_banner', name: 'Herald\'s Banner', rarity: 3, path: 'Herald',
      baseAtk: 15, baseHp: 84, baseDef: 11, maxLevel: 60,
      art: { icon: '🚩', palette: ['#8a3a3a', '#d8d2c0'] },
      lore: 'Raised so the scattered could find one another again, in a world that keeps thinning them out.',
      passive: {
        name: 'Guardian\'s Oath',
        desc: 'DEF +10%. Each Refine rank: +2.5% DEF.',
        fx: [
          { key: 'defPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'dark_hand', name: 'Dark Hand', rarity: 3, path: 'Occultist',
      baseAtk: 19, baseHp: 62, baseDef: 7, maxLevel: 60,
      art: { icon: '🖤', palette: ['#2a1f33', '#5a3a7a'] },
      lore: 'A gauntlet that grips the soul before the flesh; those it takes from are rarely told the difference.',
      passive: {
        name: 'Grasp of Sin',
        desc: 'Dark damage +10%. Each Refine rank: +2.5% Dark damage.',
        fx: [
          { key: 'dmgBoostElement', params: { element: 'Dark', pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },

    // ══════════════════════════ 2★ (gacha filler) ══════════════════════════
    {
      id: 'longsword', name: 'Longsword', rarity: 2, path: 'Warrior',
      baseAtk: 14, baseHp: 48, baseDef: 6, maxLevel: 60,
      art: { icon: '🗡', palette: ['#b8b3a4', '#6a6a72'] },
      lore: 'The knight\'s habitual answer to most questions.',
      passive: {
        name: 'Knight\'s Habit',
        desc: 'ATK +8%. Each Refine rank: +2% ATK.',
        fx: [
          { key: 'atkPct', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
        ],
      },
    },
    {
      id: 'short_bow', name: 'Short Bow', rarity: 2, path: 'Assassin',
      baseAtk: 15, baseHp: 42, baseDef: 5, maxLevel: 60,
      art: { icon: '🏹', palette: ['#8a7a5a', '#5a4a2f'] },
      lore: 'A poacher\'s bow, strung for patience rather than power.',
      passive: {
        name: 'Poacher\'s Draw',
        desc: 'Basic attack damage +10%. Each Refine rank: +2.5% Basic damage.',
        fx: [
          { key: 'basicDmgPct', params: { pct: 0.10 }, perRefine: { pct: 0.025 } },
        ],
      },
    },
    {
      id: 'heater_shield', name: 'Heater Shield', rarity: 2, path: 'Sentinel',
      baseAtk: 10, baseHp: 60, baseDef: 9, maxLevel: 60,
      art: { icon: '🛡', palette: ['#5f7ea8', '#d8d2c0'] },
      lore: 'A modest shield that has apologised to many swords and yielded to few.',
      passive: {
        name: 'Small Comfort',
        desc: 'Max HP +8%. Each Refine rank: +2% HP.',
        fx: [
          { key: 'hpPct', params: { pct: 0.08 }, perRefine: { pct: 0.02 } },
        ],
      },
    },
    {
      id: 'talisman', name: 'Talisman', rarity: 2, path: 'Cleric',
      baseAtk: 10, baseHp: 58, baseDef: 8, maxLevel: 60,
      art: { icon: '📿', palette: ['#d8cbb0', '#9e8a6a'] },
      lore: 'Plain cloth and plainer prayer; the gods hear it all the same.',
      passive: {
        name: 'Plain Prayer',
        desc: 'Healing given +6%. Each Refine rank: +1.5% healing.',
        fx: [
          { key: 'healBoost', params: { pct: 0.06 }, perRefine: { pct: 0.015 } },
        ],
      },
    },

    // ══════════════════════════ 1★ (gacha filler) ══════════════════════════
    {
      id: 'broken_straight_sword', name: 'Broken Straight Sword', rarity: 1, path: 'Warrior',
      baseAtk: 10, baseHp: 32, baseDef: 4, maxLevel: 60,
      art: { icon: '🗡', palette: ['#8a8a8a', '#5a5a5a'] },
      lore: 'Half a sword, which is still more sword than most hollows can claim.',
      passive: {
        name: 'Stubborn Edge',
        desc: 'ATK +4%. Each Refine rank: +1% ATK.',
        fx: [
          { key: 'atkPct', params: { pct: 0.04 }, perRefine: { pct: 0.01 } },
        ],
      },
    },
    {
      id: 'club', name: 'Club', rarity: 1, path: 'Sentinel',
      baseAtk: 9, baseHp: 38, baseDef: 5, maxLevel: 60,
      art: { icon: '🪵', palette: ['#8a6a4a', '#5a422f'] },
      lore: 'A length of hard wood. Arguments end quickly when it speaks.',
      passive: {
        name: 'Simple Argument',
        desc: 'Max HP +4%. Each Refine rank: +1% HP.',
        fx: [
          { key: 'hpPct', params: { pct: 0.04 }, perRefine: { pct: 0.01 } },
        ],
      },
    },
  ];

  // Load-time sanity check: every passive hook must be a legal EFFECT_KEYS entry.
  if (DS.EFFECT_KEYS) {
    DS.WEAPONS.forEach(function (w) {
      (w.passive && w.passive.fx ? w.passive.fx : []).forEach(function (f) {
        if (DS.EFFECT_KEYS.indexOf(f.key) === -1) {
          console.warn('[weapons] illegal effect key "' + f.key + '" on weapon "' + w.id + '"');
        }
      });
    });
  }
})();
