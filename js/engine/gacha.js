// ASHEN TACTICS: EMBERS OF LORDRAN — gacha engine (CONTRACT §5.6, rates per §4.8).
// Rarity is rolled first (with soft/hard pity), then a concrete drop is picked from
// that rarity's banner pool. Pool entries are selectors:
//   {type:'character', id}            — explicit character
//   {type:'weapon', id}               — explicit weapon
//   {type:'weapon', rarity:N}         — wildcard: random weapon of that rarity from DS.WEAPONS
//   {type:'item', id}                 — filler item (1★ grants ×3, 2★ grants ×1)
// Bare-string entries are tolerated and type-inferred for robustness.

window.DS = window.DS || {};

(function () {
  const SOFT_PITY_STEP = 0.06;          // +6% absolute 5★ chance per roll from softPityStart
  const BEGINNER_WITHIN = 50;           // beginner banner: 5★ guaranteed within first 50 pulls
  const BEGINNER_DISCOUNT = 0.8;        // beginner banner: costs 20% less (rounded up)
  const HISTORY_CAP = 400;              // keep the save from growing without bound

  // Safety net if a banner pool is missing/empty or an entry fails to resolve.
  const FALLBACK_ITEM = {
    1: 'soul_small', 2: 'titanite_shard', 3: 'titanite_large', 4: 'titanite_chunk', 5: 'titanite_slab',
  };

  function banners() { return Array.isArray(DS.BANNERS) ? DS.BANNERS : []; }

  function findBanner(bannerId) {
    return banners().find((b) => b.id === bannerId) || null;
  }

  // Limited banners share one pity track ('limited'); every other banner keeps its own.
  function pityKey(banner) {
    return banner.kind === 'limited' ? 'limited' : banner.id;
  }

  function pityState(banner) {
    const G = DS.State.gacha;
    const key = pityKey(banner);
    if (!G[key]) G[key] = { pity5: 0, pity4: 0, guaranteed: false, pulls: 0, got5: false };
    const p = G[key];
    if (p.pulls === undefined) p.pulls = 0;
    if (p.got5 === undefined) p.got5 = false;
    return p;
  }

  function pullCost(banner, count) {
    const per = (banner && banner.costSigns) || 1;
    let cost = per * count;
    if (banner && banner.kind === 'beginner') cost = Math.ceil(cost * BEGINNER_DISCOUNT);
    return cost;
  }

  // Roll the rarity for one pull. p is the live pity state (not yet incremented).
  function rollRarity(banner, p) {
    const R = DS.GACHA_RATES;
    const n5 = p.pity5 + 1; // which roll-since-last-5★ this one is
    const n4 = p.pity4 + 1;
    let p5 = R.five;
    if (n5 >= R.softPityStart) p5 += SOFT_PITY_STEP * (n5 - R.softPityStart + 1);
    let forced5 = n5 >= R.hardPity;
    if (banner.kind === 'beginner' && !p.got5 && p.pulls + 1 >= BEGINNER_WITHIN) forced5 = true;
    const r = DS.RNG.roll();
    if (forced5 || r < p5) return 5;
    if (n4 >= R.fourPity) return 4; // guaranteed 4★-or-better every fourPity rolls
    if (r < p5 + R.four) return 4;
    if (r < p5 + R.four + R.three) return 3;
    if (r < p5 + R.four + R.three + R.two) return 2;
    return 1;
  }

  // Normalize one pool entry into a concrete {type, id}, or null on failure.
  function resolveEntry(entry, rarity) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      if ((DS.CHARACTERS || []).some((c) => c.id === entry)) return { type: 'character', id: entry };
      if ((DS.WEAPONS || []).some((w) => w.id === entry)) return { type: 'weapon', id: entry };
      return { type: 'item', id: entry };
    }
    if (entry.type === 'weapon' && !entry.id) {
      const want = entry.rarity || rarity;
      const opts = (DS.WEAPONS || []).filter((w) => w.rarity === want);
      if (!opts.length) return null;
      return { type: 'weapon', id: DS.RNG.pick(opts).id };
    }
    if (!entry.type || !entry.id) return null;
    return { type: entry.type, id: entry.id };
  }

  function entryMatchesId(entry, id) {
    if (!id) return false;
    if (typeof entry === 'string') return entry === id;
    return entry.id === id;
  }

  function featuredId(banner) {
    const f = banner.featured5;
    if (!f) return null;
    return typeof f === 'string' ? f : f.id;
  }

  // Pick a concrete drop for the rolled rarity, honoring 50/50 + guarantee on any banner
  // that declares a featured entry (not gated on kind — a 'weapon' banner gets the same
  // rate-up mechanic as a 'limited' character banner; its pity is already isolated since
  // pityKey() only shares the 'limited' key for banner.kind === 'limited').
  function pickFromPool(banner, rarity, p) {
    let pool = banner['pool' + rarity] || [];

    if (rarity === 5 && banner.featured5) {
      const fid = featuredId(banner);
      const winsFeatured = p.guaranteed ? true : DS.RNG.chance(0.5);
      if (winsFeatured) {
        p.guaranteed = false;
        const resolved = resolveEntry(banner.featured5, 5);
        if (resolved) return resolved;
        // Featured entry failed to resolve — fall through to the general pool.
      } else {
        p.guaranteed = true; // lost the 50/50: next 5★ on a limited banner is featured
        const rest = pool.filter((e) => !entryMatchesId(e, fid));
        pool = rest.length ? rest : pool;
      }
    }

    if (rarity === 4 &&
        Array.isArray(banner.featured4) && banner.featured4.length && DS.RNG.chance(0.5)) {
      const resolved = resolveEntry(DS.RNG.pick(banner.featured4), 4);
      if (resolved) return resolved;
    }

    if (pool.length) {
      const resolved = resolveEntry(DS.RNG.pick(pool), rarity);
      if (resolved) return resolved;
    }
    return { type: 'item', id: FALLBACK_ITEM[rarity] || 'soul_small' };
  }

  // Grant the drop to the player and build the result record.
  function applyResult(rarity, picked) {
    const S = DS.State;
    const res = { rarity, type: picked.type, id: picked.id, isNew: false };

    if (picked.type === 'character') {
      const prev = S.roster[picked.id];
      const prevRem = prev ? prev.remembrance : -1;
      const prevAsh = S.currencies.ash || 0;
      res.isNew = !prev;
      DS.Save.grant({ characters: [picked.id] });
      if (!res.isNew) {
        const entry = S.roster[picked.id];
        const now = entry ? entry.remembrance : prevRem;
        const ashGained = (S.currencies.ash || 0) - prevAsh;
        if (now > prevRem) res.dupeConverted = { remembrance: now, ash: ashGained };
        else res.dupeConverted = { ash: ashGained };
      }
    } else if (picked.type === 'weapon') {
      const owned = Object.values(S.inventory.weapons).some((w) => w && w.defId === picked.id);
      res.isNew = !owned;
      if (DS.Inventory && DS.Inventory.createWeapon) {
        res.uid = DS.Inventory.createWeapon(picked.id);
      } else {
        // Inventory engine unavailable — store a minimal instance so nothing is lost.
        const uid = DS.RNG.uuid();
        S.inventory.weapons[uid] = { uid, defId: picked.id, level: 1, exp: 0, refine: 1, locked: false, equippedBy: null };
        res.uid = uid;
      }
      // Duplicate weapons are kept as instances (fodder for DS.Inventory.refineWeapon).
      // Only 4★/5★ dupes also convert into some Ash, same as duplicate characters.
      if (owned) {
        const wdef = (DS.WEAPONS || []).find((w) => w.id === picked.id);
        const rarity = wdef ? wdef.rarity : 0;
        if (rarity >= 4) {
          const ashGain = ((DS.ASH_RATES || {}).weaponDupe || {})[rarity] || 0;
          if (ashGain > 0) {
            S.currencies.ash = (S.currencies.ash || 0) + ashGain;
            res.dupeConverted = { ash: ashGain };
          }
        } else {
          res.dupeConverted = {};
        }
      }
    } else {
      const count = rarity === 1 ? 3 : 1;
      res.count = count;
      const items = {};
      items[picked.id] = count;
      DS.Save.grant({ items });
    }
    return res;
  }

  function recordHistory(bannerId, res) {
    if (!Array.isArray(DS.State.gacha.history)) DS.State.gacha.history = [];
    const H = DS.State.gacha.history;
    H.push({ ts: Date.now(), bannerId, rarity: res.rarity, type: res.type, id: res.id });
    if (H.length > HISTORY_CAP) H.splice(0, H.length - HISTORY_CAP);
  }

  DS.Gacha = {
    // Combined affordability: signs first, shortfall auto-covered by humanity conversion.
    canAfford(bannerId, count) {
      const S = DS.State;
      const banner = findBanner(bannerId);
      if (!banner) {
        return { ok: false, cost: 0, signsHave: S.currencies.signs, signsShort: 0, humanityNeeded: 0, humanityHave: S.currencies.humanity };
      }
      const cost = pullCost(banner, count || 1);
      const signsHave = S.currencies.signs;
      const signsShort = Math.max(0, cost - signsHave);
      const humanityNeeded = signsShort * DS.PULL_COST_HUMANITY;
      return {
        ok: humanityNeeded <= S.currencies.humanity,
        cost,
        signsHave,
        signsShort,
        humanityNeeded,
        humanityHave: S.currencies.humanity,
      };
    },

    getPity(bannerId) {
      const banner = findBanner(bannerId);
      if (!banner) return null;
      const R = DS.GACHA_RATES;
      const p = pityState(banner);
      return {
        key: pityKey(banner),
        pity5: p.pity5,
        pity4: p.pity4,
        guaranteed: !!p.guaranteed,
        pulls: p.pulls || 0,
        got5: !!p.got5,
        softPityStart: R.softPityStart,
        hardPity: R.hardPity,
        fourPity: R.fourPity,
      };
    },

    // Returns the results array with convenience props attached:
    //   results.best   — highest rarity in the batch
    //   results.spent  — { signs, humanity } actually paid
    //   results.results — alias to the array itself (wrapper-style destructuring works too)
    // Returns null if the banner is unknown or the player cannot afford the pulls.
    roll(bannerId, count) {
      count = count || 1;
      const banner = findBanner(bannerId);
      if (!banner) return null;
      const afford = DS.Gacha.canAfford(bannerId, count);
      if (!afford.ok) return null;

      const S = DS.State;
      const signsUsed = afford.cost - afford.signsShort;
      S.currencies.signs -= signsUsed;
      S.currencies.humanity -= afford.humanityNeeded;

      const p = pityState(banner);
      const results = [];
      for (let i = 0; i < count; i++) {
        const rarity = rollRarity(banner, p);
        const picked = pickFromPool(banner, rarity, p);
        p.pulls += 1;
        if (rarity === 5) { p.pity5 = 0; p.pity4 = 0; p.got5 = true; }
        else if (rarity === 4) { p.pity5 += 1; p.pity4 = 0; }
        else { p.pity5 += 1; p.pity4 += 1; }
        const res = applyResult(rarity, picked);
        recordHistory(banner.id, res);
        results.push(res);
      }

      if (DS.QuestLog && DS.QuestLog.checkDaily) DS.QuestLog.checkDaily('daily_pull');
      DS.Save.persist();

      results.best = results.reduce((m, r) => Math.max(m, r.rarity), 0);
      results.spent = { signs: signsUsed, humanity: afford.humanityNeeded };
      results.results = results;
      return results;
    },
  };
})();
