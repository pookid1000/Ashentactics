// ASHEN TACTICS — Portal of Oolacile: a golden sunlight sanctuary being
// consumed from below by the Abyss. Structured identically to a DS.WORLDS
// entry (same stage shape as js/data/encounters.js) and pushed onto DS.WORLDS
// after that file has already run, so DS.Meta.findStage/completeStage need
// zero changes — Oolacile's stages are indistinguishable from any other
// world's to the reward/progress engine. Kept in its own file (rather than a
// 6th literal entry inside encounters.js) to mirror this project's own
// one-file-per-mode convention (see fortress.js, formerly arena.js) and keep
// it a cleanly separable, easily-revisable unit. Original creatures only —
// no reuse of Artorias/Manus/Kalameet/Priscilla/Sif (already playable) or
// Kalameet/Manus (already Crown of Cinders entries).
//
// The 'map' screen (hub-ui.js) explicitly filters this world OUT of the
// mainline "Lands of Lordran" list — it only ever appears on its own
// dedicated 'oolacile' hub tile/screen (replacing the old Arena's slot).

window.DS = window.DS || {};

(function () {
  DS.OOLACILE = {
    id: 'oolacile', name: 'Portal of Oolacile', background: 'oolacile', unlockPlayerLevel: 6,
    desc: 'A sunlit sanctuary sealed away from Lordran\'s fall — and something beneath it patient enough to wait out even that much gold.',
    stages: [
      { id: 'oolacile_s1', name: 'The Sunken Threshold', subtitle: 'Gold going soft at the edges', estusCost: 24, recLevel: 78,
        spawns: [{ id: 'sun_blind_thrall', level: 78 }, { id: 'sun_blind_thrall', level: 78 }, { id: 'rootling_husk', level: 78 }],
        firstClear: { humanity: 140, souls: 46000, items: { sunlight_medal: 2, titanite_chunk: 2 } },
        repeat: { souls: 13000, items: { titanite_large: 2 } } },

      { id: 'oolacile_s2', name: 'Where the Light Still Reaches', subtitle: 'The grove remembers being warm', estusCost: 24, recLevel: 80,
        spawns: [{ id: 'rootling_husk', level: 80 }, { id: 'gilded_sentinel', level: 80 }, { id: 'sun_blind_thrall', level: 80 }],
        firstClear: { humanity: 150, souls: 50000, items: { sunlight_medal: 3, ember_asc_3: 2 } },
        repeat: { souls: 14000, items: { titanite_chunk: 1 } } },

      // Side branch — pure-treasure node, no fight (same shape as w1s_side1/
      // w4s_side1 in encounters.js). Branches off s2, rejoins s3.
      { id: 'oolacile_side1', name: 'A Grove Gone Quiet', subtitle: 'Nothing sings here anymore, and something noticed', recLevel: 79, side: true,
        treasure: { humanity: 160, souls: 44000, items: { sunlight_medal: 3, abyss_residue: 2, titanite_slab: 1 } } },

      { id: 'oolacile_s3', name: 'The Rootless Court', subtitle: 'Stone that kept its oath long after the roof gave out', estusCost: 26, recLevel: 84,
        spawns: [{ id: 'gilded_sentinel', level: 84 }, { id: 'gilded_sentinel', level: 84 }, { id: 'rootling_husk', level: 83 }],
        firstClear: { humanity: 170, souls: 58000, items: { abyss_residue: 3, ember_asc_3: 2 } },
        repeat: { souls: 15500, items: { abyss_residue: 1 } } },

      { id: 'oolacile_s4', name: 'The Vigil Unsleeping', subtitle: 'It has not blinked since the light began to fail', estusCost: 28, recLevel: 87, boss: true,
        spawns: [{ id: 'vigil_unsleeping', level: 87 }, { id: 'sun_blind_thrall', level: 85, statMult: 0.8 }, { id: 'sun_blind_thrall', level: 85, statMult: 0.8 }],
        firstClear: { humanity: 220, souls: 66000, signs: 2, items: { boss_soul_fragment: 2, ember_asc_3: 3 } },
        repeat: { souls: 17500, items: { titanite_chunk: 2 } } },

      { id: 'oolacile_s5', name: 'Where the Roots Give Way', subtitle: 'The floor is a suggestion, at best', estusCost: 28, recLevel: 90,
        spawns: [{ id: 'rootling_husk', level: 90 }, { id: 'rootling_husk', level: 90 }, { id: 'sun_blind_thrall', level: 90 }, { id: 'rootling_husk', level: 89 }],
        firstClear: { humanity: 200, souls: 70000, items: { abyss_residue: 3, titanite_chunk: 2 } },
        repeat: { souls: 18500, items: { abyss_residue: 1 } } },

      { id: 'oolacile_s6', name: 'The Abyss Beneath the Gold', subtitle: 'Every sanctuary has a foundation', estusCost: 32, recLevel: 95, boss: true,
        spawns: [{ id: 'what_the_roots_found', level: 95 }],
        firstClear: { humanity: 340, souls: 95000, signs: 4, items: { boss_soul_fragment: 4, titanite_slab: 2, abyss_residue: 3 } },
        repeat: { souls: 24000, items: { titanite_chunk: 2, abyss_residue: 1 } } },
    ],
  };

  DS.WORLDS.push(DS.OOLACILE);
})();
