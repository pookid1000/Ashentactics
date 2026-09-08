// ASHEN TACTICS — inventory (Bottomless Box) screen (CONTRACT.md §6.4).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);
  let invTab = 'materials';
  let salvagePick = new Set();

  // Ascension materials are spent by the Progression engine (character ascend) — call
  // them out explicitly since nothing else describes their purpose.
  const ASCENSION_MATS = ['ember_asc_1', 'ember_asc_2', 'ember_asc_3', 'demon_core', 'boss_soul_fragment'];

  // Builds the "explanation" line shown under an item's flavor text — a concrete,
  // data-derived statement of what the item actually does, so it can never drift out
  // of sync with the recipes/systems that consume it the way hand-written text would.
  function explainItem(def) {
    const parts = [];
    if (def.use) {
      const bits = [];
      if (def.use.estus) bits.push('restores ' + def.use.estus + ' Estus');
      if (def.use.humanity) bits.push('grants ' + def.use.humanity + ' Humanity');
      if (def.use.souls) bits.push('grants ' + def.use.souls.toLocaleString() + ' Souls');
      if (bits.length) parts.push('Consuming this ' + bits.join(' and ') + '.');
    }
    if (def.xp) parts.push('Offer to a character for ' + def.xp.toLocaleString() + ' EXP.');
    if (def.weaponXp) parts.push('Feed to a weapon for ' + def.weaponXp.toLocaleString() + ' EXP.');
    if (ASCENSION_MATS.includes(def.id)) parts.push('Spent, alongside souls, to ascend a warrior past a level cap.');
    if (def.id === 'titanite_slab') parts.push('Spent at a weapon’s Refine step to raise its rank without a duplicate.');
    if (def.id === 'relic_dust') parts.push('Feed to an equipped relic to raise its Attunement level.');
    return parts.join(' ');
  }

  function renderMaterials(kindFilter) {
    const box = el('div', 'detail-panel');
    const grid = el('div', 'row');
    const entries = Object.entries(DS.State.inventory.items)
      .map(([id, count]) => ({ def: DS.C.findItem(id), count }))
      .filter((x) => x.def && x.count > 0)
      .filter((x) => kindFilter === 'consumables' ? x.def.kind === 'consumable' : x.def.kind !== 'consumable')
      .sort((a, b) => b.def.rarity - a.def.rarity);
    entries.forEach(({ def, count }) => {
      grid.appendChild(DS.C.itemCard(def, {
        width: '150px',
        count,
        onClick: () => {
          const content = [el('p', 'detail-desc', def.lore || '')];
          const effect = explainItem(def);
          if (effect) content.push(el('p', 'detail-effect', effect));
          const body = DS.C.detailLayout(DS.Assets ? DS.Assets.item(def.id) : null, content, { fallbackName: def.name });
          const actions = [{ label: 'Close', cls: 'ghost' }];
          if (def.use) {
            const useN = (n) => {
              const res = DS.Inventory.useConsumable(def.id, n);
              if (res.ok) { DS.C.rewardsPopup(res.summary, { title: def.name }); DS.UI.refreshTopBar(); setTimeout(() => DS.UI.rerender(), 80); }
              else DS.C.toast(res.reason, { icon: '⚠' });
            };
            actions.unshift({ label: 'Use ×10', cls: 'ghost', onClick: () => useN(10) });
            actions.unshift({ label: 'Use ×1', cls: 'primary', onClick: () => useN(1) });
          }
          DS.C.modal({ title: def.name, body, actions, wide: true });
        },
      }));
    });
    if (!entries.length) grid.appendChild(DS.C.emptyState('Empty pockets. The world provides — violently.'));
    box.appendChild(grid);
    return box;
  }

  function openWeaponDetail(uid) {
    const w = DS.State.inventory.weapons[uid];
    if (!w) return;
    const def = DS.C.findWeaponDef(w.defId);
    if (!def) return;
    let modalHandle;
    const refresh = () => { modalHandle.close(); openWeaponDetail(uid); DS.UI.rerender(); };

    const content = [
      el('p', 'small text-dim', 'Lv.' + w.level + (w.refine > 1 ? ' · Refine ' + w.refine : '') + (w.equippedBy ? ' · Equipped by ' + (DS.C.findChar(w.equippedBy) || { name: w.equippedBy }).name : '')),
      el('p', 'detail-desc', def.lore),
      el('p', 'detail-effect', el('b', null, def.passive.name)),
      DS.C.weaponStatsSummary(uid),
      el('hr', 'hr-ornate'),
      DS.C.weaponUpgradeControls(uid, { onChange: refresh }),
    ];
    const body = DS.C.detailLayout(DS.Assets ? DS.Assets.weapon(def.id) : null, content, { fallbackName: def.name });
    const actions = [];
    if (w.equippedBy) {
      actions.push({ label: 'Unequip', cls: 'ghost', onClick: () => { DS.Inventory.equipWeapon(w.equippedBy, null); refresh(); } });
    }
    actions.push({ label: w.locked ? 'Unlock' : 'Lock', cls: 'ghost', onClick: () => { w.locked = !w.locked; DS.Save.persist(); refresh(); } });
    actions.push({ label: 'Close' });
    modalHandle = DS.C.modal({ title: def.name, body, actions, wide: true });
  }

  function renderWeapons() {
    const box = el('div', 'detail-panel');
    const grid = el('div', 'row');
    const list = Object.values(DS.State.inventory.weapons)
      .sort((a, b) => (DS.C.findWeaponDef(b.defId) || {}).rarity - (DS.C.findWeaponDef(a.defId) || {}).rarity);
    list.forEach((w) => {
      grid.appendChild(DS.C.weaponCard(w.uid, {
        width: '170px',
        onClick: () => openWeaponDetail(w.uid),
      }));
    });
    if (!list.length) grid.appendChild(DS.C.emptyState('No weapons yet. The rites of summoning provide.'));
    box.appendChild(grid);
    return box;
  }

  function openRelicDetail(uid) {
    const rel = DS.State.inventory.relics[uid];
    if (!rel) return;
    const set = (DS.RELIC_SETS || []).find((s) => s.id === rel.setId);
    const pieceName = set && set.pieces && set.pieces[rel.slot] ? set.pieces[rel.slot].name : rel.slot;
    const iconUrl = set && DS.Assets ? (DS.Assets.relicPiece(set.id, rel.slot) || DS.Assets.relic(set.id)) : null;

    const content = [];
    content.push(el('p', 'small text-dim', (set ? set.name : '') + (DS.SLOTS.includes(rel.slot) ? ' · ' + rel.slot : '')));
    content.push(DS.C.rarityStars(rel.rarity));
    const mainLabel = DS.STAT_LABEL[rel.mainStat.key] || rel.mainStat.key;
    content.push(el('p', 'detail-effect', [el('b', null, mainLabel + ' '), DS.C.fmtStat(rel.mainStat.key, rel.mainStat.value)]));
    (rel.subStats || []).forEach((s) => {
      content.push(el('p', 'small text-dim', (DS.STAT_LABEL[s.key] || s.key) + ' +' + DS.C.fmtStat(s.key, s.value)));
    });
    if (rel.equippedBy) {
      const eqDef = DS.C.findChar(rel.equippedBy);
      content.push(el('p', 'small text-faint', 'Equipped: ' + (eqDef ? eqDef.name.split(',')[0] : rel.equippedBy)));
    }
    content.push(el('hr', 'hr-ornate'));
    content.push(DS.C.relicEnhanceControls(uid, {
      onChange: () => { modalHandle.close(); openRelicDetail(uid); DS.UI.rerender(); },
    }));

    const body = DS.C.detailLayout(iconUrl, content, { fallbackName: pieceName });
    const modalHandle = DS.C.modal({ title: pieceName, body, actions: [{ label: 'Close' }], wide: true });
  }

  function renderRelicsTab() {
    const box = el('div', 'detail-panel');
    const info = el('div', 'row spread');
    const count = DS.Inventory.relicCount();
    info.appendChild(el('div', 'col', [
      el('span', 'small text-dim', 'Click a relic for its stats and to attune it. Use the corner dot to pick relics for salvage.'),
      el('span', 'small ' + (count >= DS.Inventory.MAX_RELICS ? 'text-danger' : 'text-faint'),
        count + ' / ' + DS.Inventory.MAX_RELICS + ' relics — salvage old ones into Grave Dust to make room for new ones.'),
    ]));
    const salvBtn = el('button', 'danger small', 'Salvage selected (' + salvagePick.size + ')');
    salvBtn.disabled = !salvagePick.size;
    salvBtn.onclick = async () => {
      const yes = await DS.C.confirm('Grind ' + salvagePick.size + ' relic(s) to dust? This cannot be undone.', { danger: true, okLabel: 'Salvage' });
      if (!yes) return;
      const res = DS.Inventory.salvage([...salvagePick]);
      salvagePick.clear();
      if (res.ok) DS.C.toast('Grave Dust +' + res.dust, { icon: '⚱', img: DS.Assets && DS.Assets.item('relic_dust') });
      DS.UI.rerender();
    };
    info.appendChild(salvBtn);
    box.appendChild(info);
    const grid = el('div', 'row');
    const list = Object.values(DS.State.inventory.relics).sort((a, b) => b.rarity - a.rarity || b.level - a.level);
    list.forEach((rel) => {
      grid.appendChild(DS.C.relicCard(rel.uid, {
        iconOnly: true,
        width: '160px',
        selectable: true,
        selected: salvagePick.has(rel.uid),
        onToggleSelect: () => {
          if (rel.equippedBy) { DS.C.toast('Equipped relics cannot be salvaged.', { icon: '⚠' }); return; }
          if (salvagePick.has(rel.uid)) salvagePick.delete(rel.uid);
          else salvagePick.add(rel.uid);
          DS.UI.rerender();
        },
        onClick: () => openRelicDetail(rel.uid),
      }));
    });
    if (!list.length) grid.appendChild(DS.C.emptyState('No relics yet. Clear Covenant Trials to earn them.'));
    box.appendChild(grid);
    return box;
  }

  DS.UI.registerScreen('inventory', {
    render() {
      // Outer wrapper is full-bleed (no max-width) so the backdrop image covers the
      // whole stage edge-to-edge; the actual content stays in a max-width inner
      // column (.screen-inner) for readability, same as before.
      const outer = el('div', 'screen bottomless-box');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('inventory')));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Bottomless Box')]));
      const tabs = DS.C.tabs([
        { id: 'materials', label: 'Materials' },
        { id: 'consumables', label: 'Consumables' },
        { id: 'weapons', label: 'Weapons' },
        { id: 'relics', label: 'Relics' },
      ], (id) => { invTab = id; salvagePick.clear(); DS.UI.rerender(); }, invTab);
      wrap.appendChild(tabs.root);
      if (invTab === 'weapons') wrap.appendChild(renderWeapons());
      else if (invTab === 'relics') wrap.appendChild(renderRelicsTab());
      else wrap.appendChild(renderMaterials(invTab));
      outer.appendChild(wrap);
      return outer;
    },
  });
})();
