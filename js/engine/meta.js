// ASHEN TACTICS: EMBERS OF LORDRAN — meta systems engine (CONTRACT §5.8).
// Mail inbox, event progress/claims, login tracking, stage completion rewards,
// boss-rush records, and hub notification badges. Persists after every mutation.

window.DS = window.DS || {};

(function () {
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function mailDefs() { return Array.isArray(DS.MAIL) ? DS.MAIL : []; }
  function eventDefs() { return Array.isArray(DS.EVENTS) ? DS.EVENTS : []; }
  function worldDefs() { return Array.isArray(DS.WORLDS) ? DS.WORLDS : []; }
  function domainDefs() { return Array.isArray(DS.DOMAINS) ? DS.DOMAINS : []; }
  function relicTrialDefs() { return Array.isArray(DS.RELIC_TRIALS) ? DS.RELIC_TRIALS : []; }

  function mailStatus(id) { return DS.State.progress.mail[id] || null; }

  function findMail(id) { return mailDefs().find((m) => m.id === id) || null; }
  function findEvent(id) { return eventDefs().find((e) => e.id === id) || null; }

  // Look a stage up across world stages and daily domains.
  // Domains are repeatable: they always pay their repeat rewards.
  function findStage(stageId) {
    for (const w of worldDefs()) {
      for (const s of (w.stages || [])) {
        if (s.id === stageId) return { stage: s, world: w, domain: false };
      }
    }
    for (const d of domainDefs()) {
      if (d.id === stageId && d.spawns) return { stage: d, world: null, domain: true };
      for (const s of (d.stages || [])) {
        if (s.id === stageId) return { stage: s, world: null, domain: true };
      }
    }
    for (const t of relicTrialDefs()) {
      for (const s of (t.stages || [])) {
        if (s.id === stageId) return { stage: s, world: null, domain: true };
      }
    }
    return null;
  }

  function eventState(id) {
    const E = DS.State.progress.events;
    if (!E[id]) E[id] = { claimed: {} };
    if (!E[id].claimed) E[id].claimed = {};
    return E[id];
  }

  // The number an event's tier requirements are measured against.
  function eventMetric(ev) {
    if (!ev) return 0;
    if (ev.kind === 'login') return (DS.State.progress.login && DS.State.progress.login.days) || 0;
    // The one existing bossRush-kind event (ev_bossrush) is specifically about
    // Crown of Cinders (see js/data/events_mail.js) — reads that gauntlet's
    // key directly rather than generalizing the event system for a single case.
    if (ev.kind === 'bossRush') return (DS.State.progress.bossRush && DS.State.progress.bossRush.cinders && DS.State.progress.bossRush.cinders.best) || 0;
    return Infinity; // 'boost' events are static: every tier is immediately reachable
  }

  function tierReached(ev, tier) {
    if (ev.kind === 'boost') return true;
    return eventMetric(ev) >= (tier.req || 0);
  }

  DS.Meta = {
    // ---------- Mail ----------
    // Inbox with per-mail status: null (unread) | 'read' | 'claimed'. Entries
    // with a requiresLevel (e.g. the Trial Key) stay hidden until the player's
    // Bonfire Level actually reaches it.
    mailList() {
      const lvl = (DS.State.player && DS.State.player.level) || 1;
      return mailDefs()
        .filter((m) => !m.requiresLevel || lvl >= m.requiresLevel)
        .map((m) => Object.assign({}, m, { status: mailStatus(m.id) }));
    },

    readMail(id) {
      const m = findMail(id);
      if (!m) return null;
      if (!mailStatus(id)) {
        DS.State.progress.mail[id] = 'read';
        DS.Save.persist();
      }
      return Object.assign({}, m, { status: mailStatus(id) });
    },

    // Claim a mail's attachments exactly once. Returns the grant summary
    // (empty array for reward-less mail), or null if already claimed / unknown.
    claimMail(id) {
      const m = findMail(id);
      if (!m) return null;
      if (mailStatus(id) === 'claimed') return null;
      DS.State.progress.mail[id] = 'claimed';
      const summary = m.rewards ? DS.Save.grant(m.rewards) : [];
      DS.Save.persist();
      return summary;
    },

    // ---------- Login / events ----------
    // Call once at boot. Increments the login-day counter at most once per local date.
    tickLogin() {
      const P = DS.State.progress;
      if (!P.login) P.login = { days: 0, lastDate: '' };
      const today = todayStr();
      if (P.login.lastDate === today) return { days: P.login.days, first: false };
      P.login.lastDate = today;
      P.login.days += 1;
      // Shop's Bearer's Blessing subscription: once per new calendar day, while
      // active, pay out its daily Humanity and count the day down.
      let blessingSummary = null;
      if (!P.blessing) P.blessing = { daysLeft: 0 };
      if (P.blessing.daysLeft > 0) {
        P.blessing.daysLeft -= 1;
        const amt = (DS.SHOP_SUBSCRIPTION && DS.SHOP_SUBSCRIPTION.dailyHumanity) || 60;
        blessingSummary = DS.Save.grant({ humanity: amt });
      }
      DS.Save.persist();
      return { days: P.login.days, first: true, blessingSummary };
    },

    eventProgress(id) {
      const ev = findEvent(id);
      if (!ev) return null;
      const st = eventState(id);
      const metric = eventMetric(ev);
      const tiers = (ev.tiers || []).map((tier, idx) => ({
        idx,
        tier,
        reached: tierReached(ev, tier),
        claimed: !!st.claimed[idx],
      }));
      return {
        id: ev.id,
        event: ev,
        kind: ev.kind,
        progress: ev.kind === 'boost' ? null : metric,
        tiers,
        claimable: tiers.filter((t) => t.reached && !t.claimed).length,
      };
    },

    // Claim one event tier exactly once. Returns the grant summary or null.
    claimEventTier(id, tierIdx) {
      const ev = findEvent(id);
      if (!ev || !ev.tiers || !ev.tiers[tierIdx]) return null;
      const st = eventState(id);
      if (st.claimed[tierIdx]) return null;
      if (!tierReached(ev, ev.tiers[tierIdx])) return null;
      st.claimed[tierIdx] = true;
      const summary = DS.Save.grant(ev.tiers[tierIdx].rewards || {});
      DS.Save.persist();
      return summary;
    },

    // ---------- Stage completion ----------
    // Called by battle-ui on victory when source.kind is 'stage' or 'domain'.
    // First clear pays firstClear rewards; later clears (and all domain runs) pay
    // repeat rewards. Records clears and best star rating, grants bonfire exp,
    // and pings the daily task. Returns {summary, first, clears, stars}.
    completeStage(stageId, opts) {
      const found = findStage(stageId);
      const stars = Math.max(0, Math.min(3, (opts && opts.stars) || 0));
      const P = DS.State.progress;
      if (!P.stages[stageId]) P.stages[stageId] = { clears: 0, stars: 0 };
      const prog = P.stages[stageId];
      const isDomain = !!(found && found.domain);
      const first = !isDomain && prog.clears === 0;

      prog.clears += 1;
      prog.stars = Math.max(prog.stars, stars);

      let summary = [];
      if (found) {
        const stage = found.stage;
        const rewardsDef = isDomain
          ? (stage.repeat || stage.firstClear || {})
          : (first ? (stage.firstClear || stage.repeat || {}) : (stage.repeat || {}));
        const rewards = Object.assign({}, rewardsDef);
        if (!rewards.playerExp) rewards.playerExp = Math.max(20, (stage.estusCost || 8) * 5);
        summary = DS.Save.grant(rewards);
      }

      if (DS.QuestLog && DS.QuestLog.checkDaily) DS.QuestLog.checkDaily('daily_stage');
      DS.Save.persist();
      return { summary, first, clears: prog.clears, stars: prog.stars };
    },

    // ---------- Boss rush ----------
    // Record the deepest wave reached for the given gauntlet (see DS.BOSS_RUSHES
    // in js/data/encounters.js — 'cinders' or 'cosmos'). If .rewards is an array
    // it is treated as per-wave rewards, paid once for each newly reached wave;
    // if it is a single Rewards object it is paid once upon first full clear of
    // the sequence. (Ongoing boss-rush event tiers are claimed separately via
    // claimEventTier — that event is specifically about 'cinders', see eventMetric.)
    completeBossRush(wave, gauntletId) {
      gauntletId = gauntletId || 'cinders';
      const P = DS.State.progress;
      if (!P.bossRush) P.bossRush = {};
      if (!P.bossRush[gauntletId]) P.bossRush[gauntletId] = { best: 0 };
      const slot = P.bossRush[gauntletId];
      const prev = slot.best || 0;
      wave = Math.max(0, Math.floor(wave || 0));
      const improved = wave > prev;
      if (improved) slot.best = wave;

      let summary = [];
      const BR = DS.BOSS_RUSHES && DS.BOSS_RUSHES[gauntletId];
      if (BR && BR.rewards && improved) {
        if (Array.isArray(BR.rewards)) {
          for (let w = prev + 1; w <= wave; w++) {
            const tier = BR.rewards[w - 1];
            if (tier) summary = summary.concat(DS.Save.grant(tier));
          }
        } else if (Array.isArray(BR.sequence) && wave >= BR.sequence.length && prev < BR.sequence.length) {
          summary = DS.Save.grant(BR.rewards);
        }
      }

      DS.Save.persist();
      return { best: slot.best, improved, summary };
    },

    // ---------- Hub notification badges ----------
    // mail: unclaimed reward mail + unread reward-less mail.
    // quests: questlines with a claimable reward or an advanceable current step.
    // events: total claimable (reached, unclaimed) tiers across all events.
    notifBadges() {
      let mail = 0;
      for (const m of mailDefs()) {
        const st = mailStatus(m.id);
        if (m.rewards ? st !== 'claimed' : !st) mail += 1;
      }

      let quests = 0;
      if (DS.QuestLog && DS.QuestLog.questState) {
        for (const q of (Array.isArray(DS.QUESTS) ? DS.QUESTS : [])) {
          const s = DS.QuestLog.questState(q.id);
          if (s && (s.claimable || s.canAdvance)) quests += 1;
        }
      }

      let events = 0;
      for (const ev of eventDefs()) {
        const p = DS.Meta.eventProgress(ev.id);
        if (p) events += p.claimable;
      }

      return { mail, quests, events };
    },
  };
})();
