// ASHEN TACTICS — Shop data (CONTRACT-adjacent, original). Three shelves: a
// premium (Pale Shards) shelf, a free Ash shelf, and the Cards cosmetic shelf
// (see js/data/cardskins.js). Ash is earned automatically whenever a Summoning
// rite yields a duplicate warrior or weapon (see the dupe branches in
// js/core/save.js and js/engine/gacha.js) — nothing here mints Ash directly.
// Pale Shards are the one premium currency real money actually buys (see
// SHOP_SHARD_PACKAGES below) — everything else premium-shelf-side (Blessing,
// Humanity bundles, Material packs) and the Cards shelf are priced in Shards,
// not raw USD, so there's a single real-money entry point instead of a dozen.
//
// This is a private, non-commercial fan project with no payment backend —
// every "priceUsd" tile (Shard packages only, now) is a local-save mock (see
// buyPremium() in hub-ui.js, which just shows a confirm dialog and grants the
// reward instantly). priceShards tiles spend the local Shards balance exactly
// like Ash does (see buyShards() in hub-ui.js), no confirm dialog needed since
// no real money moves.

window.DS = window.DS || {};

(function () {
  // How much Ash a duplicate pull is worth, keyed by the dupe's rarity. Only
  // 4★/5★ dupes ever produce Ash — 1★-3★ dupes give none (see save.js/gacha.js).
  DS.ASH_RATES = {
    charDupe: { 4: 28, 5: 64 },     // character dupe, Remembrance still climbing
    charMaxed: { 4: 40, 5: 100 },   // character dupe past Remembrance 6 (nothing else to gain)
    weaponDupe: { 4: 20, 5: 48 },   // duplicate weapon copy (also kept as refine fodder)
  };

  // Ash-shop heavy-price tags for buying a warrior/weapon dupe outright.
  DS.ASH_CHAR_PRICE = { 4: 500, 5: 1200 };
  DS.ASH_WEAPON_PRICE = { 4: 350, 5: 800 };

  // ── Pale Shards — the only thing still bought with real money. Flat rate of
  // 100 Shards per $1 on the base amount (so every legacy "X.99" price point
  // becomes "X99 Shards" unchanged), with an increasing bonus-% at higher
  // tiers like any gacha premium-currency ladder. Spans $5–$100 as a set.
  DS.SHOP_SHARD_PACKAGES = [
    { id: 'shards_5', shards: 500, priceUsd: 5 },
    { id: 'shards_10', shards: 1000, bonus: 50, priceUsd: 10 },
    { id: 'shards_25', shards: 2500, bonus: 250, priceUsd: 25 },
    { id: 'shards_50', shards: 5000, bonus: 750, priceUsd: 50 },
    { id: 'shards_100', shards: 10000, bonus: 2000, priceUsd: 100 },
  ];

  // ── Premium shelf (priced in Pale Shards) ──
  DS.SHOP_SUBSCRIPTION = {
    id: 'blessing_30day',
    name: "Bearer's Blessing",
    desc: 'Claim Humanity automatically every day for 30 days.',
    days: 30,
    dailyHumanity: 60,
    priceShards: 499,
  };

  DS.SHOP_HUMANITY_BUNDLES = [
    { id: 'bundle_handful', humanity: 150, priceShards: 199 },
    { id: 'bundle_pouch', humanity: 500, bonus: 40, priceShards: 499 },
    { id: 'bundle_satchel', humanity: 1200, bonus: 150, priceShards: 999 },
    { id: 'bundle_coffer', humanity: 2600, bonus: 500, priceShards: 1999 },
    { id: 'bundle_hoard', humanity: 6800, bonus: 1800, priceShards: 4999 },
  ];

  DS.SHOP_MATERIAL_PACKS = [
    { id: 'pack_tempering_small', name: 'Tempering Satchel', priceShards: 299,
      desc: 'A modest bundle of weapon-tempering stones.',
      items: { titanite_shard: 8, titanite_large: 3 } },
    { id: 'pack_tempering_large', name: 'Tempering Coffer', priceShards: 799,
      desc: 'Heavier stones for weapons nearing their cap.',
      items: { titanite_large: 6, titanite_chunk: 3, titanite_slab: 1 } },
    { id: 'pack_ascension', name: "Kiln-Keeper's Bundle", priceShards: 699,
      desc: 'Embers and a demon core to push a warrior past an early tier.',
      items: { ember_asc_1: 4, ember_asc_2: 2, demon_core: 2 } },
    { id: 'pack_ascension_deep', name: 'Lord Soul Bundle', priceShards: 1299,
      desc: "Crown embers and a Lord Soul fragment for a warrior's final tier.",
      items: { ember_asc_3: 2, boss_soul_fragment: 2, soul_hero: 3 } },
  ];

  // ── Free (Ash) shelf — character/weapon dupes are built dynamically in
  // hub-ui.js from DS.CHARACTERS/DS.WEAPONS + DS.ASH_CHAR_PRICE/ASH_WEAPON_PRICE.
  DS.SHOP_ASH_MATERIALS = [
    { id: 'ash_mats_soul', name: "Hero's Souls", ash: 120, items: { soul_hero: 2 } },
    { id: 'ash_mats_titanite', name: 'Titanite Bundle', ash: 90, items: { titanite_large: 4, titanite_chunk: 1 } },
    { id: 'ash_mats_ember', name: 'Ember Bundle', ash: 150, items: { ember_asc_2: 3, demon_core: 1 } },
    { id: 'ash_mats_crown', name: 'Crown Ember Bundle', ash: 320, items: { ember_asc_3: 2, boss_soul_fragment: 1 } },
  ];
})();
