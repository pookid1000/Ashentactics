// ASHEN TACTICS — VFX layer (CONTRACT.md §6.3).
// Canvas particle overlay + DOM float-text + full-screen ult cut-ins. Original effects.

window.DS = window.DS || {};

(function () {
  let canvas = null;
  let ctx2d = null;
  let container = null;
  let particles = [];
  let ambientTimer = null;
  let rafId = null;

  // Global 2x size bump for every combat particle effect (hits, bursts, blood,
  // heals, debuffs) — applied once here in spawn() rather than per-effect so it
  // stays uniform and doesn't need touching every hand-tuned magic number below.
  const FX_SCALE = 2;

  function reduceMotion() { return !!(DS.State && DS.State.settings && DS.State.settings.reduceMotion); }
  function speed() { return (DS.State && DS.State.settings && DS.State.settings.battleSpeed) || 1; }

  let wasEmpty = true;
  function ensureLoop() {
    if (rafId) return;
    const step = () => {
      rafId = requestAnimationFrame(step);
      if (!ctx2d || !canvas) return;
      // Idle skip: when no particles live, clear once and stop repainting.
      if (!particles.length) {
        if (!wasEmpty) { ctx2d.clearRect(0, 0, canvas.width, canvas.height); wasEmpty = true; }
        return;
      }
      wasEmpty = false;
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const dt = 1 / 60;
      particles = particles.filter((p) => {
        p.life -= dt * p.decay;
        if (p.life <= 0) return false;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vy += (p.gravity || 0) * dt * 60;
        p.vx *= (p.drag || 1);
        p.vy *= (p.drag || 1);
        const alpha = Math.max(0, Math.min(1, p.life));
        ctx2d.globalAlpha = alpha * (p.alpha || 1);
        ctx2d.fillStyle = p.color;
        if (p.shape === 'spark') {
          ctx2d.save();
          ctx2d.translate(p.x, p.y);
          ctx2d.rotate(Math.atan2(p.vy, p.vx));
          ctx2d.fillRect(-p.size * 2, -p.size * 0.35, p.size * 4, p.size * 0.7);
          ctx2d.restore();
        } else if (p.shape === 'ring') {
          // Expands outward as it ages (life 1→0) instead of moving/shrinking like
          // the other shapes — used for pulsing waves (e.g. healing).
          const grown = p.size + (1 - p.life) * (p.ringGrow || 40);
          ctx2d.strokeStyle = p.color;
          ctx2d.lineWidth = p.lineWidth || 2.5;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, Math.max(0.5, grown), 0, Math.PI * 2);
          ctx2d.stroke();
        } else {
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.size * Math.max(0.2, p.life), 0, Math.PI * 2);
          ctx2d.fill();
        }
        return true;
      });
      ctx2d.globalAlpha = 1;
    };
    rafId = requestAnimationFrame(step);
  }

  function resize() {
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  function attach(el) {
    detach();
    container = el;
    canvas = document.createElement('canvas');
    canvas.className = 'vfx-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:30;';
    el.style.position = 'relative';
    el.appendChild(canvas);
    ctx2d = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    ensureLoop();
  }

  function detach() {
    if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    window.removeEventListener('resize', resize);
    canvas = null; ctx2d = null; container = null; particles = [];
  }

  function spawn(n, maker) {
    if (!ctx2d) return;
    const cap = reduceMotion() ? Math.min(6, n) : n;
    for (let i = 0; i < cap; i++) {
      const p = maker(i);
      if (typeof p.size === 'number') p.size *= FX_SCALE;
      if (typeof p.vx === 'number') p.vx *= FX_SCALE;
      if (typeof p.vy === 'number') p.vy *= FX_SCALE;
      if (typeof p.ringGrow === 'number') p.ringGrow *= FX_SCALE;
      if (typeof p.lineWidth === 'number') p.lineWidth *= FX_SCALE;
      particles.push(p);
    }
  }

  function burst(x, y, opts) {
    opts = opts || {};
    const color = opts.color || '#e2662c';
    const count = opts.count || 24;
    const type = opts.type || 'ember';
    spawn(count, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * (type === 'shard' ? 5 : 3);
      return {
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - (type === 'ember' ? 1 : 0),
        size: type === 'shard' ? 2 + Math.random() * 2 : 2.5 + Math.random() * 3,
        color, life: 1, decay: 1.4 + Math.random(), gravity: type === 'shard' ? 0.12 : -0.02,
        drag: 0.97, shape: type === 'shard' ? 'spark' : 'dot',
      };
    });
  }

  // scale stretches the whole streak (spread + travel distance); sizeMult only
  // thickens/lengthens each individual spark (used to make crits read as a heavier
  // blow, not just a bigger version of the same swing).
  function slash(x, y, color, opts) {
    opts = opts || {};
    const scale = opts.scale || 1;
    const sizeMult = opts.sizeMult || 1;
    spawn(16, (i) => ({
      x: x + (-80 + i * 10) * scale, y: y + (60 - i * 8) * scale,
      vx: (3 + Math.random() * 2) * scale, vy: (-2.5 - Math.random()) * scale,
      size: 2.5 * sizeMult, color: color || '#dcd3bd', life: 0.8, decay: 2.2, drag: 0.96, shape: 'spark',
    }));
  }

  function beam(x1, y1, x2, y2, color) {
    const steps = reduceMotion() ? 8 : 26;
    spawn(steps, (i) => {
      const t = i / steps;
      return {
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 8,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5), vy: (Math.random() - 0.5),
        size: 3, color: color || '#7a86e8', life: 0.9, decay: 2.0,
      };
    });
  }

  // Red blood splatter for critical hits — droplets fall with gravity (unlike the
  // embers/shards above, which float or drift flat), plus a few fast thin spray
  // streaks layered in for texture.
  function bloodSplat(x, y) {
    spawn(48, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 7;
      return {
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1.5,
        size: 1.8 + Math.random() * 4,
        color: Math.random() < 0.45 ? '#c0392b' : '#7a1515',
        life: 1, decay: 0.7 + Math.random() * 0.5,
        gravity: 0.32, drag: 0.98, shape: 'dot',
      };
    });
    spawn(22, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 6;
      return {
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        size: 1.2 + Math.random() * 1.3,
        color: '#8c1f1f',
        life: 0.8, decay: 2.2, gravity: 0.25, drag: 0.94, shape: 'spark',
      };
    });
  }

  // Yellow healing pulse — a few staggered rings that expand outward and fade (like
  // ripples), plus a burst of small bright sparkles that drift gently upward.
  function healPulse(x, y) {
    const ringCount = reduceMotion() ? 1 : 3;
    for (let i = 0; i < ringCount; i++) {
      setTimeout(() => {
        spawn(1, () => ({
          x, y, vx: 0, vy: 0,
          size: 4, color: '#f5d94e',
          life: 1, decay: 1.15, drag: 1, shape: 'ring', ringGrow: 58, lineWidth: 3,
        }));
      }, i * 180);
    }
    spawn(22, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.4 + Math.random() * 1.6;
      return {
        x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 0.6,
        size: 1 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#fff3b0' : '#e0b93a',
        life: 1, decay: 0.6 + Math.random() * 0.6, gravity: -0.02, drag: 0.97, shape: 'dot',
      };
    });
  }

  // Shared "serpent bite" ult impact — any snake/wyrm-type boss's ult can opt
  // into this via anim:{type:'serpent_bite'} (see cutIn below, which fires it
  // at the cut-in's impact beat instead of the generic nova). Two massive
  // fang-drag slash streaks rake across the whole screen, offset from each
  // other like the two puncture-drags of a single strike, plus a harder shake
  // and a quick dark flash so it reads heavier than a normal ult nova.
  function serpentBite(cx, cy, color) {
    const c = color || '#dfe9ea';
    screenShake(16);
    flash('#05070a', 200);
    slash(cx - 260, cy - 100, c, { scale: 7, sizeMult: 2.6 });
    slash(cx - 200, cy + 60, c, { scale: 7, sizeMult: 2.6 });
    spawn(30, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 6;
      return {
        x: cx, y: cy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        size: 2.5 + Math.random() * 3, color: c,
        life: 1, decay: 1.3, drag: 0.95, shape: 'spark',
      };
    });
  }

  function nova(x, y, color) {
    spawn(40, () => {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 4;
      return {
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        size: 3 + Math.random() * 3, color: color || '#f0d98a',
        life: 1, decay: 1.2, drag: 0.94,
      };
    });
  }

  function screenShake(intensity) {
    if (reduceMotion() || !container) return;
    container.classList.remove('vfx-shake');
    void container.offsetWidth;
    container.style.setProperty('--shake-px', (intensity || 6) + 'px');
    container.classList.add('vfx-shake');
    setTimeout(() => container && container.classList.remove('vfx-shake'), 380);
  }

  function flash(color, ms) {
    if (!container) return;
    const f = document.createElement('div');
    f.style.cssText = 'position:absolute;inset:0;z-index:29;pointer-events:none;background:' + (color || '#fff') + ';opacity:0.35;transition:opacity ' + (ms || 300) + 'ms ease;';
    container.appendChild(f);
    requestAnimationFrame(() => { f.style.opacity = '0'; });
    setTimeout(() => f.remove(), (ms || 300) + 60);
  }

  // One distinct recipe per debuff, keyed by DS.STATUS id — each reads as a small,
  // thematically-fitting flourish rather than a generic colored burst.
  const DEBUFF_FX = {
    // Curse: dark violet ring + slow-rising smoky wisps.
    curse(x, y) {
      spawn(1, () => ({ x, y, vx: 0, vy: 0, size: 6, color: '#5a2a7a', life: 1, decay: 1.3, drag: 1, shape: 'ring', ringGrow: 34, lineWidth: 3 }));
      spawn(14, () => {
        const ang = Math.random() * Math.PI * 2;
        return {
          x: x + Math.cos(ang) * 16, y: y + Math.sin(ang) * 16,
          vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.8,
          size: 1.5 + Math.random() * 2, color: '#7a4a9e', life: 1, decay: 0.55 + Math.random() * 0.4, drag: 0.98, shape: 'dot',
        };
      });
    },
    // Blind: pale mist swirling around the face, drifting gently.
    blind(x, y) {
      spawn(20, (i) => {
        const ang = (i / 20) * Math.PI * 2;
        const r = 20 + Math.random() * 20;
        return {
          x: x + Math.cos(ang) * r, y: y + Math.sin(ang) * r,
          vx: Math.cos(ang + Math.PI / 2) * 0.9, vy: Math.sin(ang + Math.PI / 2) * 0.9 - 0.15,
          size: 3 + Math.random() * 3, color: '#c9c9c9', life: 1, decay: 0.5 + Math.random() * 0.3, drag: 0.985, shape: 'dot', alpha: 0.55,
        };
      });
    },
    // Hex: magenta vortex spiraling inward-ish around the target.
    hex(x, y) {
      spawn(1, () => ({ x, y, vx: 0, vy: 0, size: 4, color: '#9b59d6', life: 1, decay: 1.4, drag: 1, shape: 'ring', ringGrow: 26, lineWidth: 2 }));
      spawn(18, (i) => {
        const ang = (i / 18) * Math.PI * 2;
        const spd = 2 + Math.random() * 1.5;
        return {
          x, y,
          vx: Math.cos(ang) * spd * 0.3, vy: Math.sin(ang) * spd * 0.3 - 0.4,
          size: 1.8 + Math.random() * 1.5, color: i % 2 ? '#b06fd0' : '#7a3fae', life: 1, decay: 0.9, drag: 0.9, shape: 'dot',
        };
      });
    },
    // Vulnerability: red lock-on rings pulsing outward, like a target reticle.
    vulnerability(x, y) {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => spawn(1, () => ({ x, y, vx: 0, vy: 0, size: 5 + i * 3, color: '#e0392b', life: 1, decay: 1.6, drag: 1, shape: 'ring', ringGrow: 22, lineWidth: 2.5 })), i * 140);
      }
      spawn(6, () => {
        const ang = Math.random() * Math.PI * 2;
        return { x, y, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, size: 1.5, color: '#ff5c46', life: 0.7, decay: 2.4, drag: 0.9, shape: 'spark' };
      });
    },
    // Curse Token: dark motes gathering inward, escalating with each stack —
    // the killing 3rd stack gets a heavier ring and denser mote burst.
    curseToken(x, y, potency) {
      const n = Math.min(3, potency || 1);
      spawn(8 * n, () => {
        const ang = Math.random() * Math.PI * 2;
        const spd = 0.5 + Math.random() * 2;
        return {
          x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 0.5,
          size: 1.5 + Math.random() * 2, color: n >= 3 ? '#1a0a20' : '#3a1a4a', life: 1, decay: 0.6, drag: 0.97, shape: 'dot',
        };
      });
      if (n >= 3) spawn(1, () => ({ x, y, vx: 0, vy: 0, size: 6, color: '#1a0a20', life: 1, decay: 1.0, drag: 1, shape: 'ring', ringGrow: 60, lineWidth: 4 }));
    },
    // Attack Down: a dull red droop, particles sagging downward rather than bursting out.
    atkDown(x, y) {
      spawn(10, () => ({
        x: x + (Math.random() - 0.5) * 40, y: y - 20,
        vx: (Math.random() - 0.5) * 0.6, vy: 1 + Math.random() * 1.5,
        size: 1.8 + Math.random() * 1.6, color: '#c0392b', life: 1, decay: 1.1, gravity: 0.15, drag: 0.97, shape: 'spark',
      }));
    },
    // Defense Down: grey shards flying outward, like cracking armor.
    defDown(x, y) {
      spawn(16, () => {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        return {
          x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          size: 1.5 + Math.random() * 1.5, color: '#9a9a9a', life: 0.8, decay: 2.0, gravity: 0.1, drag: 0.94, shape: 'spark',
        };
      });
    },
    // Speed Down: heavy grey motes sinking slowly, like being weighed down.
    spdDown(x, y) {
      spawn(10, () => ({
        x: x + (Math.random() - 0.5) * 48, y: y - 12,
        vx: (Math.random() - 0.5) * 0.3, vy: 0.2 + Math.random() * 0.3,
        size: 2 + Math.random() * 2, color: '#7a7a7a', life: 1, decay: 0.35, gravity: 0.05, drag: 0.99, shape: 'dot', alpha: 0.6,
      }));
    },
  };

  function debuffEffect(id, x, y, potency) {
    const fn = DEBUFF_FX[id];
    if (fn) { try { fn(x, y, potency); } catch (e) { /* vfx unavailable */ } }
  }

  // Looping ambience per battle background.
  const AMBIENTS = {
    asylum: { color: '#8a8070', rate: 900, rise: false },
    burg: { color: '#e2662c', rate: 700, rise: true },
    depths: { color: '#5f9e6e', rate: 850, rise: false },
    anor: { color: '#f0d98a', rate: 750, rise: true },
    abyss: { color: '#8b5fbf', rate: 600, rise: false },
    kiln: { color: '#ff9d5c', rate: 400, rise: true },
    everlasting_dragon: { color: '#cfeaf8', rate: 650, rise: true },
    witch_of_izalith: { color: '#f4c542', rate: 380, rise: true },
    darkwraith: { color: '#a06fc0', rate: 900, rise: false },
    gravelord_servant: { color: '#d8d3c4', rate: 1000, rise: false },
  };

  function ambient(bg) {
    if (ambientTimer) clearInterval(ambientTimer);
    const conf = AMBIENTS[bg] || AMBIENTS.burg;
    if (reduceMotion()) return;
    ambientTimer = setInterval(() => {
      if (!canvas) return;
      spawn(1, () => ({
        x: Math.random() * canvas.width,
        y: conf.rise ? canvas.height + 6 : -6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: conf.rise ? -0.5 - Math.random() * 0.7 : 0.4 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2, color: conf.color,
        life: 1, decay: 0.16, alpha: 0.7,
      }));
    }, conf.rate);
  }

  function floatText(x, y, text, opts) {
    if (!container) return;
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'float-text ' + (opts.cls || '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);
    // Must stay >= the .float-text CSS animation's total duration (2.8s, see
    // battle.css's floatUp keyframe) or this timer removes the element mid-fade.
    setTimeout(() => el.remove(), 2900 / speed());
  }

  // Full-screen ult cut-in. done() fires when the strike moment lands.
  function cutIn(unit, info, done) {
    const dur = reduceMotion() ? 350 : 1600 / speed();
    const isSerpentBite = !!(info.anim && info.anim.type === 'serpent_bite');
    const overlay = document.createElement('div');
    overlay.className = 'cutin-overlay';
    const pal = (unit.art && unit.art.palette) || ['#111', '#333', '#c9a84c'];
    overlay.style.setProperty('--cut1', pal[0]);
    overlay.style.setProperty('--cut2', pal[1]);
    overlay.style.setProperty('--cut3', pal[2]);

    // The character's full portrait now fills the whole overlay as its background
    // (rather than a small face icon in the text band) — falls back to the old
    // palette-glyph look for the rare unit with no generated portrait art yet.
    const artId = unit && (unit.id || unit.defId);
    const artUrl = artId && DS.Assets ? DS.Assets.portrait(artId) : null;
    if (artUrl) {
      const bg = document.createElement('img');
      bg.className = 'cutin-bg-portrait' + (isSerpentBite ? ' lunge' : '');
      bg.src = artUrl;
      bg.alt = '';
      bg.onerror = () => bg.remove();
      overlay.appendChild(bg);
    } else {
      const glyph = DS.C.portrait(unit, { size: 220, rarity: unit.rarity, element: unit.element });
      glyph.classList.add('cutin-glyph-fallback');
      overlay.appendChild(glyph);
    }

    const rays = document.createElement('div');
    rays.className = 'cutin-rays';
    overlay.appendChild(rays);

    const scrim = document.createElement('div');
    scrim.className = 'cutin-portrait-scrim';
    overlay.appendChild(scrim);

    const band = document.createElement('div');
    band.className = 'cutin-band';
    const textBox = document.createElement('div');
    textBox.className = 'cutin-text';
    const title = document.createElement('div');
    title.className = 'cutin-title';
    title.textContent = (info.cutin && info.cutin.title) || info.name || '';
    const line = document.createElement('div');
    line.className = 'cutin-line';
    line.textContent = (info.cutin && info.cutin.line) || '';
    textBox.appendChild(title);
    textBox.appendChild(line);
    band.appendChild(textBox);
    overlay.appendChild(band);

    // Confined to the battle stage (the play area) rather than the whole browser
    // viewport — same container the VFX canvas and other overlays attach to.
    (container || document.body).appendChild(overlay);
    DS.SFX.play(info.enemy ? 'roar' : 'ritual');
    if (canvas) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      setTimeout(() => {
        if (isSerpentBite) {
          serpentBite(cx, cy, pal[2]);
          // The actual creature — a shared maw graphic (any serpent/wyrm ult can
          // use this) that rushes toward camera and snaps open right as the
          // slashes land, then is gone. mix-blend-mode:screen drops the image's
          // solid black background out entirely, leaving only the pale
          // teeth/scale highlights visible against whatever's already on
          // screen — no alpha-channel art needed for that to work.
          if (!reduceMotion() && DS.Assets && DS.Assets.vfx) {
            const wrap = document.createElement('div');
            wrap.className = 'serpent-maw-wrap';
            const maw = document.createElement('img');
            maw.className = 'serpent-maw-strike';
            maw.src = DS.Assets.vfx('serpent_maw_open');
            maw.alt = '';
            maw.onerror = () => wrap.remove();
            wrap.appendChild(maw);
            overlay.appendChild(wrap);
            setTimeout(() => wrap.remove(), 560 / speed());
          }
        } else {
          nova(cx, cy, pal[2]); screenShake(10);
        }
      }, dur * 0.55);
    }
    setTimeout(() => {
      overlay.classList.add('leaving');
      if (done) done();
      setTimeout(() => overlay.remove(), 350);
    }, dur);
  }

  DS.VFX = { attach, detach, burst, slash, beam, nova, serpentBite, bloodSplat, healPulse, debuffEffect, screenShake, flash, ambient, floatText, cutIn };
})();
