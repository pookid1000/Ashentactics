// ASHEN TACTICS — summoning banners (CONTRACT.md §4.8 + selector amendment).
// Pool entries: {type:'character', id} | {type:'weapon', rarity:N} wildcard |
// {type:'weapon', id} explicit. No item/material/consumable drops — the gacha
// only ever answers with a character or a weapon (1★/2★ rolls fall to the
// dedicated "gacha filler" weapons in weapons.js via the WPN(1)/WPN(2) wildcard).
// `featured5`/`featured4` work on ANY banner kind, not just 'limited' — see
// js/engine/gacha.js pickFromPool(), which gates the 50/50 on the field's presence.

window.DS = window.DS || {};

(function () {
  const CHAR = (id) => ({ type: 'character', id });
  const WPN = (rarity) => ({ type: 'weapon', rarity });
  const WPN_ID = (id) => ({ type: 'weapon', id });

  const STD_4CHARS = [CHAR('priscilla'), CHAR('fourkings'), CHAR('havel'), CHAR('siegmeyer'), CHAR('lautrec'),
    CHAR('gwyndolin'), CHAR('logan'), CHAR('sif'), CHAR('quelana'), CHAR('gwynevere')];
  const STD_3CHARS = [CHAR('ciaran'), CHAR('gough'), CHAR('laurentius'), CHAR('petrus'), CHAR('oscar')];

  DS.BANNERS = [
    {
      id: 'b_beginner', name: 'First Flame Initiation', kind: 'beginner',
      art: { palette: ['#2a2018', '#c9a84c'], icon: '🕯', tagline: 'Every legend starts with one spark. Guaranteed Legendary within 50 summons — 20% off.' },
      costSigns: 1,
      pool5: [CHAR('solaire'), CHAR('smough'), CHAR('quelaag')],
      pool4: STD_4CHARS.concat([WPN(4)]),
      pool3: STD_3CHARS.concat([WPN(3)]),
      pool2: [WPN(2)], pool1: [WPN(1)],
    },
    {
      id: 'b_gwyn', name: 'Lord of Cinder', kind: 'limited',
      art: { palette: ['#3a1a0a', '#ff9d5c'], icon: '🔥', tagline: 'The throne of ash takes a knee for no one. Featured: Gwyn, Lord of Cinder.' },
      costSigns: 1,
      featured5: CHAR('gwyn'), featured4: [CHAR('quelana'), CHAR('lautrec'), CHAR('gwynevere')],
      pool5: [CHAR('gwyn'), CHAR('solaire'), CHAR('ornstein'), CHAR('smough'), CHAR('quelaag'), CHAR('seath'), CHAR('nito'), CHAR('manus'), WPN(5)],
      pool4: STD_4CHARS.concat([WPN(4)]),
      pool3: STD_3CHARS.concat([WPN(3)]),
      pool2: [WPN(2)], pool1: [WPN(1)],
    },
    {
      id: 'b_artorias', name: 'The Abysswalker', kind: 'limited',
      art: { palette: ['#12101a', '#8b5fbf'], icon: '🐺', tagline: 'He walked into the dark so you would not have to. Featured: Artorias the Abysswalker.' },
      costSigns: 1,
      featured5: CHAR('artorias'), featured4: [CHAR('sif'), CHAR('ciaran'), CHAR('gwyndolin')],
      pool5: [CHAR('artorias'), CHAR('solaire'), CHAR('ornstein'), CHAR('smough'), CHAR('quelaag'), CHAR('seath'), CHAR('nito'), CHAR('manus'), WPN(5)],
      pool4: STD_4CHARS.concat([WPN(4)]),
      pool3: STD_3CHARS.concat([WPN(3)]),
      pool2: [WPN(2)], pool1: [WPN(1)],
    },
    {
      id: 'b_standard', name: 'Kindled Souls', kind: 'standard',
      art: { palette: ['#1a160e', '#dcd3bd'], icon: '🪧', iconAsset: 'signs', tagline: 'The signs never stop glowing for those who answer. The permanent roster.' },
      costSigns: 1,
      pool5: [CHAR('solaire'), CHAR('ornstein'), CHAR('smough'), CHAR('gwyn'), CHAR('artorias'), CHAR('quelaag'), CHAR('seath'), CHAR('nito'), CHAR('manus'), WPN(5)],
      pool4: STD_4CHARS.concat([WPN(4)]),
      pool3: STD_3CHARS.concat([WPN(3)]),
      pool2: [WPN(2)], pool1: [WPN(1)],
    },
    {
      id: 'b_armory', name: 'The Ashen Armory', kind: 'weapon',
      art: { palette: ['#2a2620', '#8fa3b0'], icon: '⚔', tagline: 'Every blade remembers whose hand last held it. Featured: Moonlight Greatsword.' },
      costSigns: 1,
      featured5: WPN_ID('moonlight_greatsword'),
      pool5: [WPN_ID('zweihander'), WPN_ID('grant'), WPN_ID('dragonslayer_spear'), WPN_ID('sunlight_talisman'),
        WPN_ID('channelers_trident'), WPN_ID('lifehunt_scythe')],
      pool4: [WPN_ID('black_knight_halberd'), WPN_ID('quelaags_furysword'), WPN_ID('dragon_tooth'), WPN_ID('crest_shield'),
        WPN_ID('black_bow_of_pharis'), WPN_ID('dark_silver_tracer'), WPN_ID('tin_crystallization_catalyst'),
        WPN_ID('ascended_pyromancy_flame'), WPN_ID('ivory_talisman'), WPN_ID('canvas_talisman'),
        WPN_ID('grass_crest_shield'), WPN_ID('crystal_ring_shield'), WPN_ID('velkas_talisman'), WPN_ID('gravelord_sword')],
      pool3: [WPN(3)],
      pool2: [WPN(2)], pool1: [WPN(1)],
    },
  ];
})();
