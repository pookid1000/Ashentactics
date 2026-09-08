// Persistent state + reward granting (see CONTRACT.md §3).

window.DS = window.DS || {};

(function () {
  const KEY = 'ashen_tactics2_save';

  function defaultState() {
    return {
      player: { name: 'Chosen Undead', level: 1, exp: 0, estus: 240, estusMax: 240, lastEstusTs: Date.now(), portraitId: 'chosen_undead' },
      // shards = Pale Shards, the one premium currency real money buys (see
      // DS.SHOP_SHARD_PACKAGES in js/data/shop.js) — everything else in the
      // Premium/Cards shop shelves spends this instead of being priced in USD.
      currencies: { souls: 60000, humanity: 1600, signs: 0, ash: 0, shards: 0, wraithMarks: 0 },
      roster: {},
      inventory: { items: {}, weapons: {}, relics: {} },
      gacha: { history: [] },
      // Cosmetic card skins — owned: flat set of purchased skin ids (see
      // js/data/cardskins.js); equipped: charId -> currently-active skin id (absent
      // = default art). See js/engine/cosmetics.js for the read/write API.
      cosmetics: { owned: {}, equipped: {} },
      progress: {
        stages: {}, quests: {}, mail: {}, events: {},
        dailies: { date: '', done: {} },
        login: { days: 0, lastDate: '' },
        // Keyed per-gauntlet (see DS.BOSS_RUSHES in js/data/encounters.js) — 'cinders'
        // is the original Crown of Cinders, 'cosmos' the new Crown of the Cosmos.
        bossRush: { cinders: { best: 0 }, cosmos: { best: 0 } },
        lastTeam: [],
        tutorialSeen: {},
        // Achievements: which enemy/boss defIds have EVER been defeated (any won
        // battle they appeared in counts — see onBattleEnd in battle-ui.js), which
        // achievement ids have had their reward claimed, and which portrait ids
        // (character or enemy) the player has unlocked for their profile picture.
        // Owned characters don't need an entry here — see portraitUnlocked() in
        // hub-ui.js, which treats "owned" as automatically unlocked.
        defeated: {},
        achievements: {},
        unlockedPortraits: { chosen_undead: true },
        // Shop's Bearer's Blessing subscription (see js/data/shop.js) — ticked
        // down once per calendar day in DS.Meta.tickLogin().
        blessing: { daysLeft: 0 },
        // Covenant Trials start fully locked behind a Trial Key (delivered by mail
        // once Bonfire Level 2 is reached — see js/data/events_mail.js's
        // 'm_trial_key' entry) — see the 'covenants' screen in hub-ui.js for the
        // lock/unlock-animation flow. Once unlocked, the 8 trials themselves open
        // one at a time as each prior one is fully cleared.
        covenantsUnlocked: false,
        // Which individual trials (by DS.RELIC_TRIALS entry id) have already played
        // their key/lock unlock animation — the first trial needs no entry here (it
        // opens the instant covenantsUnlocked flips true, alongside that animation);
        // every trial after it gets marked the moment its own reveal animation finishes,
        // so the same animation never replays for one already seen.
        trialsRevealed: {},
      },
      settings: { sfx: true, reduceMotion: false, battleSpeed: 1, musicVolume: 0.6, resolution: '1080p' },
      // Fortress roguelike mode (see js/engine/fortress.js). `records` is small and
      // permanent — it survives every run. `active` holds one live run's entire
      // state (map graph, temporary squad, perks, in-run currency/weapons) and is
      // discarded wholesale — reset straight back to null — the instant a run ends,
      // win or lose, so nothing about a failed run ever lingers into the next one.
      fortress: {
        records: { runsAttempted: 0, runsCompleted: 0, bestDepth: 0 },
        active: null,
      },
    };
  }

  function deepMerge(base, over) {
    if (over === undefined || over === null) return base;
    if (typeof base !== 'object' || base === null || Array.isArray(base)) return over;
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
    return out;
  }

  function newRosterEntry() {
    return {
      level: 1, exp: 0, asc: 0, remembrance: 0, traces: {},
      weaponUid: null,
      relics: { helm: null, armor: null, ring: null, talisman: null },
    };
  }

  DS.Save = {
    load() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
      DS.State = deepMerge(defaultState(), saved || {});
      // One-time migration: bossRush used to be a single flat {best} tracking
      // only Crown of Cinders; it's now keyed per-gauntlet (see DS.BOSS_RUSHES).
      // Carry an old flat value forward into .cinders so existing progress on
      // that gauntlet isn't lost the first time a save with the old shape loads.
      const BR = DS.State.progress.bossRush;
      if (typeof BR.best === 'number') {
        BR.cinders = BR.cinders || { best: 0 };
        if (BR.best > BR.cinders.best) BR.cinders.best = BR.best;
        delete BR.best;
      }
      if (!BR.cinders) BR.cinders = { best: 0 };
      if (!BR.cosmos) BR.cosmos = { best: 0 };
      // Guarantee starters exist.
      ['chosen_undead', 'oscar'].forEach((id) => {
        if (!DS.State.roster[id]) DS.State.roster[id] = newRosterEntry();
      });
      DS.Save.persist();
      return DS.State;
    },

    persist() {
      try { localStorage.setItem(KEY, JSON.stringify(DS.State)); } catch (e) { /* storage full/blocked */ }
    },

    reset() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      DS.State = null;
      DS.Save.load();
    },

    newRosterEntry,

    // rewards = { souls?, humanity?, signs?, estus?, wraithMarks?, playerExp?, items?:{id:count},
    //             weapons?:[defId], characters?:[charId], relics?:[{setId, slot?, rarity?}] }
    // Returns array of {icon, text} summaries for toasts/popups.
    grant(rewards) {
      const out = [];
      if (!rewards) return out;
      const S = DS.State;
      const A = DS.Assets;
      if (rewards.souls) { S.currencies.souls += rewards.souls; out.push({ icon: '👻', img: A && A.currency('souls'), text: `Souls ×${rewards.souls}` }); }
      if (rewards.humanity) { S.currencies.humanity += rewards.humanity; out.push({ icon: '🖤', img: A && A.currency('humanity'), text: `Humanity ×${rewards.humanity}` }); }
      if (rewards.signs) { S.currencies.signs += rewards.signs; out.push({ icon: '🪧', img: A && A.currency('signs'), text: `Summon Signs ×${rewards.signs}` }); }
      if (rewards.ash) { S.currencies.ash = (S.currencies.ash || 0) + rewards.ash; out.push({ icon: '⚱', img: A && A.currency('ash'), text: `Ash ×${rewards.ash}` }); }
      if (rewards.shards) { S.currencies.shards = (S.currencies.shards || 0) + rewards.shards; out.push({ icon: '💠', img: A && A.currency('shards'), text: `Pale Shards ×${rewards.shards}` }); }
      if (rewards.wraithMarks) { S.currencies.wraithMarks = (S.currencies.wraithMarks || 0) + rewards.wraithMarks; out.push({ icon: '👁', img: A && A.currency('wraithMarks'), text: `Wraith Marks ×${rewards.wraithMarks}` }); }
      if (rewards.estus) {
        S.player.estus = Math.min(S.player.estusMax, S.player.estus + rewards.estus);
        out.push({ icon: '🧪', img: A && A.currency('estus'), text: `Estus ×${rewards.estus}` });
      }
      if (rewards.items) {
        for (const [id, rawCount] of Object.entries(rewards.items)) {
          // Ember (ascension material) rewards are scaled game-wide here — the
          // one place every reward path (stages, quests, Fortress) funnels
          // through — instead of hand-editing every reward table.
          const count = id.indexOf('ember_asc') === 0 ? rawCount * (DS.EMBER_REWARD_MULT || 1) : rawCount;
          S.inventory.items[id] = (S.inventory.items[id] || 0) + count;
          const def = DS.ITEMS ? DS.ITEMS.find((i) => i.id === id) : null;
          out.push({ icon: def ? def.icon : '📦', img: A && A.item(id), text: `${def ? def.name : id} ×${count}` });
        }
      }
      if (rewards.weapons) {
        rewards.weapons.forEach((defId) => {
          const uid = DS.Inventory ? DS.Inventory.createWeapon(defId) : null;
          const def = DS.WEAPONS ? DS.WEAPONS.find((w) => w.id === defId) : null;
          out.push({ icon: def && def.art ? def.art.icon : '🗡', img: A && A.weapon(defId), text: def ? def.name : defId, uid });
        });
      }
      if (rewards.relics) {
        // Each relic-reward entry (currently only Covenant Trial clears) drops at
        // least 2 copies, with a 50% chance of a 3rd and a further 20% chance of a 4th.
        const rolls = [];
        rewards.relics.forEach((r) => {
          rolls.push(r, r);
          if (DS.RNG.chance(0.5)) rolls.push(r);
          if (DS.RNG.chance(0.2)) rolls.push(r);
        });
        rolls.forEach((r) => {
          const set = (DS.RELIC_SETS || []).find((s) => s.id === r.setId);
          const uid = DS.Inventory ? DS.Inventory.rollRelic(r.setId, r.slot || null, r.rarity || 4) : null;
          if (uid) {
            const rolled = S.inventory.relics[uid];
            const img = A && rolled && A.relicPiece(r.setId, rolled.slot);
            out.push({ icon: set && set.art ? set.art.icon : '💍', img, text: (set ? set.name : r.setId) + ' relic' });
          } else out.push({ icon: '⚠', text: 'Relic vault full — salvage to make room.' });
        });
      }
      if (rewards.characters) {
        rewards.characters.forEach((charId) => {
          const def = DS.CHARACTERS ? DS.CHARACTERS.find((c) => c.id === charId) : null;
          const img = A && A.portrait(charId);
          if (!S.roster[charId]) {
            S.roster[charId] = newRosterEntry();
            out.push({ icon: def && def.art ? def.art.icon : '👤', img, text: `${def ? def.name : charId} joins!` });
          } else if (S.roster[charId].remembrance < 6) {
            S.roster[charId].remembrance += 1;
            out.push({ icon: '🕯', img, text: `${def ? def.name : charId} — Remembrance ${S.roster[charId].remembrance}` });
            // Only 4★/5★ dupes also convert into Ash — 1★-3★ dupes just raise Remembrance.
            if (def && def.rarity >= 4) {
              const ashGain = ((DS.ASH_RATES || {}).charDupe || {})[def.rarity] || 0;
              if (ashGain > 0) {
                S.currencies.ash = (S.currencies.ash || 0) + ashGain;
                out.push({ icon: '⚱', img: A && A.currency('ash'), text: `Ash ×${ashGain}` });
              }
            }
          } else if (def && def.rarity >= 4) {
            const ashGain = ((DS.ASH_RATES || {}).charMaxed || {})[def.rarity] || 0;
            S.currencies.ash = (S.currencies.ash || 0) + ashGain;
            out.push({ icon: '⚱', img: A && A.currency('ash'), text: `${def ? def.name : charId} dupe → Ash ×${ashGain}` });
          } else {
            // 1★-3★ dupe past Remembrance cap — nothing else to gain, so it
            // falls back to a flat Souls + Humanity payout instead of Ash.
            S.currencies.souls += 20000;
            S.currencies.humanity += 40;
            out.push({ icon: '👻', img: A && A.currency('souls'), text: `${def ? def.name : charId} dupe → Souls ×20000, Humanity ×40` });
          }
        });
      }
      if (rewards.playerExp && DS.Progression && DS.Progression.gainPlayerExp) {
        const levels = DS.Progression.gainPlayerExp(rewards.playerExp);
        out.push({ icon: '🔥', img: A && A.hub('flame'), text: `Bonfire EXP ×${rewards.playerExp}` });
        if (levels > 0) out.push({ icon: '🔥', img: A && A.hub('flame'), text: `Bonfire Level up! Now ${S.player.level}` });
      }
      DS.Save.persist();
      return out;
    },
  };
})();
