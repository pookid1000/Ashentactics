// Background music — real audio files (unlike sfx.js's synthesized cues). Loops per-track until
// explicitly swapped or stopped; volume is read from DS.State.settings.musicVolume (0-1).

window.DS = window.DS || {};

(function () {
  const TRACKS = {
    hub: 'assets/audio/music/hub_theme.mp3',
    world1: 'assets/audio/music/world1_asylum.m4a',
    asylum_demon_boss: 'assets/audio/music/asylum_demon_boss.mp3',
    four_kings_boss: 'assets/audio/music/four_kings_boss.m4a',
    darkwraith_boss: 'assets/audio/music/darkwraith_boss.m4a',
  };

  // Maps a battle source's stageId (see hub-ui.js launchStage()'s `source.stageId`) to a track
  // key above. w1s1-w1s3 share the world theme; w1s4 is the Asylum Demon's own boss stage;
  // w5s2 is the Four Kings' Four Thrones; t_dw_2 is the Darkwraith Covenant Trial's boss stage
  // (Drowned Court Reprisal, vs. darkwraith_knights) — the closest thing to a discrete
  // "Darkwraith boss fight" since darkwraith itself is only ever a regular trash-tier spawn.
  const STAGE_TRACK = {
    w1s1: 'world1', w1s2: 'world1', w1s3: 'world1',
    w1s4: 'asylum_demon_boss',
    w5s2: 'four_kings_boss',
    t_dw_2: 'darkwraith_boss',
  };

  let current = null; // the HTMLAudioElement currently playing (or paused-but-live)
  let currentKey = null;
  const cache = {};

  function clampVol(v) {
    if (v === null || v === undefined) v = 0.6;
    return Math.max(0, Math.min(1, v));
  }

  function currentVolume() {
    return clampVol(DS.State && DS.State.settings && DS.State.settings.musicVolume);
  }

  function getAudio(key) {
    if (cache[key]) return cache[key];
    const path = TRACKS[key];
    if (!path) return null;
    const audio = new Audio(path);
    audio.loop = true;
    audio.preload = 'auto';
    cache[key] = audio;
    return audio;
  }

  DS.Music = {
    // Looks up which track key a battle stage should play, by its stageId (null if none assigned).
    stageKey(stageId) { return (stageId && STAGE_TRACK[stageId]) || null; },

    // Plays `key` on loop. No-ops if it's already the current (still-playing) track. Passing a
    // falsy/unknown key just stops whatever was playing (used when a stage has no music yet).
    play(key) {
      const audio = key ? getAudio(key) : null;
      if (!audio) { DS.Music.stop(); return; }
      if (key === currentKey && current === audio && !audio.paused) return;
      if (current && current !== audio) { current.pause(); current.currentTime = 0; }
      audio.volume = currentVolume();
      audio.currentTime = 0;
      audio.play().catch(() => { /* blocked until a user gesture — harmless, next play() retries */ });
      current = audio;
      currentKey = key;
    },

    stop() {
      if (current) { current.pause(); current.currentTime = 0; }
      current = null;
      currentKey = null;
    },

    setVolume(v) {
      const vol = clampVol(v);
      if (DS.State && DS.State.settings) DS.State.settings.musicVolume = vol;
      if (current) current.volume = vol;
    },
  };
})();
