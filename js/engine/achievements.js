// ASHEN TACTICS — achievements engine: progress checks + claiming rewards.

window.DS = window.DS || {};

(function () {
  function allDefs() {
    return []
      .concat((DS.ACHIEVEMENTS_BASIC || []).map((a) => Object.assign({ kind: 'basic' }, a)))
      .concat((DS.ACHIEVEMENTS_BESTIARY || []).map((a) => Object.assign({ kind: 'bestiary' }, a)))
      .concat((DS.ACHIEVEMENTS_MILESTONE || []).map((a) => Object.assign({ kind: 'milestone' }, a)));
  }

  function findDef(id) {
    return allDefs().find((a) => a.id === id) || null;
  }

  DS.Achievements = {
    // Every achievement with live progress/claim status attached, for the UI to render.
    list() {
      const S = DS.State;
      return allDefs().map((a) => {
        const met = (() => { try { return !!a.check(S); } catch (e) { return false; } })();
        const claimed = !!(S.progress.achievements || {})[a.id];
        return Object.assign({}, a, { met, claimed, claimable: met && !claimed });
      });
    },

    summary() {
      const all = this.list();
      return {
        total: all.length,
        claimed: all.filter((a) => a.claimed).length,
        claimable: all.filter((a) => a.claimable).length,
      };
    },

    // Grants the reward exactly once. Returns the DS.Save.grant() summary array,
    // or null if the achievement doesn't exist, isn't met yet, or was already claimed.
    claim(id) {
      const S = DS.State;
      const a = findDef(id);
      if (!a) return null;
      if ((S.progress.achievements || {})[id]) return null;
      let met = false;
      try { met = !!a.check(S); } catch (e) { met = false; }
      if (!met) return null;

      S.progress.achievements[id] = true;
      const summary = DS.Save.grant({ humanity: (a.reward && a.reward.humanity) || 0 });
      if (a.reward && a.reward.unlockPortrait) {
        S.progress.unlockedPortraits[a.reward.unlockPortrait] = true;
        const def = (DS.ENEMIES || []).find((e) => e.id === a.reward.unlockPortrait);
        summary.push({ icon: '🖼', img: DS.Assets && DS.Assets.portrait(a.reward.unlockPortrait), text: (def ? def.name : 'Portrait') + ' unlocked for the gallery' });
      }
      DS.Save.persist();
      return summary;
    },
  };
})();
