// ASHEN TACTICS: EMBERS OF LORDRAN — quest log + daily tasks engine (CONTRACT §5.7).
// Drives DS.QUESTS definitions against DS.State.progress.quests ({step, done, claimed}).
// Step rules: 'dialogue' advances freely once played; 'collect' verifies and consumes
// items; 'clearStage' verifies stage progress; 'battle' advances ONLY through
// completeBattleStep(questId) (called by battle-ui on victory of a quest battle).

window.DS = window.DS || {};

(function () {
  const DAILY_TASKS = [
    {
      id: 'daily_stage',
      name: 'Stoke the Flame',
      desc: 'Clear any stage. The fire dims when left untended.',
      icon: '⚔',
      rewards: { humanity: 40, souls: 2500 },
    },
    {
      id: 'daily_enhance',
      name: 'Temper the Steel',
      desc: 'Enhance a relic or a weapon. Dull edges bury no lords.',
      icon: '🔨',
      rewards: { humanity: 40, souls: 2500 },
    },
    {
      id: 'daily_pull',
      name: 'Answer the Sign',
      desc: 'Perform a summon. Somewhere, a soapstone glimmers.',
      icon: '🪧',
      rewards: { humanity: 40, souls: 2500 },
    },
  ];

  // Tolerant ids so other engines/UI can report completions without exact strings.
  const DAILY_ALIASES = {
    daily_stage: 'daily_stage', stage: 'daily_stage', clear: 'daily_stage', clearstage: 'daily_stage',
    daily_enhance: 'daily_enhance', enhance: 'daily_enhance', upgrade: 'daily_enhance',
    daily_pull: 'daily_pull', pull: 'daily_pull', summon: 'daily_pull', gacha: 'daily_pull',
  };

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // Reset the daily board whenever the local date rolls over.
  function ensureDailies() {
    const P = DS.State.progress;
    if (!P.dailies) P.dailies = { date: '', done: {} };
    if (!P.dailies.done) P.dailies.done = {};
    const today = todayStr();
    if (P.dailies.date !== today) {
      P.dailies.date = today;
      P.dailies.done = {};
      DS.Save.persist();
    }
    return P.dailies;
  }

  function questDef(id) {
    return (Array.isArray(DS.QUESTS) ? DS.QUESTS : []).find((q) => q.id === id) || null;
  }

  function questProg(id) {
    const Q = DS.State.progress.quests;
    if (!Q[id]) Q[id] = { step: 0, done: false, claimed: false };
    if (Q[id].claimed === undefined) Q[id].claimed = false;
    return Q[id];
  }

  function stepDef(quest, prog) {
    if (!quest || prog.done) return null;
    return quest.steps[prog.step] || null;
  }

  function haveItems(itemId, count) {
    return (DS.State.inventory.items[itemId] || 0) >= count;
  }

  function consumeItems(itemId, count) {
    if (DS.Inventory && DS.Inventory.removeItem) {
      DS.Inventory.removeItem(itemId, count);
      return;
    }
    const items = DS.State.inventory.items;
    items[itemId] = Math.max(0, (items[itemId] || 0) - count);
    if (items[itemId] === 0) delete items[itemId];
  }

  function stageCleared(stageId) {
    const s = DS.State.progress.stages[stageId];
    return !!(s && s.clears > 0);
  }

  // Can the CURRENT step be completed through advance() right now?
  function stepSatisfied(step) {
    if (!step) return false;
    switch (step.type) {
      case 'dialogue': return true;
      case 'reward': return true;
      case 'collect': return haveItems(step.itemId, step.count || 1);
      case 'clearStage': return stageCleared(step.stageId);
      case 'battle': return false; // only completeBattleStep may advance these
      default: return false;
    }
  }

  function finishStep(quest, prog) {
    prog.step += 1;
    if (prog.step >= quest.steps.length) prog.done = true;
    DS.Save.persist();
  }

  DS.QuestLog = {
    DAILY_IDS: DAILY_TASKS.map((t) => t.id),

    // All questlines the player can still interact with (unclaimed ones).
    activeQuests() {
      return (Array.isArray(DS.QUESTS) ? DS.QUESTS : [])
        .map((q) => DS.QuestLog.questState(q.id))
        .filter((s) => s && !s.claimed);
    },

    questState(id) {
      const quest = questDef(id);
      if (!quest) return null;
      const prog = questProg(id);
      const step = stepDef(quest, prog);
      return {
        id: quest.id,
        quest,
        step: prog.step,
        totalSteps: quest.steps.length,
        done: prog.done,
        claimed: prog.claimed,
        currentStep: step,
        canAdvance: !prog.done && stepSatisfied(step),
        claimable: prog.done && !prog.claimed,
      };
    },

    // Advance past the current dialogue/collect/clearStage step.
    // Returns {ok, done?, step?, reason?}. Battle steps refuse with reason:'battle'.
    advance(questId) {
      const quest = questDef(questId);
      if (!quest) return { ok: false, reason: 'unknown' };
      const prog = questProg(questId);
      if (prog.done) return { ok: false, reason: 'done' };
      const step = stepDef(quest, prog);
      if (!step) {
        prog.done = true;
        DS.Save.persist();
        return { ok: true, done: true, step: prog.step };
      }
      if (step.type === 'battle') return { ok: false, reason: 'battle' };
      if (!stepSatisfied(step)) return { ok: false, reason: 'requirement' };
      if (step.type === 'collect') consumeItems(step.itemId, step.count || 1);
      if (step.type === 'reward' && step.rewards) DS.Save.grant(step.rewards);
      finishStep(quest, prog);
      return { ok: true, done: prog.done, step: prog.step };
    },

    // Called by battle-ui after winning a quest battle (source.kind === 'quest').
    completeBattleStep(questId) {
      const quest = questDef(questId);
      if (!quest) return { ok: false, reason: 'unknown' };
      const prog = questProg(questId);
      if (prog.done) return { ok: false, reason: 'done' };
      const step = stepDef(quest, prog);
      if (!step || step.type !== 'battle') return { ok: false, reason: 'notBattle' };
      finishStep(quest, prog);
      return { ok: true, done: prog.done, step: prog.step };
    },

    // One-time claim of the questline's rewards once every step is complete.
    // Returns a grant summary array, or null if not claimable.
    claimRewards(questId) {
      const quest = questDef(questId);
      if (!quest) return null;
      const prog = questProg(questId);
      if (!prog.done || prog.claimed) return null;
      prog.claimed = true;
      const summary = DS.Save.grant(quest.rewards || {});
      DS.Save.persist();
      return summary;
    },

    // Three static daily tasks; board resets when the local date changes.
    dailyTasks() {
      const d = ensureDailies();
      return DAILY_TASKS.map((t) => ({
        id: t.id,
        name: t.name,
        desc: t.desc,
        icon: t.icon,
        rewards: t.rewards,
        done: !!d.done[t.id],
      }));
    },

    // Mark a daily task complete (idempotent per day) and grant its rewards.
    // Returns the grant summary the first time, null otherwise.
    checkDaily(taskId) {
      const id = DAILY_ALIASES[String(taskId || '').toLowerCase()] || null;
      if (!id) return null;
      const task = DAILY_TASKS.find((t) => t.id === id);
      const d = ensureDailies();
      if (d.done[id]) return null;
      d.done[id] = true;
      const summary = DS.Save.grant(task.rewards);
      DS.Save.persist();
      return summary;
    },
  };
})();
