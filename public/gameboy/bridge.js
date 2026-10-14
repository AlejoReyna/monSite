import { SAVE_KEY, encode, captureCartridge, restoreCartridge, readCartridge, createCartridgeBackup, flushLocalCartridge } from './cartridge.js';
/* EmulatorJS 4.2.3 adapter: documented options + native UI actions only.
 * No EJS_emulator/GameManager/Module internals are accessed. */
(() => {
  const origin = location.origin;
  const localGame = new URLSearchParams(location.search).get('local') === '1';
  let configured = !localGame, booted = false;
  const send = (type, extra = {}) => parent.postMessage({ channel: 'gold-player', type, ...extra }, origin);
  const keys = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, x: 88, z: 90, Enter: 13, Shift: 16 };
  const held = new Set();
  let started = false, paused = false, busy = false, exiting = false, exportNext = false;
  let timer;
  const click = name => {
    const label = [...document.querySelectorAll('.ejs_menu_button span')].find(el => el.textContent === `gold-${name}`);
    if (!label) throw new Error(`Missing EmulatorJS control: ${name}`);
    label.closest('button').click();
  };
  function input(key, down) {
    if (!keys[key] || !started || (down && (paused || exiting))) return;
    if (down === held.has(key)) return;
    if (down) held.add(key); else held.delete(key);
    document.getElementById('game').dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, keyCode: keys[key], which: keys[key], bubbles: true }));
  }
  function release() { [...held].forEach(key => input(key, false)); }
  function pause(value) {
    release();
    if (!started || value === paused) return;
    click(value ? 'pause' : 'play');
  }
  function save(backup = false) {
    if (!started) return;
    if (busy) { if (backup) exportNext = true; return; }
    busy = true; exportNext = backup;
    click('save');
  }
  window.EJS_player = '#game';
  window.EJS_core = 'gambatte';
  window.EJS_controlScheme = 'gb';
  window.EJS_gameUrl = '/games/pokemon-gold.gbc';
  window.EJS_gameName = 'pokemon-gold';
  window.EJS_gameID = 250;
  window.EJS_pathtodata = '/emulatorjs/4.2.3/data/';
  window.EJS_startOnLoaded = true;
  window.EJS_threads = false;
  window.EJS_noAutoFocus = true;
  window.EJS_disableDatabases = true; // IDBFS cartridge saves remain enabled; no ROM/core caches.
  window.EJS_disableLocalStorage = true; // Fixed key mapping on every visit.
  window.EJS_language = 'en-US';
  window.EJS_disableAutoLang = false;
  window.EJS_volume = 0.45;
  window.EJS_backgroundColor = '#000';
  window.EJS_defaultOptions = { shader: 'disabled', 'save-save-interval': '0', 'save-state-location': 'browser' };
  window.EJS_defaultControls = { 0: Object.fromEntries([[0,'z'],[2,'shift'],[3,'enter'],[4,'up arrow'],[5,'down arrow'],[6,'left arrow'],[7,'right arrow'],[8,'x']].map(([id,value]) => [id,{value}])), 1:{}, 2:{}, 3:{} };
  const control = (name, callback) => ({ visible: true, displayName: `gold-${name}`, callback });
  window.EJS_Buttons = {
    play: control('play', () => { paused = false; send('paused', { value: false }); }),
    pause: control('pause', () => { paused = true; send('paused', { value: true }); }),
    mute: control('mute', () => send('sound', { value: false })),
    unmute: control('unmute', () => send('sound', { value: true })),
    saveSavFiles: control('save'), saveState: control('snapshot'),
    restart:false, settings:false, fullscreen:false, loadState:false, screenRecord:false, gamepad:false,
    cheat:false, volume:false, loadSavFiles:false, quickSave:false, quickLoad:false, screenshot:false,
    cacheManager:false, exitEmulation:false, netplay:false, diskButton:false, contextMenu:false
  };
  window.EJS_onSaveSave = async ({save: bytes}) => {
    try {
      if (localGame) {
        // Native IDBFS saves belong to this ROM's content-based gameName.
        // Gold's 32 KiB + RTC mirror/backup format must never handle other carts.
        if (!bytes || bytes.length > 131072) throw new Error('Invalid SRAM export');
        await flushLocalCartridge(bytes, window.EJS_gameName);
        send('saved', { bytes: bytes.length });
        if (exportNext) send('cartridge-save', { encoded: encode(bytes) });
        return;
      }
      if (!bytes || bytes.length !== 32768) throw new Error('Invalid SRAM export');
      const backup = await captureCartridge(bytes);
      const json = JSON.stringify(backup);
      try { localStorage.setItem(SAVE_KEY, json); } catch { send('storage-error'); }
      send('saved', { bytes: bytes.length });
      if (exportNext) send('backup', { backup: json });
    } catch {
      send('storage-error');
      if (localGame && exportNext && bytes && bytes.length <= 131072) send('cartridge-save', { encoded: encode(bytes) });
      // A failed browser-storage/RTC flush must not prevent a manual backup of
      // the real cartridge SRAM. The host explicitly identifies the missing clock.
      if (!localGame && exportNext && bytes?.length === 32768) send('backup', { backup: JSON.stringify(createCartridgeBackup(bytes)) });
    }
    finally {
      busy = false; exportNext = false;
      if (exiting) { pause(true); send('stopped'); }
    }
  };
  window.EJS_onSaveState = ({state}) => {
    // Explicit checkpoints only: restoring one also rewinds the emulated RTC.
    send('snapshot', { encoded: encode(state) });
  };
  window.EJS_onGameStart = () => {
    if (started) return;
    started = true;
    // Starting muted avoids autoplay audio policy; first sound action is a gesture.
    click('mute');
    send('ready');
    timer = setInterval(() => { if (!paused) save(); }, 15000);
  };
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== origin || event.data?.channel !== 'gold-host') return;
    const { type, key, down, value } = event.data;
    try {
      if (type === 'load-rom') {
        const { url, id } = event.data;
        if (!localGame || configured || exiting || typeof url !== 'string' ||
            !url.startsWith(`blob:${origin}/`) || typeof id !== 'string' || !/^rom-[a-f0-9]{64}$/.test(id)) return;
        configured = true;
        window.EJS_gameUrl = url;
        window.EJS_gameName = id;
        window.EJS_gameID = Number.parseInt(id.slice(4, 16), 16);
        void boot();
        return;
      }
      if (type === 'key') input(key, down === true);
      if (type === 'release') release();
      if (type === 'pause') pause(value === true);
      if (type === 'sound') {
        // The host action activates same-origin descendant frames too. Forward a
        // gesture event so Emscripten's documented browser audio unlock runs.
        if (value) document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        click(value ? 'unmute' : 'mute');
      }
      if (type === 'save') save();
      if (type === 'export') save(true);
      if (type === 'snapshot') click('snapshot');
      if (type === 'stop') {
        exiting = true; clearInterval(timer); release();
        if (started) { click('mute'); if (busy) return; save(); }
        else send('stopped');
      }
    } catch (error) { send('error', { message: String(error) }); }
  });
  addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); pause(true); } });
  addEventListener('pagehide', () => { clearInterval(timer); release(); if (started) save(); });
  // Normalize browser-generated events too (the iframe may receive focus on tap).
  document.addEventListener('keydown', event => {
    if (!event.isTrusted) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); pause(!paused); }
    else if (event.key === 'Tab') { event.preventDefault(); send('focus-host'); }
    else if (event.altKey && event.key.toLowerCase() === 'q') { event.preventDefault(); send('exit'); }
    else if (keys[event.key] && !event.repeat) held.add(event.key);
  }, true);
  document.addEventListener('keyup', event => { if (event.isTrusted) held.delete(event.key); }, true);
  addEventListener('error', () => send('error'));
  async function boot() {
    // Standalone navigation must never start the hidden game.
    if (parent === window || !configured || booted || exiting) return;
    booted = true;
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (document.querySelector('.ejs_error_text')) { observer.disconnect(); send('error'); }
      });
      observer.observe(document.getElementById('game'), { childList: true, subtree: true, attributes: true });
    }
    if (!localGame) try {
      const imported = localStorage.getItem(SAVE_KEY + '.restore');
      if (imported) {
        await restoreCartridge(JSON.parse(imported));
        localStorage.setItem(SAVE_KEY, imported);
        localStorage.removeItem(SAVE_KEY + '.restore');
      } else {
        // Native IDBFS can contain a newer pagehide flush than the local mirror.
        const native = await readCartridge();
        const mirror = localStorage.getItem(SAVE_KEY);
        if (!native.sram && mirror) await restoreCartridge(JSON.parse(mirror));
      }
    } catch { send('storage-error'); }
    const loader = document.createElement('script');
    loader.src = '/emulatorjs/4.2.3/data/loader.js';
    loader.onerror = () => send('error');
    document.body.appendChild(loader);
  }
  boot();
})();
