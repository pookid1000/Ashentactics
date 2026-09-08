// Card-skin ownership/equip state (CONTRACT-adjacent: Shop's Cards tab sells
// them, Company's per-character Skins tab equips them — see js/data/cardskins.js
// for the actual skin defs). Purely cosmetic: swaps which art/video DS.C.portrait
// renders for a character everywhere it appears (roster, team select, battle,
// character detail), never touches stats.

window.DS = window.DS || {};

(function () {
  function skinDef(skinId) {
    return (DS.CARD_SKINS || []).find((s) => s.id === skinId) || null;
  }

  function skinsFor(charId) {
    return (DS.CARD_SKINS || []).filter((s) => s.charId === charId);
  }

  function owns(skinId) {
    return !!(DS.State && DS.State.cosmetics && DS.State.cosmetics.owned[skinId]);
  }

  function ownedSkinsFor(charId) {
    return skinsFor(charId).filter((s) => owns(s.id));
  }

  // Deducts nothing itself — the shop UI checks/spends Ash, this just records
  // the unlock once payment's already gone through.
  function unlock(skinId) {
    if (!DS.State || !DS.State.cosmetics) return;
    DS.State.cosmetics.owned[skinId] = true;
    DS.Save.persist();
  }

  // skinId null/falsy reverts that character to their default (un-skinned) art.
  function equip(charId, skinId) {
    if (!DS.State || !DS.State.cosmetics) return;
    if (skinId) DS.State.cosmetics.equipped[charId] = skinId;
    else delete DS.State.cosmetics.equipped[charId];
    DS.Save.persist();
  }

  // The skin def currently equipped for charId, or null if they're on default art.
  function equipped(charId) {
    if (!DS.State || !DS.State.cosmetics) return null;
    const skinId = DS.State.cosmetics.equipped[charId];
    return skinId ? skinDef(skinId) : null;
  }

  DS.Cosmetics = { skinDef, skinsFor, owns, ownedSkinsFor, unlock, equip, equipped };
})();
