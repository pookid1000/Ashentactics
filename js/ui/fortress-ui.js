// ASHEN TACTICS — Fortress roguelike mode: UI (single 'fortressMap' screen,
// branching internally between intro/starter-pick/the graph — same pattern
// the 'covenants' screen already uses — plus every node-interaction modal).
// All state lives in DS.State.fortress / DS.Fortress (js/engine/fortress.js).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);
  const svgEl = (...a) => DS.C.svgEl(...a);

  const KIND_GLYPH = { normal: '⚔', elite: '💀', boss: '👑', shop: '🏪', forge: '⚒', trap: '⚠', event: '❓', rest: '⛺', wager: '🎲', altar: '🩸', secret: '🗝' };
  // Guards the deferred pendingChoice popup (see render() below) against ever
  // stacking a second copy of itself if something triggers a redundant
  // rerender of 'fortressMap' while a choice is still awaiting an answer.
  let choiceModalOpen = false;
  // Same guard idea for the fullscreen starter-pick overlay (see
  // openStarterPickOverlay below).
  let starterPickOpen = false;
  const KIND_LABEL = { normal: 'Enemies', elite: 'Elite', boss: 'Boss', shop: 'Shop', forge: 'Forge', trap: 'Trap', event: 'Event', rest: 'Rest', wager: 'Wager', altar: 'Bargain', secret: 'Vault' };

  function kindIconNode(kind) {
    const url = DS.Assets && DS.Assets.fortress ? DS.Assets.fortress(kind) : null;
    if (url) return svgEl('image', { href: url, x: -4, y: -4, width: 8, height: 8, class: 'node-portrait' });
    return svgEl('text', { class: 'node-glyph' }, KIND_GLYPH[kind] || '⚔');
  }

  // A fogged/unrevealed node's glyph — a mystery icon, deliberately never a
  // literal question mark (see the "locked" prompt in the Fortress icon
  // prompt library) with a plain drifting-fog emoji as the placeholder until
  // that art exists.
  function lockedIconNode() {
    const url = DS.Assets && DS.Assets.fortress ? DS.Assets.fortress('locked') : null;
    if (url) return svgEl('image', { href: url, x: -4, y: -4, width: 8, height: 8, class: 'node-fog-glyph' });
    return svgEl('text', { class: 'node-fog-glyph', x: 0, y: 0 }, '🌫');
  }

  // Shared image-with-emoji-fallback helper for perk/trap/event icons — same
  // graceful-degradation pattern as kindIconNode()/lockedIconNode() above,
  // just returning a plain HTML node (img or text) instead of an SVG one
  // since these are used inside el()-built DOM rather than the SVG map.
  function iconOrEmoji(url, emoji) {
    if (!url) return emoji || '✦';
    const img = document.createElement('img');
    img.src = url; img.alt = ''; img.className = 'fortress-icon-img';
    return img;
  }
  function perkIconNode(perk) { return iconOrEmoji(DS.Assets && DS.Assets.fortressPerk ? DS.Assets.fortressPerk(perk.id) : null, perk.icon); }
  function trapIconNode(trap) { return iconOrEmoji(DS.Assets && DS.Assets.fortressTrap ? DS.Assets.fortressTrap(trap.id) : null, trap.icon); }
  function eventIconNode(ev) { return iconOrEmoji(DS.Assets && DS.Assets.fortressEvent ? DS.Assets.fortressEvent(ev.id) : null, ev.icon); }

  // ─────────────── the branching map (SVG) ───────────────
  // Same bezier-edge/circle-node/fog-patch technique as js/ui/hub-ui.js's
  // renderWorldGraph() (see js/data/worldmap.js), fed a freshly-generated
  // per-run graph instead of the permanent world layout. Edges sourced from
  // the virtual 'ember' id (the run's starting point) are skipped visually —
  // same as the world map drawing no edge into a world's own entry node.
  // A not-yet-revealed secret vault (see DS.Fortress.isSecretRevealed) must
  // read as PIXEL-IDENTICAL to a normal locked/fogged node — reporting
  // 'locked' here reuses the existing .state-locked CSS wholesale (fog
  // patch, hidden label/icon), so there's no way to tell it apart from any
  // other locked node just by looking at the map.
  function displayNodeState(active, nodeId) {
    const raw = DS.Fortress.nodeState(nodeId);
    const node = active.graph.nodes[nodeId];
    if (node && node.kind === 'secret' && raw === 'unlocked' && !DS.Fortress.isSecretRevealed(nodeId)) return 'locked';
    return raw;
  }

  function renderFortressGraph(active, onPick) {
    const graph = active.graph;
    const svg = svgEl('svg', { class: 'world-graph fortress-graph', viewBox: '0 0 100 ' + graph.height, preserveAspectRatio: 'xMidYMin meet' });
    svg.style.aspectRatio = '100 / ' + graph.height;

    const defs = svgEl('defs', null, svgEl('radialGradient', { id: 'fortFogGrad' }, [
      svgEl('stop', { offset: '0%', 'stop-color': '#050403', 'stop-opacity': '0.97' }),
      svgEl('stop', { offset: '65%', 'stop-color': '#050403', 'stop-opacity': '0.9' }),
      svgEl('stop', { offset: '100%', 'stop-color': '#050403', 'stop-opacity': '0' }),
    ]));

    const edgesLayer = svgEl('g', { class: 'graph-edges' });
    const nodesLayer = svgEl('g', { class: 'graph-nodes' });

    graph.edges.forEach(([fromId, toId]) => {
      if (fromId === 'ember') return;
      const from = graph.nodes[fromId];
      const to = graph.nodes[toId];
      if (!from || !to) return;
      const toState = displayNodeState(active, toId);
      const midY = (from.y + to.y) / 2;
      const d = 'M ' + from.x + ' ' + from.y + ' C ' + from.x + ' ' + midY + ', ' + to.x + ' ' + midY + ', ' + to.x + ' ' + to.y;
      edgesLayer.appendChild(svgEl('path', { d, class: 'graph-edge' + (toState === 'locked' ? ' fogged' : '') }));
    });

    Object.keys(graph.nodes).forEach((id) => {
      const node = graph.nodes[id];
      const state = displayNodeState(active, id);
      // A not-yet-revealed secret must never emit its real 'kind-secret'
      // class either — .kind-X .node-ring rules have the same specificity
      // as .state-locked .node-ring and would win by source order, tinting
      // the ring a giveaway color even under the fog patch. 'fogged' has no
      // such rule, so the plain locked styling applies untouched.
      const hiddenSecret = node.kind === 'secret' && state === 'locked';
      const displayKind = hiddenSecret ? 'fogged' : node.kind;
      // Scale is baked into this SAME transform attribute (not a separate CSS
      // rule) deliberately — a CSS `transform` on an SVG element fully
      // REPLACES its `transform` attribute rather than composing with it, so
      // a CSS-only scale would wipe out this translate and collapse every
      // node to the same spot. See css/fortress.css for why this needs
      // shrinking at all (the graph now renders full-width).
      const g = svgEl('g', { class: 'map-node state-' + state + ' kind-' + displayKind, transform: 'translate(' + node.x + ',' + node.y + ') scale(0.75)' });

      // Smaller than the Expedition map's own fog patch (r:13) — floors here
      // pack 3 nodes into roughly a third of the row's width (see
      // FLOORS_PER_ROW in js/engine/fortress.js), so a same-size patch would
      // visibly overlap its neighbors.
      g.appendChild(svgEl('circle', { class: 'node-fog-patch', cx: 0, cy: 0, r: 5.5, fill: 'url(#fortFogGrad)' }));
      g.appendChild(svgEl('circle', { class: 'node-ring', cx: 0, cy: 0, r: 4.5 }));
      if (state !== 'locked') g.appendChild(kindIconNode(displayKind));
      g.appendChild(lockedIconNode());
      if (state === 'cleared') {
        g.appendChild(svgEl('circle', { class: 'node-cleared-badge-bg', cx: 3.3, cy: -3.3, r: 1.7 }));
        g.appendChild(svgEl('text', { class: 'node-cleared-badge', x: 3.3, y: -3.3 }, '✓'));
      }
      g.appendChild(svgEl('text', { class: 'node-label', x: 0, y: 7.5 }, node.isFinal ? 'The End' : (KIND_LABEL[displayKind] || '')));
      g.appendChild(svgEl('title', null, node.isFinal ? 'The Fortress’ End — final boss' : (KIND_LABEL[displayKind] || '')));

      if (state === 'unlocked') {
        g.onclick = () => onPick(id);
      } else if (state === 'locked') {
        g.onclick = () => DS.C.toast('The way ahead is still lost in the fog.', { icon: '🌫' });
      }
      nodesLayer.appendChild(g);
    });

    svg.appendChild(defs);
    svg.appendChild(edgesLayer);
    svg.appendChild(nodesLayer);
    return svg;
  }

  // ─────────────── squad / Cinders HUD ───────────────

  // A rarity-colored pill showing the perk's icon AND its name as plain,
  // always-visible text (not hidden behind a hover) — the hover tooltip is
  // still there as a bonus with the full effect text, but the name alone is
  // legible at a glance without needing to discover the hover at all. The
  // full effect text for every perk is always available via the "View
  // Perks" button/modal below regardless.
  function perkChip(perk) {
    const chip = el('div', 'fortress-perk-chip r' + perk.rarity + ' card-tooltip', [
      el('span', 'fortress-perk-chip-icon', perkIconNode(perk)),
      el('span', 'fortress-perk-chip-name', perk.name),
    ]);
    chip.setAttribute('data-tooltip', perk.name + ' (' + perk.rarity + '★) — ' + perk.desc);
    return chip;
  }

  // Curses are never curable, so unlike wounds they need to stay visible for
  // the whole rest of the run — same chip pattern as perks, just tinted for
  // a debuff instead of a bonus.
  function curseChip(curse) {
    const chip = el('div', 'fortress-perk-chip fortress-curse-chip card-tooltip', [
      el('span', 'fortress-perk-chip-icon', curse.icon || '🩸'),
      el('span', 'fortress-perk-chip-name', curse.name),
    ]);
    chip.setAttribute('data-tooltip', curse.name + ' — ' + curse.desc);
    return chip;
  }

  // Full-detail list — icon, name, rarity stars, and the complete effect
  // description for every perk currently held, guaranteed visible with no
  // hovering required. This is the actual "show players their perks" answer;
  // the HUD chips above are just a quick-glance summary of the same data.
  function openPerksModal(active) {
    const body = el('div', 'col');
    if (!active.perks.length) {
      body.appendChild(el('p', 'text-dim italic', 'No perks found yet this run.'));
    } else {
      active.perks.forEach((perk) => {
        body.appendChild(el('div', 'row spread ds-card fortress-perk-list-row r' + perk.rarity, [
          el('div', 'row', [
            el('div', 'fortress-perk-icon', perkIconNode(perk)),
            el('div', null, [
              el('div', 'row', [el('b', null, perk.name), DS.C.rarityStars(perk.rarity)]),
              el('div', 'small text-dim', perk.desc),
            ]),
          ]),
        ]));
      });
    }
    DS.C.modal({ title: 'Perks Held This Run', body, wide: true, actions: [{ label: 'Close', cls: 'primary' }] });
  }

  function renderSquadHud(active) {
    const hud = el('div', 'fortress-hud panel-ornate');
    const topRow = el('div', 'row fortress-hud-top');
    const cindersChip = el('div', 'fortress-cinders', [el('span', null, '🔥'), el('span', null, ' ' + active.cinders + ' Cinders')]);
    topRow.appendChild(cindersChip);
    if (active.boon) {
      const boonChip = el('div', 'fortress-boon-chip card-tooltip', [el('span', null, active.boon.icon || '✦'), el('span', null, ' ' + active.boon.name)]);
      boonChip.setAttribute('data-tooltip', active.boon.desc);
      topRow.appendChild(boonChip);
    }
    const squadRow = el('div', 'row fortress-squad-row');
    active.squad.forEach((charId) => {
      const def = DS.C.findChar(charId);
      if (!def) return;
      const hpFrac = DS.Fortress.getHpFraction(charId);
      const hpPct = Math.round(hpFrac * 100);
      const chip = el('div', 'fortress-squad-chip' + (active.wounded[charId] ? ' wounded' : '') + (hpFrac < 1 ? ' hurt' : ''));
      chip.appendChild(DS.C.portrait(def, { size: 48, rarity: def.rarity, element: def.element }));
      chip.title = def.name
        + (active.wounded[charId] ? ' — Wounded (weaker until their next fight)' : '')
        + (hpFrac < 1 ? ' — ' + hpPct + '% HP carried into the next fight' : '');
      if (active.wounded[charId]) chip.appendChild(el('span', 'wound-badge', '🩸'));
      if (hpFrac < 1) chip.appendChild(el('div', 'fortress-hp-badge', hpPct + '%'));
      squadRow.appendChild(chip);
    });
    topRow.appendChild(squadRow);
    const viewPerksBtn = el('button', 'ghost small', 'View Perks (' + active.perks.length + ')');
    viewPerksBtn.onclick = () => openPerksModal(active);
    topRow.appendChild(viewPerksBtn);
    const abandon = el('button', 'ghost small', 'Abandon Run');
    abandon.onclick = async () => {
      const ok = await DS.C.confirm('Abandon this Fortress run? Your squad, perks, and everything found this run will be lost.', { title: 'Abandon Run?', okLabel: 'Abandon', danger: true });
      if (ok) { DS.Fortress.abandonRun(); DS.UI.rerender(); }
    };
    topRow.appendChild(abandon);
    hud.appendChild(topRow);

    if (active.perks.length) {
      const perksRow = el('div', 'row fortress-perks-row');
      perksRow.appendChild(el('span', 'small text-dim fortress-perks-label', 'Perks:'));
      active.perks.forEach((p) => perksRow.appendChild(perkChip(p)));
      hud.appendChild(perksRow);
    }
    if ((active.curses || []).length) {
      const cursesRow = el('div', 'row fortress-perks-row');
      cursesRow.appendChild(el('span', 'small text-dim fortress-perks-label', 'Curses:'));
      active.curses.forEach((c) => cursesRow.appendChild(curseChip(c)));
      hud.appendChild(cursesRow);
    }
    return hud;
  }

  // ─────────────── perk / recruit choice modals ───────────────

  // Always shown face-up, full name/rarity/description visible immediately
  // — no face-down state, no reveal delay. Clicking one selects it right away.
  function perkCardEl(perk, onClick) {
    const card = el('div', 'ds-card fortress-perk-card r' + perk.rarity, [
      el('div', 'fortress-perk-icon', perkIconNode(perk)),
      el('h3', null, perk.name),
      DS.C.rarityStars(perk.rarity),
      el('p', 'small text-dim', perk.desc),
    ]);
    // Decorative frame art (see the icon prompt library) — absent until
    // that art exists, at which point DS.Assets.fortress('cardFrame')
    // stops returning null and this overlay activates automatically.
    // pointer-events:none so it never blocks the card's own click.
    const frameUrl = DS.Assets && DS.Assets.fortress ? DS.Assets.fortress('cardFrame') : null;
    if (frameUrl) {
      const frame = el('div', 'fortress-perk-card-frame');
      frame.style.backgroundImage = "url('" + frameUrl + "')";
      card.appendChild(frame);
    }
    if (onClick) card.onclick = onClick;
    return card;
  }

  function showPerkChoiceModal(choice) {
    const body = el('div', 'row fortress-choice-row');
    choice.perkOptions.forEach((perk, idx) => {
      body.appendChild(perkCardEl(perk, () => { DS.Fortress.choosePerkOffer(idx); choiceModalOpen = false; close(); rerenderMap(); }));
    });
    const { close } = DS.C.modal({
      title: 'Choose a Perk', body, blocking: true, wide: true, hideClose: true,
      actions: [],
    });
  }

  // The very first choice of a run — presented before the graph itself even
  // exists (see chooseBoon in js/engine/fortress.js, which builds the graph
  // once this resolves). Exactly one Boon per run, no skip option.
  function showBoonChoiceModal(choice) {
    const comp = DS.FORTRESS_COMPANION;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim italic fortress-companion-line', '"' + DS.RNG.pick(comp.introLines) + '" — ' + comp.name + ', ' + comp.epithet));
    body.appendChild(el('p', 'small text-dim italic', 'Choose one path to shape the whole descent ahead. There is no changing this once chosen.'));
    const row = el('div', 'row fortress-choice-row');
    choice.boonOptions.forEach((boon, idx) => {
      const card = el('div', 'ds-card fortress-perk-card', [
        el('div', 'fortress-perk-icon', boon.icon || '✦'),
        el('h3', null, boon.name),
        el('p', 'small text-dim', boon.desc),
      ]);
      card.onclick = () => { DS.Fortress.chooseBoon(idx); choiceModalOpen = false; close(); rerenderMap(); };
      row.appendChild(card);
    });
    body.appendChild(row);
    const { close } = DS.C.modal({
      title: 'Choose Your Path', body, blocking: true, wide: true, hideClose: true,
      actions: [],
    });
  }

  // Corvane's boss-clear cameo — a single line, "Continue" to dismiss (see
  // DS.Fortress.dismissCompanion, which advances the choice queue same as
  // every other pick-and-advance choice in this file).
  function showCompanionChoiceModal(choice) {
    const comp = DS.FORTRESS_COMPANION;
    const body = el('div');
    body.appendChild(el('p', 'text-dim italic fortress-companion-line', '"' + choice.line + '"'));
    const cont = el('button', 'primary', 'Continue');
    cont.onclick = () => { DS.Fortress.dismissCompanion(); choiceModalOpen = false; close(); rerenderMap(); };
    const actionsRow = el('div', 'modal-actions');
    actionsRow.appendChild(cont);
    body.appendChild(actionsRow);
    const { close } = DS.C.modal({
      title: comp.name + ', ' + comp.epithet, body, blocking: true, hideClose: true, actions: [],
    });
  }

  function showRecruitChoiceModal(choice) {
    const body = el('div');
    body.appendChild(el('p', 'small text-dim', 'A warrior answers your call. Choose one to join the company (up to 4).'));
    const grid = el('div', 'row');
    grid.style.marginTop = '0.6em';
    choice.recruitOptions.forEach((charId) => {
      const card = DS.C.charCard(charId, {
        width: '116px', portraitSize: 64,
        onClick: () => { DS.Fortress.chooseRecruit(charId); choiceModalOpen = false; close(); rerenderMap(); },
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
    const skip = el('button', 'ghost small', 'Leave them be');
    skip.style.marginTop = '0.6em';
    skip.onclick = () => { DS.Fortress.chooseRecruit(null); choiceModalOpen = false; close(); rerenderMap(); };
    body.appendChild(skip);
    const { close } = DS.C.modal({ title: 'A New Ally', body, blocking: true, wide: true, hideClose: true, actions: [] });
  }

  // Follows every relic grant (elite/boss win, the abandoned-cart event, a
  // shop purchase — see queueEquipRelicChoice in js/engine/fortress.js) —
  // equips it for real (DS.Inventory.equipRelic) AND references it in
  // active.equippedRelics so it also contributes to this run immediately,
  // same effect a Rest-node borrow already has.
  function showEquipRelicChoiceModal(choice) {
    const active = DS.State.fortress.active;
    const set = (DS.RELIC_SETS || []).find((s) => s.id === choice.setId);
    const pieceName = (set && set.pieces && set.pieces[choice.slot] && set.pieces[choice.slot].name) || choice.slot;
    const relicUrl = DS.Assets && set ? (DS.Assets.relicPiece(set.id, choice.slot) || DS.Assets.relic(set.id)) : null;
    const body = el('div');
    const header = el('div', 'row', [
      relicUrl ? (() => { const img = document.createElement('img'); img.src = relicUrl; img.alt = ''; img.className = 'fortress-icon-img'; img.style.width = '2.2em'; img.style.height = '2.2em'; return img; })()
        : el('span', 'fortress-perk-icon', (set && set.art && set.art.icon) || '💍'),
      el('div', null, [el('b', null, pieceName), el('div', 'small text-dim', (set ? set.name : 'A relic') + ' — who should carry it?')]),
    ]);
    body.appendChild(header);
    const grid = el('div', 'row');
    grid.style.marginTop = '0.6em';
    active.squad.forEach((charId) => {
      const card = DS.C.charCard(charId, {
        width: '116px', portraitSize: 64,
        onClick: () => { DS.Fortress.chooseRelicEquip(charId); choiceModalOpen = false; close(); rerenderMap(); },
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
    const skip = el('button', 'ghost small', 'Leave it in the vault');
    skip.style.marginTop = '0.6em';
    skip.onclick = () => { DS.Fortress.chooseRelicEquip(null); choiceModalOpen = false; close(); rerenderMap(); };
    body.appendChild(skip);
    const { close } = DS.C.modal({ title: 'A New Relic', body, blocking: true, wide: true, hideClose: true, actions: [] });
  }

  function rerenderMap() { if (DS.UI.current === 'fortressMap') DS.UI.rerender(); }

  // ─────────────── shop / forge / trap / event modals ───────────────

  function shopTileEl(children, priceLabel, onBuy, disabled) {
    const tile = el('div', 'ds-card shop-tile');
    tile.appendChild(el('div', 'shop-tile-body', children));
    const foot = el('div', 'shop-tile-foot');
    foot.appendChild(el('div', 'shop-tile-price', priceLabel));
    const buy = el('button', 'small primary', disabled ? 'Bought' : 'Buy');
    buy.disabled = !!disabled;
    buy.onclick = onBuy;
    foot.appendChild(buy);
    tile.appendChild(foot);
    return tile;
  }

  function openShopModal(nodeId, node) {
    const shop = node.data.shop;
    const active = DS.State.fortress.active;
    const body = el('div');
    const grid = el('div', 'shop-grid shop-grid-3col');
    body.appendChild(el('p', 'small text-dim italic', 'Cinders spent here never leave the Fortress.'));
    if (shop.merchantLine) body.appendChild(el('p', 'small fortress-merchant-line', '"' + shop.merchantLine + '"'));

    function refresh() {
      grid.innerHTML = '';
      shop.perkOffers.forEach((perk, idx) => {
        const bought = !!shop.bought['perk' + idx];
        const cost = DS.FORTRESS_CONFIG.shopPerkPriceByRarity[perk.rarity] || 999;
        grid.appendChild(shopTileEl(
          [el('div', 'fortress-perk-icon', perkIconNode(perk)), el('h3', null, perk.name), DS.C.rarityStars(perk.rarity), el('p', 'small text-dim', perk.desc)],
          '🔥 ' + cost, () => { DS.Fortress.buyShopPerk(nodeId, idx); refresh(); }, bought || active.cinders < cost,
        ));
      });
      if (shop.bonusPerkOffer) {
        const perk = shop.bonusPerkOffer;
        const bought = !!shop.bought.perkbonus;
        const cost = Math.round((DS.FORTRESS_CONFIG.shopPerkPriceByRarity[perk.rarity] || 999) * DS.FORTRESS_MERCHANT.bonusOffer.priceMult);
        grid.appendChild(shopTileEl(
          [el('div', 'fortress-perk-icon', perkIconNode(perk)), el('h3', null, perk.name), DS.C.rarityStars(perk.rarity), el('p', 'small text-dim', perk.desc), el('p', 'small text-dim italic', "Mirelle remembers your bargain.")],
          '🔥 ' + cost, () => { DS.Fortress.buyShopPerk(nodeId, 'bonus'); refresh(); }, bought || active.cinders < cost,
        ));
      }
      if (shop.weaponOfferDefId) {
        const wdef = DS.C.findWeaponDef(shop.weaponOfferDefId);
        if (wdef) {
          grid.appendChild(shopTileEl(
            [el('div', 'fortress-perk-icon', (wdef.art && wdef.art.icon) || '🗡'), el('h3', null, wdef.name), el('p', 'small text-dim', 'A borrowed blade — yours for this run only.')],
            'Free', () => { DS.Fortress.buyShopWeapon(nodeId); refresh(); }, !!shop.bought.weapon,
          ));
        }
      }
      if (shop.relicOffer) {
        const set = (DS.RELIC_SETS || []).find((s) => s.id === shop.relicOffer.setId);
        if (set) {
          const pieceName = (set.pieces && set.pieces[shop.relicOffer.slot] && set.pieces[shop.relicOffer.slot].name) || shop.relicOffer.slot;
          const relicUrl = DS.Assets ? (DS.Assets.relicPiece(set.id, shop.relicOffer.slot) || DS.Assets.relic(set.id)) : null;
          const iconChild = relicUrl
            ? (() => { const img = document.createElement('img'); img.src = relicUrl; img.alt = ''; img.className = 'fortress-icon-img'; return img; })()
            : (set.art && set.art.icon) || '💍';
          grid.appendChild(shopTileEl(
            [el('div', 'fortress-perk-icon', iconChild), el('h3', null, pieceName), el('p', 'small text-dim', set.name + ' — a real relic, yours to keep.')],
            '🔥 ' + DS.FORTRESS_CONFIG.shopRelicCost, () => { DS.Fortress.buyShopRelic(nodeId); refresh(); },
            !!shop.bought.relic || active.cinders < DS.FORTRESS_CONFIG.shopRelicCost,
          ));
        }
      }
      const anyWounded = Object.keys(active.wounded).length > 0;
      const anyHurt = active.squad.some((id) => DS.Fortress.getHpFraction(id) < 1);
      grid.appendChild(shopTileEl(
        [el('div', 'fortress-perk-icon', '✚'), el('h3', null, 'Cure Wounds'), el('p', 'small text-dim', 'Mends wounds and restores the whole company to full health.')],
        '🔥 ' + DS.FORTRESS_CONFIG.shopCureWoundsCost, () => { DS.Fortress.cureWounds(nodeId); refresh(); },
        (!anyWounded && !anyHurt) || active.cinders < DS.FORTRESS_CONFIG.shopCureWoundsCost,
      ));
    }
    refresh();
    body.appendChild(grid);
    DS.C.modal({
      title: DS.FORTRESS_MERCHANT.name + ', ' + DS.FORTRESS_MERCHANT.title, body, blocking: true, wide: true, hideClose: true,
      actions: [{ label: 'Leave', cls: 'primary', onClick: () => { DS.Fortress.completeNode(nodeId); rerenderMap(); } }],
    });
  }

  function openForgeModal(nodeId, node) {
    const active = DS.State.fortress.active;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim italic', 'Spend Cinders to temper a warrior’s borrowed weapon.'));
    const list = el('div', 'col');

    function refresh() {
      list.innerHTML = '';
      const owned = Object.keys(active.runWeapons);
      if (!owned.length) { list.appendChild(el('div', 'small text-faint italic', 'No borrowed weapons to temper yet — find one from a Shop or a stroke of luck.')); return; }
      owned.forEach((uid) => {
        const w = active.runWeapons[uid];
        const wdef = DS.C.findWeaponDef(w.defId);
        if (!wdef) return;
        const cost = DS.FORTRESS_CONFIG.forgeBaseCost + w.level * DS.FORTRESS_CONFIG.forgeCostPerLevel;
        const maxed = w.level >= DS.FORTRESS_CONFIG.forgeMaxLevel;
        const equippedTo = Object.keys(active.equippedRunWeapon).find((cid) => active.equippedRunWeapon[cid] === uid);
        const row = el('div', 'row spread ds-card', [
          el('div', 'row', [el('div', 'fortress-perk-icon', (wdef.art && wdef.art.icon) || '🗡'), el('div', null, [el('div', null, wdef.name), el('div', 'small text-dim', 'Level ' + w.level + (equippedTo ? ' — worn by ' + (DS.C.findChar(equippedTo) || {}).name : ' — unequipped'))])]),
        ]);
        const btnRow = el('div', 'row');
        const upgradeBtn = el('button', 'small primary', maxed ? 'Max' : ('Temper (🔥 ' + cost + ')'));
        upgradeBtn.disabled = maxed || active.cinders < cost;
        upgradeBtn.onclick = () => { DS.Fortress.upgradeRunWeapon(uid); refresh(); };
        btnRow.appendChild(upgradeBtn);
        active.squad.forEach((charId) => {
          const def = DS.C.findChar(charId);
          if (!def || def.path !== wdef.path) return;
          const already = active.equippedRunWeapon[charId] === uid;
          const eqBtn = el('button', 'small' + (already ? ' primary' : ''), already ? (def.name.split(' ')[0] + ' ✓') : ('Give to ' + def.name.split(' ')[0]));
          eqBtn.onclick = () => { DS.Fortress.equipRunWeapon(charId, uid); refresh(); };
          btnRow.appendChild(eqBtn);
        });
        row.appendChild(btnRow);
        list.appendChild(row);
      });
    }
    refresh();
    body.appendChild(list);
    DS.C.modal({
      title: 'A Cold Forge', body, blocking: true, wide: true, hideClose: true,
      actions: [{ label: 'Leave', cls: 'primary', onClick: () => { DS.Fortress.completeNode(nodeId); rerenderMap(); } }],
    });
  }

  // A rest site: spend Cinders to raise a squad member's in-run level (real
  // growth-curve math via DS.Progression, see DS.Fortress.buildFortressUnit),
  // and freely draw on real owned relics/a real owned weapon for the run —
  // both cost nothing since nothing is consumed, just referenced by uid (see
  // DS.Fortress.equipRunRelic/equipRunRealWeapon).
  function openRestModal(nodeId, node) {
    const active = DS.State.fortress.active;
    const cfg = DS.FORTRESS_CONFIG;
    const body = el('div', 'col');
    body.appendChild(el('p', 'small text-dim italic', 'Rest here a while. Levels cost Cinders; drawing on gear you already own costs nothing.'));
    const list = el('div', 'col');

    function openRelicPicker(charId, slot) {
      const pbody = el('div');
      const grid = el('div', 'row fortress-rest-picker-grid');
      const currentUid = (active.equippedRelics[charId] || {})[slot];
      const usedElsewhere = {};
      active.squad.forEach((otherId) => {
        if (otherId === charId) return;
        const u = (active.equippedRelics[otherId] || {})[slot];
        if (u) usedElsewhere[u] = true;
      });
      Object.keys(DS.State.inventory.relics)
        .filter((uid) => DS.State.inventory.relics[uid].slot === slot && !usedElsewhere[uid])
        .forEach((uid) => {
          grid.appendChild(DS.C.relicCard(uid, {
            iconOnly: true, width: '120px', selected: uid === currentUid,
            onClick: () => { DS.Fortress.equipRunRelic(charId, slot, uid); pclose(); refresh(); },
          }));
        });
      if (!grid.children.length) pbody.appendChild(el('p', 'small text-faint italic', 'No owned relics for this slot (or they’re already lent to another squadmate this run).'));
      pbody.appendChild(grid);
      if (currentUid) {
        const unequip = el('button', 'ghost small', 'Unequip');
        unequip.onclick = () => { DS.Fortress.equipRunRelic(charId, slot, null); pclose(); refresh(); };
        pbody.appendChild(unequip);
      }
      const { close: pclose } = DS.C.modal({ title: slot.toUpperCase() + ' — lend a relic', body: pbody, wide: true, actions: [{ label: 'Cancel', cls: 'ghost' }] });
    }

    function openWeaponPicker(charId) {
      const def = DS.C.findChar(charId);
      const pbody = el('div');
      const grid = el('div', 'row fortress-rest-picker-grid');
      const currentUid = active.equippedRealWeapon[charId];
      Object.keys(DS.State.inventory.weapons)
        .filter((uid) => { const wdef = DS.C.findWeaponDef(DS.State.inventory.weapons[uid].defId); return wdef && (!def || wdef.path === def.path); })
        .forEach((uid) => {
          grid.appendChild(DS.C.weaponCard(uid, {
            width: '120px', selected: uid === currentUid,
            onClick: () => { DS.Fortress.equipRunRealWeapon(charId, uid); pclose(); refresh(); },
          }));
        });
      if (!grid.children.length) pbody.appendChild(el('p', 'small text-faint italic', 'No owned weapons of this path.'));
      pbody.appendChild(grid);
      if (currentUid) {
        const unequip = el('button', 'ghost small', 'Unequip');
        unequip.onclick = () => { DS.Fortress.equipRunRealWeapon(charId, null); pclose(); refresh(); };
        pbody.appendChild(unequip);
      }
      const { close: pclose } = DS.C.modal({ title: 'Lend a Weapon', body: pbody, wide: true, actions: [{ label: 'Cancel', cls: 'ghost' }] });
    }

    function refresh() {
      list.innerHTML = '';
      active.squad.forEach((charId) => {
        const def = DS.C.findChar(charId);
        if (!def) return;
        const level = active.charLevels[charId] || 1;
        const cost = cfg.restLevelBaseCost + (level - 1) * cfg.restLevelCostPerLevel;
        const maxed = level >= cfg.restLevelCap;
        const row = el('div', 'ds-card fortress-rest-row');
        const head = el('div', 'row spread');
        head.appendChild(el('div', 'row', [
          DS.C.portrait(def, { size: 48, rarity: def.rarity, element: def.element }),
          el('div', null, [el('div', null, def.name), el('div', 'small text-dim', 'Lv. ' + level)]),
        ]));
        const lvlBtn = el('button', 'small primary', maxed ? 'Max Level' : ('Level Up (🔥 ' + cost + ')'));
        lvlBtn.disabled = maxed || active.cinders < cost;
        lvlBtn.onclick = () => { DS.Fortress.levelUpChar(charId); refresh(); };
        head.appendChild(lvlBtn);
        row.appendChild(head);

        const gearRow = el('div', 'row fortress-rest-gear');
        const wUid = active.equippedRealWeapon[charId];
        const wSlot = el('div', 'fortress-rest-slot', [el('div', 'small text-faint', 'WEAPON'),
          wUid && DS.State.inventory.weapons[wUid] ? DS.C.weaponCard(wUid, { width: '92px' }) : el('div', 'fortress-rest-slot-empty small text-faint italic', 'Empty')]);
        wSlot.onclick = () => openWeaponPicker(charId);
        gearRow.appendChild(wSlot);

        DS.SLOTS.forEach((slot) => {
          const uid = (active.equippedRelics[charId] || {})[slot];
          const cell = el('div', 'fortress-rest-slot', [el('div', 'small text-faint', slot.toUpperCase()),
            uid && DS.State.inventory.relics[uid] ? DS.C.relicCard(uid, { iconOnly: true, width: '92px' }) : el('div', 'fortress-rest-slot-empty small text-faint italic', 'Empty')]);
          cell.onclick = () => openRelicPicker(charId, slot);
          gearRow.appendChild(cell);
        });
        row.appendChild(gearRow);
        list.appendChild(row);
      });
    }
    refresh();
    body.appendChild(list);

    // One free recruit per rest node — 3 owned-but-not-in-squad options
    // rolled once on entry (see rollNodeData in js/engine/fortress.js),
    // same one-of-three feel as the boss recruit, just far more frequent.
    const recruitBox = el('div', 'col');
    function refreshRecruit() {
      recruitBox.innerHTML = '';
      recruitBox.appendChild(el('h3', null, 'A Stranger Approaches'));
      if (node.data.recruited) {
        recruitBox.appendChild(el('p', 'small text-dim italic', 'You’ve already welcomed someone here this visit.'));
        return;
      }
      if (active.squad.length >= 4) {
        recruitBox.appendChild(el('p', 'small text-dim italic', 'The company is full (4/4).'));
        return;
      }
      if (!node.data.recruitOptions || !node.data.recruitOptions.length) {
        recruitBox.appendChild(el('p', 'small text-dim italic', 'Everyone you own already travels with you.'));
        return;
      }
      const row = el('div', 'row');
      node.data.recruitOptions.forEach((charId) => {
        row.appendChild(DS.C.charCard(charId, {
          width: '116px', portraitSize: 64,
          onClick: () => { DS.Fortress.recruitAtRest(nodeId, charId); refreshRecruit(); refresh(); },
        }));
      });
      recruitBox.appendChild(row);
    }
    refreshRecruit();
    body.appendChild(recruitBox);

    // Corvane's rest-node cameo — not every rest node gets one (see
    // rollNodeData's 60% roll), and once here, one of his 2 restChoices can
    // be picked exactly once (see DS.Fortress.chooseCompanionRestOption).
    const companionBox = el('div', 'col');
    function refreshCompanion() {
      companionBox.innerHTML = '';
      if (!node.data.companionLine) return;
      const comp = DS.FORTRESS_COMPANION;
      companionBox.appendChild(el('p', 'small text-dim italic fortress-companion-line', '"' + node.data.companionLine + '" — ' + comp.name));
      if (node.data.companionChoiceMade) return;
      const btnRow = el('div', 'row');
      comp.restChoices.forEach((choice, idx) => {
        const detail = choice.desc || (choice.grantPerk ? choice.grantPerk.desc : '');
        const btn = el('button', 'small', choice.label + (detail ? ' — ' + detail : ''));
        btn.onclick = () => { DS.Fortress.chooseCompanionRestOption(nodeId, idx); refreshCompanion(); };
        btnRow.appendChild(btn);
      });
      companionBox.appendChild(btnRow);
    }
    refreshCompanion();
    body.appendChild(companionBox);

    DS.C.modal({
      title: 'A Place to Rest', body, blocking: true, wide: true, hideClose: true,
      actions: [{ label: 'Leave', cls: 'primary', onClick: () => { DS.Fortress.completeNode(nodeId); rerenderMap(); } }],
    });
  }

  // An altar: 3 curse/perk pairs, chosen (not rolled) — take a real, named,
  // never-curable debuff for a guaranteed strong perk, or walk away with
  // neither.
  function openAltarModal(nodeId, node) {
    const altar = node.data.altar;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim italic', 'A bargain is a bargain. Choose one, or walk away with nothing paid and nothing gained.'));
    const row = el('div', 'row fortress-choice-row');
    altar.options.forEach((curse, idx) => {
      const perk = DS.FORTRESS_PERKS.find((p) => p.id === curse.pairedPerkId);
      const card = el('div', 'ds-card fortress-perk-card fortress-altar-card');
      card.appendChild(el('div', 'fortress-altar-half fortress-altar-curse', [
        el('div', 'fortress-perk-icon', curse.icon || '🩸'),
        el('h3', null, curse.name),
        el('p', 'small', curse.desc),
      ]));
      if (perk) {
        card.appendChild(el('div', 'fortress-altar-half fortress-altar-perk r' + perk.rarity, [
          el('div', 'fortress-perk-icon', perkIconNode(perk)),
          el('h3', null, perk.name),
          DS.C.rarityStars(perk.rarity),
          el('p', 'small text-dim', perk.desc),
        ]));
      }
      card.onclick = () => {
        DS.Fortress.chooseAltarBargain(nodeId, idx);
        close();
        rerenderMap();
      };
      row.appendChild(card);
    });
    body.appendChild(row);
    const walkAway = el('button', 'ghost small', 'Walk Away');
    walkAway.style.marginTop = '0.6em';
    walkAway.onclick = () => { DS.Fortress.completeNode(nodeId); close(); rerenderMap(); };
    body.appendChild(walkAway);
    const { close } = DS.C.modal({ title: '🩸 A Bargain', body, blocking: true, wide: true, hideClose: true, actions: [] });
  }

  // A found secret vault — see displayNodeState/isSecretRevealed for how it
  // stays hidden until now. Simple "take it and leave" reward display; the
  // 'cinders_recruit' reward additionally offers a pick-one recruit choice,
  // same charCard pattern as showRecruitChoiceModal.
  function openSecretModal(nodeId, node) {
    const secret = node.data.secret;
    const recipe = secret.recipe;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim italic', 'A secret, found. Whatever waits here is yours.'));
    const reward = recipe.reward;

    if (reward.kind === 'cinders_recruit') {
      body.appendChild(el('p', null, 'Cinders +' + reward.cinders + ', and a new ally waiting to join.'));
      const row = el('div', 'row');
      (secret.recruitOptions || []).forEach((charId) => {
        row.appendChild(DS.C.charCard(charId, {
          width: '116px', portraitSize: 64,
          onClick: () => { DS.Fortress.claimSecretVault(nodeId, charId); close(); rerenderMap(); },
        }));
      });
      body.appendChild(row);
      if (!secret.recruitOptions || !secret.recruitOptions.length) {
        const takeBtn = el('button', 'primary', 'Take the Cinders');
        takeBtn.onclick = () => { DS.Fortress.claimSecretVault(nodeId, null); close(); rerenderMap(); };
        body.appendChild(takeBtn);
      }
    } else {
      const desc = reward.kind === 'perks'
        ? reward.count + ' perk' + (reward.count > 1 ? 's' : '') + ' (' + reward.minRarity + '★ or better)'
        : reward.count + ' perk (' + reward.minRarity + '★ or better) and Cinders +' + reward.cinders;
      body.appendChild(el('p', null, desc + ' await.'));
      const takeBtn = el('button', 'primary', 'Take It');
      takeBtn.onclick = () => { DS.Fortress.claimSecretVault(nodeId); close(); rerenderMap(); };
      body.appendChild(takeBtn);
    }
    const { close } = DS.C.modal({ title: (recipe.icon || '🗝') + ' ' + recipe.name, body, blocking: true, hideClose: true, actions: [] });
  }

  // A gambling node: pick a bet tier (and optionally stake a held perk for a
  // bigger payout, lost on a loss), then reuse the exact dice-roll reveal
  // pattern openTrapModal() already established (spinning box, timed
  // reveal, tier-colored result text).
  function openWagerModal(nodeId, node) {
    const active = DS.State.fortress.active;
    const cfg = DS.FORTRESS_WAGER;
    const body = el('div');
    body.appendChild(el('p', 'small text-dim italic', 'A stranger runs a game of chance down here in the dark. Bet Cinders — stake a held perk too, if you dare, for a far bigger prize.'));
    const content = el('div', 'col');
    body.appendChild(content);

    let stakedId = null;

    function renderChoose() {
      content.innerHTML = '';
      if (active.perks.length) {
        content.appendChild(el('div', 'small text-dim', 'Stake a perk for a bigger payout (lost for good if you lose):'));
        const stakeRow = el('div', 'row fortress-choice-row');
        active.perks.forEach((perk) => {
          const card = perkCardEl(perk, () => { stakedId = stakedId === perk.instanceId ? null : perk.instanceId; renderChoose(); });
          if (perk.instanceId === stakedId) card.classList.add('selected');
          stakeRow.appendChild(card);
        });
        content.appendChild(stakeRow);
      }
      const tierGrid = el('div', 'shop-grid shop-grid-3col');
      cfg.tiers.forEach((tier) => {
        const mult = tier.payoutMult * (stakedId ? cfg.perkStakeMultBonus : 1);
        const payout = Math.round(tier.cost * mult);
        tierGrid.appendChild(shopTileEl(
          [el('h3', null, tier.name), el('p', 'small text-dim', Math.round(tier.winChance * 100) + '% to win 🔥' + payout)],
          '🔥 ' + tier.cost, () => renderRolling(tier.id), active.cinders < tier.cost,
        ));
      });
      content.appendChild(tierGrid);
      const walkAway = el('button', 'ghost small', 'Walk Away');
      walkAway.style.marginTop = '0.6em';
      walkAway.onclick = () => { DS.Fortress.completeNode(nodeId); close(); rerenderMap(); };
      content.appendChild(walkAway);
    }

    function renderRolling(tierId) {
      content.innerHTML = '';
      const diceUrl = DS.Assets && DS.Assets.fortress ? DS.Assets.fortress('dice') : null;
      const diceBox = el('div', 'fortress-dice-roll' + (diceUrl ? ' has-art' : ''), diceUrl ? null : '🎲');
      if (diceUrl) diceBox.style.backgroundImage = "url('" + diceUrl + "')";
      content.appendChild(diceBox);
      const resultText = el('p', 'small text-dim italic', 'The dice are cast...');
      content.appendChild(resultText);
      setTimeout(() => {
        const res = DS.Fortress.resolveWager(nodeId, tierId, stakedId);
        diceBox.textContent = String(res.roll);
        diceBox.classList.add('revealed', 'tier-' + (res.win ? 'safe' : 'heavy'));
        resultText.textContent = res.win
          ? 'A winning roll (' + res.roll + ' vs ' + res.threshold + ') — Cinders +' + res.payout + '.'
          : 'A losing roll (' + res.roll + ' vs ' + res.threshold + ').' + (res.perkLost ? ' ' + res.perkLost + ' is gone with it.' : '');
        const cont = el('button', 'primary', 'Continue');
        cont.onclick = () => { close(); rerenderMap(); };
        const actionsRow = el('div', 'modal-actions');
        actionsRow.appendChild(cont);
        content.appendChild(actionsRow);
      }, 1100);
    }

    renderChoose();
    const { close } = DS.C.modal({ title: '🎲 A Game of Chance', body, blocking: true, wide: true, hideClose: true, actions: [] });
  }

  function openTrapModal(nodeId, node) {
    const trap = node.data.trap;
    const body = el('div', 'fortress-trap-body');
    const trapUrl = DS.Assets && DS.Assets.fortressTrap ? DS.Assets.fortressTrap(trap.id) : null;
    if (trapUrl) body.appendChild(el('div', 'fortress-flavor-icon', trapIconNode(trap)));
    body.appendChild(el('p', null, trap.desc));
    const diceUrl = DS.Assets && DS.Assets.fortress ? DS.Assets.fortress('dice') : null;
    const diceBox = el('div', 'fortress-dice-roll' + (diceUrl ? ' has-art' : ''), diceUrl ? null : '🎲');
    if (diceUrl) diceBox.style.backgroundImage = "url('" + diceUrl + "')";
    body.appendChild(diceBox);
    const resultText = el('p', 'small text-dim italic', 'Something has been triggered...');
    body.appendChild(resultText);
    const { close, body: modalBody } = DS.C.modal({ title: trap.icon + ' ' + trap.name, body, blocking: true, hideClose: true, actions: [] });

    setTimeout(() => {
      const res = DS.Fortress.resolveTrap(nodeId);
      diceBox.textContent = String(res.roll);
      diceBox.classList.add('revealed', 'tier-' + res.outcome.tier);
      if (res.outcome.tier === 'heavy') {
        const victim = DS.C.findChar(res.outcome.victim);
        resultText.textContent = (victim ? victim.name : 'A warrior') + ' is caught badly — wounded, and Cinders scatter (' + res.outcome.cindersDelta + ').';
      } else if (res.outcome.tier === 'light') {
        resultText.textContent = 'A glancing scrape. Cinders lost: ' + res.outcome.cindersDelta + '.';
      } else {
        resultText.textContent = 'Everyone slips past unharmed — and a few stray Cinders besides (+' + res.outcome.cindersDelta + ').';
      }
      const cont = el('button', 'primary', 'Continue');
      cont.onclick = () => { close(); rerenderMap(); };
      const actionsRow = el('div', 'modal-actions');
      actionsRow.appendChild(cont);
      modalBody.parentElement.appendChild(actionsRow);
    }, 1100);
  }

  function openEventModal(nodeId, node) {
    const ev = node.data.event;
    const body = el('div');
    const evUrl = DS.Assets && DS.Assets.fortressEvent ? DS.Assets.fortressEvent(ev.id) : null;
    if (evUrl) body.appendChild(el('div', 'fortress-flavor-icon', eventIconNode(ev)));
    body.appendChild(el('p', null, ev.desc));
    const resultBox = el('div', 'small text-dim italic');
    body.appendChild(resultBox);
    const btnRow = el('div', 'row');
    const investigateBtn = el('button', 'primary', 'Investigate');
    const leaveBtn = el('button', 'ghost', 'Leave it be');
    btnRow.appendChild(investigateBtn);
    btnRow.appendChild(leaveBtn);
    body.appendChild(btnRow);

    function finish(text) {
      resultBox.textContent = text;
      btnRow.innerHTML = '';
      const cont = el('button', 'primary', 'Continue');
      cont.onclick = () => { close(); rerenderMap(); };
      btnRow.appendChild(cont);
    }
    investigateBtn.onclick = () => {
      const res = DS.Fortress.resolveEvent(nodeId, true);
      // 'A Sleeping Giant' isn't a normal good/bad roll — awake means a real
      // fight, handed off to the battle screen exactly like a normal/elite/
      // boss node would (see onNodePicked below); the node itself only
      // completes once that battle resolves (see onNodeBattleWon/Lost).
      if (res.awake === true) {
        close();
        DS.UI.navigate('battle', {
          spawns: [{ id: res.bossId, level: DS.FORTRESS_CONFIG.enemyLevelForFloor(node.floor) }],
          background: 'kiln',
          source: { kind: 'fortress', nodeId },
        });
        return;
      }
      if (res.awake === false) { finish('He sleeps on. You slip away with Cinders +' + res.cindersDelta + '.'); return; }
      if (res.good && res.perk) finish('Fortune answers — you find ' + res.perk.name + '.');
      else if (res.good && res.weaponGranted) finish('Fortune answers — you find ' + res.weaponGranted.text + '.');
      else if (res.good && res.relicGranted) finish('Fortune answers — you find ' + res.relicGranted.text + '.');
      else if (res.good) finish('Fortune answers — Cinders +' + res.cindersDelta + '.');
      else if (res.victim) finish((DS.C.findChar(res.victim) || {}).name + ' is hurt investigating.');
      else finish('It costs you Cinders (' + res.cindersDelta + ').');
    };
    leaveBtn.onclick = () => {
      DS.Fortress.resolveEvent(nodeId, false);
      finish('You leave it be, and move on.');
    };
    const { close } = DS.C.modal({ title: ev.icon + ' ' + ev.name, body, blocking: true, hideClose: true, actions: [] });
  }

  // ─────────────── starter pick (fullscreen card choice) ───────────────
  // A dramatic, screen-covering choice rather than a small in-modal row —
  // reuses DS.C.charCard's existing `full` mode (the same full-bleed
  // portrait/frame/name/stars card the battle screen and team-select already
  // use), just laid out three-wide over a dark backdrop, appended straight to
  // <body> like every other fullscreen moment in this codebase (the covenant
  // key/lock unlock animation, the gacha ritual overlay).
  function openStarterPickOverlay(options) {
    const overlay = el('div', 'fortress-picker-overlay');
    overlay.appendChild(el('div', 'fortress-picker-title display', 'Choose Your Bearer'));
    overlay.appendChild(el('div', 'fortress-picker-sub small text-dim italic', 'The ash offers three. Only one may carry the ember in.'));
    const row = el('div', 'fortress-picker-row');
    options.forEach((charId) => {
      const card = DS.C.charCard(charId, {
        full: true, width: '260px', portraitSize: 260,
        onClick: () => {
          DS.SFX.play('ui');
          overlay.classList.add('leaving');
          setTimeout(() => {
            overlay.remove();
            starterPickOpen = false;
            DS.Fortress.chooseStarter(charId);
            DS.UI.rerender();
          }, 350);
        },
      });
      card.classList.add('fortress-picker-card');
      row.appendChild(card);
    });
    overlay.appendChild(row);
    document.body.appendChild(overlay);
  }

  // ─────────────── node click dispatch ───────────────

  function onNodePicked(nodeId) {
    const node = DS.Fortress.ensureNodeData(nodeId);
    if (!node) return;
    if (node.kind === 'normal' || node.kind === 'elite' || node.kind === 'boss') {
      DS.UI.navigate('battle', {
        spawns: node.data.spawns, background: 'kiln',
        source: { kind: 'fortress', nodeId },
      });
      return;
    }
    if (node.kind === 'shop') return openShopModal(nodeId, node);
    if (node.kind === 'forge') return openForgeModal(nodeId, node);
    if (node.kind === 'rest') return openRestModal(nodeId, node);
    if (node.kind === 'wager') return openWagerModal(nodeId, node);
    if (node.kind === 'altar') return openAltarModal(nodeId, node);
    if (node.kind === 'secret') return openSecretModal(nodeId, node);
    if (node.kind === 'trap') return openTrapModal(nodeId, node);
    if (node.kind === 'event') return openEventModal(nodeId, node);
  }

  // ─────────────── screen ───────────────

  DS.UI.registerScreen('fortressMap', {
    render() {
      const outer = el('div', 'screen fortress-screen');
      outer.appendChild(DS.C.screenBgImage((DS.Assets.background('fortress') || DS.Assets.background('map')), 'cover'));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'The Fortress'), el('div', 'hint', 'A roguelike descent — nothing carries but what you find')]));

      const active = DS.State.fortress.active;

      if (!active) {
        const rec = DS.Fortress.getRecords();
        const box = el('div', 'world-box panel-ornate bgtint-kiln');
        box.appendChild(el('h3', null, '🏰 Light the Ember'));
        box.appendChild(el('p', 'small text-dim italic',
          'Choose one warrior of the three the ash offers you, and descend. Every perk, every ally, every stray Cinder is yours only until the company falls — then the fortress forgets you ever came.'));
        box.appendChild(el('div', 'row small text-dim', [
          el('span', null, 'Runs attempted: ' + rec.runsAttempted),
          el('span', null, 'Runs completed: ' + rec.runsCompleted),
          el('span', null, 'Deepest floor reached: ' + rec.bestDepth + ' / ' + DS.FORTRESS_CONFIG.totalFloors),
        ]));
        const owned = Object.keys(DS.State.roster);
        const startBtn = el('button', 'primary big', 'Light the Ember');
        startBtn.disabled = owned.length < 1;
        startBtn.onclick = async () => {
          const ok = await DS.C.confirm('Are you sure you want to descend into the Fortress? Nothing carries but what you find — and nothing survives a fall.', { title: 'Descend?', okLabel: 'Descend' });
          if (!ok) return;
          DS.Fortress.startRun();
          DS.UI.rerender();
        };
        box.appendChild(startBtn);
        wrap.appendChild(box);
        outer.appendChild(wrap);
        return outer;
      }

      // Blocking choice takes over the whole screen the instant one exists —
      // resolving it (or, for the very first pick, choosing a starter) is
      // mandatory before the graph itself is usable.
      if (!active.squad.length) {
        if (!starterPickOpen) {
          starterPickOpen = true;
          setTimeout(() => {
            const cur = DS.State.fortress.active;
            if (DS.UI.current !== 'fortressMap' || !cur || cur.squad.length) { starterPickOpen = false; return; }
            openStarterPickOverlay(cur.starterOptions || []);
          }, 0);
        }
        wrap.appendChild(el('div', 'world-box panel-ornate bgtint-kiln', [el('h3', null, 'The ash stirs...')]));
        outer.appendChild(wrap);
        return outer;
      }

      if (active.pendingChoice && !choiceModalOpen) {
        choiceModalOpen = true;
        // Defer to a fresh render tick so the modal always mounts against a
        // fully-built graph underneath it (matches how every other blocking
        // modal in this codebase layers over already-rendered screen content).
        setTimeout(() => {
          if (DS.UI.current !== 'fortressMap' || !DS.State.fortress.active || !DS.State.fortress.active.pendingChoice) { choiceModalOpen = false; return; }
          const choice = DS.State.fortress.active.pendingChoice;
          if (choice.type === 'perk') showPerkChoiceModal(choice);
          else if (choice.type === 'recruit') showRecruitChoiceModal(choice);
          else if (choice.type === 'boon') showBoonChoiceModal(choice);
          else if (choice.type === 'companion') showCompanionChoiceModal(choice);
          else if (choice.type === 'equipRelic') showEquipRelicChoiceModal(choice);
          else choiceModalOpen = false;
        }, 0);
      }

      wrap.appendChild(renderSquadHud(active));
      outer.appendChild(wrap);

      // The graph doesn't exist until a Boon is chosen (see chooseBoon in
      // js/engine/fortress.js — it needs the Boon to bias the map's weighted
      // kind-rolls) — the pendingChoice block above already covers showing
      // that choice modal, so this is just what renders in the graph's place
      // while it's still pending.
      if (!active.graph) {
        wrap.appendChild(el('div', 'world-box panel-ornate bgtint-kiln', [el('h3', null, 'Corvane studies the dark ahead...')]));
        return outer;
      }

      // Deliberately appended to `outer` (full-bleed, max-width:none) rather
      // than inside `wrap` (the readable-width .screen-inner column) — the
      // map itself should use the whole screen's width, not sit boxed inside
      // the same narrow column as the header text and HUD above it.
      const graphWrap = el('div', 'world-graph-wrap fortress-graph-wrap');
      const bgUrl = DS.Assets ? (DS.Assets.background('fortress') || DS.Assets.background('kiln')) : null;
      if (bgUrl) graphWrap.style.backgroundImage = 'url(' + bgUrl + ')';
      graphWrap.appendChild(el('div', 'world-graph-scrim'));
      graphWrap.appendChild(renderFortressGraph(active, onNodePicked));
      outer.appendChild(graphWrap);

      return outer;
    },
  });
})();
