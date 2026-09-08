// ASHEN TACTICS — achievements & bestiary challenges. Original writing.
// Three kinds:
//   'basic'     — everyday milestones, 10 Humanity each.
//   'bestiary'  — one per enemy in DS.ENEMIES; defeating it once (in a WON battle)
//                 makes it claimable. Reward always includes unlocking that
//                 enemy's portrait for the profile gallery, plus Humanity —
//                 10 for common enemies, 20-30 for bosses (the "harder" ones).
//   'milestone' — longer-term goals, 20-30 Humanity (also "harder challenges").
// check(state) returns true once the achievement's condition is met (claimable);
// actually granting the reward still requires DS.Achievements.claim(id).

window.DS = window.DS || {};

(function () {
  function anyRosterEntry(pred) {
    const roster = DS.State.roster || {};
    return Object.keys(roster).some((id) => pred(roster[id], id));
  }

  DS.ACHIEVEMENTS_BASIC = [
    { id: 'first_victory', name: 'First Blood', desc: 'Win your first battle.', reward: { humanity: 10 },
      check: (s) => Object.values(s.progress.stages || {}).some((p) => p.clears > 0) },
    { id: 'first_summon', name: 'The Fire Answers', desc: 'Perform your first summon.', reward: { humanity: 10 },
      check: (s) => (s.gacha.history || []).length > 0 },
    { id: 'first_weapon', name: 'Armed', desc: 'Equip a weapon on a warrior.', reward: { humanity: 10 },
      check: () => anyRosterEntry((r) => !!r.weaponUid) },
    { id: 'first_relic', name: 'Adorned', desc: 'Equip a relic on a warrior.', reward: { humanity: 10 },
      check: () => anyRosterEntry((r) => r.relics && Object.values(r.relics).some(Boolean)) },
    { id: 'first_ascend', name: 'Ascended', desc: 'Ascend a warrior past their first tier.', reward: { humanity: 10 },
      check: () => anyRosterEntry((r) => (r.asc || 0) > 0) },
    { id: 'first_trace', name: 'Kindled', desc: 'Kindle a trace node on a warrior.', reward: { humanity: 10 },
      check: () => anyRosterEntry((r) => r.traces && Object.values(r.traces).some(Boolean)) },
    { id: 'growing_company', name: 'Growing Company', desc: 'Recruit 5 different warriors.', reward: { humanity: 10 },
      check: (s) => Object.keys(s.roster || {}).length >= 5 },
    { id: 'covenant_sworn', name: 'Covenant Sworn', desc: 'Clear a Covenant Trial and earn a relic.', reward: { humanity: 10 },
      check: (s) => Object.keys(s.inventory.relics || {}).length > 0 },
    { id: 'bonfire_10', name: 'Bonfire Lit', desc: 'Reach Bonfire Level 10.', reward: { humanity: 10 },
      check: (s) => (s.player.level || 1) >= 10 },
  ];

  DS.ACHIEVEMENTS_MILESTONE = [
    { id: 'bonfire_25', name: 'Kindled Flame', desc: 'Reach Bonfire Level 25.', reward: { humanity: 20 },
      check: (s) => (s.player.level || 1) >= 25 },
    { id: 'five_star_owner', name: 'A Legend Answers', desc: 'Own a 5★ warrior.', reward: { humanity: 20 },
      check: (s) => Object.keys(s.roster || {}).some((id) => { const c = DS.C && DS.C.findChar ? DS.C.findChar(id) : null; return c && c.rarity === 5; }) },
    { id: 'boss_slayer_5', name: 'Boss Slayer', desc: 'Defeat 5 different bosses.', reward: { humanity: 25 },
      check: (s) => Object.keys(s.progress.defeated || {}).filter((id) => { const e = (DS.ENEMIES || []).find((x) => x.id === id); return e && e.tier === 'boss'; }).length >= 5 },
    { id: 'full_relic_set', name: 'Full Regalia', desc: 'Equip a complete 4-piece relic set on one warrior.', reward: { humanity: 25 },
      check: (s) => anyRosterEntry((r) => {
        if (!r.relics) return false;
        const counts = {};
        DS.SLOTS.forEach((slot) => {
          const uid = r.relics[slot];
          const rel = uid ? s.inventory.relics[uid] : null;
          if (rel) counts[rel.setId] = (counts[rel.setId] || 0) + 1;
        });
        return Object.values(counts).some((n) => n >= 4);
      }) },
    { id: 'asylum_cleared', name: 'Asylum Escaped', desc: 'Clear every stage in the Northern Undead Asylum.', reward: { humanity: 30 },
      check: (s) => {
        const world = (DS.WORLDS || []).find((w) => (w.stages || []).some((st) => (s.progress.stages[st.id] || {}).clears > 0) || w.id === 'undead_asylum' || /asylum/i.test(w.name || ''));
        const target = (DS.WORLDS || []).find((w) => /asylum/i.test(w.name || '') || w.id === 'undead_asylum') || world;
        if (!target || !target.stages || !target.stages.length) return false;
        return target.stages.every((st) => (s.progress.stages[st.id] || {}).clears > 0);
      } },
    { id: 'boss_slayer_all', name: 'Herald of the Dark', desc: 'Defeat every boss in Lordran.', reward: { humanity: 30 },
      check: (s) => {
        const bosses = (DS.ENEMIES || []).filter((e) => e.tier === 'boss');
        return bosses.length > 0 && bosses.every((e) => (s.progress.defeated || {})[e.id]);
      } },
  ];

  // Bestiary: one challenge per enemy, generated from the enemy roster so it can
  // never drift out of sync. Bosses (the "harder" fights) pay out more and are
  // staggered 20/25/30 across roughly the first/middle/last third of the roster
  // order (which is itself already in rough progression order).
  DS.ACHIEVEMENTS_BESTIARY = (function () {
    const enemies = DS.ENEMIES || [];
    const bossIds = enemies.filter((e) => e.tier === 'boss').map((e) => e.id);
    const bossHumanity = (id) => {
      const idx = bossIds.indexOf(id);
      const third = Math.ceil(bossIds.length / 3) || 1;
      if (idx < third) return 20;
      if (idx < third * 2) return 25;
      return 30;
    };
    return enemies.map((e) => ({
      id: 'defeat_' + e.id,
      name: 'Slay ' + e.name,
      desc: (e.tier === 'boss' ? 'Defeat the boss ' : 'Defeat ') + e.name + ' at least once in battle.',
      tier: e.tier,
      enemyId: e.id,
      reward: { humanity: e.tier === 'boss' ? bossHumanity(e.id) : 10, unlockPortrait: e.id },
      check: (s) => !!(s.progress.defeated || {})[e.id],
    }));
  })();
})();
