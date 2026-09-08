// Resolution frame: #stage is held at a fixed virtual resolution (always 16:9) and
// scaled+centered to fit whatever the real browser window is, letterboxing with
// black bars rather than reflowing the UI. See css/theme.css's "Resolution frame"
// comment for the #viewport/#stage architecture this drives.

window.DS = window.DS || {};

(function () {
  const RESOLUTIONS = {
    '720p': { w: 1280, h: 720, label: '720p (HD)' },
    '1080p': { w: 1920, h: 1080, label: '1080p (Full HD)' },
    '1440p': { w: 2560, h: 1440, label: '1440p (QHD)' },
    '4k': { w: 3840, h: 2160, label: '4K (UHD)' },
  };

  function currentKey() {
    const k = DS.State && DS.State.settings && DS.State.settings.resolution;
    return RESOLUTIONS[k] ? k : '1080p';
  }

  function apply() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const { w, h } = RESOLUTIONS[currentKey()];
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }

  // Fullscreen — the packaged desktop build (Tauri, window.__TAURI__ present
  // when tauri.conf.json's app.withGlobalTauri is on) goes through the native
  // window API; a plain browser tab (dev testing, or the web build) falls back
  // to the standard Fullscreen API on <html>. Exposed as a toggle rather than
  // tracked on/off state in DS.State.settings, since the OS/browser can also
  // exit fullscreen on its own (Esc, Alt+Enter) — asking each API for its own
  // current state avoids ever going stale.
  async function isFullscreen() {
    const tauriWin = window.__TAURI__ && window.__TAURI__.window;
    if (tauriWin) return tauriWin.getCurrentWindow().isFullscreen();
    return !!document.fullscreenElement;
  }

  async function toggleFullscreen() {
    const tauriWin = window.__TAURI__ && window.__TAURI__.window;
    if (tauriWin) {
      const win = tauriWin.getCurrentWindow();
      const now = await win.isFullscreen();
      await win.setFullscreen(!now);
      return !now;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return false;
    }
    await document.documentElement.requestFullscreen();
    return true;
  }

  DS.Layout = {
    RESOLUTIONS,
    apply,
    isFullscreen,
    toggleFullscreen,
    setResolution(key) {
      if (!RESOLUTIONS[key]) return;
      if (DS.State && DS.State.settings) DS.State.settings.resolution = key;
      apply();
    },
  };

  window.addEventListener('resize', apply);

  // F11 is the conventional fullscreen key in games; preventDefault stops a
  // real browser's own native F11 handling from fighting with ours.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  });
})();
