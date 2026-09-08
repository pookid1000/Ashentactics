// ASHEN TACTICS — title, home hub, world map, settings (CONTRACT.md §6.4).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);

  // ─────────────── title ───────────────

  DS.UI.registerScreen('title', {
    render() {
      const wrap = el('div', 'title-screen');
      // Drifting embers (CSS-animated).
      const embers = el('div', 'title-embers');
      for (let i = 0; i < (DS.State.settings.reduceMotion ? 4 : 22); i++) {
        const e = el('div', 'title-ember');
        e.style.left = Math.random() * 100 + '%';
        e.style.animationDelay = (Math.random() * 9) + 's';
        e.style.animationDuration = (7 + Math.random() * 8) + 's';
        e.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
        embers.appendChild(e);
      }
      wrap.appendChild(embers);
      const logoUrl = DS.Assets ? DS.Assets.titleLogo() : null;
      if (logoUrl) {
        const logoImg = document.createElement('img');
        logoImg.className = 'title-logo-art';
        logoImg.src = logoUrl;
        logoImg.alt = 'Ashen Tactics: Embers of Lordran';
        wrap.appendChild(logoImg);
      } else {
        wrap.appendChild(el('div', 'title-flame', '🔥'));
        wrap.appendChild(el('h1', 'title-logo', 'ASHEN TACTICS'));
        wrap.appendChild(el('div', 'title-sub', 'EMBERS OF LORDRAN'));
      }
      const start = el('button', 'primary big title-start', 'Touch the Bonfire');
      // First click of the game — the only guaranteed user gesture to unlock audio autoplay,
      // so the hub theme kicks off here rather than in onEnter (which fires before any click
      // and would just get silently blocked by the browser).
      start.onclick = () => { DS.SFX.play('ritual'); DS.Music.play('hub'); DS.UI.navigate('home'); };
      wrap.appendChild(start);
      return wrap;
    },
    onEnter() { DS.Music.play('hub'); }, // harmless if blocked by autoplay policy — the Start button covers that case
  });

  // ─────────────── home hub ───────────────

  // ─────────────── profile portraits (shared by the home player-card + gallery) ───────────────

  // A "unit-like" shape DS.C.portrait() can render, for any character OR enemy id.
  function portraitSourceFor(id) {
    const c = DS.C.findChar(id);
    if (c) return { id: c.id, art: c.art, rarity: c.rarity, element: c.element, name: c.name };
    const e = (DS.ENEMIES || []).find((x) => x.id === id);
    if (e) return { id: e.id, art: e.art, rarity: e.tier === 'boss' ? 5 : 4, element: e.element, name: e.name };
    return { id, art: null, name: id };
  }

  // Owned characters are automatically unlocked for the profile gallery; enemy/boss
  // portraits must be earned via their bestiary achievement (see achievements.js).
  function portraitUnlocked(id) {
    if (DS.State.roster[id]) return true;
    return !!(DS.State.progress.unlockedPortraits || {})[id];
  }

  function menuTile(icon, name, desc, screen, badge, assetKey) {
    const artUrl = assetKey && DS.Assets ? DS.Assets.hub(assetKey) : null;
    const iconEl = el('div', 'hub-icon' + (artUrl ? ' has-art' : ''), artUrl ? null : icon);
    if (artUrl) {
      const img = document.createElement('img');
      img.className = 'hub-icon-art';
      img.src = artUrl;
      img.alt = '';
      iconEl.appendChild(img);
    }
    const tile = el('div', 'hub-tile ds-card', [
      iconEl,
      el('div', 'hub-name display', name),
      el('div', 'hub-desc small text-dim', desc),
    ]);
    if (badge) tile.appendChild(el('div', 'notif-dot', String(badge)));
    tile.onclick = () => { DS.SFX.play('ui'); DS.UI.navigate(screen); };
    return tile;
  }

  DS.UI.registerScreen('home', {
    render() {
      const wrap = el('div', 'screen home-screen');
      const badges = DS.Meta.notifBadges();
      const p = DS.State.player;
      const est = DS.Progression.estusTick();

      // Player card. The portrait is the player's chosen profile picture (any
      // unlocked warrior or foe — see the Portrait Gallery) rather than a fixed
      // flame icon, and doubles as the button into that gallery.
      const pc = el('div', 'player-card panel-ornate');
      const portraitId = p.portraitId || 'chosen_undead';
      const pcSrc = portraitSourceFor(portraitId);
      // Full portrait as the card's own backdrop (no more small circular thumbnail)
      // — fills roughly the left 75%, blending through a gradient into solid black
      // for the last quarter, same "hero banner" language as the Summoning cards.
      // The name/level/XP block hugs the LEFT edge (over the art, backed by heavy
      // text-shadow) while the change-portrait button and daily-tasks box share a
      // column hugging the RIGHT edge, over the card's solid-black end.
      const pcArtUrl = DS.Assets && DS.Assets.portrait(pcSrc.id);
      const pcEdit = el('div', 'pc-portrait-edit', '✎ Change portrait');
      pcEdit.onclick = () => { DS.SFX.play('ui'); DS.UI.navigate('portraitGallery'); };
      if (pcArtUrl) {
        const pcBg = document.createElement('img');
        pcBg.className = 'pc-portrait-bg';
        pcBg.src = pcArtUrl;
        pcBg.alt = '';
        pcBg.title = 'Change profile portrait';
        pcBg.onclick = () => { DS.SFX.play('ui'); DS.UI.navigate('portraitGallery'); };
        pc.appendChild(pcBg);
        pc.appendChild(el('div', 'pc-portrait-fade'));
      }
      const pcInfo = el('div', 'pc-info', [
        el('h2', null, p.name),
        el('div', 'small text-dim', 'Bonfire Level ' + p.level),
        DS.C.statBar({ cls: 'xp', cur: p.exp, max: DS.CURVES.playerXp(p.level), label: p.exp + ' / ' + DS.CURVES.playerXp(p.level) + ' EXP' }),
        el('div', 'small text-dim', [DS.C.currencyIcon('estus'), ' Estus ' + est.estus + ' / ' + est.estusMax + (est.msToNext ? ' · +1 in ' + Math.ceil(est.msToNext / 60000) + 'm' : '')]),
      ]);
      pc.appendChild(pcInfo);
      // Daily tasks preview.
      const dailies = DS.QuestLog.dailyTasks();
      const dBox = el('div', 'daily-box');
      dBox.appendChild(el('div', 'section-title', 'Daily Tending'));
      dailies.forEach((d) => {
        dBox.appendChild(el('div', 'row small', [
          el('span', null, d.done ? '✅' : '⬜'),
          el('span', d.done ? 'text-faint' : '', d.name),
        ]));
      });
      const pcRight = el('div', 'pc-right-col');
      if (pcArtUrl) pcRight.appendChild(pcEdit);
      pcRight.appendChild(dBox);
      pc.appendChild(pcRight);
      wrap.appendChild(pc);

      const grid = el('div', 'hub-grid');
      grid.appendChild(menuTile('⚔', 'Expedition', 'Worlds, domains, and the boss gauntlet', 'map', null, 'expedition'));
      grid.appendChild(menuTile('🪧', 'Summoning', 'Answer the signs — dark rites await', 'gacha', null, 'summoning'));
      grid.appendChild(menuTile('👥', 'Company', 'Warriors, growth, traces, and gear', 'characters', null, 'company'));
      grid.appendChild(menuTile('🎒', 'Bottomless Box', 'Materials, weapons, and relics', 'inventory', null, 'bottomless_box'));
      grid.appendChild(menuTile('🛡', 'Covenants', 'Trials of the eight relic covenants', 'covenants', null, 'covenants'));
      grid.appendChild(menuTile('🏰', 'Fortress', 'A roguelike descent — nothing carries but what you find', 'fortressMap', null, 'fortress'));
      grid.appendChild(menuTile('🌲', 'Portal of Oolacile', 'A golden sanctuary, and the dark that\'s been climbing up into it', 'oolacile', null, 'oolacile'));
      grid.appendChild(menuTile('📜', 'Travelers', 'Questlines of fellow wanderers', 'quests', badges.quests, 'travelers'));
      grid.appendChild(menuTile('🎪', 'Tidings', 'Events and seasonal bounties', 'events', badges.events, 'tidings'));
      grid.appendChild(menuTile('🐦‍⬛', 'Deliveries', 'The crow brings letters and gifts', 'mail', badges.mail, 'deliveries'));
      const achSummary = DS.Achievements.summary();
      grid.appendChild(menuTile('🏆', 'Achievements', 'Challenges, milestones, and the bestiary', 'achievements', achSummary.claimable || null, 'achievements'));
      grid.appendChild(menuTile('🏪', 'Shop', 'Premium bundles and the Ash exchange', 'shop', null, 'shop'));
      wrap.appendChild(grid);
      return wrap;
    },
  });

  // ─────────────── portrait gallery ───────────────

  DS.UI.registerScreen('portraitGallery', {
    render() {
      const wrap = el('div', 'screen portrait-gallery-screen');
      wrap.appendChild(el('div', 'screen-header', [
        el('h2', null, 'Profile Portrait'),
        el('div', 'hint', 'Every warrior you\'ve sworn, and every foe whose bestiary challenge you\'ve claimed.'),
      ]));

      const currentId = DS.State.player.portraitId || 'chosen_undead';
      const allIds = (DS.CHARACTERS || []).map((c) => c.id).concat((DS.ENEMIES || []).map((e) => e.id));
      const grid = el('div', 'portrait-gallery-grid');
      allIds.forEach((id) => {
        const src = portraitSourceFor(id);
        const unlocked = portraitUnlocked(id);
        const cell = el('div', 'portrait-cell' + (unlocked ? '' : ' locked') + (currentId === id ? ' selected' : ''));
        cell.appendChild(DS.C.portrait(src, { size: 84, rarity: src.rarity, element: src.element }));
        cell.appendChild(el('div', 'small portrait-cell-name', src.name || id));
        if (!unlocked) cell.appendChild(el('div', 'portrait-lock', '🔒'));
        if (unlocked) {
          cell.onclick = () => {
            DS.State.player.portraitId = id;
            DS.Save.persist();
            DS.SFX.play('ui');
            DS.UI.rerender();
          };
        } else {
          cell.title = 'Locked — clear this foe\'s bestiary challenge in Achievements to unlock.';
        }
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      return wrap;
    },
  });

  // ─────────────── achievements ───────────────

  function achievementRow(a) {
    const rewardBits = [];
    if (a.reward && a.reward.humanity) rewardBits.push('🖤 +' + a.reward.humanity + ' Humanity');
    if (a.reward && a.reward.unlockPortrait) rewardBits.push('🖼 Unlocks gallery portrait');
    const row = el('div', 'ds-card ach-row' + (a.claimed ? ' claimed' : '') + (a.claimable ? ' claimable' : ''));
    if (a.kind === 'bestiary') {
      const src = portraitSourceFor(a.enemyId);
      row.appendChild(DS.C.portrait(src, { size: 44, rarity: src.rarity, element: src.element }));
    }
    row.appendChild(el('div', 'grow', [
      el('div', 'display ach-name', a.name),
      el('div', 'small text-dim', a.desc),
      el('div', 'small text-gold', rewardBits.join('   ')),
    ]));
    const btn = el('button', 'small' + (a.claimable ? ' primary' : ' ghost'), a.claimed ? '✓ Claimed' : (a.claimable ? 'Claim' : 'Locked'));
    btn.disabled = a.claimed || !a.claimable;
    btn.onclick = () => {
      const summary = DS.Achievements.claim(a.id);
      if (summary) {
        DS.C.rewardsPopup(summary, { title: a.name });
        DS.UI.refreshTopBar();
        setTimeout(() => DS.UI.rerender(), 80);
      }
    };
    row.appendChild(btn);
    return row;
  }

  function claimAllAchievements() {
    const claimableOnes = DS.Achievements.list().filter((a) => a.claimable);
    if (!claimableOnes.length) { DS.C.toast('Nothing ready to claim.', { icon: '⚠' }); return; }
    let combined = [];
    claimableOnes.forEach((a) => {
      const summary = DS.Achievements.claim(a.id);
      if (summary) combined = combined.concat(summary);
    });
    DS.SFX.play('chime');
    DS.C.rewardsPopup(combined, { title: 'Claimed ' + claimableOnes.length + ' Achievement' + (claimableOnes.length > 1 ? 's' : '') });
    DS.UI.refreshTopBar();
    setTimeout(() => DS.UI.rerender(), 80);
  }

  DS.UI.registerScreen('achievements', {
    render() {
      const outer = el('div', 'screen achievements-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('achievements'), 'contain'));
      const wrap = el('div', 'screen-inner');
      const all = DS.Achievements.list();
      const summary = DS.Achievements.summary();
      const header = el('div', 'screen-header', [
        el('h2', null, 'Achievements'),
        el('div', 'hint', summary.claimed + ' / ' + summary.total + ' claimed' + (summary.claimable ? '  ·  ' + summary.claimable + ' ready to claim' : '')),
      ]);
      const claimAllBtn = el('button', 'primary', 'Claim All (' + summary.claimable + ')');
      claimAllBtn.disabled = !summary.claimable;
      claimAllBtn.onclick = claimAllAchievements;
      header.appendChild(claimAllBtn);
      wrap.appendChild(header);

      const basic = all.filter((a) => a.kind === 'basic');
      const milestone = all.filter((a) => a.kind === 'milestone');
      const bestiary = all.filter((a) => a.kind === 'bestiary')
        .sort((x, y) => (y.claimable - x.claimable) || (x.tier === 'boss' ? 0 : 1) - (y.tier === 'boss' ? 0 : 1) || x.name.localeCompare(y.name));

      wrap.appendChild(el('div', 'section-title', 'Basic Achievements'));
      const basicList = el('div', 'ach-list');
      basic.forEach((a) => basicList.appendChild(achievementRow(a)));
      wrap.appendChild(basicList);

      wrap.appendChild(el('div', 'section-title', 'Milestones'));
      const milestoneList = el('div', 'ach-list');
      milestone.forEach((a) => milestoneList.appendChild(achievementRow(a)));
      wrap.appendChild(milestoneList);

      wrap.appendChild(el('div', 'section-title', 'Bestiary Challenges'));
      wrap.appendChild(el('div', 'small text-faint italic', 'Defeat each foe once in a won battle to make its challenge claimable.'));
      const bestiaryList = el('div', 'ach-list');
      bestiary.forEach((a) => bestiaryList.appendChild(achievementRow(a)));
      wrap.appendChild(bestiaryList);

      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── shop ───────────────
  // Two shelves: a mocked real-world-currency shelf (this is a private,
  // non-commercial project with no payment backend — every "Buy" here is a
  // local-save grant behind a confirm dialog, never a real charge), and a free
  // Ash shelf. Ash itself is only ever earned automatically from duplicate
  // Summoning results (see js/core/save.js grant() and js/engine/gacha.js).

  let shopTab = 'premium';

  function fmtUsd(n) { return '$' + n.toFixed(2); }

  // DS.C.currencyIcon() returns an EMPTY text node (not null) when a currency
  // has no registered art asset — falsy-checking its return value never falls
  // back, so check the asset registry directly instead.
  function currencyIconOrEmoji(name, emoji) {
    return DS.Assets && DS.Assets.currency(name) ? DS.C.currencyIcon(name) : emoji;
  }

  function shopTile(children, priceLabel, onBuy, opts) {
    opts = opts || {};
    const tile = el('div', 'ds-card shop-tile' + (opts.rarity ? ' r' + opts.rarity : '') + (opts.wide ? ' wide' : ''));
    tile.appendChild(el('div', 'shop-tile-body', children));
    const foot = el('div', 'shop-tile-foot');
    foot.appendChild(el('div', 'shop-tile-price', priceLabel));
    const buy = el('button', 'small primary', opts.buyLabel || 'Buy');
    buy.disabled = !!opts.disabled;
    buy.onclick = onBuy;
    foot.appendChild(buy);
    tile.appendChild(foot);
    return tile;
  }

  function weaponIconNode(w) {
    const url = DS.Assets ? DS.Assets.weapon(w.id) : null;
    const box = el('div', 'shop-tile-icon');
    if (url) {
      const img = document.createElement('img');
      img.className = 'weapon-icon-art';
      img.src = url;
      img.alt = '';
      img.onerror = () => { img.replaceWith(el('span', null, (w.art && w.art.icon) || '🗡')); };
      box.appendChild(img);
    } else {
      box.appendChild(el('span', null, (w.art && w.art.icon) || '🗡'));
    }
    return box;
  }

  function grantAndPopup(rewards, title) {
    const summary = DS.Save.grant(rewards);
    DS.SFX.play('chime');
    DS.C.rewardsPopup(summary, { title });
    DS.UI.refreshTopBar();
    setTimeout(() => DS.UI.rerender(), 80);
  }

  // Shard packages are the ONLY tiles still bought with real money — everything
  // else premium-shelf-side spends the Shards balance instead (see buyShards).
  async function buyPremium(priceUsd, label, rewards) {
    const yes = await DS.C.confirm('Purchase ' + label + ' for ' + fmtUsd(priceUsd) + '? (Local single-player save — no real payment is processed.)', { title: 'Confirm Purchase', okLabel: 'Buy' });
    if (!yes) return;
    grantAndPopup(rewards, label);
  }

  function buyAsh(cost, label, rewards) {
    const ash = DS.State.currencies.ash || 0;
    if (ash < cost) { DS.C.toast('Not enough Ash.', { icon: '⚠' }); return; }
    DS.State.currencies.ash = ash - cost;
    grantAndPopup(rewards, label);
  }

  // Real Pale Shards icon art (see currencyIconOrEmoji above) instead of the
  // plain 💠 emoji text everywhere a Shards price is shown.
  function fmtShards(n) { return [currencyIconOrEmoji('shards', '💠'), ' ' + n.toLocaleString()]; }

  function buyShards(cost, label, rewards) {
    const shards = DS.State.currencies.shards || 0;
    if (shards < cost) { DS.C.toast('Not enough Pale Shards.', { icon: '⚠' }); return; }
    DS.State.currencies.shards = shards - cost;
    grantAndPopup(rewards, label);
  }

  function renderPremiumShop(wrap) {
    wrap.appendChild(el('div', 'section-title', 'Pale Shards'));
    wrap.appendChild(el('p', 'small text-dim italic', 'The one thing real money buys here — everything below (and the Cards shelf) spends Shards instead.'));
    const sGrid = el('div', 'shop-grid');
    (DS.SHOP_SHARD_PACKAGES || []).forEach((pk) => {
      const total = pk.shards + (pk.bonus || 0);
      const tile = shopTile([
        el('div', 'shop-tile-icon', currencyIconOrEmoji('shards', '💠')),
        el('h3', null, total.toLocaleString() + ' Pale Shards'),
        pk.bonus ? el('div', 'small text-gold', pk.shards.toLocaleString() + ' + ' + pk.bonus.toLocaleString() + ' bonus') : null,
      ], fmtUsd(pk.priceUsd), () => buyPremium(pk.priceUsd, total.toLocaleString() + ' Pale Shards', { shards: total }));
      sGrid.appendChild(tile);
    });
    wrap.appendChild(sGrid);

    const bl = DS.SHOP_SUBSCRIPTION;
    const P = DS.State.progress;
    if (!P.blessing) P.blessing = { daysLeft: 0 };
    const shards = DS.State.currencies.shards || 0;

    wrap.appendChild(el('div', 'section-title', bl.name));
    const blessBox = el('div', 'ds-card shop-tile wide blessing-tile panel-ornate');
    const blessIconBox = el('div', 'blessing-icon');
    blessIconBox.appendChild(currencyIconOrEmoji('humanity', '🖤'));
    const daysActive = P.blessing.daysLeft > 0;
    const blessInfo = el('div', 'blessing-info', [
      el('h3', null, bl.name),
      el('p', 'small text-dim', 'Claim ' + bl.dailyHumanity + ' '),
    ]);
    // "N Humanity" rendered separately so the same real currency icon (not just
    // text) shows inline with the daily amount, matching how prices read elsewhere.
    const dailyLine = blessInfo.querySelector('p');
    dailyLine.appendChild(currencyIconOrEmoji('humanity', '🖤'));
    dailyLine.appendChild(document.createTextNode(' Humanity automatically, every day for ' + bl.days + ' days.'));
    if (daysActive) {
      const pct = Math.round((P.blessing.daysLeft / bl.days) * 100);
      blessInfo.appendChild(el('div', 'blessing-progress', [el('div', 'blessing-progress-fill')]));
      blessInfo.querySelector('.blessing-progress-fill').style.width = pct + '%';
      blessInfo.appendChild(el('div', 'small text-gold', P.blessing.daysLeft + ' of ' + bl.days + ' days remaining'));
    }
    blessBox.appendChild(blessIconBox);
    blessBox.appendChild(el('div', 'shop-tile-body blessing-body', [blessInfo]));
    const blessFoot = el('div', 'shop-tile-foot');
    blessFoot.appendChild(el('div', 'shop-tile-price', fmtShards(bl.priceShards)));
    const blessBuy = el('button', 'small primary', P.blessing.daysLeft > 0 ? 'Renew' : 'Buy');
    blessBuy.disabled = shards < bl.priceShards;
    blessBuy.onclick = () => {
      if ((DS.State.currencies.shards || 0) < bl.priceShards) { DS.C.toast('Not enough Pale Shards.', { icon: '⚠' }); return; }
      DS.State.currencies.shards -= bl.priceShards;
      P.blessing.daysLeft = bl.days;
      DS.Save.persist();
      DS.SFX.play('chime');
      DS.C.toast(bl.name + ' active for ' + bl.days + ' days.', { icon: '🖤' });
      DS.UI.refreshTopBar();
      DS.UI.rerender();
    };
    blessFoot.appendChild(blessBuy);
    blessBox.appendChild(blessFoot);
    wrap.appendChild(blessBox);

    wrap.appendChild(el('div', 'section-title', 'Humanity Bundles'));
    wrap.appendChild(el('p', 'small text-dim italic', 'The main event — Humanity is spent on Summoning rites.'));
    const bGrid = el('div', 'shop-grid');
    (DS.SHOP_HUMANITY_BUNDLES || []).forEach((b) => {
      const total = b.humanity + (b.bonus || 0);
      const tile = shopTile([
        el('div', 'shop-tile-icon', currencyIconOrEmoji('humanity', '🖤')),
        el('h3', null, total.toLocaleString() + ' Humanity'),
        b.bonus ? el('div', 'small text-gold', b.humanity.toLocaleString() + ' + ' + b.bonus.toLocaleString() + ' bonus') : null,
      ], fmtShards(b.priceShards), () => buyShards(b.priceShards, total.toLocaleString() + ' Humanity', { humanity: total }), { disabled: shards < b.priceShards });
      bGrid.appendChild(tile);
    });
    wrap.appendChild(bGrid);

    wrap.appendChild(el('div', 'section-title', 'Material Packs'));
    wrap.appendChild(el('p', 'small text-dim italic', 'Bundles to advance warriors and temper weapons.'));
    const pGrid = el('div', 'shop-grid shop-grid-3col');
    (DS.SHOP_MATERIAL_PACKS || []).forEach((pk) => {
      const contents = el('div', 'row shop-pack-contents');
      Object.entries(pk.items).forEach(([id, count]) => contents.appendChild(DS.C.itemCard(id, { count, width: '58px' })));
      const tile = shopTile([
        el('h3', null, pk.name),
        el('p', 'small text-dim', pk.desc),
        contents,
      ], fmtShards(pk.priceShards), () => buyShards(pk.priceShards, pk.name, { items: pk.items }), { disabled: shards < pk.priceShards });
      pGrid.appendChild(tile);
    });
    wrap.appendChild(pGrid);
  }

  function renderAshShop(wrap) {
    const ash = DS.State.currencies.ash || 0;
    wrap.appendChild(el('p', 'small text-dim italic', 'Ash is earned automatically whenever a Summoning rite yields a duplicate warrior or weapon.'));

    wrap.appendChild(el('div', 'section-title', 'Upgrade Materials'));
    const mGrid = el('div', 'shop-grid shop-grid-3col');
    (DS.SHOP_ASH_MATERIALS || []).forEach((pk) => {
      const contents = el('div', 'row shop-pack-contents');
      Object.entries(pk.items).forEach(([id, count]) => contents.appendChild(DS.C.itemCard(id, { count, width: '58px' })));
      const tile = shopTile([
        el('h3', null, pk.name),
        contents,
      ], pk.ash.toLocaleString() + ' Ash', () => buyAsh(pk.ash, pk.name, { items: pk.items }), { disabled: ash < pk.ash });
      mGrid.appendChild(tile);
    });
    wrap.appendChild(mGrid);

    wrap.appendChild(el('div', 'section-title', 'Warrior Dupes'));
    wrap.appendChild(el('p', 'small text-dim italic', 'A heavy-priced duplicate summon for any 4★ or 5★ warrior you\'ve already sworn.'));
    const cGrid = el('div', 'shop-grid');
    Object.keys(DS.State.roster)
      .map((id) => DS.C.findChar(id))
      .filter((def) => def && def.rarity >= 4)
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
      .forEach((def) => {
        const price = (DS.ASH_CHAR_PRICE || {})[def.rarity] || 500;
        const tile = shopTile([
          DS.C.portrait(def, { size: 72, rarity: def.rarity, element: def.element }),
          el('div', 'small', def.name),
        ], price.toLocaleString() + ' Ash', () => buyAsh(price, def.name + ' dupe', { characters: [def.id] }), { rarity: def.rarity, disabled: ash < price });
        cGrid.appendChild(tile);
      });
    if (!cGrid.children.length) cGrid.appendChild(el('div', 'small text-faint italic', 'Sworn no 4★ or 5★ warriors yet.'));
    wrap.appendChild(cGrid);

    wrap.appendChild(el('div', 'section-title', 'Weapons'));
    const wGrid = el('div', 'shop-grid');
    (DS.WEAPONS || []).filter((w) => w.rarity >= 4).forEach((w) => {
      const price = (DS.ASH_WEAPON_PRICE || {})[w.rarity] || 350;
      const tile = shopTile([
        weaponIconNode(w),
        el('div', 'small', w.name),
      ], price.toLocaleString() + ' Ash', () => buyAsh(price, w.name, { weapons: [w.id] }), { rarity: w.rarity, disabled: ash < price });
      wGrid.appendChild(tile);
    });
    wrap.appendChild(wGrid);
  }

  // A single skin tile: video/image preview (autoplay/loop for animated skins),
  // name + which warrior it's for, price, and a Buy button that's disabled once
  // owned (no re-buying something you already have) rather than hidden, so the
  // shop keeps reading as a complete, if partly-owned, catalog.
  function skinTile(skin) {
    const owned = DS.Cosmetics && DS.Cosmetics.owns(skin.id);
    const def = DS.C.findChar(skin.charId);
    // Sized/framed like the actual card being sold (see .skin-preview in
    // hub.css) — the ornate .card-frame border-image is the same one every
    // real battle/roster card uses, so this reads as "here is the card" and
    // not just a loose preview clip floating above some text.
    const preview = el('div', 'shop-tile-icon skin-preview' + (def ? ' r' + def.rarity : ''));
    if (skin.type === 'animated' && skin.video) {
      const vid = document.createElement('video');
      vid.className = 'skin-preview-art';
      vid.src = skin.video;
      vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
      preview.appendChild(vid);
    } else if (skin.image) {
      const img = document.createElement('img');
      img.className = 'skin-preview-art';
      img.src = skin.image;
      img.alt = '';
      preview.appendChild(img);
    }
    preview.appendChild(el('div', 'card-frame'));
    const shards = DS.State.currencies.shards || 0;
    const tile = shopTile([
      preview,
      el('h3', null, skin.name),
      def ? el('div', 'stars small', '★'.repeat(def.rarity)) : null,
      el('div', 'small text-dim', 'For ' + (def ? def.name : skin.charId)),
      el('p', 'small text-dim italic', skin.desc),
    ], owned ? 'Owned' : [currencyIconOrEmoji('shards', '💠'), ' ' + skin.priceShards.toLocaleString()], () => buyCardSkin(skin), {
      disabled: owned || shards < skin.priceShards, buyLabel: owned ? 'Owned' : 'Buy',
    });
    return tile;
  }

  // Shards-only — no Ash option, unlike the rest of the free (Ash) shelf.
  function buyCardSkin(skin) {
    if (DS.Cosmetics && DS.Cosmetics.owns(skin.id)) return;
    const shards = DS.State.currencies.shards || 0;
    if (shards < skin.priceShards) { DS.C.toast('Not enough Pale Shards.', { icon: '⚠' }); return; }
    DS.State.currencies.shards = shards - skin.priceShards;
    DS.Cosmetics.unlock(skin.id);
    DS.SFX.play('chime');
    DS.C.toast(skin.name + ' added to the Company\'s Skins.', { icon: '🎴' });
    DS.UI.refreshTopBar();
    DS.UI.rerender();
  }

  function renderCardsShop(wrap) {
    wrap.appendChild(el('p', 'small text-dim italic', 'Purely cosmetic — swap a warrior\'s card art any time from their Skins tab in Company, no stat change either way.'));
    const animated = (DS.CARD_SKINS || []).filter((s) => s.type === 'animated');
    const altArt = (DS.CARD_SKINS || []).filter((s) => s.type === 'art');

    wrap.appendChild(el('div', 'section-title', 'Animated Cards'));
    const aGrid = el('div', 'shop-grid shop-grid-4col');
    if (animated.length) animated.forEach((s) => aGrid.appendChild(skinTile(s)));
    else aGrid.appendChild(el('div', 'small text-faint italic', 'None answer the call yet — check back another day.'));
    wrap.appendChild(aGrid);

    wrap.appendChild(el('div', 'section-title', 'Alternative Art'));
    const bGrid = el('div', 'shop-grid shop-grid-4col');
    if (altArt.length) altArt.forEach((s) => bGrid.appendChild(skinTile(s)));
    else bGrid.appendChild(el('div', 'small text-faint italic', 'None answer the call yet — check back another day.'));
    wrap.appendChild(bGrid);
  }

  DS.UI.registerScreen('shop', {
    render() {
      const outer = el('div', 'screen shop-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('shop'), 'contain'));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [
        el('h2', null, 'Shop'),
        el('div', 'row small', [
          el('div', 'hint', [currencyIconOrEmoji('shards', '💠'), ' ' + (DS.State.currencies.shards || 0) + ' Pale Shards']),
          el('div', 'hint', [currencyIconOrEmoji('ash', '⚱'), ' ' + (DS.State.currencies.ash || 0) + ' Ash']),
        ]),
      ]));
      const tabsBar = DS.C.tabs([
        { id: 'premium', label: '💰 Premium' },
        { id: 'ash', label: '⚱ Ash Exchange' },
        { id: 'cards', label: '🎴 Cards' },
      ], (id) => { shopTab = id; DS.UI.rerender(); }, shopTab);
      wrap.appendChild(tabsBar.root);
      const body = el('div', 'shop-body');
      if (shopTab === 'premium') renderPremiumShop(body);
      else if (shopTab === 'ash') renderAshShop(body);
      else renderCardsShop(body);
      wrap.appendChild(body);
      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── world map ───────────────

  function launchStage(stage, background, sourceKind) {
    const est = DS.Progression.spendEstus(stage.estusCost || 10);
    if (!est.ok) { DS.C.toast(est.reason, { icon: '🧪', img: DS.Assets && DS.Assets.currency('estus') }); return; }
    DS.UI.refreshTopBar();
    DS.UI.navigate('battle', {
      spawns: stage.spawns,
      background,
      estusCost: stage.estusCost,
      source: { kind: sourceKind, stageId: stage.id, spawns: stage.spawns, estusCost: stage.estusCost },
    });
  }

  function stageRow(stage, world, sourceKind) {
    const prog = DS.State.progress.stages[stage.id];
    const cleared = prog && prog.clears > 0;
    const row = el('div', 'stage-row ds-card' + (stage.boss ? ' boss-stage' : ''));
    const spawnsIcons = el('div', 'stage-foes');
    stage.spawns.forEach((sp) => {
      const def = (DS.ENEMIES || []).find((e) => e.id === sp.id);
      if (!def) return;
      const url = DS.Assets ? DS.Assets.portrait(sp.id) : null;
      if (url) {
        const img = document.createElement('img');
        img.className = 'stage-foe-art';
        img.src = url;
        img.alt = '';
        img.onerror = () => { img.replaceWith(el('span', null, def.art.icon)); };
        spawnsIcons.appendChild(img);
      } else {
        spawnsIcons.appendChild(el('span', null, def.art.icon));
      }
    });
    row.appendChild(el('div', 'stage-main grow', [
      el('div', 'row', [
        el('span', 'display stage-name', stage.name),
        stage.boss ? el('span', 'badge boss-badge', '☠ BOSS') : null,
        cleared ? el('span', 'stars small', '★'.repeat(prog.stars)) : null,
      ]),
      el('div', 'small text-dim italic', stage.subtitle + ' — Lv.' + stage.recLevel + ' advised'),
    ]));
    row.appendChild(spawnsIcons);
    const estusUrl = DS.Assets ? DS.Assets.currency('estus') : null;
    const estusRow = el('div', 'small text-dim row stage-estus-cost');
    if (estusUrl) {
      const eImg = document.createElement('img');
      eImg.className = 'stage-estus-icon';
      eImg.src = estusUrl;
      eImg.alt = '';
      estusRow.appendChild(eImg);
    } else {
      estusRow.appendChild(document.createTextNode('🧪 '));
    }
    estusRow.appendChild(document.createTextNode(String(stage.estusCost || 10)));
    row.appendChild(estusRow);
    const go = el('button', cleared ? 'small' : 'small primary', cleared ? 'Again' : 'Enter');
    go.onclick = () => launchStage(stage, world.background, sourceKind);
    row.appendChild(go);
    return row;
  }

  // ─────────────── Expedition map — branching node-graph ───────────────
  // Layout (positions/edges) lives in DS.WORLD_MAP_LAYOUT (js/data/worldmap.js),
  // keyed by world id — see that file's header comment for the exact shape.
  // There is no persisted "unlock" state per node: reachability is computed live
  // from DS.State.progress.stages[id].clears every render (a node with no
  // incoming edge is the world's own entry point; anything else needs at least
  // one predecessor edge whose source has clears > 0). This mirrors how the
  // rest of the game already treats stage completion — nothing new to migrate.

  // A pure-treasure side node (side:true + a `treasure` reward object instead of
  // `spawns`/`firstClear`) never goes through launchStage()/battle — claiming it
  // just grants the reward once, exactly like a first-clear, and marks the stage
  // "cleared" so the map reflects it and world-completion achievements still see
  // it as one of the world's stages resolved.
  function claimTreasure(stage) {
    const prog = DS.State.progress.stages[stage.id];
    if (prog && prog.clears > 0) return;
    DS.State.progress.stages[stage.id] = { clears: 1, stars: 0 };
    const summary = DS.Save.grant(stage.treasure || {});
    DS.SFX.play('chime');
    DS.C.rewardsPopup(summary, { title: stage.name });
    DS.UI.refreshTopBar();
    DS.Save.persist();
    setTimeout(() => DS.UI.rerender(), 80);
  }

  function mapNodeState(stage, layout) {
    const prog = DS.State.progress.stages[stage.id];
    if (prog && prog.clears > 0) return 'cleared';
    const incoming = (layout.edges || []).filter(([, to]) => to === stage.id);
    if (!incoming.length) return 'unlocked'; // the world's own entry point(s)
    const ready = incoming.some(([from]) => {
      const p = DS.State.progress.stages[from];
      return !!(p && p.clears > 0);
    });
    return ready ? 'unlocked' : 'locked';
  }

  function mapNodeKind(stage) {
    if (stage.boss) return 'boss';
    if (stage.side && stage.treasure) return 'treasure';
    if (stage.side) return 'elite';
    return 'normal';
  }

  // Builds one world's whole map as a single inline SVG: a smoothly-curved path
  // per edge (dashed/thin for optional side branches, solid/bright for the
  // main line) underneath a circular node per stage. Locked nodes render as an
  // unlabeled fogged silhouette (CSS handles the blur/desaturation entirely off
  // the .state-locked class — see .map-node in hub.css) so the shape of what's
  // ahead is visible without spoiling what it actually is.
  function renderWorldGraph(world) {
    const layout = DS.WORLD_MAP_LAYOUT && DS.WORLD_MAP_LAYOUT[world.id];
    if (!layout) return null;
    const stagesById = {};
    world.stages.forEach((s) => { stagesById[s.id] = s; });

    const svg = DS.C.svgEl('svg', {
      class: 'world-graph', viewBox: '0 0 100 ' + layout.height, preserveAspectRatio: 'xMidYMin meet',
    });
    // Lets the box scale to any container width without any pixel-guessing —
    // width comes from CSS (100%), height then follows the viewBox's own ratio.
    svg.style.aspectRatio = '100 / ' + layout.height;

    // Soft-edged radial gradient shared by every locked node's fog patch in
    // this world's SVG — a real patch of "unexplored map" bigger than the node
    // itself (fading smoothly into the visible backdrop art around it), not a
    // little cloud icon sitting on the pin. IDs must be document-unique, not
    // just per-<svg>, hence the world id suffix.
    const gradId = 'fogGrad-' + world.id;
    const defs = DS.C.svgEl('defs', null, DS.C.svgEl('radialGradient', { id: gradId }, [
      DS.C.svgEl('stop', { offset: '0%', 'stop-color': '#050403', 'stop-opacity': '0.97' }),
      DS.C.svgEl('stop', { offset: '65%', 'stop-color': '#050403', 'stop-opacity': '0.9' }),
      DS.C.svgEl('stop', { offset: '100%', 'stop-color': '#050403', 'stop-opacity': '0' }),
    ]));

    const edgesLayer = DS.C.svgEl('g', { class: 'graph-edges' });
    const nodesLayer = DS.C.svgEl('g', { class: 'graph-nodes' });

    layout.edges.forEach(([fromId, toId]) => {
      const from = layout.nodes[fromId];
      const to = layout.nodes[toId];
      const toStage = stagesById[toId];
      const fromStage = stagesById[fromId];
      if (!from || !to || !toStage) return;
      const toState = mapNodeState(toStage, layout);
      const isSideEdge = !!((fromStage && fromStage.side) || toStage.side);
      const midY = (from.y + to.y) / 2;
      const d = 'M ' + from.x + ' ' + from.y + ' C ' + from.x + ' ' + midY + ', ' + to.x + ' ' + midY + ', ' + to.x + ' ' + to.y;
      edgesLayer.appendChild(DS.C.svgEl('path', {
        d, class: 'graph-edge' + (isSideEdge ? ' side' : '') + (toState === 'locked' ? ' fogged' : ''),
      }));
    });

    world.stages.forEach((stage) => {
      const pos = layout.nodes[stage.id];
      if (!pos) return;
      const state = mapNodeState(stage, layout);
      const kind = mapNodeKind(stage);
      const prog = DS.State.progress.stages[stage.id];
      const g = DS.C.svgEl('g', { class: 'map-node state-' + state + ' kind-' + kind });

      // A patch of unexplored map, well bigger than the node ring itself, fading
      // smoothly into the visible backdrop art around it — only ever visible
      // while state-locked (see .state-locked .node-fog-patch in hub.css).
      // (Sizes here are in the 0-100-wide viewBox's own units — roughly 1 unit ≈
      // 1% of the rendered map's width, not CSS pixels.)
      g.appendChild(DS.C.svgEl('circle', {
        class: 'node-fog-patch', cx: pos.x, cy: pos.y, r: 13, fill: 'url(#' + gradId + ')',
      }));

      g.appendChild(DS.C.svgEl('circle', { class: 'node-ring', cx: pos.x, cy: pos.y, r: 4.5 }));

      if (state !== 'locked') {
        const firstSpawn = stage.spawns && stage.spawns[0];
        const portraitUrl = firstSpawn && DS.Assets ? DS.Assets.portrait(firstSpawn.id) : null;
        if (portraitUrl && kind !== 'treasure') {
          const clipId = 'mapclip-' + stage.id;
          g.appendChild(DS.C.svgEl('clipPath', { id: clipId }, DS.C.svgEl('circle', { cx: pos.x, cy: pos.y, r: 4 })));
          g.appendChild(DS.C.svgEl('image', {
            href: portraitUrl, x: pos.x - 4, y: pos.y - 4, width: 8, height: 8,
            class: 'node-portrait', 'clip-path': 'url(#' + clipId + ')', preserveAspectRatio: 'xMidYMid slice',
          }));
        } else {
          g.appendChild(DS.C.svgEl('text', { class: 'node-glyph', x: pos.x, y: pos.y }, kind === 'treasure' ? '🗝' : '⚔'));
        }
      }
      g.appendChild(DS.C.svgEl('text', { class: 'node-fog-glyph', x: pos.x, y: pos.y }, '?'));

      if (state === 'cleared') {
        g.appendChild(DS.C.svgEl('circle', { class: 'node-cleared-badge-bg', cx: pos.x + 3.3, cy: pos.y - 3.3, r: 1.7 }));
        g.appendChild(DS.C.svgEl('text', { class: 'node-cleared-badge', x: pos.x + 3.3, y: pos.y - 3.3 }, '✓'));
      }
      const showStars = state === 'cleared' && prog && prog.stars > 0;
      if (showStars) g.appendChild(DS.C.svgEl('text', { class: 'node-stars', x: pos.x, y: pos.y + 8.2 }, '★'.repeat(prog.stars)));
      g.appendChild(DS.C.svgEl('text', { class: 'node-label', x: pos.x, y: pos.y + (showStars ? 11.5 : 7.5) }, stage.name));

      const titleParts = [stage.name, stage.subtitle, stage.recLevel ? ('Lv.' + stage.recLevel + ' advised') : null];
      if (kind === 'boss') titleParts.push('BOSS');
      if (kind === 'treasure') titleParts.push('Treasure — no battle');
      if (kind === 'elite') titleParts.push('Optional — harder fight, better spoils');
      g.appendChild(DS.C.svgEl('title', null, titleParts.filter(Boolean).join(' — ')));

      if (state !== 'locked') {
        g.onclick = () => { if (stage.treasure) claimTreasure(stage); else launchStage(stage, world.background, 'stage'); };
      } else {
        g.onclick = () => DS.C.toast('The way ahead is still lost in the fog.', { icon: '🌫' });
      }
      nodesLayer.appendChild(g);
    });

    svg.appendChild(defs);
    svg.appendChild(edgesLayer);
    svg.appendChild(nodesLayer);
    return svg;
  }

  // Shared per-world render (locked badge, ornate box, node-graph-or-flat-list)
  // — used both by the 'map' screen's loop below and by the standalone
  // 'oolacile' screen, so Oolacile gets the exact same presentation quality
  // as any of the 5 mainline worlds without duplicating this block.
  function worldBox(world, pLevel) {
    const locked = pLevel < (world.unlockPlayerLevel || 1);
    const box = el('div', 'world-box panel-ornate' + (locked ? ' locked' : '') + ' bgtint-' + world.background);
    box.appendChild(el('div', 'row spread', [
      el('h3', null, world.name),
      locked ? el('span', 'badge', '🔒 Bonfire Lv.' + world.unlockPlayerLevel) : null,
    ]));
    box.appendChild(el('p', 'small text-dim italic', world.desc));
    if (!locked) {
      const graph = renderWorldGraph(world);
      if (graph) {
        // The world's own backdrop art sits behind the node-graph so it
        // genuinely reads as a map of a place, not a plain dark panel with
        // circles on it — a scrim on top keeps nodes/labels legible over
        // whatever's busy in the art underneath.
        const graphWrap = el('div', 'world-graph-wrap');
        const bgUrl = DS.Assets ? DS.Assets.background(world.background) : null;
        if (bgUrl) graphWrap.style.backgroundImage = 'url(' + bgUrl + ')';
        graphWrap.appendChild(el('div', 'world-graph-scrim'));
        graphWrap.appendChild(graph);
        box.appendChild(graphWrap);
      } else {
        // Fallback flat list, only if a world has no authored map layout yet.
        const list = el('div', 'col');
        world.stages.forEach((st) => list.appendChild(stageRow(st, world, 'stage')));
        box.appendChild(list);
      }
    }
    return box;
  }

  DS.UI.registerScreen('map', {
    render() {
      // Outer wrapper is full-bleed (no max-width) so the backdrop image covers the
      // whole stage edge-to-edge; the actual content stays in a max-width inner
      // column (.screen-inner) for readability, same as before.
      const outer = el('div', 'screen map-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('map')));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Lands of Lordran'), el('div', 'hint', 'Estus fuels each expedition')]));
      const pLevel = DS.State.player.level;

      // Oolacile lives on its own dedicated hub tile/screen (see the 'oolacile'
      // screen registration right after this one) — filtered out here so it
      // doesn't also show up mixed into the mainline 5-world list.
      (DS.WORLDS || []).filter((w) => w.id !== 'oolacile').forEach((world) => {
        wrap.appendChild(worldBox(world, pLevel));
      });

      // Domains.
      wrap.appendChild(el('div', 'section-title', 'Daily Domains'));
      (DS.DOMAINS || []).forEach((dom) => {
        const box = el('div', 'world-box panel');
        box.appendChild(el('h3', null, dom.icon + ' ' + dom.name));
        box.appendChild(el('p', 'small text-dim italic', dom.desc));
        const list = el('div', 'col');
        (dom.stages || []).forEach((st) => list.appendChild(stageRow(st, dom, 'domain')));
        box.appendChild(list);
        wrap.appendChild(box);
      });

      // Boss rush gauntlets — one tile per DS.BOSS_RUSHES entry (Crown of
      // Cinders, Crown of the Cosmos, and any added after), each tracking its
      // own deepest-wave progress under DS.State.progress.bossRush[gauntletId].
      const gauntlets = DS.BOSS_RUSHES || {};
      const gauntletIds = Object.keys(gauntlets);
      if (gauntletIds.length) {
        wrap.appendChild(el('div', 'section-title', 'Gauntlet'));
        gauntletIds.forEach((gauntletId) => {
          const BR = gauntlets[gauntletId];
          if (!BR) return;
          const best = (DS.State.progress.bossRush && DS.State.progress.bossRush[gauntletId] && DS.State.progress.bossRush[gauntletId].best) || 0;
          const box = el('div', 'world-box panel-ornate bgtint-kiln');
          box.appendChild(el('div', 'row spread', [
            el('h3', null, BR.icon + ' ' + BR.name),
            el('span', 'badge', 'Deepest wave: ' + best + ' / ' + BR.sequence.length),
          ]));
          box.appendChild(el('p', 'small text-dim italic', BR.desc));
          const nextWave = Math.min(best + 1, BR.sequence.length);
          const seq = BR.sequence[nextWave - 1];
          const row = el('div', 'row spread');
          row.appendChild(el('span', 'small', seq.name));
          const go = el('button', 'small primary', best >= BR.sequence.length ? 'Fight Wave ' + BR.sequence.length + ' again' : 'Challenge Wave ' + nextWave);
          go.onclick = () => {
            const est = DS.Progression.spendEstus(BR.estusCost || 25);
            if (!est.ok) { DS.C.toast(est.reason, { icon: '🧪', img: DS.Assets && DS.Assets.currency('estus') }); return; }
            DS.UI.refreshTopBar();
            DS.UI.navigate('battle', {
              spawns: seq.spawns, background: BR.background, estusCost: BR.estusCost,
              source: { kind: 'bossRush', gauntletId, wave: nextWave, spawns: seq.spawns, estusCost: BR.estusCost },
            });
          };
          row.appendChild(go);
          box.appendChild(row);
          wrap.appendChild(box);
        });
      }
      outer.appendChild(wrap);
      return outer;
    },
  });

  // The DLC-style zone that replaced Arena — same worldBox() rendering as any
  // mainline world, just on its own screen instead of mixed into 'map'.
  DS.UI.registerScreen('oolacile', {
    render() {
      const outer = el('div', 'screen map-screen');
      // No dedicated background art yet — falls back to Anor Londo's ("the
      // city of gods, kept golden") as a placeholder silhouette for a golden
      // sanctuary until real art exists. screenBgImage has no null-safety of
      // its own (unlike every other DS.Assets.background() call in this file),
      // so this fallback is required, not just a nicety.
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('oolacile') || DS.Assets.background('anor')));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [
        el('h2', null, DS.OOLACILE.name),
        el('div', 'hint', 'A sunlight sanctuary, and what has been climbing up into it'),
      ]));
      wrap.appendChild(worldBox(DS.OOLACILE, DS.State.player.level));
      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── covenants ───────────────

  // A trial "group" (one of DS.RELIC_TRIALS' 8 covenants) counts as cleared
  // once every one of its own stages has at least one clear — the same
  // clears>0 bookkeeping every other stage in the game already uses.
  function trialGroupCleared(trial) {
    return (trial.stages || []).every((st) => {
      const p = DS.State.progress.stages[st.id];
      return p && p.clears > 0;
    });
  }

  // Guards the per-trial reveal animation (below) against firing twice for the
  // same trial from overlapping re-renders while it's mid-playback — reset the
  // instant its onDone callback marks the trial persistently revealed.
  let trialRevealAnimating = null;

  // Key-in-lock unlock animation: appended straight to <body> (like the
  // gacha/relic VFX helpers) so it sits above everything regardless of the
  // covenants screen re-rendering under it. Phases: key slides in and turns,
  // then the shackle/chain links shatter into flying pieces and fade for
  // good. onDone fires once the whole sequence has finished playing.
  function playTrialUnlockAnimation(onDone) {
    const reduce = DS.State.settings.reduceMotion;
    const overlay = el('div', 'trial-unlock-overlay');
    const scene = el('div', 'trial-unlock-scene');

    const svg = DS.C.svgEl('svg', { viewBox: '0 0 200 200', class: 'trial-unlock-svg' }, [
      // Chain links draped from above the lock, in a loose vertical run.
      DS.C.svgEl('g', { class: 'trial-chain' }, [0, 1, 2].map((i) => DS.C.svgEl('ellipse', {
        class: 'chain-link', cx: 100 + (i % 2 ? 10 : -10), cy: 38 + i * 22, rx: 13, ry: 9,
        fill: 'none', stroke: '#8a8070', 'stroke-width': 6,
      }))),
      // Shackle arc.
      DS.C.svgEl('path', {
        class: 'lock-shackle', d: 'M78 92 V72 a22 22 0 0 1 44 0 V92',
        fill: 'none', stroke: '#9a8f6a', 'stroke-width': 10, 'stroke-linecap': 'round',
      }),
      // Body.
      DS.C.svgEl('rect', { class: 'lock-body', x: 62, y: 92, width: 76, height: 62, rx: 8, fill: '#6b5d3a' }),
      DS.C.svgEl('circle', { class: 'lock-body', cx: 100, cy: 116, r: 8, fill: '#2a2013' }),
      DS.C.svgEl('rect', { class: 'lock-body', x: 96, y: 116, width: 8, height: 16, fill: '#2a2013' }),
    ]);
    scene.appendChild(svg);

    // The key itself — bow (ring) + shaft + two teeth — a plain vector shape
    // rather than the 🗝 emoji, to match the lock's own drawn-not-emoji look.
    const keySvg = DS.C.svgEl('svg', { viewBox: '0 0 200 200', class: 'trial-key-svg' }, [
      DS.C.svgEl('circle', { cx: 34, cy: 116, r: 16, fill: 'none', stroke: '#e8dc9a', 'stroke-width': 7 }),
      DS.C.svgEl('rect', { x: 48, y: 111, width: 60, height: 10, fill: '#e8dc9a' }),
      DS.C.svgEl('rect', { x: 92, y: 121, width: 8, height: 12, fill: '#e8dc9a' }),
      DS.C.svgEl('rect', { x: 104, y: 121, width: 8, height: 16, fill: '#e8dc9a' }),
    ]);
    const key = el('div', 'trial-key-icon');
    key.appendChild(keySvg);
    scene.appendChild(key);
    overlay.appendChild(scene);
    overlay.appendChild(el('div', 'trial-unlock-label', 'The lock remembers the shape of this key...'));
    document.body.appendChild(overlay);

    const t1 = reduce ? 100 : 900;   // key slides in + turns
    const t2 = reduce ? 200 : 700;   // shatter
    const t3 = reduce ? 100 : 600;   // hold on the broken pieces before clearing

    setTimeout(() => {
      overlay.classList.add('key-turned');
      DS.SFX.play('trialUnlock');
    }, t1);

    setTimeout(() => {
      overlay.classList.add('breaking');
      DS.VFX && DS.VFX.screenShake && DS.VFX.screenShake(6);
      // Chain links + shackle + body each fly apart on their own random vector.
      scene.querySelectorAll('.chain-link, .lock-shackle, .lock-body').forEach((piece) => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 70;
        piece.style.setProperty('--px', Math.round(Math.cos(ang) * dist) + 'px');
        piece.style.setProperty('--py', Math.round(Math.sin(ang) * dist) + 'px');
        piece.style.setProperty('--prot', Math.round((Math.random() - 0.5) * 340) + 'deg');
      });
      overlay.querySelector('.trial-unlock-label').textContent = 'The covenants\' trials stand open.';
    }, t1 + t2);

    setTimeout(() => {
      overlay.classList.add('leaving');
      setTimeout(() => { overlay.remove(); onDone(); }, 400);
    }, t1 + t2 + t3);
  }

  DS.UI.registerScreen('covenants', {
    render() {
      const outer = el('div', 'screen covenants-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('covenants'), 'contain'));
      const wrap = el('div', 'screen-inner');
      wrap.appendChild(el('div', 'screen-header', [
        el('h2', null, 'Covenant Trials'),
        el('div', 'hint', DS.Inventory.relicCount() + ' / ' + DS.Inventory.MAX_RELICS + ' relics held'),
      ]));

      if (!DS.State.progress.covenantsUnlocked) {
        wrap.appendChild(el('p', 'small text-dim italic', 'Clear a covenant\'s trial to earn a relic from its set — every time, not just the first.'));
        const lockBox = el('div', 'world-box panel-ornate covenant-locked-box');
        lockBox.appendChild(DS.C.lockIcon('covenant-lock-big'));
        lockBox.appendChild(el('h3', null, 'Sealed'));
        const hasKey = DS.Inventory.has('trial_key');
        lockBox.appendChild(el('p', 'small text-dim italic',
          hasKey
            ? 'A Trial Key sits heavy in your pack. The covenants are waiting.'
            : 'These trials answer to no one without a Trial Key — the covenants send one by crow once your bonfire has grown twice over. Check your Deliveries.'));
        if (hasKey) {
          const useBtn = el('button', 'primary', 'Use Trial Key');
          useBtn.onclick = () => {
            useBtn.disabled = true;
            playTrialUnlockAnimation(() => {
              DS.Inventory.removeItem('trial_key', 1);
              DS.State.progress.covenantsUnlocked = true;
              DS.Save.persist();
              DS.UI.rerender();
            });
          };
          lockBox.appendChild(useBtn);
        }
        wrap.appendChild(lockBox);
        outer.appendChild(wrap);
        return outer;
      }

      wrap.appendChild(el('p', 'small text-dim italic', 'Clear a covenant\'s trial to earn a relic from its set — every time, not just the first.'));

      (DS.RELIC_TRIALS || []).forEach((trial, i) => {
        const prevReady = i === 0 || trialGroupCleared(DS.RELIC_TRIALS[i - 1]);
        const revealed = i === 0 || !!(DS.State.progress.trialsRevealed && DS.State.progress.trialsRevealed[trial.id]);
        const open = prevReady && revealed;

        // The moment a trial's gate condition is met but its unlock animation
        // hasn't played yet, kick it off — same key-turns/lock-shatters sequence
        // as the covenants' own Sealed gate. Guarded so an in-flight animation
        // (or one already marked revealed) never fires twice.
        if (prevReady && !revealed && trialRevealAnimating !== trial.id) {
          trialRevealAnimating = trial.id;
          playTrialUnlockAnimation(() => {
            if (!DS.State.progress.trialsRevealed) DS.State.progress.trialsRevealed = {};
            DS.State.progress.trialsRevealed[trial.id] = true;
            trialRevealAnimating = null;
            DS.Save.persist();
            DS.UI.rerender();
          });
        }

        const set = (DS.RELIC_SETS || []).find((s) => s.id === trial.setId);
        const box = el('div', 'world-box panel-ornate bgtint-' + trial.background + (open ? '' : ' covenant-locked'));
        const head = el('div', 'row spread');
        const iconUrl = DS.Assets ? DS.Assets.relicPiece(trial.setId, 'helm') : null;
        const iconBox = el('div', 'covenant-icon');
        if (!open) {
          iconBox.appendChild(DS.C.lockIcon());
        } else if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl; img.alt = '';
          iconBox.appendChild(img);
        } else {
          iconBox.appendChild(el('span', null, trial.icon));
        }
        head.appendChild(el('div', 'row', [iconBox, el('h3', null, trial.name)]));
        if (set && open) {
          head.appendChild(el('div', 'small text-dim', set.bonus2.desc + ' (2pc) · ' + set.bonus4.desc + ' (4pc)'));
        }
        box.appendChild(head);
        if (!open) {
          box.appendChild(el('p', 'small text-dim italic', prevReady
            ? 'The lock stirs — the covenant is answering...'
            : 'Clear the covenant before this one to earn its trust.'));
        } else {
          box.appendChild(el('p', 'small text-dim italic', trial.desc));
          const list = el('div', 'col');
          (trial.stages || []).forEach((st) => list.appendChild(stageRow(st, trial, 'domain')));
          box.appendChild(list);
        }
        wrap.appendChild(box);
      });
      outer.appendChild(wrap);
      return outer;
    },
  });

  // ─────────────── settings ───────────────

  DS.UI.registerScreen('settings', {
    render() {
      const wrap = el('div', 'screen');
      wrap.appendChild(el('div', 'screen-header', [el('h2', null, 'Settings')]));
      const box = el('div', 'detail-panel');

      const toggle = (label, key) => {
        const row = el('div', 'row spread stat-row');
        row.appendChild(el('span', null, label));
        const btn = el('button', 'small ' + (DS.State.settings[key] ? 'primary' : 'ghost'), DS.State.settings[key] ? 'On' : 'Off');
        btn.onclick = () => { DS.State.settings[key] = !DS.State.settings[key]; DS.Save.persist(); DS.UI.rerender(); };
        row.appendChild(btn);
        return row;
      };
      box.appendChild(toggle('Sound effects', 'sfx'));
      box.appendChild(toggle('Reduce motion', 'reduceMotion'));

      const volRow = el('div', 'row spread stat-row');
      volRow.appendChild(el('span', null, 'Music volume'));
      const volRight = el('div', 'row');
      volRight.style.alignItems = 'center';
      volRight.style.gap = '0.6em';
      const volSlider = document.createElement('input');
      volSlider.type = 'range';
      volSlider.min = '0'; volSlider.max = '100'; volSlider.step = '1';
      volSlider.value = String(Math.round((DS.State.settings.musicVolume ?? 0.6) * 100));
      const volLabel = el('span', 'small text-dim', volSlider.value + '%');
      volSlider.oninput = () => {
        const pct = Number(volSlider.value);
        volLabel.textContent = pct + '%';
        DS.Music.setVolume(pct / 100);
        DS.Save.persist();
      };
      volRight.appendChild(volSlider);
      volRight.appendChild(volLabel);
      volRow.appendChild(volRight);
      box.appendChild(volRow);

      const resRow = el('div', 'row spread stat-row');
      resRow.appendChild(el('span', null, 'Resolution'));
      const resSelect = document.createElement('select');
      Object.entries(DS.Layout.RESOLUTIONS).forEach(([key, r]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = r.label;
        if (key === (DS.State.settings.resolution || '1080p')) opt.selected = true;
        resSelect.appendChild(opt);
      });
      resSelect.onchange = () => {
        DS.Layout.setResolution(resSelect.value);
        DS.Save.persist();
      };
      resRow.appendChild(resSelect);
      box.appendChild(resRow);

      const fsRow = el('div', 'row spread stat-row');
      fsRow.appendChild(el('span', null, 'Fullscreen'));
      const fsBtn = el('button', 'small ghost', 'Toggle (F11)');
      fsBtn.onclick = () => DS.Layout.toggleFullscreen();
      fsRow.appendChild(fsBtn);
      box.appendChild(fsRow);

      const spdRow = el('div', 'row spread stat-row');
      spdRow.appendChild(el('span', null, 'Battle speed'));
      const spdBtn = el('button', 'small', '×' + (DS.State.settings.battleSpeed || 1));
      spdBtn.onclick = () => {
        const cur = DS.State.settings.battleSpeed || 1;
        DS.State.settings.battleSpeed = cur >= 2 ? 1 : cur + 0.5;
        DS.Save.persist(); DS.UI.rerender();
      };
      spdRow.appendChild(spdBtn);
      box.appendChild(spdRow);

      box.appendChild(el('hr', 'hr-ornate'));
      const reset = el('button', 'danger', 'Extinguish the flame (reset save)');
      reset.onclick = async () => {
        const yes = await DS.C.confirm('Everything — warriors, relics, progress — returns to ash. There is no undoing this.', { danger: true, okLabel: 'Extinguish', title: 'Truly?' });
        if (yes) { DS.Save.reset(); DS.UI.navigate('title'); }
      };
      box.appendChild(reset);

      box.appendChild(el('hr', 'hr-ornate'));
      box.appendChild(el('p', 'small text-faint', 'Ashen Tactics: Embers of Lordran — an unofficial, non-commercial fan work. Dark Souls, its characters and place names belong to FromSoftware / Bandai Namco. All code, artwork, animations, audio synthesis, and writing in this project are original creations.'));
      wrap.appendChild(box);
      return wrap;
    },
  });
})();
