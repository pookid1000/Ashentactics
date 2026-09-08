// ASHEN TACTICS — summoning UI (CONTRACT.md §6.4).
// Banner carousel, pity/rates/history, and the canvas bonfire ritual whose
// intensity scales with the best rarity in the batch (1★..5★).

window.DS = window.DS || {};

(function () {
  const el = (...a) => DS.C.el(...a);
  let activeBannerIdx = 0;

  // Renders "<cost> <signs icon>[suffix]" using the real signs currency art when
  // available, falling back to the soapstone emoji otherwise.
  function signCostEl(cost, suffix) {
    const row = el('div', 'small text-dim sign-cost');
    row.appendChild(document.createTextNode(cost + ' '));
    const url = DS.Assets ? DS.Assets.currency('signs') : null;
    if (url) {
      const img = document.createElement('img');
      img.className = 'sign-icon-art';
      img.src = url;
      img.alt = '';
      row.appendChild(img);
    } else {
      row.appendChild(document.createTextNode('🪧'));
    }
    if (suffix) row.appendChild(document.createTextNode(suffix));
    return row;
  }

  // ─────────────── ritual animation ───────────────
  // Tiers: 1 grey sputter · 2 green flicker · 3 blue soul-surge · 4 epic violet blaze
  //        5 extended gold cinematic (dark → humanity sprites → sword strike → fire ring → reveal)

  const TIER_CONF = {
    1: { color: '#8a8a8a', glow: '#5a5a5a', label: 'The ember sputters...', dur: 2600, particles: 18 },
    2: { color: '#5f9e6e', glow: '#2a4a34', label: 'A modest flame takes...', dur: 3000, particles: 30 },
    3: { color: '#4f7ec2', glow: '#22405a', label: 'Soul-light gathers...', dur: 3600, particles: 48 },
    4: { color: '#9b59b6', glow: '#3a1a4a', label: 'The dark parts for something rare...', dur: 4400, particles: 70 },
    5: { color: '#d4af37', glow: '#5a4210', label: 'THE FIRST FLAME STIRS', dur: 6400, particles: 120 },
  };

  function playRitual(tier, onDone) {
    const conf = TIER_CONF[tier] || TIER_CONF[3];
    const reduce = DS.State.settings.reduceMotion;
    // Video takes over from the static tier art where one exists (currently
    // tiers 4-5) — same reduceMotion opt-out as the Hub's own video backdrop,
    // since an autoplaying clip is exactly the kind of motion that setting
    // means to suppress.
    const videoUrl = !reduce && DS.Assets ? DS.Assets.ritualVideo(tier) : null;
    const artUrl = !videoUrl && DS.Assets ? DS.Assets.ritual(tier) : null;
    const overlay = el('div', 'ritual-overlay tier-' + tier + ((videoUrl || artUrl) ? ' has-art' : ''));

    if (videoUrl) {
      const artVid = document.createElement('video');
      artVid.className = 'ritual-art-bg';
      artVid.src = videoUrl;
      artVid.autoplay = true;
      artVid.loop = true;
      artVid.muted = true;
      artVid.playsInline = true;
      overlay.appendChild(artVid);
    } else if (artUrl) {
      const artImg = document.createElement('img');
      artImg.className = 'ritual-art-bg';
      artImg.src = artUrl;
      artImg.alt = '';
      overlay.appendChild(artImg);
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'ritual-canvas';
    overlay.appendChild(canvas);

    // Coiled sword + bonfire mound (pure CSS/DOM shapes) — only used as a
    // fallback when no generated art/video exists for this tier yet.
    if (!videoUrl && !artUrl) {
      const fire = el('div', 'ritual-bonfire', [
        el('div', 'ritual-sword'),
        el('div', 'ritual-mound'),
        el('div', 'ritual-flame'),
      ]);
      overlay.appendChild(fire);
    }
    const label = el('div', 'ritual-label', conf.label);
    overlay.appendChild(label);
    const skip = el('button', 'ghost small ritual-skip', 'Skip ▸');
    overlay.appendChild(skip);
    document.body.appendChild(overlay);

    canvas.width = overlay.clientWidth;
    canvas.height = overlay.clientHeight;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.62;

    let parts = [];
    let running = true;
    let phase = 0;
    const t0 = performance.now();
    const dur = reduce ? 700 : conf.dur;
    overlay.style.setProperty('--ritual-dur', dur + 'ms');

    function spawnEmber(burst) {
      const ang = Math.random() * Math.PI * 2;
      const r = burst ? Math.random() * 30 : 60 + Math.random() * Math.max(80, canvas.width * 0.2);
      parts.push({
        x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * 0.5,
        tx: cx, ty: cy - 30,
        size: 1.5 + Math.random() * 3,
        seek: !burst, vx: 0, vy: burst ? -(1 + Math.random() * 3) : 0,
        life: 1,
      });
    }

    function frame(now) {
      if (!running) return;
      const t = (now - t0) / dur;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep vignette.
      const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, canvas.width * 0.7);
      grad.addColorStop(0, conf.glow + '55');
      grad.addColorStop(1, '#000000ee');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Phase management.
      if (t > 0.25 && phase < 1) { phase = 1; overlay.classList.add('phase-gather'); }
      if (t > 0.6 && phase < 2) {
        phase = 2; overlay.classList.add('phase-ignite');
        DS.SFX.play(tier >= 4 ? 'legendary' : tier >= 3 ? 'rare' : 'ritual');
        for (let i = 0; i < conf.particles; i++) spawnEmber(true);
      }
      if (tier === 5 && t > 0.82 && phase < 3) {
        phase = 3; overlay.classList.add('phase-crown');
        for (let i = 0; i < 80; i++) spawnEmber(true);
      }

      // Trickle of seeking sprites during the gather phase.
      if (phase >= 1 && phase < 2 && Math.random() < (reduce ? 0.2 : 0.7)) spawnEmber(false);

      parts = parts.filter((p) => {
        if (p.seek) {
          p.x += (p.tx - p.x) * 0.04;
          p.y += (p.ty - p.y) * 0.04;
          if (Math.abs(p.x - p.tx) < 12 && Math.abs(p.y - p.ty) < 12) p.life -= 0.1;
        } else {
          p.x += p.vx; p.y += p.vy; p.vy -= 0.015;
          p.life -= 0.012;
        }
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx.fillStyle = conf.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;

      if (t >= 1) { finish(); return; }
      requestAnimationFrame(frame);
    }

    function finish() {
      if (!running) return;
      running = false;
      overlay.classList.add('leaving');
      setTimeout(() => { overlay.remove(); onDone(); }, 300);
    }

    skip.onclick = finish;
    overlay.style.setProperty('--tier-color', conf.color);
    requestAnimationFrame(frame);
    DS.SFX.play('ritual');
  }

  // ─────────────── results reveal ───────────────

  function resultCard(res, i) {
    let icon = '📦', name = res.id, sub = '', charDef = null, weaponId = null, itemId = null;
    if (res.type === 'character') {
      const def = DS.C.findChar(res.id);
      if (def) { icon = def.art.icon; name = def.name; sub = def.title; charDef = def; }
    } else if (res.type === 'weapon') {
      const def = DS.C.findWeaponDef(res.id);
      if (def) { icon = def.art.icon; name = def.name; sub = def.path; weaponId = def.id; }
    } else {
      const def = DS.C.findItem(res.id);
      if (def) { icon = def.icon; name = def.name + (res.count > 1 ? ' ×' + res.count : ''); sub = def.kind; itemId = def.id; }
    }
    // 4★/5★ CHARACTER pulls get the art blown up to cover the whole card — like
    // the roster/battle cards — instead of a small centered icon. Weapons stay at
    // their original compact icon-plus-caption size; a 5★ weapon still gets the
    // sheen sweep below (that rule keys off .r5 alone, not .big-art).
    const bigArt = res.rarity >= 4 && res.type === 'character';
    const card = el('div', 'gacha-result r' + res.rarity + (bigArt ? ' big-art' : ''));
    const content = el('div', 'gr-content');
    const weaponUrl = weaponId && DS.Assets ? DS.Assets.weapon(weaponId) : null;
    const itemUrl = itemId && DS.Assets ? DS.Assets.item(itemId) : null;
    const charUrl = charDef && DS.Assets ? DS.Assets.portrait(charDef.id) : null;
    const fullArtUrl = charUrl || weaponUrl || itemUrl;
    if (bigArt && fullArtUrl) {
      const bg = document.createElement('img');
      bg.className = 'gr-bg-art';
      bg.src = fullArtUrl;
      bg.alt = '';
      bg.onerror = () => bg.remove();
      content.appendChild(bg);
      content.appendChild(el('div', 'gr-bg-scrim'));
    } else if (charDef && charUrl) {
      const p = DS.C.portrait(charDef, { size: 80, rarity: res.rarity, element: charDef.element });
      p.style.margin = '0 auto';
      content.appendChild(p);
    } else if (weaponUrl || itemUrl) {
      const img = document.createElement('img');
      img.className = 'gr-icon-art';
      img.src = weaponUrl || itemUrl;
      img.alt = '';
      img.onerror = () => { img.replaceWith(el('div', 'gr-icon', icon)); };
      content.appendChild(img);
    } else {
      content.appendChild(el('div', 'gr-icon', icon));
    }
    content.appendChild(el('div', 'gr-stars stars', '★'.repeat(res.rarity)));
    const nm = el('div', 'gr-name', name);
    nm.style.color = (DS.RARITY_META[res.rarity] || {}).color;
    content.appendChild(nm);
    if (sub) content.appendChild(el('div', 'gr-sub small text-faint', sub));
    if (res.isNew) content.appendChild(el('div', 'gr-new', 'NEW'));
    else if (res.dupeConverted && res.dupeConverted.remembrance !== undefined) {
      content.appendChild(el('div', 'gr-dupe small', 'Remembrance ' + res.dupeConverted.remembrance + (res.dupeConverted.ash ? ' · +' + res.dupeConverted.ash + ' Ash' : '')));
    } else if (res.dupeConverted && res.dupeConverted.ash) content.appendChild(el('div', 'gr-dupe small', '→ +' + res.dupeConverted.ash + ' Ash'));
    else if (res.dupeConverted) content.appendChild(el('div', 'gr-dupe small', 'Duplicate'));
    card.appendChild(content);

    // Face-down until clicked. 4★/5★ reveals get a shake + colored flash +
    // spark burst (purple for 4★, gold for 5★); the flash/sparks are appended
    // to the un-clipped .gr-cell wrapper, not the card itself, since .big-art
    // sets overflow:hidden to keep its full-bleed art inside rounded corners.
    const cardback = el('div', 'gr-cardback');
    card.appendChild(cardback);
    const cell = el('div', 'gr-cell');
    cell.style.animationDelay = (i * 0.1) + 's';
    cell.appendChild(card);

    // A 4★/5★ reveal shakes FIRST, builds tension, then flips — flash/sparks/
    // fanfare only land once the shake has actually finished. Lower rarities
    // flip immediately (nothing to build tension toward).
    const SHAKE_MS = 600;
    let revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      const doFlip = () => {
        card.classList.add('revealed');
        DS.SFX.play('flip');
        if (res.rarity >= 4) {
          DS.SFX.play(res.rarity >= 5 ? 'legendary' : 'rare');
          const tone = res.rarity >= 5 ? 'gold' : 'purple';
          const flash = el('div', 'gr-flash ' + tone);
          cell.appendChild(flash);
          setTimeout(() => flash.remove(), 800);
          const sparkCount = res.rarity >= 5 ? 22 : 14;
          for (let s = 0; s < sparkCount; s++) {
            const spark = el('div', 'gr-spark ' + tone);
            const ang = Math.random() * Math.PI * 2;
            const dist = 55 + Math.random() * 55;
            spark.style.setProperty('--sx', Math.cos(ang) * dist + 'px');
            spark.style.setProperty('--sy', Math.sin(ang) * dist + 'px');
            spark.style.animationDelay = (Math.random() * 0.1) + 's';
            cell.appendChild(spark);
            setTimeout(() => spark.remove(), 900);
          }
        }
      };
      if (res.rarity >= 4) {
        card.classList.add('gr-shaking');
        setTimeout(() => {
          card.classList.remove('gr-shaking');
          doFlip();
        }, SHAKE_MS);
      } else {
        doFlip();
      }
    }
    cardback.onclick = reveal;
    cell.reveal = reveal;
    return cell;
  }

  function showResults(results) {
    const body = el('div');
    body.appendChild(el('div', 'small text-dim gr-hint', 'Click a card to reveal it — or Reveal All below.'));
    const grid = el('div', 'gacha-results-grid' + (results.length === 1 ? ' single' : ''));
    const cells = results.map((r, i) => resultCard(r, i));
    cells.forEach((c) => grid.appendChild(c));
    body.appendChild(grid);
    DS.C.modal({
      title: 'The Fire Answers', body, wide: true, blocking: true,
      actions: [
        {
          label: 'Reveal All', cls: 'ghost',
          onClick: () => {
            // Domino cascade — each card flips a beat after the last, rather
            // than all at once; every flip plays its own SFX (see reveal()).
            cells.forEach((c, idx) => setTimeout(() => c.reveal(), idx * 180));
            return true;
          },
        },
        { label: 'Accept', cls: 'primary', onClick: () => { DS.UI.rerender(); } },
      ],
    });
  }

  // Guards against a second roll starting (and a second .ritual-overlay stacking
  // on top) while one is still mid-ritual — e.g. a rapid double-click on Summon —
  // which could otherwise show a lower-tier overlay layered right on top of an
  // in-progress tier-5 cinematic, making it look like the wrong clip played.
  let rollInProgress = false;

  function doRoll(banner, count) {
    if (rollInProgress) return;
    const afford = DS.Gacha.canAfford(banner.id, count);
    if (!afford.ok) {
      DS.C.toast('Not enough Signs or Humanity. (Need ' + afford.cost + ' signs; short ' + afford.signsShort + ', would cost ' + afford.humanityNeeded + ' humanity.)', { icon: '🖤', img: DS.Assets && DS.Assets.currency('humanity'), ms: 3200 });
      return;
    }
    const go = () => {
      rollInProgress = true;
      const results = DS.Gacha.roll(banner.id, count);
      if (!results) {
        rollInProgress = false;
        DS.C.toast('The signs are silent.', { icon: '🪧', img: DS.Assets && DS.Assets.currency('signs') });
        return;
      }
      DS.UI.refreshTopBar();
      playRitual(results.best, () => { rollInProgress = false; showResults(results); });
    };
    if (afford.signsShort > 0) {
      DS.C.confirm(
        'You hold ' + afford.signsHave + ' Summon Signs. The remaining ' + afford.signsShort + ' will be drawn from Humanity (' + afford.humanityNeeded + ' 🖤). Proceed?',
        { title: 'Convert Humanity?', okLabel: 'Summon' }
      ).then((yes) => { if (yes) go(); });
    } else go();
  }

  // ─────────────── modals: details / history ───────────────

  function ratesModal(banner) {
    const p = DS.Gacha.getPity(banner.id);
    const body = el('div');
    const rows = [
      ['5★ Legendary', (DS.GACHA_RATES.five * 100).toFixed(1) + '% (soft pity from roll ' + p.softPityStart + ', guaranteed at ' + p.hardPity + ')'],
      ['4★ Epic', (DS.GACHA_RATES.four * 100).toFixed(1) + '% (guaranteed 4★+ every ' + p.fourPity + ' rolls)'],
      ['3★ Rare', (DS.GACHA_RATES.three * 100).toFixed(0) + '%'],
      ['2★ Uncommon', (DS.GACHA_RATES.two * 100).toFixed(0) + '%'],
      ['1★ Common', 'remainder'],
    ];
    rows.forEach(([a, b]) => body.appendChild(el('p', 'small', [el('b', 'text-gold', a + ' — '), b])));
    if (banner.featured5) body.appendChild(el('p', 'small text-dim', 'Featured rite: each 5★ has a 50% chance to be the featured drop; losing that toss guarantees the next 5★ is featured.' + (banner.kind === 'limited' ? ' Limited rites share one pity track.' : '')));
    if (banner.kind === 'beginner') body.appendChild(el('p', 'small text-dim', 'Initiation rite: a 5★ is guaranteed within your first 50 summons here, and each summon costs 20% less.'));
    body.appendChild(el('hr', 'hr-ornate'));
    body.appendChild(el('p', 'small', ['Current pity — 5★: ', el('b', 'text-gold', String(p.pity5)), ' · 4★: ', el('b', 'text-gold', String(p.pity4)), p.guaranteed ? ' · next 5★ is GUARANTEED featured' : '']));
    DS.C.modal({ title: 'Rates & Rites', body, actions: [{ label: 'Close' }] });
  }

  function historyModal() {
    const H = (DS.State.gacha.history || []).slice().reverse().slice(0, 60);
    const body = el('div');
    if (!H.length) body.appendChild(DS.C.emptyState('No summons yet. The signs wait.'));
    H.forEach((h) => {
      let name = h.id;
      if (h.type === 'character') { const d = DS.C.findChar(h.id); if (d) name = d.name; }
      else if (h.type === 'weapon') { const d = DS.C.findWeaponDef(h.id); if (d) name = d.name; }
      else { const d = DS.C.findItem(h.id); if (d) name = d.name; }
      const row = el('div', 'row small spread');
      row.style.padding = '0.2em 0';
      const nm = el('span', null, '★'.repeat(h.rarity) + ' ' + name);
      nm.style.color = (DS.RARITY_META[h.rarity] || {}).color;
      row.appendChild(nm);
      row.appendChild(el('span', 'text-faint', new Date(h.ts).toLocaleDateString()));
      body.appendChild(row);
    });
    DS.C.modal({ title: 'Summoning Record', body, actions: [{ label: 'Close' }] });
  }

  // ─────────────── screen ───────────────

  DS.UI.registerScreen('gacha', {
    render() {
      // Outer wrapper is full-bleed (no max-width) so the backdrop image covers the
      // whole stage edge-to-edge; the actual content stays in a max-width inner
      // column (.screen-inner) for readability, same as before.
      const outer = el('div', 'screen gacha-screen');
      outer.appendChild(DS.C.screenBgImage(DS.Assets.background('gacha')));
      const wrap = el('div', 'screen-inner');
      // The beginner banner is a one-time offer — once the account has pulled its
      // first 5★ from it (p.got5, tracked per-banner by the pity engine), it's done
      // its job and drops out of the list entirely.
      const banners = (DS.BANNERS || []).filter((b) => {
        if (b.kind !== 'beginner') return true;
        const bp = DS.Gacha.getPity(b.id);
        return !(bp && bp.got5);
      });
      if (!banners.length) { wrap.appendChild(DS.C.emptyState('No rites available.')); outer.appendChild(wrap); return outer; }
      if (activeBannerIdx >= banners.length) activeBannerIdx = 0;
      const banner = banners[activeBannerIdx];
      const p = DS.Gacha.getPity(banner.id);

      // Banner tab strip.
      const strip = el('div', 'banner-strip');
      banners.forEach((b, i) => {
        const iconAssetUrl = b.art.iconAsset && DS.Assets ? DS.Assets.currency(b.art.iconAsset) : null;
        const chipChildren = [];
        if (iconAssetUrl) {
          const iconNode = document.createElement('img');
          iconNode.className = 'sign-icon-art';
          iconNode.src = iconAssetUrl;
          iconNode.alt = '';
          chipChildren.push(iconNode);
        }
        chipChildren.push(el('span', 'small', b.name));
        const chip = el('div', 'banner-chip' + (i === activeBannerIdx ? ' active' : ''), chipChildren);
        chip.onclick = () => { activeBannerIdx = i; DS.SFX.play('ui'); DS.UI.rerender(); };
        strip.appendChild(chip);
      });
      wrap.appendChild(strip);

      // Main banner card.
      const card = el('div', 'banner-hero panel-ornate');
      card.style.setProperty('--b1', banner.art.palette[0]);
      card.style.setProperty('--b2', banner.art.palette[1]);
      const featuredType = banner.featured5 && banner.featured5.type;
      const featuredId = banner.featured5 ? (banner.featured5.id || banner.featured5) : null;
      const featuredChar = featuredId && (!featuredType || featuredType === 'character') ? DS.C.findChar(featuredId) : null;
      const featuredWeapon = featuredId && featuredType === 'weapon' ? DS.C.findWeaponDef(featuredId) : null;

      // Full portrait/weapon art as the card's own backdrop instead of a small
      // thumbnail icon — covers the left half, blending into black toward the right
      // so the pity meter/summon buttons (in .banner-right) stay readable.
      const bgUrl = featuredChar ? (DS.Assets && DS.Assets.portrait(featuredChar.id))
        : featuredWeapon ? (DS.Assets && DS.Assets.weapon(featuredWeapon.id)) : null;
      if (bgUrl) {
        const bgImg = document.createElement('img');
        bgImg.className = 'banner-portrait-bg' + (featuredWeapon ? ' contain-fit' : '');
        bgImg.src = bgUrl;
        bgImg.alt = '';
        card.appendChild(bgImg);
        card.appendChild(el('div', 'banner-portrait-fade'));
      }

      const kindLabel = banner.kind === 'limited' ? 'LIMITED RITE'
        : banner.kind === 'beginner' ? 'INITIATION RITE'
        : banner.kind === 'weapon' ? 'ARMORY RITE'
        : 'PERMANENT RITE';
      const heroLeft = el('div', 'banner-left', [
        el('div', 'banner-kind small', kindLabel),
        el('h2', null, banner.name),
        el('p', 'small text-dim italic', banner.art.tagline),
      ]);
      if (featuredChar) {
        heroLeft.appendChild(el('div', null, [
          el('div', 'stars', '★★★★★'),
          el('div', 'display text-gold', featuredChar.name),
          el('div', 'small text-dim', featuredChar.title),
        ]));
      } else if (featuredWeapon) {
        heroLeft.appendChild(el('div', null, [
          el('div', 'stars', '★★★★★'),
          el('div', 'display text-gold', featuredWeapon.name),
          el('div', 'small text-dim', featuredWeapon.path),
        ]));
      }
      card.appendChild(heroLeft);

      const heroRight = el('div', 'banner-right');
      // Pity meter.
      const pityBox = el('div', 'pity-box', [
        el('div', 'small text-dim', 'Pity toward guaranteed 5★'),
        DS.C.statBar({ cls: 'energy', cur: p.pity5, max: p.hardPity, label: p.pity5 + ' / ' + p.hardPity }),
        p.guaranteed ? el('div', 'small text-gold', '✦ Next 5★: featured guaranteed') : null,
      ]);
      heroRight.appendChild(pityBox);

      const cost1 = DS.Gacha.canAfford(banner.id, 1);
      const cost10 = DS.Gacha.canAfford(banner.id, 10);
      const btnRow = el('div', 'row');
      const b1 = el('button', 'big', ['Summon ×1', signCostEl(cost1.cost)]);
      b1.onclick = () => doRoll(banner, 1);
      const b10 = el('button', 'primary big', ['Summon ×10', signCostEl(cost10.cost, ' · 4★+ guaranteed')]);
      b10.onclick = () => doRoll(banner, 10);
      btnRow.appendChild(b1);
      btnRow.appendChild(b10);
      heroRight.appendChild(btnRow);

      const linkRow = el('div', 'row small');
      const rates = el('button', 'ghost small', 'Rates & Rites');
      rates.onclick = () => ratesModal(banner);
      const hist = el('button', 'ghost small', 'Record');
      hist.onclick = () => historyModal();
      linkRow.appendChild(rates);
      linkRow.appendChild(hist);
      heroRight.appendChild(linkRow);
      card.appendChild(heroRight);
      wrap.appendChild(card);

      wrap.appendChild(el('p', 'small text-faint italic', 'Summon Signs are drawn with soapstone and answered by the fire. 1 sign per summon; short signs are covered by Humanity (' + DS.PULL_COST_HUMANITY + ' 🖤 each). Ritual splendor scales with what answers — from a grey sputter to the First Flame itself.'));
      outer.appendChild(wrap);
      return outer;
    },
  });
})();
