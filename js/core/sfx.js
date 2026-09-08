// Synthesized sound effects via WebAudio — no external audio assets.

window.DS = window.DS || {};

(function () {
  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 220, type = 'sine', dur = 0.15, gain = 0.12, slideTo = null, delay = 0 }) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.2, gain = 0.1, freq = 800, delay = 0 }) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + delay;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(a.destination);
    src.start(t0);
  }

  const LIB = {
    ui() { tone({ freq: 660, type: 'triangle', dur: 0.06, gain: 0.05 }); },
    back() { tone({ freq: 440, type: 'triangle', dur: 0.06, gain: 0.05 }); },
    hit() { noise({ dur: 0.12, gain: 0.14, freq: 900 }); tone({ freq: 140, type: 'square', dur: 0.08, gain: 0.06 }); },
    crit() { noise({ dur: 0.16, gain: 0.18, freq: 1400 }); tone({ freq: 520, type: 'sawtooth', dur: 0.14, gain: 0.07, slideTo: 90 }); },
    heal() { tone({ freq: 520, type: 'sine', dur: 0.25, gain: 0.07, slideTo: 780 }); },
    shield() { tone({ freq: 300, type: 'triangle', dur: 0.2, gain: 0.08, slideTo: 420 }); },
    break() { noise({ dur: 0.3, gain: 0.2, freq: 600 }); tone({ freq: 220, type: 'sawtooth', dur: 0.3, gain: 0.1, slideTo: 55 }); },
    whoosh() { noise({ dur: 0.25, gain: 0.09, freq: 2200 }); },
    chime() { tone({ freq: 880, dur: 0.4, gain: 0.06 }); tone({ freq: 1320, dur: 0.5, gain: 0.04, delay: 0.05 }); },
    roar() { tone({ freq: 90, type: 'sawtooth', dur: 0.6, gain: 0.12, slideTo: 45 }); noise({ dur: 0.5, gain: 0.1, freq: 300 }); },
    ritual() { tone({ freq: 110, type: 'sine', dur: 1.2, gain: 0.08, slideTo: 220 }); tone({ freq: 55, type: 'triangle', dur: 1.4, gain: 0.07 }); },
    rare() { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.35, gain: 0.06, delay: i * 0.09 })); },
    legendary() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone({ freq: f, dur: 0.5, gain: 0.07, delay: i * 0.11 })); noise({ dur: 0.8, gain: 0.06, freq: 500, delay: 0.3 }); },
    death() { tone({ freq: 160, type: 'sawtooth', dur: 0.5, gain: 0.08, slideTo: 40 }); },
    energy() { tone({ freq: 700, type: 'sine', dur: 0.1, gain: 0.04, slideTo: 950 }); },
    flip() { noise({ dur: 0.09, gain: 0.11, freq: 2600 }); tone({ freq: 900, type: 'triangle', dur: 0.05, gain: 0.04, slideTo: 480 }); },
  };

  // Recorded one-shot samples — take priority over the synthesized LIB above when a
  // name matches both (e.g. 'hit'/'crit'/'heal'/'shield' replace their synthesized
  // versions outright). Cloned per-play so overlapping triggers (rapid multi-hits)
  // don't cut each other off.
  const SAMPLES = {
    hit: 'assets/audio/sfx/hit.mp3',
    crit: 'assets/audio/sfx/crit.mp3',
    hitShield: 'assets/audio/sfx/hit_shield.mp3',
    heal: 'assets/audio/sfx/heal.mp3',
    shield: 'assets/audio/sfx/shield_buff.mp3',
    buff: 'assets/audio/sfx/buff.mp3',
    debuff: 'assets/audio/sfx/debuff.mp3',
    attackWarrior: 'assets/audio/sfx/attack_warrior.mp3',
    attackAssassin: 'assets/audio/sfx/attack_assassin.mp3',
    attackSentinel: 'assets/audio/sfx/attack_sentinel.mp3',
    flip: 'assets/audio/sfx/card_flip.mp3',
    arrowShot: 'assets/audio/sfx/arrow_shot.m4a',
    parry: 'assets/audio/sfx/gwyn_parry_skill.mp3',
    swipe: 'assets/audio/sfx/swipe.mp3',
    click: 'assets/audio/sfx/click.mp3',
    trialUnlock: 'assets/audio/sfx/trial_unlock.m4a',
    fogTransition: 'assets/audio/sfx/fog_transition.mp3',
  };
  // 'swipe'/'click' fire far more often than any other cue here (every menu hover,
  // every click anywhere) — quieter than the default so they read as a subtle UI
  // tick rather than competing with battle SFX volume.
  const SAMPLE_VOLUME = { swipe: 0.32, click: 0.45 };
  const sampleCache = {};

  function playSample(name) {
    const src = SAMPLES[name];
    if (!src) return false;
    let base = sampleCache[name];
    if (!base) { base = new Audio(src); base.preload = 'auto'; sampleCache[name] = base; }
    const node = base.cloneNode();
    node.volume = SAMPLE_VOLUME[name] != null ? SAMPLE_VOLUME[name] : 0.7;
    node.play().catch(() => { /* blocked until a user gesture — harmless */ });
    return true;
  }

  DS.SFX = {
    play(name) {
      if (DS.State && DS.State.settings && DS.State.settings.sfx === false) return;
      try {
        if (playSample(name)) return;
        const fn = LIB[name];
        if (fn) fn();
      } catch (e) { /* audio unavailable */ }
    },
    // Every ability whose own flavor text describes an actual bow-and-arrow shot
    // (checked case by case against characters.js/enemies.js, not guessed from a
    // unit's whole kit) — covers mixed-moveset units like Silver Knight, whose
    // other two moves are a melee spear/halberd, without also tagging those.
    //   Loosed Shaft, Pinning Volley  — Hollow Archer's whole kit
    //   Moonlight Arrow               — Gwyndolin's basic only (skill/ult aren't
    //                                   described as arrows, just moonfire/illusion)
    //   Greatbow Loose                — Gough's basic, and Silver Knight's 3rd move
    //   Pinning Shot, Dragonfell Volley — Gough's skill/ult
    ARROW_ABILITY_NAMES: {
      'Loosed Shaft': true, 'Pinning Volley': true, 'Moonlight Arrow': true,
      'Greatbow Loose': true, 'Pinning Shot': true, 'Dragonfell Volley': true,
    },
    // Per-unit attack sample: Warrior/Sentinel/Assassin paths have dedicated
    // recordings; everyone else falls back to the synthesized 'whoosh'. Takes the
    // acting unit and the ability's own name (not just the unit's path/defId) so a
    // bow attack is recognized by what the ability actually is.
    playAttack(unit, abilityName) {
      const path = unit && unit.path;
      const key = abilityName && DS.SFX.ARROW_ABILITY_NAMES[abilityName] ? 'arrowShot'
        : path === 'Warrior' ? 'attackWarrior'
        : path === 'Sentinel' ? 'attackSentinel'
        : path === 'Assassin' ? 'attackAssassin'
        : null;
      if (key) DS.SFX.play(key);
      else DS.SFX.play('whoosh');
    },
  };

  // Rain + thunder ambience for the Hub (whose backdrop art/video is a rainstorm over
  // Firelink). A continuously looping filtered-noise buffer for the rain hiss, plus
  // randomly-timed low-rumble "thunder" bursts built from the existing tone()/noise()
  // one-shots — same synthesis approach as the rest of this file, no audio assets.
  let rainSrc = null, rainGain = null, thunderTimer = null;

  function thunderCrack() {
    // A low sine rumble reads as a natural boom; a sawtooth at this frequency (the
    // original version) has enough harmonic content to sound buzzy/synthetic instead.
    noise({ dur: 1.3, gain: 0.16, freq: 220 });
    tone({ freq: 55, type: 'sine', dur: 1.5, gain: 0.12, slideTo: 28, delay: 0.04 });
    noise({ dur: 0.8, gain: 0.09, freq: 150, delay: 0.45 });
  }

  function scheduleThunder(first) {
    const delay = first ? 2000 + Math.random() * 2000 : 7000 + Math.random() * 13000; // first crack in 2–4s, then 7–20s apart
    thunderTimer = setTimeout(() => {
      try { thunderCrack(); } catch (e) { /* audio unavailable */ }
      scheduleThunder(false);
    }, delay);
  }

  function startRain() {
    if (rainSrc) return;
    const a = ac();
    if (!a) return;
    // Long enough that the loop point isn't noticeable as a repeating pattern.
    const len = a.sampleRate * 12;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.045, a.currentTime + 1.5);
    src.connect(hp).connect(lp).connect(g).connect(a.destination);
    src.start();
    rainSrc = src;
    rainGain = g;
    scheduleThunder(true);
  }

  function stopRain() {
    if (thunderTimer) { clearTimeout(thunderTimer); thunderTimer = null; }
    if (rainSrc) {
      const a = ac();
      const src = rainSrc, g = rainGain;
      if (a && g) {
        g.gain.cancelScheduledValues(a.currentTime);
        g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
      }
      setTimeout(() => { try { src.stop(); } catch (e) { /* already stopped */ } }, 600);
      rainSrc = null;
      rainGain = null;
    }
  }

  DS.Ambience = {
    // Called once per screen render with whether ambience should be playing here.
    setActive(active) {
      const enabled = !(DS.State && DS.State.settings && DS.State.settings.sfx === false);
      if (active && enabled) startRain();
      else stopRain();
    },
  };
})();
