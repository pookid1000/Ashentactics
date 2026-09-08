// ASHEN TACTICS — cosmetic card skins (Shop's Cards tab / Company's Skins tab).
// Schema: { id, charId, type: 'animated'|'art', name, desc, priceShards,
//           video? (type:'animated'), image? (type:'art'), scale? }
// scale overrides js/ui/components.js's PORTRAIT_SCALE for this skin specifically
// — a skin's own art is a completely different composition from the character's
// base portrait, so it often needs its own zoom factor rather than inheriting
// whatever the base portrait was tuned to.
// Purely cosmetic — no stat effect. Ownership/equip state lives in
// DS.State.cosmetics (see js/core/save.js), read/written via DS.Cosmetics
// (js/engine/cosmetics.js). Priced in Pale Shards only (see js/data/shop.js) —
// not purchasable with Ash.

window.DS = window.DS || {};

(function () {
  DS.CARD_SKINS = [
    {
      id: 'artorias_animated', charId: 'artorias', type: 'animated',
      name: 'Abysswalker\'s Requiem',
      desc: 'A living card: the Abyss curls off his blade in an endless, silent howl.',
      video: 'assets/video/skins/artorias_card_animation.mp4',
      priceShards: 899, // $8.99 at the standard 100-Shards-per-$1 rate
    },
    {
      id: 'seath_animated', charId: 'seath', type: 'animated',
      name: 'The Paledrake\'s Vigil',
      desc: 'A living card: crystal creeps and glitters over the frame, never quite still.',
      video: 'assets/video/skins/seath_card_animation.mp4',
      priceShards: 899, // $8.99, matching the Abysswalker's Requiem price point
      scale: 1.75, // this animation's own composition needs more zoom than the base portrait's 1.35
    },
    {
      id: 'gwyn_animated', charId: 'gwyn', type: 'animated',
      name: 'Lord of Cinder\'s Last Flame',
      desc: 'A living card: embers curl off his greatsword and gutter in the dark, never quite going out.',
      video: 'assets/video/skins/gwyn_card_animation.mp4',
      priceShards: 899, // $8.99, matching the other animated skins' price point
    },
  ];
})();
