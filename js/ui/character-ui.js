// ASHEN TACTICS — character roster + detail screens (CONTRACT.md §6.4).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);
  let rosterFilter = { element: null, path: null };
  let detailTab = 'stats';
  // Set during a relic drag gesture (dragstart -> dragend) so equipment-slot drop
  // targets can check slot compatibility without needing dataTransfer.getData(),
  // which most browsers refuse to expose during dragover for security reasons.
  let draggingRelic = null;
  // Set for one render pass right after a successful equip-by-drop, so the
  // freshly-filled slot cell can flash gold once (see .just-equipped in
  // character.css) — cleared as soon as that one cell consumes it.
  let justEquippedSlot = null;

  // Click-and-drag (touch-style) panning for the relic collection strip — grabbing
  // empty space scrolls the list; grabbing a card lets native HTML5 drag take over
  // instead (see the dragstart wiring below), so the two interactions never fight.
  function attachDragScroll(container) {
    let active = false;
    let startY = 0;
    let startScrollTop = 0;
    const end = () => { active = false; container.classList.remove('grabbing'); };
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.relic-card-big')) return;
      active = true;
      container.classList.add('grabbing');
      startY = e.pageY;
      startScrollTop = container.scrollTop;
    });
    container.addEventListener('mousemove', (e) => {
      if (!active) return;
      e.preventDefault();
      container.scrollTop = startScrollTop - (e.pageY - startY);
    });
    container.addEventListener('mouseup', end);
    container.addEventListener('mouseleave', end);
  }

  // ─────────────── roster ───────────────

  DS.UI.registerScreen('characters', {
    render() {
      // Outer wrapper is full-bleed (no max-width) so the backdrop image covers the
      // whole stage edge-to-edge; the actual content stays in a max-width inner
      // column (.screen-inner) for readability, same as before.
      const outer = el('div', 'screen characters-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('characters')));
      const wrap = el('div', 'screen-inner');
      const header = el('div', 'screen-header', [
        el('h2', null, 'Company of Ash'),
        el('div', 'hint', Object.keys(DS.State.roster).length + '/' + (DS.CHARACTERS || []).length + ' souls sworn'),
      ]);
      wrap.appendChild(header);

      // Filters — full-size buttons (no more '.small'), so the element/path chips
      // read clearly instead of disappearing as tiny text.
      const filters = el('div', 'row roster-filters');
      const mkFilter = (label, key, value) => {
        const active = rosterFilter[key] === value;
        const b = el('button', active ? 'primary' : 'ghost', label);
        b.onclick = () => { rosterFilter[key] = active ? null : value; DS.UI.rerender(); };
        return b;
      };
      DS.ELEMENTS.forEach((e) => filters.appendChild(mkFilter([DS.C.elementIcon(e), ' ' + e], 'element', e)));
      wrap.appendChild(filters);
      const filters2 = el('div', 'row roster-filters');
      Object.keys(DS.PATHS).forEach((pth) => filters2.appendChild(mkFilter([DS.C.pathIcon(pth), ' ' + pth], 'path', pth)));
      wrap.appendChild(filters2);

      const grid = el('div', 'roster-grid');
      const owned = Object.keys(DS.State.roster)
        .map((id) => DS.C.findChar(id)).filter(Boolean)
        .filter((c) => (!rosterFilter.element || c.element === rosterFilter.element) && (!rosterFilter.path || c.path === rosterFilter.path))
        .sort((a, b) => DS.Progression.charPower(b.id) - DS.Progression.charPower(a.id) || b.rarity - a.rarity || a.name.localeCompare(b.name));
      owned.forEach((c) => {
        grid.appendChild(DS.C.charCard(c.id, {
          full: true,
          showPower: true,
          onClick: () => { detailTab = 'stats'; DS.UI.navigate('characterDetail', { charId: c.id }); },
        }));
      });
      if (!owned.length) grid.appendChild(DS.C.emptyState('No warriors match that call.'));
      wrap.appendChild(grid);
      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── detail ───────────────

  function statRow(label, value, extra) {
    return el('div', 'row spread stat-row', [el('span', 'text-dim', label), el('span', null, String(value) + (extra || ''))]);
  }

  function fmtPct(v) { return (v * 100).toFixed(1) + '%'; }

  function renderStats(c, r) {
    const s = DS.Progression.computeStats(c.id);
    const box = el('div', 'detail-panel');
    box.appendChild(el('div', 'power-line', ['Power ', el('b', 'text-gold', String(DS.Progression.charPower(c.id)))]));
    box.appendChild(statRow('HP', s.hp));
    box.appendChild(statRow('ATK', s.atk));
    box.appendChild(statRow('DEF', s.def));
    box.appendChild(statRow('SPD', s.spd));
    box.appendChild(statRow('CRIT Rate', fmtPct(s.critRate)));
    box.appendChild(statRow('CRIT DMG', fmtPct(s.critDmg)));
    if (s.breakEffect) box.appendChild(statRow('Break Effect', fmtPct(s.breakEffect)));
    if (s.healBoost) box.appendChild(statRow('Healing Boost', fmtPct(s.healBoost)));
    if (s.energyRegen) box.appendChild(statRow('Energy Regen', fmtPct(s.energyRegen)));
    Object.keys(s.dmgBoost || {}).forEach((elm) => box.appendChild(statRow(elm + ' DMG', fmtPct(s.dmgBoost[elm]))));
    box.appendChild(el('hr', 'hr-ornate'));
    box.appendChild(el('p', 'small text-dim italic', c.lore));
    return box;
  }

  function renderLevel(c, r) {
    const box = el('div', 'detail-panel');
    const ascCap = DS.LEVEL_CAPS[r.asc || 0];
    const cap = DS.Progression.charLevelCap(c.id);
    const need = DS.CURVES.charXp(r.level);
    box.appendChild(el('div', 'row spread', [el('h3', null, 'Level ' + r.level + ' / ' + cap), el('span', 'small text-dim', 'Ascension ' + (r.asc || 0))]));
    box.appendChild(DS.C.statBar({ cls: 'xp', cur: r.exp, max: need, label: r.exp + ' / ' + need + ' EXP' }));
    if (cap < ascCap && r.level >= cap) {
      box.appendChild(el('p', 'small text-dim italic', 'Locked — reach Bonfire Level ' + (cap + 1) + ' to raise this cap further.'));
    }
    box.appendChild(el('div', 'section-title', 'Offer Souls'));
    const feedRow = el('div', 'row');
    ['soul_small', 'soul_large', 'soul_hero'].forEach((id) => {
      const count = DS.State.inventory.items[id] || 0;
      const def = DS.C.findItem(id);
      const card = DS.C.itemCard(id, {
        count,
        onClick: () => {
          if (count <= 0) { DS.C.toast('None to offer.', { icon: '👻', img: DS.Assets && DS.Assets.currency('souls') }); return; }
          if (r.level >= cap) {
            const msg = cap < ascCap
              ? 'Reach Bonfire Level ' + (cap + 1) + ' before they can grow further.'
              : 'They must ascend before growing further.';
            DS.C.toast(msg, { icon: '🔥', img: DS.Assets && DS.Assets.hub('flame') });
            return;
          }
          DS.Inventory.removeItem(id, 1);
          const res = DS.Progression.gainCharExp(c.id, def.xp || 500);
          if (res.levels > 0) DS.SFX.play('chime');
          DS.UI.rerender();
        },
      });
      feedRow.appendChild(card);
    });
    box.appendChild(feedRow);

    const haveAnySoul = ['soul_small', 'soul_large', 'soul_hero'].some((id) => (DS.State.inventory.items[id] || 0) > 0);
    const maxBtn = el('button', 'ghost', 'Level to Max');
    maxBtn.disabled = r.level >= cap || !haveAnySoul;
    maxBtn.onclick = () => {
      const res = DS.Progression.feedSoulsToMax(c.id);
      if (!res.ok) { DS.C.toast(res.reason, { icon: '⚠' }); return; }
      if (res.levels > 0) DS.SFX.play('chime');
      const msg = res.atCap
        ? c.name + ' reaches Lv.' + res.level + ' (cap).'
        : c.name + ' reaches Lv.' + res.level + ' — out of souls to offer.';
      DS.C.toast(msg, { icon: '🔥', img: DS.Assets && DS.Assets.hub('flame') });
      DS.UI.rerender();
    };
    box.appendChild(maxBtn);

    // Ascension.
    box.appendChild(el('div', 'section-title', 'Ascension'));
    const info = DS.Progression.ascendCost(c.id);
    if (!info) {
      box.appendChild(el('p', 'small text-gold', 'They stand at the summit of mortal strength.'));
    } else {
      const chk = DS.Progression.canAscend(c.id);
      const costRow = el('div', 'row small');
      costRow.appendChild(el('span', 'badge', [DS.C.currencyIcon('souls'), ' ' + info.cost.souls.toLocaleString()]));
      Object.entries(info.cost.items || {}).forEach(([id, n]) => {
        const d = DS.C.findItem(id);
        const have = DS.State.inventory.items[id] || 0;
        const chip = el('span', 'badge' + (have < n ? ' text-danger' : ''), [DS.C.itemIcon(id), ' ' + (d ? d.name : id) + ' ' + have + '/' + n]);
        costRow.appendChild(chip);
      });
      box.appendChild(costRow);
      box.appendChild(el('p', 'small text-dim', 'Requires level ' + info.levelReq + '. Raises the cap to ' + info.newCap + ' and deepens base strength.'));
      const btn = el('button', 'primary', 'Ascend');
      btn.disabled = !chk.ok;
      if (!chk.ok) box.appendChild(el('div', 'small text-danger', chk.reason));
      btn.onclick = () => {
        const res = DS.Progression.ascend(c.id);
        if (res.ok) { DS.SFX.play('legendary'); DS.C.toast(c.name + ' ascends! Cap: ' + res.newCap, { icon: '🔥', img: DS.Assets && DS.Assets.hub('flame') }); DS.UI.rerender(); }
        else DS.C.toast(res.reason, { icon: '⚠' });
      };
      box.appendChild(btn);
    }
    return box;
  }

  function renderTraces(c, r) {
    const box = el('div', 'detail-panel');
    const tree = DS.TRACES[c.id];
    if (!tree) { box.appendChild(DS.C.emptyState('No traces recorded.')); return box; }
    const byTier = { 1: [], 2: [], 3: [] };
    tree.nodes.forEach((n) => byTier[n.tier || 1].push(n));
    [1, 2, 3].forEach((tier) => {
      if (!byTier[tier].length) return;
      box.appendChild(el('div', 'section-title', 'Tier ' + tier));
      const row = el('div', 'trace-row');
      byTier[tier].forEach((n) => {
        const unlocked = !!r.traces[n.id];
        const reqMet = (n.requires || []).every((q) => r.traces[q]);
        const node = el('div', 'trace-node' + (unlocked ? ' unlocked' : reqMet ? ' available' : ' locked'));
        node.appendChild(el('div', 'trace-name', n.name));
        node.appendChild(el('div', 'small text-dim', n.desc));
        if (!unlocked) {
          const costRow = el('div', 'row small');
          costRow.appendChild(el('span', 'badge', [DS.C.currencyIcon('souls'), ' ' + (n.cost.souls || 0).toLocaleString()]));
          Object.entries(n.cost.items || {}).forEach(([id, cnt]) => {
            const have = DS.State.inventory.items[id] || 0;
            costRow.appendChild(el('span', 'badge' + (have < cnt ? ' text-danger' : ''), [DS.C.itemIcon(id), ' ' + have + '/' + cnt]));
          });
          node.appendChild(costRow);
          if (reqMet) {
            const btn = el('button', 'small primary', 'Kindle');
            btn.onclick = () => {
              const res = DS.Progression.unlockTrace(c.id, n.id);
              if (res.ok) { DS.SFX.play('chime'); DS.UI.rerender(); }
              else DS.C.toast(res.reason, { icon: '⚠' });
            };
            node.appendChild(btn);
          }
        } else {
          node.appendChild(el('div', 'small text-gold', '✦ Kindled'));
        }
        row.appendChild(node);
      });
      box.appendChild(row);
    });
    return box;
  }

  function abilityBlock(title, ab, mult) {
    if (!ab) return null;
    const b = el('div', 'ability-block');
    b.appendChild(el('div', 'row spread', [el('h3', null, title + ' — ' + ab.name), ab.energyCost ? el('span', 'badge', '✦ ' + ab.energyCost) : null]));
    b.appendChild(el('p', 'small text-dim', ab.desc || ''));
    if (typeof ab.power === 'number' && ab.power > 0) {
      const shown = Math.round(ab.power * (mult || 1) * 100);
      b.appendChild(el('div', 'small', ['Power: ', el('b', 'text-gold', shown + '%'), (mult && mult > 1) ? el('span', 'text-heal', '  (traces +' + Math.round((mult - 1) * 100) + '%)') : null, ab.hits > 1 ? '  ×' + ab.hits + ' hits' : '']));
    }
    return b;
  }

  function renderAbilities(c, r) {
    const box = el('div', 'detail-panel');
    box.appendChild(abilityBlock('Basic', c.basic, DS.Progression.tracePowerMult(c.id, 'basic')));
    box.appendChild(abilityBlock('Skill', c.skill, DS.Progression.tracePowerMult(c.id, 'skill')));
    box.appendChild(abilityBlock('Ultimate', c.ult, DS.Progression.tracePowerMult(c.id, 'ult')));
    const t = el('div', 'ability-block');
    t.appendChild(el('h3', null, 'Talent — ' + c.talent.name));
    t.appendChild(el('p', 'small text-dim', c.talent.desc));
    box.appendChild(t);
    const q = el('div', 'ability-block');
    q.appendChild(el('h3', null, 'Technique — ' + c.technique.name));
    q.appendChild(el('p', 'small text-dim', c.technique.desc));
    box.appendChild(q);
    return box;
  }

  function renderWeapon(c, r) {
    const box = el('div', 'detail-panel');
    const w = r.weaponUid ? DS.State.inventory.weapons[r.weaponUid] : null;
    const wdef = w ? DS.C.findWeaponDef(w.defId) : null;

    if (w && wdef) {
      box.appendChild(el('div', 'row', [
        DS.C.weaponCard(w.uid, {}),
        el('div', 'grow', [
          el('h3', null, wdef.name + '  ·  Lv.' + w.level + (w.refine > 1 ? '  ·  Refine ' + w.refine : '')),
          el('p', 'small text-dim italic', wdef.lore),
          el('p', 'small', el('b', 'text-gold', wdef.passive.name)),
          DS.C.weaponStatsSummary(w.uid),
        ]),
      ]));
      // Feed titanite / refine — shared with the Bottomless Box's weapon detail view.
      box.appendChild(DS.C.weaponUpgradeControls(w.uid, { onChange: () => DS.UI.rerender() }));

      const unequip = el('button', 'ghost small', 'Unequip');
      unequip.onclick = () => { DS.Inventory.equipWeapon(c.id, null); DS.UI.rerender(); };
      box.appendChild(unequip);
    } else {
      box.appendChild(DS.C.emptyState('Bare-handed. Choose a weapon of the ' + c.path + ' path.'));
    }

    box.appendChild(el('div', 'section-title', 'Armory (' + c.path + ' path)'));
    const list = el('div', 'row');
    Object.values(DS.State.inventory.weapons)
      .filter((x) => { const d = DS.C.findWeaponDef(x.defId); return d && d.path === c.path && (!w || x.uid !== w.uid); })
      .sort((a, b) => (DS.C.findWeaponDef(b.defId).rarity - DS.C.findWeaponDef(a.defId).rarity))
      .forEach((x) => {
        list.appendChild(DS.C.weaponCard(x.uid, {
          onClick: () => {
            const res = DS.Inventory.equipWeapon(c.id, x.uid);
            if (res.ok) { DS.SFX.play('ui'); DS.UI.rerender(); } else DS.C.toast(res.reason, { icon: '⚠' });
          },
        }));
      });
    if (!list.children.length) list.appendChild(el('div', 'small text-faint italic', 'None owned yet — summon or craft weapons of this path.'));
    box.appendChild(list);
    return box;
  }

  function renderRelics(c, r) {
    const box = el('div', 'detail-panel');
    // Set bonus summary — the stats granted by whatever's currently equipped.
    const counts = {};
    DS.SLOTS.forEach((slot) => {
      const uid = r.relics[slot];
      const rel = uid ? DS.State.inventory.relics[uid] : null;
      if (rel) counts[rel.setId] = (counts[rel.setId] || 0) + 1;
    });
    const bonusBox = el('div', 'small');
    Object.entries(counts).forEach(([setId, n]) => {
      const set = (DS.RELIC_SETS || []).find((s) => s.id === setId);
      if (!set) return;
      const setIconUrl = DS.Assets ? DS.Assets.relicPiece(setId, 'helm') : null;
      const setIcon = () => {
        if (!setIconUrl) return document.createTextNode(set.art.icon);
        const img = document.createElement('img');
        img.className = 'inline-icon-art';
        img.src = setIconUrl;
        img.alt = '';
        img.onerror = () => { img.replaceWith(document.createTextNode(set.art.icon)); };
        return img;
      };
      if (n >= 2) bonusBox.appendChild(el('div', 'text-heal', [setIcon(), ' ' + set.name + ' (2pc): ' + set.bonus2.desc]));
      if (n >= 4) bonusBox.appendChild(el('div', 'text-heal', [setIcon(), ' ' + set.name + ' (4pc): ' + set.bonus4.desc]));
    });

    // Equipped slots (left, main column) + Relic Stats (right, side column) —
    // the set-bonus summary used to sit stacked above the slots; it's its own box
    // beside them now so both are visible without scrolling past one another.
    const row = el('div', 'relic-tab-row');
    const mainCol = el('div', 'relic-tab-main');
    const sideCol = el('div', 'relic-tab-side');

    mainCol.appendChild(el('div', 'section-title', 'Equipped'));
    const slotsGrid = el('div', 'relic-slots-grid');
    DS.SLOTS.forEach((slot) => {
      const uid = r.relics[slot];
      const cell = el('div', 'relic-slot-cell');
      cell.appendChild(el('div', 'small text-faint relic-slot-label', slot.toUpperCase()));
      if (uid && DS.State.inventory.relics[uid]) {
        cell.appendChild(DS.C.relicCard(uid, { iconOnly: true, width: '128px' }));
        const colBtns = DS.C.relicEnhanceControls(uid, { onChange: () => DS.UI.rerender() });
        const off = el('button', 'ghost small', 'Remove');
        off.onclick = () => { DS.Inventory.unequipRelic(c.id, slot); DS.UI.rerender(); };
        colBtns.appendChild(off);
        cell.appendChild(colBtns);
      } else {
        cell.appendChild(el('div', 'relic-slot-empty small text-faint italic', 'Drop a relic here'));
      }
      if (slot === justEquippedSlot) {
        cell.classList.add('just-equipped');
        justEquippedSlot = null;
      }
      cell.ondragover = (e) => {
        if (draggingRelic && draggingRelic.slot === slot) { e.preventDefault(); cell.classList.add('drop-hover'); }
      };
      cell.ondragleave = () => cell.classList.remove('drop-hover');
      cell.ondrop = (e) => {
        e.preventDefault();
        cell.classList.remove('drop-hover');
        if (!draggingRelic || draggingRelic.slot !== slot) return;
        const res = DS.Inventory.equipRelic(c.id, draggingRelic.uid);
        if (res.ok) {
          const r = cell.getBoundingClientRect();
          DS.C.relicEquipBurst(r.left + r.width / 2, r.top + r.height / 2);
          DS.SFX.play('ui');
          justEquippedSlot = slot;
          DS.UI.rerender();
        }
      };
      slotsGrid.appendChild(cell);
    });
    mainCol.appendChild(slotsGrid);

    sideCol.appendChild(el('div', 'section-title', 'Relic Stats'));
    if (bonusBox.children.length) sideCol.appendChild(bonusBox);
    else sideCol.appendChild(el('p', 'small text-faint italic', 'Equip 2 or 4 pieces of a set to unlock its bonus.'));

    // Combined main-stat + sub-stat totals across every currently equipped relic.
    const statTotals = {};
    DS.SLOTS.forEach((slot) => {
      const uid = r.relics[slot];
      const rel = uid ? DS.State.inventory.relics[uid] : null;
      if (!rel) return;
      statTotals[rel.mainStat.key] = (statTotals[rel.mainStat.key] || 0) + rel.mainStat.value;
      (rel.subStats || []).forEach((s) => { statTotals[s.key] = (statTotals[s.key] || 0) + s.value; });
    });
    sideCol.appendChild(el('div', 'section-title', 'Equipped Totals'));
    const totalsKeys = Object.keys(statTotals);
    if (totalsKeys.length) {
      totalsKeys.forEach((key) => {
        const line = el('div', 'stat-row row');
        line.appendChild(el('span', 'text-dim grow', DS.STAT_LABEL[key] || key));
        line.appendChild(el('span', null, '+' + DS.C.fmtStat(key, statTotals[key])));
        sideCol.appendChild(line);
      });
    } else {
      sideCol.appendChild(el('p', 'small text-faint italic', 'Equip relics to see their combined stats.'));
    }

    row.appendChild(mainCol);
    row.appendChild(sideCol);
    box.appendChild(row);

    // ── Table 2: the relic collection — every unequipped relic, draggable onto a slot above. ──
    box.appendChild(el('div', 'section-title', 'Relic Collection'));
    const collection = Object.values(DS.State.inventory.relics)
      .filter((x) => !x.equippedBy)
      .sort((a, b) => b.rarity - a.rarity || b.level - a.level);
    const strip = el('div', 'relic-collection-strip');
    if (!collection.length) {
      strip.appendChild(DS.C.emptyState('No unequipped relics. Clear Covenant Trials to earn more.'));
    } else {
      collection.forEach((x) => {
        const card = DS.C.relicCard(x.uid, { iconOnly: true, width: '110px' });
        card.draggable = true;
        card.ondragstart = (e) => {
          draggingRelic = { uid: x.uid, slot: x.slot };
          e.dataTransfer.setData('text/plain', x.uid);
          e.dataTransfer.effectAllowed = 'move';
          card.classList.add('dragging');
        };
        card.ondragend = () => { draggingRelic = null; card.classList.remove('dragging'); };
        strip.appendChild(card);
      });
    }
    attachDragScroll(strip);
    box.appendChild(strip);
    return box;
  }

  function renderRemembrance(c, r) {
    const box = el('div', 'detail-panel');
    box.appendChild(el('p', 'small text-dim italic', 'Duplicate summons kindle Remembrance — echoes of the same soul, folded back in.'));
    const list = c.remembrance || [];
    for (let i = 0; i < list.length; i += 3) {
      const row = el('div', 'trace-row');
      list.slice(i, i + 3).forEach((rem) => {
        const unlocked = (r.remembrance || 0) >= rem.level;
        const node = el('div', 'trace-node' + (unlocked ? ' unlocked' : ' locked'));
        node.appendChild(el('div', 'trace-name', 'R' + rem.level + ' — ' + rem.name));
        node.appendChild(el('div', 'small text-dim', rem.desc));
        if (unlocked) node.appendChild(el('div', 'small text-gold', '✦ Kindled'));
        row.appendChild(node);
      });
      box.appendChild(row);
    }
    return box;
  }

  // Only shown once at least one skin's been bought for this character (see
  // buyCardSkin() in hub-ui.js) — an unpurchased character has nothing to toggle,
  // so the tab itself stays absent rather than showing an empty locked state.
  function renderSkins(c, r) {
    const box = el('div', 'detail-panel');
    box.appendChild(el('p', 'small text-dim italic', 'Toggle freely between owned card skins — purely cosmetic, no stat change either way.'));
    const grid = el('div', 'row skin-grid');

    function skinOptionCard(label, previewNode, isEquipped, onClick) {
      const card = el('div', 'ds-card skin-option' + (isEquipped ? ' selected' : ''));
      card.style.width = '140px';
      const preview = el('div', 'skin-option-preview');
      preview.appendChild(previewNode);
      card.appendChild(preview);
      card.appendChild(el('div', 'small', label));
      if (isEquipped) card.appendChild(el('div', 'small text-gold', '✦ Equipped'));
      card.onclick = onClick;
      return card;
    }

    const equippedSkin = DS.Cosmetics ? DS.Cosmetics.equipped(c.id) : null;
    grid.appendChild(skinOptionCard(
      'Default',
      DS.C.portrait(c, { size: 110, rarity: c.rarity, element: c.element, ignoreSkin: true }),
      !equippedSkin,
      () => { DS.Cosmetics.equip(c.id, null); DS.UI.rerender(); },
    ));

    (DS.Cosmetics ? DS.Cosmetics.ownedSkinsFor(c.id) : []).forEach((skin) => {
      let previewNode;
      if (skin.type === 'animated' && skin.video) {
        previewNode = document.createElement('video');
        previewNode.src = skin.video;
        previewNode.autoplay = true; previewNode.loop = true; previewNode.muted = true; previewNode.playsInline = true;
        previewNode.className = 'skin-option-preview-art';
      } else {
        previewNode = document.createElement('img');
        previewNode.src = skin.image;
        previewNode.alt = '';
        previewNode.className = 'skin-option-preview-art';
      }
      grid.appendChild(skinOptionCard(
        skin.name,
        previewNode,
        equippedSkin && equippedSkin.id === skin.id,
        () => { DS.Cosmetics.equip(c.id, skin.id); DS.UI.rerender(); },
      ));
    });

    box.appendChild(grid);
    return box;
  }

  DS.UI.registerScreen('characterDetail', {
    render(params) {
      const c = DS.C.findChar(params.charId);
      const r = DS.State.roster[params.charId];
      const outer = el('div', 'screen char-detail-screen');
      if (!c || !r) { outer.appendChild(DS.C.emptyState('That soul is not sworn to you.')); return outer; }

      // Full-bleed backdrop behind every tab: the character's own portrait art,
      // heavily blurred and darkened so it reads as ambience rather than
      // competing with the (sharp) portrait rendered in the hero row above it.
      const bgUrl = DS.Assets ? DS.Assets.portrait(c.id) : null;
      if (bgUrl) {
        const bg = document.createElement('img');
        bg.className = 'char-detail-bg';
        bg.alt = '';
        bg.src = bgUrl;
        outer.appendChild(bg);
        outer.appendChild(el('div', 'char-detail-bg-scrim'));
      }
      const wrap = el('div', 'screen-inner');
      outer.appendChild(wrap);

      const hero = el('div', 'char-hero panel-ornate');
      hero.appendChild(DS.C.portrait(c, { size: 120, rarity: c.rarity, element: c.element }));
      const info = el('div', 'grow', [
        el('div', 'stars', '★'.repeat(c.rarity)),
        el('h2', null, c.name),
        el('div', 'text-dim italic', c.title),
        el('div', 'row small', [
          el('span', 'badge', [DS.C.elementIcon(c.element), ' ' + c.element]),
          el('span', 'badge', [DS.C.pathIcon(c.path), ' ' + c.path]),
          el('span', 'badge', 'Lv.' + r.level),
          el('span', 'badge', 'R' + (r.remembrance || 0)),
        ]),
      ]);
      hero.appendChild(info);
      wrap.appendChild(hero);

      // Skins tab only exists once at least one skin's been bought for THIS
      // character (see buyCardSkin() in hub-ui.js) — appears the moment that
      // happens rather than being a permanent, mostly-empty tab.
      const hasSkins = DS.Cosmetics && DS.Cosmetics.ownedSkinsFor(c.id).length > 0;
      if (detailTab === 'skins' && !hasSkins) detailTab = 'stats';
      const tabDefs = [
        { id: 'stats', label: 'Stats' },
        { id: 'level', label: 'Level & Ascend' },
        { id: 'traces', label: 'Traces' },
        { id: 'abilities', label: 'Arts' },
        { id: 'weapon', label: 'Weapon' },
        { id: 'relics', label: 'Relics' },
        { id: 'remembrance', label: 'Remembrance' },
      ];
      if (hasSkins) tabDefs.push({ id: 'skins', label: 'Skins' });
      const tabs = DS.C.tabs(tabDefs, (id) => { detailTab = id; DS.UI.rerender(); }, detailTab);
      wrap.appendChild(tabs.root);

      const body = { stats: renderStats, level: renderLevel, traces: renderTraces, abilities: renderAbilities, weapon: renderWeapon, relics: renderRelics, remembrance: renderRemembrance, skins: renderSkins }[detailTab];
      wrap.appendChild(body(c, r));
      return outer;
    },
  });
})();
