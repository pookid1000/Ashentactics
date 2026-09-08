// ASHEN TACTICS — item definitions (CONTRACT.md §4.5). Original flavor text.

window.DS = window.DS || {};

(function () {
  DS.ITEMS = [
    // ── Character EXP ──
    { id: 'soul_small', name: 'Soul of a Lost Undead', rarity: 1, kind: 'exp', icon: '👻', xp: 500,
      lore: 'Offer to a warrior for 500 EXP toward their next level — a faint warmth with nowhere left to go, until you give it one.' },
    { id: 'soul_large', name: 'Large Soul of a Nameless Warrior', rarity: 2, kind: 'exp', icon: '💠', xp: 2000,
      lore: 'Offer to a warrior for 2,000 EXP toward their next level — heavy with old battles, it settles into new muscle like it never left.' },
    { id: 'soul_hero', name: 'Soul of a Great Hero', rarity: 4, kind: 'exp', icon: '🌟', xp: 8000,
      lore: 'Offer to a warrior for 8,000 EXP toward their next level — some names are too big for gravestones. This one still burns.' },

    // ── Weapon materials ──
    { id: 'titanite_shard', name: 'Titanite Shard', rarity: 2, kind: 'material', icon: '🪨', weaponXp: 300,
      lore: 'Feed to a weapon to temper it toward its next level — a sliver of the nameless smith-god\'s bones.' },
    { id: 'titanite_large', name: 'Large Titanite Shard', rarity: 3, kind: 'material', icon: '🗿', weaponXp: 1200,
      lore: 'Feed to a weapon to temper it toward its next level, worth far more than a common shard — dense with intent, and weapons drink it greedily.' },
    { id: 'titanite_chunk', name: 'Titanite Chunk', rarity: 4, kind: 'material', icon: '⛰', weaponXp: 4800,
      lore: 'Feed to a weapon to temper it in great leaps toward its next level — a fist of pure smithing-stone few anvils survive.' },
    { id: 'titanite_slab', name: 'Titanite Slab', rarity: 5, kind: 'material', icon: '🧱',
      lore: 'Spend at a weapon\'s Refine step to raise its rank when no duplicate copy is on hand — a legendary whole-stone that perfects a weapon\'s art.' },

    // ── Ascension materials ──
    { id: 'ember_asc_1', name: 'Faded Ember', rarity: 2, kind: 'material', icon: '🕸',
      lore: 'Spent to ascend a warrior past their earliest level caps, raising the ceiling on how strong they can grow — still warm enough to teach a body new limits.' },
    { id: 'ember_asc_2', name: 'Glowing Ember', rarity: 3, kind: 'material', icon: '🔶',
      lore: 'Spent to ascend a warrior through their middle tiers — it pulses like a small heart. Smiths call this one "honest fire."' },
    { id: 'ember_asc_3', name: 'Crown Ember', rarity: 4, kind: 'material', icon: '👑',
      lore: 'Spent to ascend a warrior into their final tiers — cut from a kiln that once served lords, it remembers what greatness costs.' },
    { id: 'demon_core', name: 'Demon Core', rarity: 3, kind: 'material', icon: '🩸',
      lore: 'Spent alongside Embers to ascend a warrior through their middle tiers — the molten pit of a demon\'s chest, cooled to black glass, never quite stops smoldering.' },
    { id: 'boss_soul_fragment', name: 'Lord Soul Fragment', rarity: 5, kind: 'material', icon: '💎',
      lore: 'Spent alongside Crown Embers to ascend a warrior to their final tiers — a shard of the fire that divided the world.' },

    // ── Relic material ──
    { id: 'relic_dust', name: 'Grave Dust', rarity: 2, kind: 'material', icon: '⚱',
      lore: 'Feed to an equipped relic to attune it toward its level cap — powdered offerings from ten thousand forgotten shrines.' },

    // ── Consumables & currency packs ──
    { id: 'estus_shard', name: 'Estus Shard', rarity: 3, kind: 'consumable', icon: '🧪', use: { estus: 60 },
      lore: 'Consume to instantly refill 60 Estus — a crystallized swallow of golden fire that makes the weariness forget you.' },
    { id: 'humanity_sprite', name: 'Humanity', rarity: 3, kind: 'consumable', icon: '🖤', use: { humanity: 40 },
      lore: 'Consume to instantly gain 40 Humanity, the premium currency spent on summoning rites — a small black wisp with a will of its own.' },
    { id: 'sign_fragment', name: 'Soapstone Sliver', rarity: 2, kind: 'material', icon: '🪧',
      lore: 'A shard of a summon sign that never quite finished inscribing itself — no rite calls for it yet, but it still hums faintly when signs are drawn nearby.' },
    { id: 'green_blossom', name: 'Green Blossom', rarity: 1, kind: 'consumable', icon: '🌿', use: { estus: 10 },
      lore: 'Consume to instantly refill 10 Estus — bitter herb chewed by warriors before a charge.' },
    { id: 'firebomb', name: 'Soul Fragments', rarity: 2, kind: 'consumable', icon: '🌫', use: { souls: 1500 },
      lore: 'Consume to cash them in for 1,500 souls — loose, unclaimed soul-stuff too fractured for any warrior to use, but a merchant never minds.' },
    // Not a plain use:{currency} consumable — using it plays a dedicated
    // lock-breaking animation and unlocks the Covenant Trials feature outright
    // (see the 'covenants' screen in hub-ui.js). kind stays 'key' rather than
    // 'consumable' so it never shows a generic "Use" option anywhere else.
    { id: 'trial_key', name: "Trial Key", rarity: 4, kind: 'key', icon: '🗝',
      lore: 'An old iron key, given to warriors who\'ve finally proven the bonfire\'s first trust. It knows exactly which lock is its own.' },
    { id: 'prism_stone', name: 'Prism Stone', rarity: 1, kind: 'material', icon: '🔮',
      lore: 'A trophy pebble that hums a different color each dawn — no rite calls for it yet, but it is never quite the same color twice.' },
    { id: 'charcoal_resin', name: 'Charcoal Pine Resin', rarity: 2, kind: 'material', icon: '🟠',
      lore: 'Sticky fire in a jar, scraped from the deep domains — no rite calls for it yet, but it never quite goes cold.' },
    { id: 'frozen_tear', name: 'Frozen Tear of the Crossbreed', rarity: 4, kind: 'material', icon: '❄',
      lore: 'A rare trophy earned from the deep domains — no rite calls for it yet, but it never melts, and it never stops grieving.' },
    { id: 'abyss_residue', name: 'Abyssal Residue', rarity: 4, kind: 'material', icon: '🕳',
      lore: 'What remains when the dark is scraped off a soul — a Darkwraith covenant trophy, kept for its own sake. Handle with a clean conscience.' },
    { id: 'sunlight_medal', name: 'Sunlight Medal', rarity: 3, kind: 'material', icon: '☀',
      lore: 'Proof of aid freely given, warm to the touch long after the deed — a Warrior of Sunlight covenant trophy, kept for its own sake.' },
    { id: 'ring_of_sacrifice', name: 'Ring of Sacrifice', rarity: 3, kind: 'material', icon: '💍',
      lore: 'Demanded by Lautrec of Carim to close out his questline — it breaks so you do not. A grim arithmetic, but a kind one.' },
  ];
})();
