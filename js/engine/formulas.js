// ASHEN TACTICS — damage math (CONTRACT.md §5.1). HSR-like defense curve.

window.DS = window.DS || {};

(function () {
  DS.Formulas = {
    // defMult = 1 - def / (def + 200 + 10 * attackerLevel)
    defMult(def, attackerLevel) {
      const d = Math.max(0, def || 0);
      return 1 - d / (d + 200 + 10 * (attackerLevel || 1));
    },

    dmg(opts) {
      const atk = opts.atk || 100;
      const power = opts.power || 1;
      const dmgBoost = opts.dmgBoost || 0;
      const critMult = opts.critMult || 1;
      const brokenMult = opts.brokenMult || 1;
      const vulnMult = opts.vulnMult || 1;
      const elemMult = opts.elemMult || 1;
      const defender = opts.defender || { def: 0 };
      const effDef = (defender.def || 0) * (1 - (opts.defPierce || 0));
      const dm = DS.Formulas.defMult(effDef, opts.attackerLevel);
      const raw = atk * power * (1 + dmgBoost) * critMult * dm * brokenMult * vulnMult * elemMult * (1 - (opts.resPct || 0));
      return Math.max(1, Math.round(raw));
    },

    // Elemental advantage wheel: ±10% based on DS.ELEMENT_ADVANTAGE. Neutral (1) for
    // Physical, opposite-pair matchups, and any element not in the table.
    elementMult(atkEl, defEl) {
      const adv = DS.ELEMENT_ADVANTAGE[atkEl];
      if (!adv) return 1;
      if (adv.strongVs === defEl) return 1 + DS.ELEMENT_ADVANTAGE_PCT;
      if (adv.weakVs === defEl) return 1 - DS.ELEMENT_ADVANTAGE_PCT;
      return 1;
    },

    critRoll(rate) { return Math.random() < Math.max(0, Math.min(1, rate)); },

    // acc/eva are additive modifiers around 0 (e.g. +0.2 evasion from buffs).
    hitRoll(acc, eva) {
      const chance = Math.max(0.05, Math.min(1, 1 + (acc || 0) - (eva || 0)));
      return Math.random() < chance;
    },

    breakDmg(level, breakEffect, element) {
      const base = DS.CURVES.breakBaseDmg(level || 1);
      const elemMult = element === 'Physical' || element === 'Fire' ? 1.1 : 1.0;
      return Math.max(1, Math.round(base * (1 + (breakEffect || 0)) * elemMult));
    },
  };
})();
