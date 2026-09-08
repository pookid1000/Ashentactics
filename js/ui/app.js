// App shell: screen registry, router, top bar, boot. (CONTRACT.md §6.1)

window.DS = window.DS || {};

(function () {
  // Shared registry created by the components.js shim (UI files load before app.js).
  DS.UI = DS.UI || {};
  DS.UI._screens = DS.UI._screens || {};
  const screens = DS.UI._screens;
  const NO_TOPBAR = { title: true, battle: true };
  const SCREEN_TITLES = {
    home: 'Firelink Shrine', map: 'Lands of Lordran', gacha: 'Summoning Rituals',
    characters: 'Company of Ash', characterDetail: 'Warrior', inventory: 'Bottomless Box',
    covenants: 'Covenant Trials', quests: 'Fellow Travelers', events: 'Tidings',
    mail: "Crow's Deliveries", settings: 'Settings',
    achievements: 'Achievements', portraitGallery: 'Profile Portrait',
    shop: 'Shop', fortressMap: 'The Fortress', oolacile: 'Portal of Oolacile',
  };

  Object.assign(DS.UI, {
    current: null,
    currentParams: null,

    registerScreen(name, def) { screens[name] = def; },

    navigate(name, params) {
      const prev = screens[DS.UI.current];
      if (prev && prev.onLeave) { try { prev.onLeave(); } catch (e) { console.error(e); } }
      // Modals live outside #app — clear any strays so they can't outlive their screen.
      document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
      // Remember wherever the player actually was before a fight starts, so fleeing
      // or returning from battle goes back there instead of a hardcoded screen.
      if (name === 'battle' && DS.UI.current !== 'battle') {
        DS.UI._battleReturn = { screen: DS.UI.current, params: DS.UI.currentParams };
      }
      DS.UI.current = name;
      DS.UI.currentParams = params || {};
      DS.UI.rerender();
      const next = screens[name];
      if (next && next.onEnter) { try { next.onEnter(DS.UI.currentParams); } catch (e) { console.error(e); } }
    },

    rerender() {
      const root = document.getElementById('app');
      if (!root) return;
      const def = screens[DS.UI.current];
      root.innerHTML = '';
      document.body.classList.toggle('reduce-motion', !!(DS.State && DS.State.settings.reduceMotion));
      // Persistent background video lives inside #stage (see components.js videoBg) so it
      // survives this teardown/rebuild — just show/hide per screen. (The map screen's
      // parchment backdrop is handled inside hub-ui.js's own render() instead, since it's
      // meant to scroll along with that screen's content rather than stay fixed.)
      DS.C.videoBg('assets/video/background.mp4', DS.UI.current === 'home');
      if (DS.Ambience) DS.Ambience.setActive(DS.UI.current === 'home');
      if (!def) { root.appendChild(DS.C.el('div', 'empty-state', 'Unknown screen: ' + DS.UI.current)); return; }
      if (!NO_TOPBAR[DS.UI.current]) root.appendChild(buildTopBar());
      let content;
      try {
        content = def.render(DS.UI.currentParams);
      } catch (e) {
        console.error('Screen render failed:', DS.UI.current, e);
        content = DS.C.el('div', 'screen', [
          DS.C.el('h2', null, 'Something broke'),
          DS.C.el('p', 'text-dim', String(e && e.message || e)),
          (() => { const b = DS.C.el('button', 'primary', 'Return to Firelink'); b.onclick = () => DS.UI.navigate('home'); return b; })(),
        ]);
      }
      root.appendChild(content);
    },

    refreshTopBar() {
      const tb = document.querySelector('.topbar');
      if (tb) tb.replaceWith(buildTopBar());
    },

    // Wherever the player was standing right before this fight started — used by
    // Flee and the post-battle Return/Withdraw button instead of a hardcoded screen.
    battleReturn() {
      return DS.UI._battleReturn || { screen: 'map', params: undefined };
    },
  });

  function currencyChip(icon, value, title, assetKey) {
    const assetUrl = assetKey && DS.Assets ? DS.Assets.currency(assetKey) : null;
    let iconEl;
    if (assetUrl) {
      iconEl = DS.C.el('span', 'cicon cicon-art');
      const img = document.createElement('img');
      img.src = assetUrl;
      img.alt = '';
      iconEl.appendChild(img);
    } else {
      iconEl = DS.C.el('span', 'cicon', icon);
    }
    const c = DS.C.el('div', 'currency', [iconEl, DS.C.el('span', null, fmtNum(value))]);
    c.title = title;
    return c;
  }

  function fmtNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  // Elemental-affinities-info + Settings buttons — shared by the main topbar and
  // by the battle screen (which has no topbar of its own, see NO_TOPBAR above,
  // so it builds its own small top-right corner cluster with these same buttons).
  function buildQuickActionButtons() {
    const elemIconUrl = DS.Assets ? DS.Assets.topbar('element_info') : null;
    const elemBtn = DS.C.el('button', 'ghost topbar-icon-btn' + (elemIconUrl ? ' has-art' : ''), elemIconUrl ? null : '✦');
    if (elemIconUrl) {
      const elemImg = document.createElement('img');
      elemImg.src = elemIconUrl;
      elemImg.alt = '';
      elemBtn.appendChild(elemImg);
    }
    elemBtn.title = 'Elemental Affinities';
    elemBtn.onclick = () => openElementInfo();

    const settingsUrl = DS.Assets ? DS.Assets.hub('settings') : null;
    const settingsBtn = DS.C.el('button', 'ghost topbar-icon-btn' + (settingsUrl ? ' has-art' : ''), settingsUrl ? null : '⚙');
    if (settingsUrl) {
      const settingsImg = document.createElement('img');
      settingsImg.src = settingsUrl;
      settingsImg.alt = '';
      settingsBtn.appendChild(settingsImg);
    }
    settingsBtn.title = 'Settings';
    settingsBtn.onclick = () => DS.UI.navigate('settings');

    return [elemBtn, settingsBtn];
  }
  DS.UI.buildQuickActionButtons = buildQuickActionButtons;

  function buildTopBar() {
    const S = DS.State;
    const bar = DS.C.el('div', 'topbar');
    if (DS.UI.current !== 'home') {
      const back = DS.C.el('button', 'ghost back-btn', '←');
      back.onclick = () => { DS.SFX.play('back'); DS.UI.navigate(backTarget()); };
      bar.appendChild(back);
    }
    bar.appendChild(DS.C.el('div', 'screen-name', SCREEN_TITLES[DS.UI.current] || ''));
    bar.appendChild(DS.C.el('div', 'grow'));
    if (S) {
      if (DS.Progression && DS.Progression.estusTick) DS.Progression.estusTick();
      bar.appendChild(currencyChip('🧪', S.player.estus, 'Estus — stamina for expeditions (regenerates over time)', 'estus'));
      bar.appendChild(currencyChip('👻', S.currencies.souls, 'Souls — common currency', 'souls'));
      bar.appendChild(currencyChip('🖤', S.currencies.humanity, 'Humanity — premium currency for summons', 'humanity'));
      bar.appendChild(currencyChip('💠', S.currencies.shards || 0, 'Pale Shards — the Shop\'s premium currency, bought with real money', 'shards'));
      bar.appendChild(currencyChip('🪧', S.currencies.signs, 'Summon Signs — summoning tickets', 'signs'));
      bar.appendChild(currencyChip('⚱', S.currencies.ash || 0, 'Ash — earned from duplicate Summoning results, spent in the Shop', 'ash'));
      const flameUrl = DS.Assets ? DS.Assets.hub('flame') : null;
      const flameNode = flameUrl ? (() => { const im = document.createElement('img'); im.className = 'player-chip-flame-art'; im.src = flameUrl; im.alt = ''; return im; })() : '🔥';
      const chip = DS.C.el('div', 'player-chip', [flameNode, DS.C.el('span', null, S.player.name + ' · Lv.' + S.player.level)]);
      chip.title = 'Bonfire Level';
      bar.appendChild(chip);
    }
    buildQuickActionButtons().forEach((b) => bar.appendChild(b));
    return bar;
  }

  // Builds the elemental wheel / Holy-Dark rivalry / Physical note dynamically from
  // DS.ELEMENT_ADVANTAGE + DS.ELEMENT_META so this can never drift out of sync with the
  // actual damage-formula data (see DS.Formulas.elementMult, js/engine/formulas.js).
  function buildElementInfoBody() {
    const wrap = DS.C.el('div', 'elem-info');
    const iconName = (id) => (DS.ELEMENT_META[id] ? DS.ELEMENT_META[id].icon : '') + ' ' + id;

    ['Fire', 'Frost', 'Lightning', 'Magic'].forEach((id) => {
      const adv = DS.ELEMENT_ADVANTAGE[id];
      const row = DS.C.el('div', 'elem-info-row', [
        DS.C.el('span', null, iconName(id)),
        DS.C.el('span', 'text-heal', '+10% vs ' + iconName(adv.strongVs)),
        DS.C.el('span', 'text-danger', '-10% vs ' + iconName(adv.weakVs)),
      ]);
      wrap.appendChild(row);
    });

    wrap.appendChild(DS.C.el('div', 'elem-info-row', [
      DS.C.el('span', null, iconName('Holy') + ' ⇄ ' + iconName('Dark')),
      DS.C.el('span', 'text-heal', '+10% to each other'),
    ]));

    wrap.appendChild(DS.C.el('div', 'elem-info-row', [
      DS.C.el('span', null, iconName('Physical')),
      DS.C.el('span', 'text-dim', 'Neutral to all elements. Immune to all negative status effects.'),
    ]));

    return wrap;
  }

  function openElementInfo() {
    DS.C.modal({ title: '✦ Elemental Affinities', body: buildElementInfoBody() });
  }
  // Exposed so the battle screen (which has no shared topbar — see NO_TOPBAR
  // above) can still open the same elemental-wheel info from its own button.
  DS.UI.openElementInfo = openElementInfo;

  function backTarget() {
    const map = {
      characterDetail: 'characters',
      map: 'home', gacha: 'home', characters: 'home', inventory: 'home', covenants: 'home',
      quests: 'home', events: 'home', mail: 'home', settings: 'home',
      achievements: 'home', portraitGallery: 'home', shop: 'home', fortressMap: 'home', oolacile: 'home',
    };
    return map[DS.UI.current] || 'home';
  }

  // ── Global click/hover feedback ──
  // A white ring that expands and fades at the click point, for every click
  // anywhere (not scoped to any one screen). Appended straight to <body>, not
  // #stage, so position:fixed lands on the real e.clientX/clientY with no
  // conversion for #stage's own scale transform (see .click-ripple in theme.css).
  function spawnClickRipple(x, y) {
    const ring = document.createElement('div');
    ring.className = 'click-ripple';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }
  document.addEventListener('click', (e) => {
    DS.SFX.play('click');
    spawnClickRipple(e.clientX, e.clientY);
  });

  // Menu hover tick — plays once per button/card newly moused-over, not on every
  // bubbled mouseover as the pointer crosses child elements within the same one
  // (that would retrigger constantly while just sitting still over a card).
  // Battle has its own targeting affordances (see .bunit.targetable), so it's
  // excluded rather than doubling up on hover noise mid-fight.
  const HOVER_SELECTOR = 'button, .btn, .ds-card, .hub-tile, .mail-card, .banner-chip, .stage-row, .portrait-cell, .clickable';
  let lastHoverEl = null;
  document.addEventListener('mouseover', (e) => {
    if (DS.UI.current === 'battle') return;
    const el = e.target.closest ? e.target.closest(HOVER_SELECTOR) : null;
    if (el && el !== lastHoverEl) DS.SFX.play('swipe');
    lastHoverEl = el;
  });

  // ── Boot ──
  document.addEventListener('DOMContentLoaded', () => {
    DS.Save.load();
    if (DS.Layout && DS.Layout.apply) DS.Layout.apply();
    if (DS.Progression && DS.Progression.estusTick) { try { DS.Progression.estusTick(); } catch (e) { console.error(e); } }
    DS.UI.navigate('title');
    if (DS.Meta && DS.Meta.tickLogin) {
      try {
        const login = DS.Meta.tickLogin();
        if (login && login.blessingSummary && login.blessingSummary.length) {
          setTimeout(() => DS.C.toast("Bearer's Blessing — " + login.blessingSummary.map((s) => s.text).join(', '), { icon: '🖤' }), 900);
        }
      } catch (e) { console.error(e); }
    }
  });
})();
