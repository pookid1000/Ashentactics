// Shared UI components (see CONTRACT.md §6.2). All screens build on DS.C.

window.DS = window.DS || {};

// Screen-registry shim: UI screen files load before app.js, so the registry
// must exist here (the first UI file). app.js extends this same object.
DS.UI = DS.UI || {};
DS.UI._screens = DS.UI._screens || {};
DS.UI.registerScreen = DS.UI.registerScreen || function (name, def) { DS.UI._screens[name] = def; };

(function () {
  function el(tag, cls, children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (children !== undefined && children !== null) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach((c) => {
        if (c === null || c === undefined || c === false) return;
        e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return e;
  }

  // SVG counterpart to el() — document.createElement() silently produces a
  // non-rendering HTMLUnknownElement for SVG tags, so these need the SVG
  // namespace and setAttribute() (SVG elements don't have .className as a
  // plain string; attrs.class goes through setAttribute like everything else).
  // Used by the Expedition map's node-graph (see js/ui/hub-ui.js).
  function svgEl(tag, attrs, children) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) Object.keys(attrs).forEach((k) => { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); });
    if (children !== undefined && children !== null) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach((c) => {
        if (c === null || c === undefined || c === false) return;
        e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return e;
  }

  function findChar(id) { return (DS.CHARACTERS || []).find((c) => c.id === id); }
  function findItem(id) { return (DS.ITEMS || []).find((i) => i.id === id); }
  function findWeaponDef(id) { return (DS.WEAPONS || []).find((w) => w.id === id); }

  function pathIcon(pathName) {
    const url = DS.Assets ? DS.Assets.path(pathName) : null;
    if (!url) return document.createTextNode((DS.PATHS[pathName] || {}).icon || '');
    const img = document.createElement('img');
    img.className = 'path-icon-art';
    img.src = url;
    img.alt = pathName;
    return img;
  }

  function elementIcon(name) {
    const url = DS.Assets ? DS.Assets.element(name) : null;
    if (!url) return document.createTextNode((DS.ELEMENT_META[name] || {}).icon || '');
    const img = document.createElement('img');
    img.className = 'elem-icon-art';
    img.src = url;
    img.alt = name;
    return img;
  }

  function itemIcon(id) {
    const def = findItem(id);
    const url = DS.Assets ? DS.Assets.item(id) : null;
    if (!url) return document.createTextNode((def || {}).icon || '');
    const img = document.createElement('img');
    img.className = 'inline-icon-art';
    img.src = url;
    img.alt = '';
    img.onerror = () => { img.replaceWith(document.createTextNode((def || {}).icon || '')); };
    return img;
  }

  function currencyIcon(name) {
    const url = DS.Assets ? DS.Assets.currency(name) : null;
    if (!url) return document.createTextNode('');
    const img = document.createElement('img');
    img.className = 'inline-icon-art';
    img.src = url;
    img.alt = name;
    return img;
  }

  // Some source portraits were composed as wide/distant shots (lots of empty
  // background around the character) while most are medium/close shots, which made
  // the roster grid look inconsistently sized. This scales the outliers up so the
  // character reads at roughly the same size across cards, without touching art.
  const PORTRAIT_SCALE = {
    sif: 1.4, seath: 1.35, gwynevere: 1.3, gwyndolin: 1.3, quelaag: 1.25, manus: 1.2,
    priscilla: 1.15, ornstein: 1.15, quelana: 1.1, chosen_undead: 1.1,
  };

  // artOrUnit: {palette,icon,aura} or an object with .art (character def / battle unit)
  function portrait(artOrUnit, opts) {
    opts = opts || {};
    const art = (artOrUnit && artOrUnit.art) ? artOrUnit.art : (artOrUnit || {});
    const size = opts.size || 64;
    const box = el('div', 'ds-portrait' + (opts.rarity ? ' r' + opts.rarity : ''));
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    box.style.setProperty('--psize', size + 'px');
    const pal = art.palette || ['#14100c', '#2a2018', '#c9a84c'];
    box.style.setProperty('--p-dark', pal[0]);
    box.style.setProperty('--p-mid', pal[1]);
    box.style.setProperty('--p-accent', pal[2]);

    const artId = artOrUnit && (artOrUnit.id || artOrUnit.defId);
    // An equipped card skin (see js/engine/cosmetics.js) overrides the default
    // portrait everywhere this component is used — roster, team select, battle,
    // character detail — since they all render through this one function.
    // opts.ignoreSkin forces the real default art regardless of what's equipped,
    // used only by the Skins tab's own "Default" preview option so a player can
    // still see/pick the base art without it being masked by whatever's active.
    const skin = artId && DS.Cosmetics && !opts.ignoreSkin ? DS.Cosmetics.equipped(artId) : null;
    const artUrl = artId && DS.Assets ? DS.Assets.portrait(artId) : null;
    if (skin && skin.type === 'animated' && skin.video) {
      box.classList.add('has-art');
      // A skin's own composition can be framed completely differently from the
      // default portrait it replaces (different source art entirely), so it
      // gets its own scale (skin.scale in js/data/cardskins.js) instead of
      // just inheriting the base character's PORTRAIT_SCALE entry.
      const skinScale = skin.scale || PORTRAIT_SCALE[artId];
      if (skinScale) box.style.setProperty('--portrait-scale', skinScale);
      const vid = document.createElement('video');
      vid.className = 'portrait-art';
      vid.src = skin.video;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      box.appendChild(vid);
    } else if (skin && skin.type === 'art' && skin.image) {
      box.classList.add('has-art');
      const skinScale = skin.scale || PORTRAIT_SCALE[artId];
      if (skinScale) box.style.setProperty('--portrait-scale', skinScale);
      const img = document.createElement('img');
      img.className = 'portrait-art';
      img.src = skin.image;
      img.alt = '';
      box.appendChild(img);
    } else if (artUrl) {
      box.classList.add('has-art');
      if (PORTRAIT_SCALE[artId]) box.style.setProperty('--portrait-scale', PORTRAIT_SCALE[artId]);
      const img = document.createElement('img');
      img.className = 'portrait-art';
      img.src = artUrl;
      img.alt = '';
      box.appendChild(img);
    } else {
      if (art.aura) box.appendChild(el('div', 'aura ' + art.aura));
      box.appendChild(el('div', 'glyph', art.icon || '👤'));
    }

    if (opts.element && DS.ELEMENT_META[opts.element]) {
      const elemUrl = DS.Assets ? DS.Assets.element(opts.element) : null;
      const eb = el('div', 'elem-badge' + (elemUrl ? ' has-art' : ''));
      if (elemUrl) {
        const eimg = document.createElement('img');
        eimg.className = 'elem-badge-art';
        eimg.src = elemUrl;
        eimg.alt = '';
        eb.appendChild(eimg);
      } else {
        eb.textContent = DS.ELEMENT_META[opts.element].icon;
        eb.style.color = DS.ELEMENT_META[opts.element].color;
      }
      box.appendChild(eb);
    }
    return box;
  }

  function statBar(opts) {
    const wrap = el('div');
    const bar = el('div', 'ds-bar');
    const fill = el('div', 'fill ' + (opts.cls || 'hp'));
    const pct = Math.max(0, Math.min(100, (opts.cur / Math.max(1, opts.max)) * 100));
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    wrap.appendChild(bar);
    if (opts.label !== false) {
      wrap.appendChild(el('div', 'ds-bar-label', [
        el('span', null, opts.label || `${Math.max(0, Math.round(opts.cur))}/${Math.round(opts.max)}`),
        el('span', null, opts.rightLabel || ''),
      ]));
    }
    return wrap;
  }

  function starRating(n) {
    return el('div', 'stars', '★'.repeat(Math.max(0, n)) + '☆'.repeat(Math.max(0, 3 - n)));
  }

  function rarityStars(n) { return el('div', 'stars', '★'.repeat(n)); }

  // Non-emoji placeholder for the rare cases where an asset hasn't been generated yet
  // (a handful of weapons, mainly) — a plain initial reads as "no art yet" without
  // resorting to a fallback pictograph.
  function monogram(name) {
    const ch = (name || '?').trim().charAt(0).toUpperCase() || '?';
    return el('div', 'monogram-fallback', ch);
  }

  // Appends art if a URL was resolved, else the monogram placeholder — and if the URL
  // resolved but the file 404s (a registry entry pointing at art that was never actually
  // generated), swaps to the monogram once the browser reports the load failure, so a
  // missing asset never renders as a blank void.
  function artOrFallback(container, url, cls, fallbackName) {
    if (!url) { container.appendChild(monogram(fallbackName)); return; }
    const img = document.createElement('img');
    if (cls) img.className = cls;
    img.alt = '';
    // Images are natively draggable by default in browsers, which would otherwise
    // hijack HTML5 drag-and-drop (e.g. dragging a relic card) into dragging just
    // this inner <img> instead of the whole card it sits in.
    img.draggable = false;
    img.onerror = () => { img.replaceWith(monogram(fallbackName)); };
    img.src = url;
    container.appendChild(img);
  }

  // Live "current stats" readout for a weapon instance — the passive.desc text is fixed
  // flavor writing, so this renders the actual level/refine-scaled numbers alongside it
  // and is rebuilt every time the weapon changes (see weaponUpgradeControls' onChange).
  function weaponStatsSummary(uid) {
    const w = DS.State.inventory.weapons[uid];
    const wdef = w ? findWeaponDef(w.defId) : null;
    const box = el('div', 'weapon-stats-now small');
    if (!w || !wdef) return box;
    const stats = DS.Progression.weaponStatsNow(uid);
    const statParts = [];
    if (stats.atk) statParts.push('ATK +' + stats.atk);
    if (stats.hp) statParts.push('HP +' + stats.hp);
    if (stats.def) statParts.push('DEF +' + stats.def);
    if (statParts.length) box.appendChild(el('div', null, [el('b', 'text-gold', 'Weapon stats (Lv.' + w.level + '): '), statParts.join(' · ')]));
    const passiveNow = DS.Progression.weaponPassiveNow(uid);
    if (passiveNow.length) {
      box.appendChild(el('div', null, [
        el('b', 'text-gold', 'Passive now (Refine ' + (w.refine || 1) + '): '),
        passiveNow.join(' · '),
      ]));
    }
    return box;
  }

  // Shared Temper (feed Titanite) + Refine (duplicate/Slab) controls for a weapon
  // instance — used both by a warrior's Weapon tab and the Bottomless Box's weapon
  // detail view so upgrading a weapon works the same wherever you reach it from.
  function weaponUpgradeControls(uid, opts) {
    opts = opts || {};
    const w = DS.State.inventory.weapons[uid];
    const wdef = w ? findWeaponDef(w.defId) : null;
    const box = el('div', 'col');
    if (!w || !wdef) return box;

    box.appendChild(el('div', 'section-title', 'Temper (feed Titanite)'));
    const feedRow = el('div', 'row');
    ['titanite_shard', 'titanite_large', 'titanite_chunk'].forEach((id) => {
      const count = DS.State.inventory.items[id] || 0;
      feedRow.appendChild(itemCard(id, {
        count,
        onClick: () => {
          const res = DS.Inventory.weaponGainExp(uid, { [id]: 1 });
          if (res.ok) { if (res.levels) DS.SFX.play('chime'); if (opts.onChange) opts.onChange(); }
          else toast(res.reason, { icon: '⚠' });
        },
      }));
    });
    box.appendChild(feedRow);
    const need = DS.CURVES.weaponXp(w.level);
    box.appendChild(statBar({ cls: 'xp', cur: w.exp, max: need, label: w.exp + ' / ' + need + ' · cap Lv.' + wdef.maxLevel }));

    const haveAnyTitanite = ['titanite_shard', 'titanite_large', 'titanite_chunk'].some((id) => (DS.State.inventory.items[id] || 0) > 0);
    const temperBtn = el('button', 'ghost', 'Temper to Max');
    temperBtn.disabled = w.level >= wdef.maxLevel || !haveAnyTitanite;
    temperBtn.onclick = () => {
      const res = DS.Inventory.feedTitaniteToMax(uid);
      if (!res.ok) { toast(res.reason, { icon: '⚠' }); return; }
      if (res.levels > 0) DS.SFX.play('chime');
      const msg = res.atCap
        ? wdef.name + ' reaches Lv.' + res.level + ' (cap).'
        : wdef.name + ' reaches Lv.' + res.level + ' — out of titanite to offer.';
      toast(msg, { icon: '⚒' });
      if (opts.onChange) opts.onChange();
    };
    box.appendChild(temperBtn);

    box.appendChild(el('div', 'section-title', 'Refine (duplicate or Titanite Slab)'));
    const dupes = Object.values(DS.State.inventory.weapons).filter((x) => x.defId === w.defId && x.uid !== uid && !x.equippedBy && !x.locked);
    const refRow = el('div', 'row');
    const refBtn = el('button', 'small', 'Refine with duplicate (' + dupes.length + ')');
    refBtn.disabled = !dupes.length || w.refine >= 5;
    refBtn.onclick = () => {
      const res = DS.Inventory.refineWeapon(uid, dupes[0].uid);
      if (res.ok) { DS.SFX.play('legendary'); if (opts.onChange) opts.onChange(); } else toast(res.reason, { icon: '⚠' });
    };
    const slabBtn = el('button', 'small', 'Refine with Slab (' + (DS.State.inventory.items.titanite_slab || 0) + ')');
    slabBtn.disabled = !(DS.State.inventory.items.titanite_slab > 0) || w.refine >= 5;
    slabBtn.onclick = () => {
      const res = DS.Inventory.refineWeapon(uid, null);
      if (res.ok) { DS.SFX.play('legendary'); if (opts.onChange) opts.onChange(); } else toast(res.reason, { icon: '⚠' });
    };
    refRow.appendChild(refBtn);
    refRow.appendChild(slabBtn);
    box.appendChild(refRow);
    return box;
  }

  // Shared click-through layout for item/weapon/relic detail modals: art pinned to the
  // left, an arbitrary content column (description, then mechanical explanation, then
  // any controls) on the right.
  function detailLayout(iconUrl, contentChildren, opts) {
    opts = opts || {};
    const wrap = el('div', 'detail-layout');
    const iconBox = el('div', 'detail-icon');
    artOrFallback(iconBox, iconUrl, null, opts.fallbackName);
    wrap.appendChild(iconBox);
    wrap.appendChild(el('div', 'detail-content', contentChildren));
    return wrap;
  }

  // Shared "Attune +1 / Attune to Max" controls for a relic instance — used both by the
  // character equip screen and the Bottomless Box relic detail view so the two never
  // drift out of sync with each other.
  function relicEnhanceControls(uid, opts) {
    opts = opts || {};
    const rel = DS.State ? DS.State.inventory.relics[uid] : null;
    const col = el('div', 'col');
    if (!rel) return col;
    const dustHave = DS.State.inventory.items.relic_dust || 0;
    const dustNeed = DS.Inventory.MAX_RELIC_LEVEL - rel.level;
    const enh = el('button', 'small', 'Attune +1 (Grave Dust ×1, have ' + dustHave + ')');
    enh.disabled = dustNeed <= 0 || dustHave <= 0;
    enh.onclick = () => {
      const res = DS.Inventory.enhanceRelic(uid, 1);
      if (res.ok) { DS.SFX.play('chime'); if (res.gains.length) toast(res.gains.join(' · '), { icon: '✦', img: DS.Assets && DS.Assets.item('relic_dust') }); }
      else toast(res.reason, { icon: '⚠' });
      if (opts.onChange) opts.onChange();
    };
    const maxEnh = el('button', 'ghost small', 'Attune to Max');
    maxEnh.disabled = dustNeed <= 0 || dustHave <= 0;
    maxEnh.onclick = () => {
      const use = Math.min(dustHave, dustNeed);
      const res = DS.Inventory.enhanceRelic(uid, use);
      if (!res.ok) { toast(res.reason, { icon: '⚠' }); if (opts.onChange) opts.onChange(); return; }
      DS.SFX.play('chime');
      const atCap = res.level >= DS.Inventory.MAX_RELIC_LEVEL;
      toast('Reaches Lv.' + res.level + (atCap ? ' (cap).' : ' — out of Grave Dust.'), { icon: '✦', img: DS.Assets && DS.Assets.item('relic_dust') });
      if (opts.onChange) opts.onChange();
    };
    col.appendChild(enh);
    col.appendChild(maxEnh);
    return col;
  }

  function itemCard(itemIdOrDef, opts) {
    opts = opts || {};
    const def = typeof itemIdOrDef === 'string' ? findItem(itemIdOrDef) : itemIdOrDef;
    if (!def) return el('div', 'ds-card static', '?');
    const card = el('div', 'ds-card r' + (def.rarity || 1) + (opts.selected ? ' selected' : '') + (opts.onClick ? '' : ' static'));
    card.style.width = opts.width || '86px';
    card.style.textAlign = 'center';
    const itemUrl = DS.Assets ? DS.Assets.item(def.id) : null;
    artOrFallback(card, itemUrl, 'item-icon-art', def.name);
    const nm = el('div', 'small', def.name);
    nm.style.color = (DS.RARITY_META[def.rarity] || {}).color || 'var(--bone)';
    nm.style.lineHeight = '1.15';
    nm.style.minHeight = '2.2em';
    card.appendChild(nm);
    if (opts.count !== undefined) card.appendChild(el('div', 'small text-dim', '×' + opts.count));
    if (opts.onClick) card.onclick = opts.onClick;
    if (opts.footer) card.appendChild(opts.footer);
    return card;
  }

  function charCard(charId, opts) {
    opts = opts || {};
    const def = findChar(charId);
    if (!def) return el('div', 'ds-card static', charId);
    const entry = DS.State && DS.State.roster ? DS.State.roster[charId] : null;

    if (opts.full) return charCardFull(def, entry, opts);

    const card = el('div', 'ds-card r' + def.rarity + (opts.selected ? ' selected' : ''));
    card.style.width = opts.width || '128px';
    // Fixed height (rather than sizing to content) so a grid/row of these — e.g. the
    // team-select modal — reads as one even rank of cards instead of a jagged one;
    // .row's align-items:center doesn't stretch children to match each other, so
    // without this a longer name wrapping to 2 lines makes just that one card taller.
    card.style.height = opts.height || '176px';
    const top = el('div', 'row');
    top.style.justifyContent = 'center';
    top.appendChild(portrait(def, { size: opts.portraitSize || 84, rarity: def.rarity, element: def.element }));
    card.appendChild(top);
    const nm = el('div', 'display', def.name.split(',')[0]);
    nm.style.textAlign = 'center';
    nm.style.fontSize = '0.82em';
    nm.style.color = (DS.RARITY_META[def.rarity] || {}).color;
    nm.style.marginTop = '4px';
    // Clamped to one line — a wrapped second line is exactly what breaks the
    // fixed-height card above, so a long name truncates with an ellipsis instead.
    nm.style.whiteSpace = 'nowrap';
    nm.style.overflow = 'hidden';
    nm.style.textOverflow = 'ellipsis';
    card.appendChild(nm);
    const sub = el('div', 'row small');
    sub.style.justifyContent = 'center';
    sub.style.gap = '0.35em';
    sub.appendChild(rarityStars(def.rarity));
    card.appendChild(sub);
    const meta = el('div', 'row small text-dim');
    meta.style.justifyContent = 'center';
    meta.style.gap = '0.5em';
    meta.appendChild(el('span', null, [pathIcon(def.path), ' ' + def.path]));
    if (entry) meta.appendChild(el('span', null, 'Lv.' + entry.level));
    card.appendChild(meta);
    if (opts.showPower && entry && DS.Progression) {
      card.appendChild(el('div', 'small text-gold', 'Power ' + DS.Progression.charPower(charId))).style.textAlign = 'center';
    }
    if (opts.footer) card.appendChild(opts.footer);
    if (opts.onClick) card.onclick = opts.onClick;
    else card.classList.add('static');
    return card;
  }

  // Full-bleed variant mirroring the battle-screen unit card: art fills the whole
  // card, a border-image frame overlays it, and name/stats are pinned top/bottom.
  function charCardFull(def, entry, opts) {
    const card = el('div', 'ds-card full r' + def.rarity + (opts.selected ? ' selected' : ''));
    card.style.width = opts.width || '180px';
    card.appendChild(portrait(def, { size: opts.portraitSize || 180, rarity: def.rarity, element: def.element }));
    card.appendChild(el('div', 'card-frame'));

    card.appendChild(el('div', 'card-top-scrim'));
    card.appendChild(el('div', 'bname', def.name.split(',')[0]));

    card.appendChild(el('div', 'card-bottom-scrim'));
    const bottom = el('div', 'card-bottom');
    bottom.appendChild(rarityStars(def.rarity));
    const meta = el('div', 'row small path-row');
    meta.style.gap = '0.5em';
    meta.appendChild(el('span', null, [pathIcon(def.path), ' ' + def.path]));
    bottom.appendChild(meta);
    if (opts.showPower && entry && DS.Progression) {
      bottom.appendChild(el('div', 'card-power-text', 'Pwr ' + DS.Progression.charPower(def.id)));
    }
    card.appendChild(bottom);

    if (entry) card.appendChild(el('div', 'card-level-badge', 'Lv.' + entry.level));

    if (opts.onClick) card.onclick = opts.onClick;
    else card.classList.add('static');
    return card;
  }

  function weaponCard(uidOrDefId, opts) {
    opts = opts || {};
    let inst = null;
    let def = null;
    if (DS.State && DS.State.inventory.weapons[uidOrDefId]) {
      inst = DS.State.inventory.weapons[uidOrDefId];
      def = findWeaponDef(inst.defId);
    } else def = findWeaponDef(uidOrDefId);
    if (!def) return el('div', 'ds-card static', '?');
    const card = el('div', 'ds-card r' + def.rarity + (opts.selected ? ' selected' : '') + (opts.onClick ? '' : ' static'));
    card.style.width = opts.width || '130px';
    const weaponUrl = DS.Assets ? DS.Assets.weapon(def.id) : null;
    artOrFallback(card, weaponUrl, 'weapon-icon-art', def.name);
    const nm = el('div', 'small', def.name);
    nm.style.textAlign = 'center';
    nm.style.color = (DS.RARITY_META[def.rarity] || {}).color;
    nm.style.minHeight = '2.2em';
    nm.style.lineHeight = '1.15';
    card.appendChild(nm);
    const foot = el('div', 'row small text-dim');
    foot.style.justifyContent = 'center';
    foot.style.gap = '0.5em';
    foot.appendChild(el('span', null, pathIcon(def.path)));
    if (inst) {
      foot.appendChild(el('span', null, 'Lv.' + inst.level));
      if (inst.refine > 1) foot.appendChild(el('span', 'text-gold', 'R' + inst.refine));
      if (inst.equippedBy) foot.appendChild(el('span', 'text-faint', 'Equipped'));
    }
    card.appendChild(foot);
    if (opts.onClick) card.onclick = opts.onClick;
    return card;
  }

  function relicCard(uid, opts) {
    opts = opts || {};
    const inst = DS.State ? DS.State.inventory.relics[uid] : null;
    if (!inst) return el('div', 'ds-card static', '?');
    const set = (DS.RELIC_SETS || []).find((s) => s.id === inst.setId);
    const pieceName = set && set.pieces && set.pieces[inst.slot] ? set.pieces[inst.slot].name : inst.slot;
    const relicUrl = set && DS.Assets
      ? (DS.Assets.relicPiece(set.id, inst.slot) || DS.Assets.relic(set.id))
      : null;

    // Icon-first browsing card (Bottomless Box): no stat readout, just big art, the
    // piece name, and a level badge — clicking opens the full stat/upgrade detail view.
    if (opts.iconOnly) {
      const card = el('div', 'ds-card relic-card-big r' + inst.rarity + (opts.selected ? ' selected' : '') + (opts.onClick ? '' : ' static'));
      card.style.width = opts.width || '160px';
      const iconBox = el('div', 'relic-big-icon');
      artOrFallback(iconBox, relicUrl, null, pieceName);
      card.appendChild(iconBox);
      const mainLabel = DS.STAT_LABEL[inst.mainStat.key] || inst.mainStat.key;
      card.appendChild(el('div', 'relic-mainstat-badge', [
        el('span', null, mainLabel),
        el('span', null, fmtStat(inst.mainStat.key, inst.mainStat.value)),
      ]));
      const nm = el('div', 'small relic-piece-name', pieceName);
      nm.style.color = (DS.RARITY_META[inst.rarity] || {}).color;
      card.appendChild(nm);
      card.appendChild(el('div', 'relic-level-badge', '+' + inst.level));
      if (opts.selectable) {
        const dot = el('div', 'relic-select-dot' + (opts.selected ? ' checked' : '') + (inst.equippedBy ? ' disabled' : ''));
        dot.onclick = (e) => {
          e.stopPropagation();
          if (opts.onToggleSelect) opts.onToggleSelect();
        };
        card.appendChild(dot);
      }
      if (opts.onClick) card.onclick = opts.onClick;
      return card;
    }

    const card = el('div', 'ds-card r' + inst.rarity + (opts.selected ? ' selected' : '') + (opts.onClick ? '' : ' static'));
    card.style.width = opts.width || '150px';
    const head = el('div', 'row');
    head.style.gap = '0.4em';
    artOrFallback(head, relicUrl, 'relic-icon-art', pieceName);
    const nmBox = el('div', 'grow');
    const nm = el('div', 'small', pieceName);
    nm.style.color = (DS.RARITY_META[inst.rarity] || {}).color;
    nm.style.lineHeight = '1.1';
    nmBox.appendChild(nm);
    nmBox.appendChild(el('div', 'small text-faint', DS.SLOTS.includes(inst.slot) ? inst.slot : ''));
    head.appendChild(nmBox);
    head.appendChild(el('span', 'small text-gold', '+' + inst.level));
    card.appendChild(head);
    const main = el('div', 'small');
    main.style.marginTop = '3px';
    const mainLabel = DS.STAT_LABEL[inst.mainStat.key] || inst.mainStat.key;
    main.appendChild(el('span', 'text-gold', mainLabel + ' '));
    main.appendChild(el('span', null, fmtStat(inst.mainStat.key, inst.mainStat.value)));
    card.appendChild(main);
    if (!opts.compact) {
      (inst.subStats || []).forEach((s) => {
        card.appendChild(el('div', 'small text-dim', (DS.STAT_LABEL[s.key] || s.key) + ' +' + fmtStat(s.key, s.value)));
      });
    }
    if (inst.equippedBy) {
      const eqDef = findChar(inst.equippedBy);
      card.appendChild(el('div', 'small text-faint', 'Equipped: ' + (eqDef ? eqDef.name.split(',')[0] : inst.equippedBy)));
    }
    if (opts.onClick) card.onclick = opts.onClick;
    return card;
  }

  function fmtStat(key, value) {
    const pctKeys = ['hpPct', 'atkPct', 'defPct', 'critRate', 'critDmg', 'breakEffect', 'effectHitRate', 'effectRes', 'healBoost', 'energyRegen'];
    if (pctKeys.includes(key)) return (value * 100).toFixed(1) + '%';
    return String(Math.round(value));
  }

  function modal(opts) {
    const backdrop = el('div', 'modal-backdrop');
    const box = el('div', 'modal-box');
    if (opts.wide) box.style.maxWidth = '900px';
    const closeFn = () => { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); if (opts.onClose) opts.onClose(); };
    const title = el('div', 'modal-title', [el('span', null, opts.title || '')]);
    if (!opts.hideClose) {
      const x = el('span', 'modal-close', '✕');
      x.onclick = closeFn;
      title.appendChild(x);
    }
    box.appendChild(title);
    const body = el('div', 'modal-body');
    if (opts.body) body.appendChild(opts.body);
    box.appendChild(body);
    if (opts.actions && opts.actions.length) {
      const act = el('div', 'modal-actions');
      opts.actions.forEach((a) => {
        const b = el('button', a.cls || '', a.label);
        b.onclick = () => { const keep = a.onClick && a.onClick(); if (!keep) closeFn(); };
        act.appendChild(b);
      });
      box.appendChild(act);
    }
    backdrop.appendChild(box);
    backdrop.onclick = (e) => { if (e.target === backdrop && !opts.blocking) closeFn(); };
    document.body.appendChild(backdrop);
    DS.SFX.play('ui');
    return { close: closeFn, body };
  }

  function toast(text, opts) {
    opts = opts || {};
    let zone = document.getElementById('toast-zone');
    if (!zone) { zone = el('div'); zone.id = 'toast-zone'; document.body.appendChild(zone); }
    const iconNode = opts.img ? rewardIcon({ img: opts.img, icon: opts.icon }) : (opts.icon ? el('span', null, opts.icon) : null);
    const t = el('div', 'toast', [iconNode, el('span', null, text)]);
    zone.appendChild(t);
    setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 350); }, opts.ms || 2400);
  }

  function confirm(text, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      modal({
        title: opts.title || 'Are you certain?',
        body: el('p', null, text),
        blocking: true,
        actions: [
          { label: opts.cancelLabel || 'Cancel', cls: 'ghost', onClick: () => { resolve(false); } },
          { label: opts.okLabel || 'Confirm', cls: opts.danger ? 'danger' : 'primary', onClick: () => { resolve(true); } },
        ],
        onClose: () => resolve(false),
      });
    });
  }

  // list: [{id, label, badge?}] — returns {root, setActive}
  function tabs(list, onPick, activeId) {
    const root = el('div', 'ds-tabs');
    const btns = {};
    function setActive(id) {
      Object.values(btns).forEach((b) => b.classList.remove('active'));
      if (btns[id]) btns[id].classList.add('active');
    }
    list.forEach((t) => {
      const b = el('div', 'tab' + (t.id === activeId ? ' active' : ''), [
        el('span', null, t.label),
        t.badge ? el('span', 'notif-dot', String(t.badge)) : null,
      ]);
      b.style.position = 'relative';
      b.onclick = () => { setActive(t.id); DS.SFX.play('ui'); onPick(t.id); };
      btns[t.id] = b;
      root.appendChild(b);
    });
    return { root, setActive };
  }

  function rewardsPopup(summary, opts) {
    opts = opts || {};
    const body = el('div');
    if (opts.heading) {
      const h = el('div', 'display text-gold', opts.heading);
      h.style.textAlign = 'center';
      h.style.marginBottom = '0.5em';
      body.appendChild(h);
    }
    const grid = el('div', 'rewards-grid');
    (summary || []).forEach((s, i) => {
      const chip = el('div', 'reward-chip', [rewardIcon(s), el('span', null, s.text)]);
      chip.style.animationDelay = (i * 0.07) + 's';
      grid.appendChild(chip);
    });
    if (!summary || !summary.length) grid.appendChild(el('div', 'text-dim', 'Nothing gained.'));
    body.appendChild(grid);
    DS.SFX.play('chime');
    return modal({ title: opts.title || 'Rewards Claimed', body, actions: [{ label: 'Take', cls: 'primary' }] });
  }

  function emptyState(text) { return el('div', 'empty-state', text); }

  function icon(name) {
    const MAP = { souls: '👻', humanity: '🖤', signs: '🪧', estus: '🧪', level: '🔥' };
    return MAP[name] || name;
  }

  // Reward summary entries carry both an emoji fallback (icon) and, when real
  // art exists for that item/currency/character, an asset path (img).
  function rewardIcon(s) {
    if (s.img) {
      const im = document.createElement('img');
      im.className = 'reward-chip-icon';
      im.src = s.img;
      im.alt = '';
      im.onerror = () => { im.replaceWith(el('span', null, s.icon || '📦')); };
      return im;
    }
    return el('span', null, s.icon || '📦');
  }

  // A full-bleed, looping, muted background video for screens that would otherwise be flat
  // black. Muted is required for autoplay to be allowed at all.
  //
  // IMPORTANT: this element is a persistent singleton attached directly to <body>, OUTSIDE
  // #app — never a child of a screen's DOM. Every screen navigation does a full teardown
  // (#app.innerHTML = ''), and a fresh <video> created inside that tree gets destroyed and
  // re-created (restarting playback from a blank frame) on every single re-render, which is
  // exactly what "flashes then disappears" looks like. Living outside #app means it survives
  // every navigate()/rerender() untouched — show/hideVideoBg() below just toggle it.
  let bgVideoEl = null;
  let bgVideoMaskEl = null;
  let bgVideoBottomMaskEl = null;

  function ensureVideoBgEl(src) {
    if (bgVideoEl) return bgVideoEl;
    const v = document.createElement('video');
    v.className = 'screen-bg-video';
    v.src = src;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.style.display = 'none';
    // Lives inside #stage, not <body> — #stage is the fixed-resolution game frame
    // (see js/core/layout.js), so the video scales and letterboxes together with it
    // instead of bleeding into the black bars around it.
    (document.getElementById('stage') || document.body).appendChild(v);
    // Chrome (and some other browsers) auto-pause "video-only background media" — a muted
    // video with no audio track, sitting decorative/non-interactive behind the page — as a
    // battery-saving measure. That's a real, documented behavior, not a bug in this code, and
    // it's exactly what made the background look like it "flashes then disappears" or never
    // shows at all: the browser was pausing it out from under us. Fight it with a watchdog —
    // any time it gets paused while it's supposed to be visible, resume it immediately.
    v.addEventListener('pause', () => {
      if (v.style.display !== 'none') v.play().catch(() => {});
    });
    bgVideoEl = v;
    // The source video has a small sparkle watermark baked into its bottom-right
    // corner, plus a sliver of caption text baked into the very last pixel rows
    // across the bottom edge (from whatever tool exported it) — can't be edited out
    // of the pixels, so camouflage both with soft dark patches feathered over them.
    const mask = document.createElement('div');
    mask.className = 'screen-bg-video-mask';
    mask.style.display = 'none';
    v.insertAdjacentElement('afterend', mask);
    bgVideoMaskEl = mask;
    const bottomMask = document.createElement('div');
    bottomMask.className = 'screen-bg-video-mask-bottom';
    bottomMask.style.display = 'none';
    mask.insertAdjacentElement('afterend', bottomMask);
    bgVideoBottomMaskEl = bottomMask;
    return v;
  }

  // Call once per screen render with show=true/false — never recreates the element, just
  // toggles it and (re)starts playback if it had stalled/paused for any reason.
  function videoBg(src, show) {
    if (DS.State && DS.State.settings && DS.State.settings.reduceMotion) {
      if (bgVideoEl) bgVideoEl.style.display = 'none';
      if (bgVideoMaskEl) bgVideoMaskEl.style.display = 'none';
      if (bgVideoBottomMaskEl) bgVideoBottomMaskEl.style.display = 'none';
      return null;
    }
    const v = ensureVideoBgEl(src);
    v.style.display = show ? '' : 'none';
    if (bgVideoMaskEl) bgVideoMaskEl.style.display = show ? '' : 'none';
    if (bgVideoBottomMaskEl) bgVideoBottomMaskEl.style.display = show ? '' : 'none';
    if (show) v.play().catch(() => { /* blocked until a user gesture — harmless, retries on interaction */ });
    return v;
  }

  // A static backdrop image pinned in place behind a screen's own scrolling content
  // (same fixed-in-place idea as videoBg above) — just a plain <img> the caller
  // inserts as the first child of its own '.screen' wrapper. See css/theme.css's
  // .screen-bg-parchment rule: position:fixed against #stage's own frame, so it
  // never scrolls away or runs out partway down a tall list — only the screen's own
  // .screen-inner content scrolls inside #app.
  // fit: 'cover' (default) crops to fill the frame — used by the Expedition map, which
  // is meant to feel zoomed-in. 'contain' shows the whole illustration uncropped,
  // letterboxed within the frame instead — used by screens whose art should read as a
  // single intact scene rather than a cropped detail.
  function screenBgImage(src, fit) {
    const frag = document.createDocumentFragment();
    const img = document.createElement('img');
    img.className = 'screen-bg-parchment' + (fit === 'contain' ? ' contain' : '');
    img.alt = '';
    img.src = src;
    frag.appendChild(img);
    // Every one of these generated backgrounds has the same small sparkle watermark
    // baked into the same relative bottom-right corner. Since the source art is
    // always 16:9 and covers a 16:9 stage, object-fit:cover never crops it — so a
    // single fixed-percentage patch reliably sits over the mark on every one of them,
    // at every resolution, without needing to touch the source pixels.
    const mask = document.createElement('div');
    mask.className = 'screen-bg-parchment-mask';
    frag.appendChild(mask);
    return frag;
  }

  // Gold ember burst for a successful relic-drag-to-slot equip (see character-ui.js's
  // relic-slot ondrop). Appended straight to <body> with position:fixed — like
  // app.js's click-ripple — rather than inside the slot cell, since DS.UI.rerender()
  // tears down and rebuilds the whole relic screen right after the drop lands.
  function relicEquipBurst(x, y) {
    const reduce = DS.State && DS.State.settings && DS.State.settings.reduceMotion;
    const wrap = el('div', 'relic-equip-burst');
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    wrap.appendChild(el('div', 'relic-equip-ring'));
    const n = reduce ? 5 : 16;
    for (let i = 0; i < n; i++) {
      const spark = el('div', 'relic-equip-spark' + (i % 3 === 0 ? ' ember' : ''));
      const ang = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 30 + Math.random() * 30;
      spark.style.setProperty('--sx', Math.round(Math.cos(ang) * dist) + 'px');
      spark.style.setProperty('--sy', Math.round(Math.sin(ang) * dist) + 'px');
      wrap.appendChild(spark);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), reduce ? 350 : 800);
  }

  // Plain padlock glyph (shackle arc + body + keyhole), used anywhere a "this
  // is locked" state needs an icon that isn't the 🔒 emoji — e.g. Covenant
  // Trials before the Trial Key is used (see hub-ui.js's 'covenants' screen).
  // Fill/stroke both read off currentColor so a wrapping element's CSS `color`
  // controls it, same convention as the rest of this file's icon helpers.
  function lockIcon(cls) {
    return svgEl('svg', { viewBox: '0 0 24 24', class: 'lock-icon' + (cls ? ' ' + cls : '') }, [
      svgEl('path', { d: 'M7 10V7a5 5 0 0 1 10 0v3', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }),
      svgEl('rect', { x: '5', y: '10', width: '14', height: '11', rx: '2', fill: 'currentColor' }),
      svgEl('circle', { cx: '12', cy: '15', r: '1.6', fill: '#000', 'fill-opacity': '0.55' }),
      svgEl('rect', { x: '11.2', y: '15.4', width: '1.6', height: '3', fill: '#000', 'fill-opacity': '0.55' }),
    ]);
  }

  DS.C = {
    el, svgEl, icon, portrait, statBar, itemCard, charCard, weaponCard, relicCard,
    modal, toast, confirm, tabs, rewardsPopup, rewardIcon, starRating, rarityStars, emptyState, fmtStat,
    findChar, findItem, findWeaponDef, pathIcon, elementIcon, itemIcon, currencyIcon, detailLayout, relicEnhanceControls, weaponUpgradeControls, weaponStatsSummary,
    videoBg, screenBgImage, relicEquipBurst, lockIcon,
  };
})();
