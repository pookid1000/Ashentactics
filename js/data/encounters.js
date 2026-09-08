// ASHEN TACTICS — worlds, stages, domains, boss rush (CONTRACT.md §4.7). Original writing.

window.DS = window.DS || {};

(function () {
  DS.WORLDS = [
    {
      id: 'w1', name: 'Northern Undead Asylum', background: 'asylum', unlockPlayerLevel: 1,
      desc: 'Where the condemned are shelved and the world begins. Cold stone, colder company.',
      stages: [
        { id: 'w1s1', name: 'The Cells', subtitle: 'Something rattles the bars', estusCost: 10, recLevel: 1,
          spawns: [{ id: 'hollow_soldier', level: 1 }, { id: 'hollow_soldier', level: 1 }],
          firstClear: { humanity: 60, souls: 4000, items: { soul_small: 4, titanite_shard: 2 } },
          repeat: { souls: 1500, items: { soul_small: 2 } } },
        { id: 'w1s2', name: 'The Courtyard', subtitle: 'Rain, rubble, and archers', estusCost: 10, recLevel: 3,
          spawns: [{ id: 'hollow_archer', level: 3 }, { id: 'hollow_soldier', level: 3 }, { id: 'hollow_archer', level: 3 }],
          firstClear: { humanity: 60, souls: 5000, items: { soul_small: 4, ember_asc_1: 2 } },
          repeat: { souls: 1800, items: { soul_small: 2 } } },
        // Side branch — a pure-treasure node (no fight): claiming it just grants the
        // reward once and marks the stage cleared (see claimTreasure() in hub-ui.js),
        // it never goes through launchStage()/battle.
        { id: 'w1s_side1', name: 'The Locked Cell', subtitle: 'Something was left behind, and forgotten', recLevel: 2, side: true,
          treasure: { humanity: 40, souls: 3000, items: { titanite_shard: 2, soul_small: 2 } } },
        { id: 'w1s3', name: 'The Upper Walk', subtitle: 'A knight who forgot surrender', estusCost: 12, recLevel: 5,
          spawns: [{ id: 'balder_knight', level: 5 }, { id: 'hollow_soldier', level: 4 }, { id: 'hollow_soldier', level: 4 }],
          firstClear: { humanity: 80, souls: 6000, items: { soul_large: 2, titanite_shard: 3 } },
          repeat: { souls: 2200, items: { titanite_shard: 1 } } },
        { id: 'w1s4', name: 'The Warden\'s Hall', subtitle: 'The door was never locked. He was the lock.', estusCost: 15, recLevel: 8, boss: true,
          spawns: [{ id: 'asylum_demon', level: 8 }],
          firstClear: { humanity: 120, souls: 12000, signs: 1, items: { ember_asc_1: 4, soul_large: 3, sign_fragment: 5 } },
          repeat: { souls: 4000, items: { soul_small: 3, titanite_shard: 1 } } },
      ],
    },
    {
      id: 'w2', name: 'Undead Burg & Parish', background: 'burg', unlockPlayerLevel: 2,
      desc: 'A city that keeps its shape out of habit. The bells still ring; nobody remembers why.',
      stages: [
        { id: 'w2s1', name: 'Burg Gatehouse', subtitle: 'Toll demanded in rust and teeth', estusCost: 12, recLevel: 10,
          spawns: [{ id: 'hollow_soldier', level: 10 }, { id: 'hollow_archer', level: 10 }, { id: 'hollow_soldier', level: 10 }],
          firstClear: { humanity: 60, souls: 7000, items: { soul_large: 2, charcoal_resin: 2 } },
          repeat: { souls: 2500, items: { soul_small: 3 } } },
        { id: 'w2s2', name: 'The Aqueduct', subtitle: 'Rats the size of regrets', estusCost: 12, recLevel: 12,
          spawns: [{ id: 'rat_swarm', level: 12 }, { id: 'rat_swarm', level: 12 }, { id: 'hollow_soldier', level: 12 }],
          firstClear: { humanity: 60, souls: 8000, items: { green_blossom: 3, titanite_shard: 3 } },
          repeat: { souls: 2800, items: { green_blossom: 1 } } },
        // Side branch — optional, harder than the main-path stages around it.
        { id: 'w2s_side1', name: 'Sealed Undercroft', subtitle: 'Two shields, no mercy, and a secret behind them', estusCost: 16, recLevel: 13, side: true,
          spawns: [{ id: 'balder_knight', level: 15 }, { id: 'balder_knight', level: 15 }],
          firstClear: { humanity: 90, souls: 9000, items: { titanite_large: 2, sunlight_medal: 1 } },
          repeat: { souls: 3000, items: { titanite_shard: 2 } } },
        { id: 'w2s3', name: 'Watchtower Ascent', subtitle: 'A bull-horned shadow on the ramparts', estusCost: 14, recLevel: 14, boss: true,
          spawns: [{ id: 'taurus_demon', level: 14 }],
          firstClear: { humanity: 100, souls: 12000, items: { ember_asc_1: 4, demon_core: 2 } },
          repeat: { souls: 3600, items: { titanite_shard: 2 } } },
        { id: 'w2s4', name: 'Parish Nave', subtitle: 'The congregation never left', estusCost: 14, recLevel: 16,
          spawns: [{ id: 'balder_knight', level: 16 }, { id: 'channeler', level: 16 }, { id: 'hollow_soldier', level: 15 }],
          firstClear: { humanity: 80, souls: 10000, items: { soul_large: 3, ember_asc_2: 2 } },
          repeat: { souls: 3200, items: { soul_large: 1 } } },
        { id: 'w2s5', name: 'The Belfry', subtitle: 'One shadow, for now', estusCost: 16, recLevel: 18, boss: true,
          spawns: [{ id: 'bell_gargoyle', level: 18 }],
          firstClear: { humanity: 140, souls: 16000, signs: 1, items: { ember_asc_2: 3, sunlight_medal: 2, sign_fragment: 5 } },
          repeat: { souls: 5000, items: { titanite_large: 1 } } },
      ],
    },
    {
      id: 'w3', name: 'The Depths & Blighttown', background: 'depths', unlockPlayerLevel: 3,
      desc: 'Down past the butcher tables, past the poison, to where the fire-witch keeps her vigil.',
      stages: [
        { id: 'w3s1', name: 'Butcher\'s Larder', subtitle: 'The menu is you', estusCost: 14, recLevel: 21,
          spawns: [{ id: 'hollow_soldier', level: 21 }, { id: 'rat_swarm', level: 21 }, { id: 'necromancer', level: 21 }],
          firstClear: { humanity: 80, souls: 12000, items: { titanite_large: 2, soul_large: 3 } },
          repeat: { souls: 4000, items: { titanite_shard: 2 } } },
        { id: 'w3s2', name: 'The Goat\'s Alley', subtitle: 'Small room. Big blades. Bad dogs.', estusCost: 16, recLevel: 24, boss: true,
          spawns: [{ id: 'capra_demon_hound', level: 22, statMult: 0.8 }, { id: 'capra_demon', level: 24 }, { id: 'capra_demon_hound', level: 22, statMult: 0.8 }],
          firstClear: { humanity: 100, souls: 15000, items: { demon_core: 3, ember_asc_2: 2 } },
          repeat: { souls: 4500, items: { demon_core: 1 } } },
        { id: 'w3s3', name: 'Blighttown Scaffolds', subtitle: 'Every plank is a promise nobody kept', estusCost: 16, recLevel: 27,
          spawns: [{ id: 'darkwraith', level: 27 }, { id: 'hollow_archer', level: 26 }, { id: 'hollow_archer', level: 26 }],
          firstClear: { humanity: 80, souls: 16000, items: { titanite_large: 2, green_blossom: 3 } },
          repeat: { souls: 5000, items: { titanite_large: 1 } } },
        // Side branch — optional, harder than the main-path stages around it.
        { id: 'w3s_side1', name: 'Poison Grotto', subtitle: 'The deep end of Blighttown keeps its own toll', estusCost: 18, recLevel: 28, side: true,
          spawns: [{ id: 'necromancer', level: 29 }, { id: 'rat_swarm', level: 29 }, { id: 'rat_swarm', level: 29 }],
          firstClear: { humanity: 100, souls: 17000, items: { titanite_large: 3, green_blossom: 3 } },
          repeat: { souls: 5500, items: { green_blossom: 2 } } },
        { id: 'w3s4', name: 'The Swamp Floor', subtitle: 'The mud keeps what it catches', estusCost: 18, recLevel: 30,
          spawns: [{ id: 'necromancer', level: 30 }, { id: 'skeleton', level: 30 }, { id: 'skeleton', level: 30 }],
          firstClear: { humanity: 80, souls: 18000, items: { ember_asc_2: 3, charcoal_resin: 3 } },
          repeat: { souls: 5500, items: { charcoal_resin: 1 } } },
        { id: 'w3s5', name: 'Quelaag\'s Domain', subtitle: 'The lair beneath the web', estusCost: 20, recLevel: 33, boss: true,
          spawns: [{ id: 'quelaag_boss', level: 33 }],
          firstClear: { humanity: 160, souls: 24000, signs: 2, items: { boss_soul_fragment: 1, ember_asc_2: 4, sign_fragment: 5 } },
          repeat: { souls: 7000, items: { titanite_large: 2 } } },
        { id: 'w3s6', name: 'Lost Izalith', subtitle: 'Roots that remember being a goddess', estusCost: 22, recLevel: 35, boss: true,
          spawns: [{ id: 'bed_of_chaos_left_arm', level: 35 }, { id: 'bed_of_chaos', level: 35 }, { id: 'bed_of_chaos_right_arm', level: 35 }],
          firstClear: { humanity: 170, souls: 26000, signs: 2, items: { boss_soul_fragment: 1, ember_asc_2: 4 } },
          repeat: { souls: 7500, items: { titanite_large: 2 } } },
      ],
    },
    {
      id: 'w4', name: 'Anor Londo & the Archives', background: 'anor', unlockPlayerLevel: 4,
      desc: 'The city of gods, kept golden by one devoted liar. Above it, a library that eats scholars.',
      stages: [
        { id: 'w4s1', name: 'The Sunlit Approach', subtitle: 'Silver knights hold the stair', estusCost: 18, recLevel: 37,
          spawns: [{ id: 'silver_knight', level: 37 }, { id: 'silver_knight', level: 37 }, { id: 'royal_sentinel', level: 37 }],
          firstClear: { humanity: 100, souls: 22000, items: { titanite_chunk: 1, soul_hero: 1 } },
          repeat: { souls: 7000, items: { titanite_large: 1 } } },
        { id: 'w4s2', name: 'The Painting\'s Threshold', subtitle: 'Guardians of a world in oils', estusCost: 18, recLevel: 40,
          spawns: [{ id: 'painting_guardian', level: 40 }, { id: 'painting_guardian', level: 40 }, { id: 'channeler', level: 40 }],
          firstClear: { humanity: 100, souls: 24000, items: { frozen_tear: 1, ember_asc_3: 2 } },
          repeat: { souls: 7500, items: { soul_large: 2 } } },
        // Side branch — a pure-treasure node (no fight, see w1s_side1's comment).
        { id: 'w4s_side1', name: 'The Forgotten Stacks', subtitle: 'A shelf the librarians pretend not to remember', recLevel: 41, side: true,
          treasure: { humanity: 120, souls: 20000, items: { titanite_chunk: 2, frozen_tear: 1 } } },
        { id: 'w4s3', name: 'The Great Hall', subtitle: 'The captain and the executioner', estusCost: 22, recLevel: 44, boss: true,
          spawns: [{ id: 'ornstein_boss', level: 44 }, { id: 'smough_boss', level: 44 }],
          firstClear: { humanity: 200, souls: 32000, signs: 2, items: { boss_soul_fragment: 2, titanite_chunk: 2, sign_fragment: 10 } },
          repeat: { souls: 9000, items: { titanite_chunk: 1 } } },
        { id: 'w4s4', name: 'Archive Stacks', subtitle: 'Shelved experiments, still hungry', estusCost: 20, recLevel: 48,
          spawns: [{ id: 'crystal_golem', level: 48 }, { id: 'crystal_golem', level: 48 }, { id: 'channeler', level: 47 }],
          firstClear: { humanity: 100, souls: 28000, items: { titanite_chunk: 2, ember_asc_3: 2 } },
          repeat: { souls: 8500, items: { titanite_large: 2 } } },
        { id: 'w4s5', name: 'The Duke\'s Sanctum', subtitle: 'The scaleless one, among his prizes', estusCost: 24, recLevel: 52, boss: true,
          spawns: [{ id: 'seath_boss', level: 52 }],
          firstClear: { humanity: 200, souls: 38000, signs: 2, items: { boss_soul_fragment: 2, ember_asc_3: 3 } },
          repeat: { souls: 10000, items: { titanite_chunk: 1 } } },
      ],
    },
    {
      id: 'w5', name: 'The Abyss & the Kiln', background: 'kiln', unlockPlayerLevel: 5,
      desc: 'The floor of the world, and the furnace it was lit from. Bring everything.',
      stages: [
        { id: 'w5s1', name: 'New Londo Undercroft', subtitle: 'The drowned keep their court', estusCost: 20, recLevel: 56,
          spawns: [{ id: 'darkwraith', level: 56 }, { id: 'darkwraith', level: 56 }, { id: 'necromancer', level: 55 }],
          firstClear: { humanity: 120, souls: 34000, items: { abyss_residue: 2, titanite_chunk: 2 } },
          repeat: { souls: 10000, items: { titanite_large: 2 } } },
        // Side branch — optional, harder than the main-path stages around it.
        { id: 'w5s_side1', name: 'Drowned Reliquary', subtitle: 'The Darkwraiths guard what the flood could not take', estusCost: 22, recLevel: 58, side: true,
          spawns: [{ id: 'darkwraith', level: 59 }, { id: 'darkwraith', level: 59 }, { id: 'darkwraith', level: 58 }],
          firstClear: { humanity: 180, souls: 32000, items: { abyss_residue: 3, titanite_chunk: 2 } },
          repeat: { souls: 9000, items: { abyss_residue: 1 } } },
        { id: 'w5s2', name: 'The Four Thrones', subtitle: 'Kings, unhoused and unhinged', estusCost: 24, recLevel: 60, boss: true,
          spawns: [{ id: 'fourkings_boss', level: 60 }],
          firstClear: { humanity: 200, souls: 42000, signs: 2, items: { boss_soul_fragment: 2, abyss_residue: 2 } },
          repeat: { souls: 12000, items: { titanite_chunk: 1 } } },
        { id: 'w5s3', name: 'The Tomb Descent', subtitle: 'Darkness with teeth in it', estusCost: 24, recLevel: 63,
          spawns: [{ id: 'skeleton', level: 63 }, { id: 'skeleton', level: 63 }, { id: 'necromancer', level: 62 }, { id: 'skeleton', level: 62 }],
          firstClear: { humanity: 120, souls: 40000, items: { ember_asc_3: 3, soul_hero: 1 } },
          repeat: { souls: 11000, items: { soul_hero: 1 } } },
        { id: 'w5s4', name: 'Gravelord\'s Sepulcher', subtitle: 'The first funeral, still in progress', estusCost: 26, recLevel: 66, boss: true,
          spawns: [{ id: 'skeleton', level: 64, statMult: 0.8 }, { id: 'nito_boss', level: 66 }, { id: 'skeleton', level: 64, statMult: 0.8 }],
          firstClear: { humanity: 220, souls: 48000, signs: 2, items: { boss_soul_fragment: 3, ember_asc_3: 3 } },
          repeat: { souls: 13000, items: { titanite_chunk: 2 } } },
        { id: 'w5s5', name: 'Chasm of the Abyss', subtitle: 'The father of it all, wanting one thing back', estusCost: 28, recLevel: 70, boss: true,
          spawns: [{ id: 'manus_boss', level: 70 }],
          firstClear: { humanity: 240, souls: 56000, signs: 3, items: { boss_soul_fragment: 3, abyss_residue: 3 } },
          repeat: { souls: 15000, items: { abyss_residue: 1 } } },
        { id: 'w5s6', name: 'Kiln of the First Flame', subtitle: 'Ash to ash, at last', estusCost: 30, recLevel: 75, boss: true,
          spawns: [{ id: 'gwyn_boss', level: 75 }],
          firstClear: { humanity: 300, souls: 80000, signs: 3, items: { boss_soul_fragment: 4, titanite_slab: 1, sign_fragment: 10 } },
          repeat: { souls: 20000, items: { titanite_chunk: 2 } } },
      ],
    },
  ];

  // Daily material domains — always repeatable, always pay `repeat`.
  DS.DOMAINS = [
    {
      id: 'd_souls', name: 'Soul Vessel', icon: '👻', background: 'depths',
      desc: 'A cracked reliquary that never quite empties. Souls for the taking, if you can take them.',
      stages: [
        { id: 'd_souls_1', name: 'Vessel I', subtitle: 'Skim the surface', estusCost: 10, recLevel: 10,
          spawns: [{ id: 'hollow_soldier', level: 10 }, { id: 'skeleton', level: 10 }, { id: 'hollow_soldier', level: 10 }],
          repeat: { souls: 9000, items: { soul_small: 3 } } },
        { id: 'd_souls_2', name: 'Vessel II', subtitle: 'Drink deeper', estusCost: 14, recLevel: 30,
          spawns: [{ id: 'darkwraith', level: 30 }, { id: 'skeleton', level: 30 }, { id: 'necromancer', level: 30 }],
          repeat: { souls: 20000, items: { soul_large: 3 } } },
        { id: 'd_souls_3', name: 'Vessel III', subtitle: 'To the dregs', estusCost: 18, recLevel: 55,
          spawns: [{ id: 'darkwraith', level: 55 }, { id: 'royal_sentinel', level: 55 }, { id: 'darkwraith', level: 55 }],
          repeat: { souls: 42000, items: { soul_hero: 1 } } },
      ],
    },
    {
      id: 'd_titanite', name: 'Titanite Demon Pit', icon: '🪨', background: 'burg',
      desc: 'Something down there still works the stone. It does not share willingly.',
      stages: [
        { id: 'd_tit_1', name: 'Pit I', subtitle: 'Scrape the walls', estusCost: 10, recLevel: 12,
          spawns: [{ id: 'crystal_golem', level: 12 }, { id: 'hollow_soldier', level: 12 }],
          repeat: { items: { titanite_shard: 4, charcoal_resin: 1 }, souls: 2000 } },
        { id: 'd_tit_2', name: 'Pit II', subtitle: 'Mine the seam', estusCost: 14, recLevel: 32,
          spawns: [{ id: 'crystal_golem', level: 32 }, { id: 'crystal_golem', level: 32 }],
          repeat: { items: { titanite_large: 3, relic_dust: 6 }, souls: 4000 } },
        { id: 'd_tit_3', name: 'Pit III', subtitle: 'Wake the smith', estusCost: 18, recLevel: 56,
          spawns: [{ id: 'crystal_golem', level: 56 }, { id: 'royal_sentinel', level: 56 }, { id: 'crystal_golem', level: 55 }],
          repeat: { items: { titanite_chunk: 2, relic_dust: 12 }, souls: 6000 } },
      ],
    },
    {
      id: 'd_ember', name: 'Ember Grove', icon: '🔶', background: 'kiln',
      desc: 'A charcoal orchard where old fires go to seed. Pick carefully; everything bites.',
      stages: [
        { id: 'd_emb_1', name: 'Grove I', subtitle: 'Gather kindling', estusCost: 10, recLevel: 15,
          spawns: [{ id: 'hollow_archer', level: 15 }, { id: 'channeler', level: 15 }],
          repeat: { items: { ember_asc_1: 3 }, souls: 2500 } },
        { id: 'd_emb_2', name: 'Grove II', subtitle: 'Rake the coals', estusCost: 14, recLevel: 35,
          spawns: [{ id: 'channeler', level: 35 }, { id: 'darkwraith', level: 35 }, { id: 'hollow_archer', level: 34 }],
          repeat: { items: { ember_asc_2: 3, relic_dust: 5 }, souls: 4500 } },
        { id: 'd_emb_3', name: 'Grove III', subtitle: 'Steal from the heart-fire', estusCost: 18, recLevel: 58,
          spawns: [{ id: 'royal_sentinel', level: 58 }, { id: 'channeler', level: 58 }, { id: 'darkwraith', level: 57 }],
          repeat: { items: { ember_asc_3: 2, demon_core: 2 }, souls: 7000 } },
      ],
    },
  ];

  // Covenant Trials — one always-repeatable stage per relic set (CONTRACT.md §4.4 relics).
  // Shaped exactly like a DS.DOMAINS entry so DS.Meta.findStage() treats it the same way
  // (domain: true — always pays `repeat`, no firstClear distinction). Each clear pays a
  // relic from that covenant's set via the `relics` reward key (DS.Save.grant).
  DS.RELIC_TRIALS = [
    {
      id: 't_way_of_white', setId: 'way_of_white', name: 'Way of White', icon: '✚', background: 'burg',
      desc: 'The oldest church still keeps its vows. Stand vigil with the pilgrims a while.',
      stages: [
        { id: 't_wow_1', name: 'Vigil of the Faithful', subtitle: 'Quiet halls, quieter prayers', estusCost: 12, recLevel: 14,
          spawns: [{ id: 'hollow_soldier', level: 14 }, { id: 'channeler', level: 14 }],
          repeat: { souls: 8000, items: { relic_dust: 4 }, relics: [{ setId: 'way_of_white' }] } },
        { id: 't_wow_2', name: 'The Unbroken Line', subtitle: 'Three shields, one oath, and no names spoken', estusCost: 16, recLevel: 16,
  spawns: [{ id: 'way_of_white_knights', level: 16 }, { id: 'way_of_white_knights', level: 16 }, { id: 'way_of_white_knights', level: 16 }],
  repeat: { souls: 9600, items: { relic_dust: 5 }, relics: [{ setId: 'way_of_white', rarity: 5 }] } },
      ],
    },
    {
      id: 't_princess_guard', setId: 'princess_guard', name: 'Princess Guard', icon: '🌸', background: 'anor',
      desc: 'An oath sworn to Gwynevere, kept spotless through a hundred sieges. Prove it holds.',
      stages: [
        { id: 't_pg_1', name: 'Honor Sworn', subtitle: 'Silks over steel', estusCost: 14, recLevel: 18,
          spawns: [{ id: 'balder_knight', level: 18 }, { id: 'hollow_archer', level: 18 }],
          repeat: { souls: 11000, items: { relic_dust: 5 }, relics: [{ setId: 'princess_guard' }] } },
      ],
    },
    {
      id: 't_chaos_servant', setId: 'chaos_servant', name: 'Chaos Servant', icon: '🕷', background: 'witch_of_izalith',
      desc: 'Ash-caked vestments from the burrow beneath Quelaag\'s domain. The chaos flame remembers devotion.',
      stages: [
        { id: 't_cs_1', name: 'Cinder Burrow', subtitle: 'Something ancient stirs the coals', estusCost: 15, recLevel: 24,
          spawns: [{ id: 'taurus_demon', level: 24 }, { id: 'necromancer', level: 24 }],
          repeat: { souls: 15000, items: { relic_dust: 5 }, relics: [{ setId: 'chaos_servant' }] } },
        { id: 't_cs_2', name: 'The Weaver\'s Ember', subtitle: 'Deeper still, someone kneels and will not rise', estusCost: 18, recLevel: 26,
  spawns: [{ id: 'witch_of_izalith', level: 26 }],
  repeat: { souls: 17500, items: { relic_dust: 6 }, relics: [{ setId: 'chaos_servant', rarity: 5 }] } },
      ],
    },
    {
      id: 't_darkwraith', setId: 'darkwraith', name: 'Darkwraith', icon: '🕳', background: 'darkwraith',
      desc: 'Black iron worn by knights who chose the dark and never once called it a fall.',
      stages: [
        { id: 't_dw_1', name: 'New Londo Vigil', subtitle: 'The drowned keep their own court', estusCost: 16, recLevel: 28,
          spawns: [{ id: 'darkwraith', level: 28 }, { id: 'darkwraith', level: 28 }],
          repeat: { souls: 17000, items: { relic_dust: 6 }, relics: [{ setId: 'darkwraith' }] } },
        { id: 't_dw_2', name: 'Drowned Court Reprisal', subtitle: 'Three oaths kept where the bell once rang', estusCost: 22, recLevel: 30,
  spawns: [{ id: 'darkwraith_knights', level: 30 }, { id: 'darkwraith_knights', level: 30 }, { id: 'darkwraith_knights', level: 30 }],
  repeat: { souls: 20000, items: { relic_dust: 7 }, relics: [{ setId: 'darkwraith', rarity: 5 }] } },
      ],
    },
    {
      id: 't_warrior_of_sunlight', setId: 'warrior_of_sunlight', name: 'Warrior of Sunlight', icon: '☀', background: 'anor',
      desc: 'A covenant that believed helping strangers was a kind of worship. Jolly cooperation, tested in battle.',
      stages: [
        { id: 't_wos_1', name: 'Sunlit Approach', subtitle: 'Silver knights hold the stair', estusCost: 18, recLevel: 38,
          spawns: [{ id: 'royal_sentinel', level: 38 }, { id: 'silver_knight', level: 38 }],
          repeat: { souls: 23000, items: { relic_dust: 6 }, relics: [{ setId: 'warrior_of_sunlight' }] } },
        { id: 't_wos_2', name: 'Where the Sun Never Rose', subtitle: 'A vow curdles atop the storm-lashed peak', estusCost: 24, recLevel: 40,
  spawns: [{ id: 'hollowed_solaire', level: 40 }],
  repeat: { souls: 24500, items: { relic_dust: 7 }, relics: [{ setId: 'warrior_of_sunlight', rarity: 5 }] } },
      ],
    },
    {
      id: 't_blades_of_the_darkmoon', setId: 'blades_of_the_darkmoon', name: 'Blades of the Darkmoon', icon: '🌙', background: 'anor',
      desc: 'Moon-pale steel issued to Gwyndolin\'s silent executors of grudges.',
      stages: [
        { id: 't_botdm_1', name: 'Silent Executors', subtitle: 'Judgment under a blue moon', estusCost: 20, recLevel: 42,
          spawns: [{ id: 'silver_knight', level: 42 }, { id: 'royal_sentinel', level: 42 }],
          repeat: { souls: 26000, items: { relic_dust: 7 }, relics: [{ setId: 'blades_of_the_darkmoon' }] } },
        { id: 't_botdm_2', name: 'The Moon Behind the Mask', subtitle: 'Where borrowed light passes judgment', estusCost: 26, recLevel: 44,
  spawns: [{ id: 'gwyndolin_boss', level: 44 }],
  repeat: { souls: 27500, items: { relic_dust: 8 }, relics: [{ setId: 'blades_of_the_darkmoon', rarity: 5 }] } },
      ],
    },
    {
      id: 't_path_of_the_dragon', setId: 'path_of_the_dragon', name: 'Path of the Dragon', icon: '🐉', background: 'everlasting_dragon',
      desc: 'Scale-tokens of an order that starves its humanity to grow something older.',
      stages: [
        { id: 't_potd_1', name: 'Stone-Hide Vigil', subtitle: 'Patience, scaled in centuries', estusCost: 22, recLevel: 48,
          spawns: [{ id: 'crystal_golem', level: 48 }, { id: 'crystal_golem', level: 48 }],
          repeat: { souls: 30000, items: { relic_dust: 8 }, relics: [{ setId: 'path_of_the_dragon' }] } },
        { id: 't_potd_2', name: 'The Dragon Beyond Prayer', subtitle: 'What the covenant worships, answers.', estusCost: 30, recLevel: 52,
  spawns: [{ id: 'everlasting_dragon', level: 52 }],
  repeat: { souls: 34000, items: { relic_dust: 9 }, relics: [{ setId: 'path_of_the_dragon', rarity: 5 }] } },
      ],
    },
    {
      id: 't_gravelord_servant', setId: 'gravelord_servant', name: 'Gravelord Servant', icon: '💀', background: 'gravelord_servant',
      desc: 'Funerary trappings of Nito\'s congregation. The dust on them was people once.',
      stages: [
        { id: 't_gs_1', name: 'Funerary Rite', subtitle: 'The dead keep their own hours', estusCost: 26, recLevel: 62,
          spawns: [{ id: 'skeleton', level: 62 }, { id: 'skeleton', level: 62 }, { id: 'necromancer', level: 61 }],
          repeat: { souls: 38000, items: { relic_dust: 8 }, relics: [{ setId: 'gravelord_servant' }] } },
      ],
    },
  ];

  // Boss rush gauntlets — keyed so the hub/battle/save/meta layers can host more
  // than one (see DS.State.progress.bossRush[key].best in js/core/save.js, and
  // every consumer that used to read the singular DS.BOSS_RUSH directly: js/ui/
  // hub-ui.js's Gauntlet section, js/ui/battle-ui.js's wave-continuation button,
  // js/engine/meta.js's completeBossRush). DS.BOSS_RUSH stays as an alias to
  // .cinders below for anything that still reaches for the old singular name.
  DS.BOSS_RUSHES = {
    // Every main-story boss, easiest to hardest, plus the two superbosses
    // (Gaping Dragon, Kalameet) that sit outside the main story path entirely —
    // no bonfires between waves. Per-wave rewards (array indexed by wave).
    cinders: {
      id: 'cinders', name: 'Crown of Cinders', icon: '👑', background: 'kiln',
      desc: 'Fourteen thrones, fourteen tyrants, no bonfires between. How far does your fire carry?',
      estusCost: 25,
      sequence: [
        { name: 'Wave I — The Warden', spawns: [{ id: 'asylum_demon', level: 20 }] },
        { name: 'Wave II — The Broken Wall', spawns: [{ id: 'taurus_demon', level: 26 }] },
        { name: 'Wave III — The Belfry Pair', spawns: [{ id: 'bell_gargoyle', level: 32 }] },
        { name: 'Wave IV — The Narrow Stair', spawns: [{ id: 'capra_demon_hound', level: 30, statMult: 0.8 }, { id: 'capra_demon', level: 34 }, { id: 'capra_demon_hound', level: 30, statMult: 0.8 }] },
        { name: 'Wave V — Hunger Given Wings', spawns: [{ id: 'gaping_dragon', level: 40 }] },
        { name: 'Wave VI — The Chaos Witch', spawns: [{ id: 'quelaag_boss', level: 46 }] },
        { name: 'Wave VII — Root of All Flame', spawns: [{ id: 'bed_of_chaos_left_arm', level: 50 }, { id: 'bed_of_chaos', level: 50 }, { id: 'bed_of_chaos_right_arm', level: 50 }] },
        { name: 'Wave VIII — The Great Hall', spawns: [{ id: 'ornstein_boss', level: 58 }, { id: 'smough_boss', level: 58 }] },
        { name: 'Wave IX — Traitor of the Archives', spawns: [{ id: 'seath_boss', level: 63 }] },
        { name: 'Wave X — Crowns Adrift', spawns: [{ id: 'fourkings_boss', level: 68 }] },
        { name: 'Wave XI — First of the Dead', spawns: [{ id: 'skeleton', level: 64, statMult: 0.8 }, { id: 'nito_boss', level: 73 }, { id: 'skeleton', level: 64, statMult: 0.8 }] },
        { name: 'Wave XII — Father of the Abyss', spawns: [{ id: 'manus_boss', level: 78 }] },
        { name: 'Wave XIII — Calamity on the Wind', spawns: [{ id: 'kalameet', level: 83 }] },
        { name: 'Wave XIV — The Lord of Cinder', spawns: [{ id: 'gwyn_boss', level: 88 }] },
      ],
      rewards: [
        { humanity: 60, souls: 8000 },
        { humanity: 70, souls: 9000 },
        { humanity: 85, souls: 11000, items: { titanite_shard: 3 } },
        { humanity: 100, souls: 13000, items: { titanite_large: 1 } },
        { humanity: 115, souls: 16000, items: { titanite_large: 2 } },
        { humanity: 130, souls: 19000, items: { ember_asc_3: 1 } },
        { humanity: 150, souls: 22000, items: { ember_asc_3: 2 } },
        { humanity: 175, souls: 26000, signs: 1, items: { boss_soul_fragment: 1 } },
        { humanity: 195, souls: 30000, items: { boss_soul_fragment: 1, titanite_chunk: 2 } },
        { humanity: 220, souls: 35000, signs: 2, items: { boss_soul_fragment: 1 } },
        { humanity: 245, souls: 40000, items: { boss_soul_fragment: 2, titanite_slab: 1 } },
        { humanity: 270, souls: 46000, signs: 2, items: { boss_soul_fragment: 2 } },
        { humanity: 300, souls: 55000, items: { boss_soul_fragment: 2, titanite_slab: 1 } },
        { humanity: 350, souls: 70000, signs: 4, items: { boss_soul_fragment: 3, titanite_slab: 2 } },
      ],
    },

    // Cosmic-horror finale bosses (see js/data/enemies.js's "Crown of the
    // Cosmos bosses" section, plus Star-Eater from the earlier Fortress-finale
    // batch) — shorter and pitched above Crown of Cinders' own ceiling, the
    // gauntlet for whatever's waiting once the thrones are done.
    cosmos: {
      id: 'cosmos', name: 'Crown of the Cosmos', icon: '🌌', background: 'cosmos',
      desc: 'Six things that were never lords, and never needed to be. No bonfires between.',
      estusCost: 30,
      sequence: [
        { name: 'Wave I — The Unblinking Choir', spawns: [{ id: 'unblinking_choir', level: 75 }] },
        { name: 'Wave II — The Withered Bloom', spawns: [{ id: 'withered_bloom', level: 80 }] },
        { name: 'Wave III — The Star-Eater', spawns: [{ id: 'star_eater', level: 85 }] },
        { name: 'Wave IV — The Thousandfold', spawns: [{ id: 'thousandfold', level: 88 }] },
        { name: 'Wave V — The Cooling Heart', spawns: [{ id: 'cooling_heart', level: 92 }] },
        { name: 'Wave VI — Maw of the Deep Dark', spawns: [{ id: 'maw_of_the_deep_dark', level: 98 }] },
      ],
      rewards: [
        { humanity: 200, souls: 50000, items: { boss_soul_fragment: 1 } },
        { humanity: 250, souls: 60000, items: { boss_soul_fragment: 2 } },
        { humanity: 300, souls: 70000, items: { boss_soul_fragment: 2, titanite_chunk: 2 } },
        { humanity: 350, souls: 80000, signs: 3, items: { boss_soul_fragment: 2, titanite_slab: 1 } },
        { humanity: 450, souls: 95000, signs: 4, items: { boss_soul_fragment: 3, titanite_slab: 2 } },
        { humanity: 550, souls: 130000, signs: 6, items: { boss_soul_fragment: 4, titanite_slab: 3, ember_asc_3: 2 } },
      ],
    },
  };
  DS.BOSS_RUSH = DS.BOSS_RUSHES.cinders;
})();
