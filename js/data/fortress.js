// ASHEN TACTICS — Fortress roguelike mode: static data (config, perk pool,
// trap/event pools, node-kind weight tables). Pure data, no logic — mirrors
// every other js/data/*.js file's own-IIFE/window.DS.* convention.
// See js/engine/fortress.js for the run engine that consumes all of this.

window.DS = window.DS || {};

(function () {
  DS.FORTRESS_CONFIG = {
    // Tripled from the original 9/6/3-floor bands (21 total floors instead of
    // 9) so a run has roughly 3x as many battle encounters — same
    // early/mid/late weighting and checkpoint cadence, just three times the
    // floors in each band.
    totalFloors: 21,
    bossFloors: [10, 17, 21],
    finalFloor: 21,
    // Node count for every non-boss floor (boss floors are always exactly 1).
    // The map packs several floors side by side per row (see FLOORS_PER_ROW
    // in js/engine/fortress.js) rather than stretching one floor across the
    // whole width, so this stays a comfortable 3 rather than needing to be
    // wide enough to fill a full screen on its own.
    floorNodeCount: 3,

    // Convex ease (slow at first, steeper later) instead of a straight line —
    // a linear ramp still made the opening handful of floors punishing for a
    // genuine fresh Lv.1/no-gear character (see DS.Fortress.buildFortressUnit),
    // even after the first nerf pass. Floors 1-3 now sit at level 1-2, floor 5
    // at 4, only really picking up around the floor-10 checkpoint — while
    // still reaching the same ~level 40 final-boss target by floor 21.
    enemyLevelForFloor(floor) {
      const t = Math.max(0, floor - 1) / (this.totalFloors - 1);
      return Math.max(1, Math.round(1 + 39 * Math.pow(t, 1.6)));
    },

    // Kind-weight tables, keyed by depth band — traps/elites climb with depth,
    // shop/forge/rest/event stay steadier (rest tapers off a little at the
    // very end, same as shop/forge, since by then a run's gear choices are
    // mostly settled). Fed straight into DS.RNG.weighted().
    nodeWeights: {
      early: [ // floors 1-9
        { kind: 'normal', weight: 36 }, { kind: 'shop', weight: 13 }, { kind: 'forge', weight: 8 },
        { kind: 'event', weight: 13 }, { kind: 'trap', weight: 8 }, { kind: 'elite', weight: 4 },
        { kind: 'rest', weight: 9 }, { kind: 'wager', weight: 5 }, { kind: 'altar', weight: 4 },
      ],
      mid: [ // floors 11-16
        { kind: 'normal', weight: 28 }, { kind: 'shop', weight: 10 }, { kind: 'forge', weight: 8 },
        { kind: 'event', weight: 11 }, { kind: 'trap', weight: 15 }, { kind: 'elite', weight: 10 },
        { kind: 'rest', weight: 7 }, { kind: 'wager', weight: 7 }, { kind: 'altar', weight: 6 },
      ],
      late: [ // floors 18-20
        { kind: 'normal', weight: 20 }, { kind: 'shop', weight: 8 }, { kind: 'forge', weight: 6 },
        { kind: 'event', weight: 8 }, { kind: 'trap', weight: 19 }, { kind: 'elite', weight: 22 },
        { kind: 'rest', weight: 5 }, { kind: 'wager', weight: 8 }, { kind: 'altar', weight: 7 },
      ],
    },

    // Perk-rarity odds by context, also fed into DS.RNG.weighted().
    perkRarityWeights: {
      start:       [{ rarity: 1, weight: 55 }, { rarity: 2, weight: 35 }, { rarity: 3, weight: 9 }, { rarity: 4, weight: 1 }, { rarity: 5, weight: 0 }],
      normalEarly: [{ rarity: 1, weight: 45 }, { rarity: 2, weight: 35 }, { rarity: 3, weight: 16 }, { rarity: 4, weight: 4 }, { rarity: 5, weight: 0 }],
      normalLate:  [{ rarity: 1, weight: 20 }, { rarity: 2, weight: 35 }, { rarity: 3, weight: 28 }, { rarity: 4, weight: 14 }, { rarity: 5, weight: 3 }],
      elite:       [{ rarity: 1, weight: 10 }, { rarity: 2, weight: 25 }, { rarity: 3, weight: 35 }, { rarity: 4, weight: 24 }, { rarity: 5, weight: 6 }],
      boss:        [{ rarity: 1, weight: 0 }, { rarity: 2, weight: 10 }, { rarity: 3, weight: 30 }, { rarity: 4, weight: 40 }, { rarity: 5, weight: 20 }],
    },

    shopPerkPriceByRarity: { 1: 40, 2: 80, 3: 150, 4: 280, 5: 500 },
    shopCureWoundsCost: 60,
    // A real, persistent relic offer (see DS.Fortress.buyShopRelic) — priced
    // well above the temporary weapon offer (which is free) since this one
    // survives the run regardless of how it ends.
    shopRelicCost: 350,
    forgeBaseCost: 50, forgeCostPerLevel: 30, forgeMaxLevel: 10,

    // Rest node — spends Cinders to raise a squad member's IN-RUN level (see
    // DS.Fortress.levelUpChar/buildFortressUnit); equipping real owned relics
    // and a real owned weapon there is free, since nothing is consumed —
    // it's just temporarily referencing gear that already exists in the
    // player's real inventory for the duration of the run (see
    // DS.Fortress.equipRunRelic/equipRunRealWeapon).
    restLevelCap: 30, restLevelBaseCost: 30, restLevelCostPerLevel: 12,

    trapCinderLossHeavy: 25, trapCinderLossLight: 10, trapCinderGainSafe: 10,
    eventCindersBad: -40, eventCindersGood: 120,
    eliteCindersReward: 80, normalCindersReward: 40, bossCindersReward: 160,

    woundDebuff: { atkMult: 0.8, defMult: 0.85 },

    victoryBase: { souls: 20000, humanity: 80 },
    victoryPerksSoulsMult: 1500, victoryRaritySoulsMult: 800, victoryCindersSoulsMult: 8,
    victoryCharExpPerFloor: 300,
    victoryBonusDupeChance: 0.15,
  };

  // Wager node — bet Cinders (and optionally stake a held perk) on a d20 roll
  // against the tier's winChance for a payout. Losing a staked perk actually
  // removes it from active.perks; see DS.Fortress.resolveWager. A Boon can
  // scale payoutMult further (see FORTRESS_BOONS' wagerPayoutMult).
  DS.FORTRESS_WAGER = {
    tiers: [
      { id: 'timid', name: 'Timid Bet', cost: 20, winChance: 0.60, payoutMult: 1.6 },
      { id: 'bold', name: 'Bold Bet', cost: 50, winChance: 0.45, payoutMult: 2.4 },
      { id: 'reckless', name: 'Reckless Bet', cost: 100, winChance: 0.30, payoutMult: 3.8 },
    ],
    perkStakeMultBonus: 1.5,
  };

  // Altar node — a deliberate, chosen trade-off (not a random roll): take a
  // real, named, run-wide debuff in exchange for a guaranteed strong perk.
  // Curses are never curable (see DS.State.fortress.active.curses — unlike
  // per-character `wounded`, nothing clears these for the rest of the run).
  // Each is paired with an EXISTING rarity-4/5 DS.FORTRESS_PERKS id so the
  // "guaranteed" reward needs no new perk authoring — see
  // DS.Fortress.chooseAltarBargain.
  // Run-start Boon — a once-per-run pick (see DS.Fortress.queueBoonChoice/
  // chooseBoon) that reshapes this run's node-kind odds by multiplying
  // matching nodeWeights entries (see DS.Fortress's applyBoonWeights). Two
  // Boons also carry an extra, feature-specific multiplier read directly by
  // that feature (wagerPayoutMult by resolveWager, secretRevealBias by
  // isSecretRevealed) rather than needing any new generic plumbing.
  DS.FORTRESS_BOONS = [
    { id: 'boon_pilgrim', name: "Pilgrim's Peace", icon: '🕯',
      desc: 'Shop and Rest turn up more often; traps grow rarer.',
      weightMods: { shop: 1.5, rest: 1.6, forge: 1.2, trap: 0.5 } },
    { id: 'boon_warmonger', name: "Warmonger's Zeal", icon: '⚔',
      desc: 'The Fortress bares more teeth — Elites appear far more.',
      weightMods: { elite: 2.0, normal: 1.1 } },
    { id: 'boon_gambler', name: "Gambler's Luck", icon: '🎲',
      desc: 'Wager nodes turn up far more, and misfortune stings less.',
      weightMods: { wager: 3.0, trap: 0.7 }, wagerPayoutMult: 1.15 },
    { id: 'boon_seeker', name: "Seeker's Instinct", icon: '👁',
      desc: 'Doors open a little sooner; the Fortress hides its secrets a little less well.',
      weightMods: { event: 1.3 }, secretRevealBias: 0.7 },
  ];

  // Secret vault nodes — placed by a post-pass in DS.Fortress.generateGraph
  // (not a weighted roll like every other kind), rendered pixel-identical to
  // a normal locked/fogged node (see displayNodeState in
  // js/ui/fortress-ui.js) until BOTH normally reachable AND its `reveal`
  // condition is met (see DS.Fortress.isSecretRevealed) — genuinely secret,
  // no visual tell beforehand. floorRange restricts which floors a recipe
  // can be placed on; thresholds are tuned low enough that the condition is
  // very likely already true well before that floor is reached.
  DS.FORTRESS_SECRETS = [
    { id: 'secret_cache', name: 'A Quiet Cache', icon: '💰',
      reveal: { type: 'cinders', value: 100 }, floorRange: [4, 9],
      reward: { kind: 'cinders_recruit', cinders: 150 } },
    { id: 'secret_door', name: 'The Marked Door', icon: '🗝',
      reveal: { type: 'perks', value: 3 }, floorRange: [6, 12],
      reward: { kind: 'perks', minRarity: 3, count: 2 } },
    { id: 'secret_cell', name: 'The Sealed Cell', icon: '⛓',
      reveal: { type: 'squad', value: 3 }, floorRange: [9, 15],
      reward: { kind: 'perks_and_cinders', minRarity: 4, count: 1, cinders: 80 } },
  ];

  // The Shop node's vendor, named and reactive to run state (see
  // DS.Fortress's rollShopStock/buyShopPerk) — priority-ordered: curse taken
  // beats wounds-cured beats many-perks beats plain depth-based flavor.
  DS.FORTRESS_MERCHANT = {
    name: 'Mirelle', title: 'the Weary Merchant',
    linesByDepth: {
      early: ["Fresh ash on you still. Buy quick — the Fortress doesn't wait.", "First time down? Everyone says that, first time."],
      mid: ["You're deeper than most who stop by twice.", "Still standing. Good — my wares don't sell themselves to corpses."],
      late: ["This far down, Cinders mean less than breathing does.", "Almost admirable, how far you've dragged yourself."],
    },
    linesWoundsCured: ["Mended again? At this rate I should charge rent.", "Third time patching this lot. I'm starting to worry."],
    linesCurseTaken: ["I can smell the bargain on you. Hope it was worth it.", "A curse, is it. Cinders spend the same, cursed or clean."],
    linesManyPerks: ["Look at you, dripping with charms. The Fortress must really want you dead."],
    bonusOffer: { requiresCurses: 1, perkRarityFloor: 4, priceMult: 0.85 },
  };

  // The run's one recurring narrative presence — a permanently-hollowed
  // guide who has failed this descent countless times and can no longer
  // carry a blade the Fortress "recognizes," so he only ever walks beside a
  // new bearer and offers words, never fights or joins the squad. See
  // DS.Fortress's queueCompanionChoice/dismissCompanion and
  // js/ui/fortress-ui.js's showBoonChoiceModal (his introduction) and
  // openRestModal (his rest-node cameo + choice).
  DS.FORTRESS_COMPANION = {
    id: 'corvane', name: 'Corvane', epithet: 'the Ashfinder',
    introLines: [
      "Another ember, another fool to carry it. Choose your road before the Fortress notices you've arrived.",
      "I've watched a thousand bearers take this walk. Pick your burden, and pick it fast.",
    ],
    bossClearLines: [
      'Still standing. That\'s further than most.',
      "The Fortress felt that. It won't forget you now, for whatever that's worth.",
    ],
    restLines: [
      'Sit. Even the ash needs to cool sometimes.',
      "Rest isn't weakness down here. It's the only reason anyone reaches the bottom at all.",
    ],
    victoryLine: 'You did what I never could. Go on, then — the ash remembers this one.',
    // The "Steadying Hand" option is a company-wide mini-perk pushed through
    // the existing perk pipeline (see DS.Fortress.chooseCompanionRestOption)
    // rather than inventing new per-character targeting — perks are already
    // always company-wide in this engine, so this reuses that wholesale.
    restChoices: [
      { id: 'steady_hand', label: 'A Steadying Hand',
        grantPerk: { id: 'c_steady_hand', name: "A Steadying Hand", icon: '🤝', rarity: 1,
          desc: "DEF +6% (Corvane's gift).", fx: [{ key: 'defPct', params: { pct: 0.06 } }], fromCompanion: true } },
      { id: 'quiet_coin', label: 'A Quiet Coin', desc: '+30 Cinders, no strings.', cinders: 30 },
    ],
  };

  DS.FORTRESS_CURSES = [
    { id: 'c_frailty', name: 'Curse of Frailty', icon: '🥀',
      desc: "The company's Max HP is diminished for the rest of this descent.",
      fx: [{ key: 'hpPct', params: { pct: -0.18 } }], pairedPerkId: 'p_dark_lords_crown' },
    { id: 'c_rust', name: 'Curse of Rust', icon: '⛓',
      desc: 'Every blade in the company bites duller.',
      fx: [{ key: 'atkPct', params: { pct: -0.15 } }], pairedPerkId: 'p_crown_of_the_dead' },
    { id: 'c_leaden_limbs', name: 'Curse of Leaden Limbs', icon: '⚰',
      desc: 'The company moves as though wading through tar.',
      fx: [{ key: 'spdPct', params: { pct: -0.20 } }], pairedPerkId: 'p_grand_ultimatum' },
    { id: 'c_hollow_guard', name: 'Curse of the Hollow Guard', icon: '🕳',
      desc: "The company's guard falters for the rest of this descent.",
      fx: [{ key: 'defPct', params: { pct: -0.18 } }], pairedPerkId: 'p_undying_flame' },
  ];

  // 31 perks: 8x1*, 8x2*, 7x3*, 5x4*, 3x5* — every fx key drawn straight from
  // the existing DS.EFFECT_KEYS vocabulary (see js/core/constants.js) so no
  // new engine hook is ever required; applied via DS.Fortress.applyRunModifiers.
  DS.FORTRESS_PERKS = [
    // ───────── 1-star (8) ─────────
    { id: 'p_whetstone', name: 'Whetstone Edge', rarity: 1, icon: '🗡',
      desc: 'ATK +6%.', fx: [{ key: 'atkPct', params: { pct: 0.06 } }] },
    { id: 'p_hardened', name: 'Hardened Resolve', rarity: 1, icon: '🛡',
      desc: 'DEF +8%.', fx: [{ key: 'defPct', params: { pct: 0.08 } }] },
    { id: 'p_sturdy_boots', name: 'Sturdy Boots', rarity: 1, icon: '👢',
      desc: 'SPD +5%.', fx: [{ key: 'spdPct', params: { pct: 0.05 } }] },
    { id: 'p_sharp_eye', name: 'Sharp Eye', rarity: 1, icon: '👁',
      desc: 'CRIT Rate +4%.', fx: [{ key: 'critRate', params: { pct: 0.04 } }] },
    { id: 'p_iron_stomach', name: 'Iron Stomach', rarity: 1, icon: '🍖',
      desc: 'Healing Boost +8%.', fx: [{ key: 'healBoost', params: { pct: 0.08 } }] },
    { id: 'p_kindled_spirit', name: 'Kindled Spirit', rarity: 1, icon: '✨',
      desc: 'Energy Regeneration +6%.', fx: [{ key: 'energyRegen', params: { pct: 0.06 } }] },
    { id: 'p_tempered_nerve', name: 'Tempered Nerve', rarity: 1, icon: '💢',
      desc: 'Break Effect +10%.', fx: [{ key: 'breakEffect', params: { pct: 0.10 } }] },
    { id: 'p_quick_study', name: 'Quick Study', rarity: 1, icon: '📖',
      desc: 'Begin battle with +10 Energy.', fx: [{ key: 'battleStartEnergy', params: { amount: 10 } }] },

    // ───────── 2-star (8) ─────────
    { id: 'p_ashen_vigor', name: 'Ashen Vigor', rarity: 2, icon: '❤',
      desc: 'Max HP +10%.', fx: [{ key: 'hpPct', params: { pct: 0.10 } }] },
    { id: 'p_quickstep', name: 'Quickstep', rarity: 2, icon: '💨',
      desc: 'SPD +8%.', fx: [{ key: 'spdPct', params: { pct: 0.08 } }] },
    { id: 'p_ember_within', name: 'Ember Within', rarity: 2, icon: '🔥',
      desc: 'Energy Regeneration +8%.', fx: [{ key: 'energyRegen', params: { pct: 0.08 } }] },
    { id: 'p_killing_edge', name: 'Killing Edge', rarity: 2, icon: '⚔',
      desc: 'CRIT DMG +12%.', fx: [{ key: 'critDmg', params: { pct: 0.12 } }] },
    { id: 'p_guardians_ward', name: "Guardian's Ward", rarity: 2, icon: '🔰',
      desc: 'Begin battle with a shield equal to 12% Max HP.', fx: [{ key: 'battleStartShieldPct', params: { pct: 0.12 } }] },
    { id: 'p_focused_strikes', name: 'Focused Strikes', rarity: 2, icon: '🎯',
      desc: 'Basic attack damage +12%.', fx: [{ key: 'basicDmgPct', params: { pct: 0.12 } }] },
    { id: 'p_adrenal_rush', name: 'Adrenal Rush', rarity: 2, icon: '⚡',
      desc: 'Begin battle with +1 SP.', fx: [{ key: 'spOnBattleStart', params: { amount: 1 } }] },
    { id: 'p_iron_skin', name: 'Iron Skin', rarity: 2, icon: '🪨',
      desc: 'DEF +12%.', fx: [{ key: 'defPct', params: { pct: 0.12 } }] },

    // ───────── 3-star (7) ─────────
    { id: 'p_executioner', name: "Executioner's Eye", rarity: 3, icon: '🎯',
      desc: 'Damage to Broken enemies +20%.', fx: [{ key: 'dmgVsBrokenPct', params: { pct: 0.20 } }] },
    { id: 'p_first_blood', name: 'First Blood', rarity: 3, icon: '🩸',
      desc: 'On kill, ATK +15% for 2 turns.', fx: [{ key: 'onKillAtkPct', params: { pct: 0.15, turns: 2 } }] },
    { id: 'p_vengeful_spirit', name: 'Vengeful Spirit', rarity: 3, icon: '👻',
      desc: 'Below 40% HP, damage taken -25%.', fx: [{ key: 'lowHpDmgReduction', params: { threshold: 0.4, pct: 0.25 } }] },
    { id: 'p_predators_instinct', name: "Predator's Instinct", rarity: 3, icon: '🐺',
      desc: 'Damage to debuffed enemies +18%.', fx: [{ key: 'dmgVsDebuffedPct', params: { pct: 0.18 } }] },
    { id: 'p_skillful_fury', name: 'Skillful Fury', rarity: 3, icon: '🌀',
      desc: 'Skill damage +18%.', fx: [{ key: 'skillDmgPct', params: { pct: 0.18 } }] },
    { id: 'p_bloodhound_step', name: 'Bloodhound Step', rarity: 3, icon: '🐾',
      desc: 'Follow-up damage +20%.', fx: [{ key: 'followUpDmgPct', params: { pct: 0.20 } }] },
    { id: 'p_scavengers_luck', name: "Scavenger's Luck", rarity: 3, icon: '🍀',
      desc: 'Gain +5 Energy whenever hit.', fx: [{ key: 'energyOnHitTaken', params: { amount: 5 } }] },

    // ───────── 4-star (5) ─────────
    { id: 'p_bloodletter', name: "Bloodletter's Bargain", rarity: 4, icon: '🕸',
      desc: 'Damage over time dealt +30%.', fx: [{ key: 'dotDmgPct', params: { pct: 0.30 } }] },
    { id: 'p_sunlight_oath', name: 'Sunlight Oath', rarity: 4, icon: '☀',
      desc: 'Ultimate heals 15% Max HP.', fx: [{ key: 'healOnUltPct', params: { pct: 0.15 } }] },
    { id: 'p_breakers_wrath', name: "Breaker's Wrath", rarity: 4, icon: '💥',
      desc: 'Gain +25 Energy whenever an enemy Breaks.', fx: [{ key: 'onBreakEnergy', params: { amount: 25 } }] },
    { id: 'p_grand_ultimatum', name: 'Grand Ultimatum', rarity: 4, icon: '🌟',
      desc: 'Ultimate damage +25%.', fx: [{ key: 'ultDmgPct', params: { pct: 0.25 } }] },
    { id: 'p_undying_flame', name: 'Undying Flame', rarity: 4, icon: '🔥',
      desc: 'Max HP +15%, DEF +10%.', fx: [{ key: 'hpPct', params: { pct: 0.15 } }, { key: 'defPct', params: { pct: 0.10 } }] },

    // ───────── 5-star (3) ─────────
    { id: 'p_dark_lords_crown', name: "Dark Lord's Crown", rarity: 5, icon: '👑',
      desc: 'ATK +15%, CRIT DMG +25%.', fx: [{ key: 'atkPct', params: { pct: 0.15 } }, { key: 'critDmg', params: { pct: 0.25 } }] },
    { id: 'p_crown_of_the_dead', name: 'Crown of the Dead', rarity: 5, icon: '💀',
      desc: 'Max HP +20%, Healing Boost +15%.', fx: [{ key: 'hpPct', params: { pct: 0.20 } }, { key: 'healBoost', params: { pct: 0.15 } }] },
    // No fx key covers "revive on wipe" — resolved directly in battle-ui.js's
    // onBattleEnd() (see DS.Fortress.hasUnusedRevive/consumeRevive) rather than
    // adding a new engine hook for one perk.
    { id: 'p_last_ember', name: 'The Last Ember', rarity: 5, icon: '🔥',
      desc: "Once per run, if the company would fall, one warrior rises again with a sliver of HP.",
      special: 'revive_once' },
  ];

  // Trap flavor variants — purely descriptive, wrapped around the same d20
  // roll (see DS.Fortress.resolveTrap). One is picked at random per trap node.
  DS.FORTRESS_TRAPS = [
    { id: 'swinging_axes', name: 'Swinging Axes', icon: '🪓',
      desc: 'Rusted blades swing from the ceiling in a slow, patient rhythm.' },
    { id: 'pressure_plate_arrows', name: 'A Pressure Plate', icon: '🏹',
      desc: 'The floor gives a fraction of an inch underfoot. Somewhere, a string goes taut.' },
    { id: 'collapsing_floor', name: 'A Collapsing Floor', icon: '🕳',
      desc: 'The stone here has been waiting a long time to stop pretending to be solid.' },
    { id: 'poison_dart_wall', name: 'A Dart Wall', icon: '☠',
      desc: 'Tiny holes line the corridor, each one old, dry, and patient.' },
  ];

  // Special-event pool — a 2-choice mini-encounter. "Investigate" rolls
  // goodChance for a real reward, otherwise the bad outcome; "Leave it be" is
  // always safe and does nothing. See DS.Fortress.resolveEvent.
  DS.FORTRESS_EVENTS = [
    { id: 'shrine_nameless_god', name: 'A Shrine to a Nameless God', icon: '⛩',
      desc: 'Ash is heaped before a faceless idol. Something here still listens.',
      goodChance: 0.65, good: { perkMinRarity: 3 }, bad: { wound: true } },
    // 'gear' grants a REAL, persistent weapon-or-relic (50/50, see
    // resolveEvent) straight into the player's actual inventory — unlike
    // every other event/perk reward in Fortress, this survives the run
    // regardless of how it ends.
    { id: 'abandoned_cart', name: "An Abandoned Merchant's Cart", icon: '🛒',
      desc: 'Wares nobody came back to collect.',
      goodChance: 0.70, good: { gear: true }, bad: { cinders: -40 } },
    { id: 'sealed_well', name: 'Whispers from a Sealed Well', icon: '🕳',
      desc: 'Something down there is still counting the days.',
      goodChance: 0.55, good: { perkMinRarity: 2 }, bad: { wound: true } },
    // Not a normal good/bad roll — Investigate is a coin flip between a real
    // fight (against DS.ENEMIES' 'sleeping_giant' entry) and a quiet payout.
    // See DS.Fortress.resolveEvent's special-cased branch and
    // js/ui/fortress-ui.js's openEventModal for the battle hand-off.
    { id: 'sleeping_giant', name: 'A Sleeping Giant', icon: '💤',
      desc: 'It could be treasure. It could be very much awake.',
      special: 'wake_or_cinders', bossId: 'sleeping_giant', wakeChance: 0.50, cindersIfAsleep: 120 },
  ];
})();
