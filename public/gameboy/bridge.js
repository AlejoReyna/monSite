import { SAVE_KEY, ROM, encode, decode, captureCartridge, restoreCartridge, readCartridge, createCartridgeBackup, captureGameCartridge, createGameCartridgeBackup, restoreGameCartridge } from './cartridge.js';
import { parseGameBackup, parseStateBackup, CORE_RUNTIMES, MAX_SRAM_BYTES, MAX_STATE_BYTES } from './backups.js';
/* Pinned EmulatorJS adapter: documented configuration/events and native UI
 * actions only. Never accesses EJS_emulator/GameManager/Module internals. */
(() => {
  const origin = location.origin;
  const params = new URLSearchParams(location.search);
  const session = params.get('session');
  const localGame = params.get('local') === '1';
  let configured = !localGame && !session, booted = false;
  let mode = localGame ? 'cartridge' : 'gold';
  let identity = { sha256: ROM, platform: 'gbc', core: 'gambatte' };
  let restore, stateRestore;
  const send = (type, extra = {}) => parent.postMessage({ channel: 'gold-player', ...(session ? { session } : {}), type, ...extra }, origin);
  // The core's OpenAL resumes its AudioContext once, on the first keydown or
  // mousedown here. Our synthetic input spends that attempt without a user
  // gesture, Safari rejects it (NotAllowedError) and audio stays suspended
  // for the whole session. Track every context so the host can resume them
  // synchronously from a real tap or key press in its own document.
  const audioContexts = new Set();
  const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
  if (NativeAudioContext) {
    const TrackedAudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); audioContexts.add(this); }
    };
    window.AudioContext = TrackedAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = TrackedAudioContext;
  }
  window.goldResumeAudio = () => audioContexts.forEach(context => {
    if (context.state !== 'running' && context.state !== 'closed') context.resume().catch(() => {});
  });
  // Fatal errors carry a readable cause so the host can log and show it.
  const fail = (where, cause, at = '') => {
    const detail = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause ?? 'sin detalle');
    const message = `${where}: ${detail}${at ? ` (${at})` : ''}`.slice(0, 500);
    console.error('[gameboy]', message, cause);
    send('error', { message });
  };
  const keys = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, x: 88, z: 90, Enter: 13, Shift: 16 };
  const held = new Set();
  let started = false, paused = false, busy = false, exiting = false, exportNext = false, rawNext = false;
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
  function save(backup = false, raw = false) {
    if (!started) return;
    if (busy) { exportNext ||= backup; rawNext ||= raw; return; }
    busy = true; exportNext = backup; rawNext = raw;
    try { click('save'); } catch (error) { busy = false; throw error; }
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
  window.EJS_disableDatabases = true;
  window.EJS_disableLocalStorage = true;
  window.EJS_language = 'en-US';
  window.EJS_disableAutoLang = false;
  window.EJS_volume = 0.45;
  window.EJS_backgroundColor = '#000';
  // Use the pinned engine's native SRAM flush. The export button also takes
  // a screenshot and must never run periodically during gameplay.
  // EmulatorJS's 30 s autosave coincided with iOS Safari killing the tab at its
  // 2 GB memory limit. Saves happen on pause, blur, hide and the save button.
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
  window.EJS_onSaveSave = async ({save: exported}) => {
    const bytes = exported ?? new Uint8Array(0); // Carts without battery RAM export null.
    let failed = false;
    try {
      if (mode === 'cartridge') {
        if (bytes.length > MAX_SRAM_BYTES) throw new Error('Invalid cartridge size');
        const backup = await captureGameCartridge(bytes, window.EJS_gameName, identity);
        send('saved', { bytes: bytes.length });
        if (exportNext) send('game-backup', { backup: JSON.stringify(backup) });
        if (rawNext) send('cartridge-save', { encoded: encode(bytes) });
      } else {
        if (bytes.length !== 32768) throw new Error('Invalid SRAM export');
        const backup = await captureCartridge(bytes);
        const json = JSON.stringify(backup);
        try { localStorage.setItem(SAVE_KEY, json); } catch { send('storage-error'); }
        send('saved', { bytes: bytes.length });
        if (exportNext) send('backup', { backup: json });
        if (rawNext) send('cartridge-save', { encoded: encode(bytes) });
      }
    } catch {
      failed = true;
      send('storage-error');
      if (mode === 'cartridge' && bytes.length <= MAX_SRAM_BYTES) {
        if (exportNext) send('game-backup', { backup: JSON.stringify(createGameCartridgeBackup(bytes, undefined, identity, true)) });
        if (rawNext) send('cartridge-save', { encoded: encode(bytes) });
      }
      if (mode === 'gold' && bytes.length === 32768) {
        if (exportNext) send('backup', { backup: JSON.stringify(createCartridgeBackup(bytes)) });
        if (rawNext) send('cartridge-save', { encoded: encode(bytes) });
      }
    } finally {
      busy = false; exportNext = false; rawNext = false;
      if (exiting) {
        pause(true);
        if (failed) { exiting = false; send('stop-failed'); }
        else send('stopped');
      }
    }
  };
  window.EJS_onSaveState = ({state}) => {
    if (!state?.length || state.length > MAX_STATE_BYTES) { send('storage-error'); return; }
    const backup = parseStateBackup(JSON.stringify({
      format: 'monsite-game-state', version: 1, rom: identity.sha256,
      core: identity.core, platform: identity.platform, runtime: CORE_RUNTIMES[identity.core],
      savedAt: new Date().toISOString(), state: encode(state),
    }), identity);
    send('snapshot', { backup: JSON.stringify(backup) });
  };
  window.EJS_onGameStart = () => {
    if (started || exiting) return;
    started = true;
    click('mute');
    send('ready');
  };
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== origin || event.data?.channel !== 'gold-host' ||
        (session && event.data.session !== session)) return;
    const { type, key, down, value } = event.data;
    try {
      if (type === 'load-rom') {
        const { url, id, platform = 'gb', saveMode = 'cartridge', sha256 = id?.slice(4) } = event.data;
        if (configured || exiting || typeof url !== 'string' || !['gb', 'gbc', 'gba'].includes(platform) ||
            typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) return;
        const gold = saveMode === 'gold' && id === 'pokemon-gold' && sha256 === ROM && platform === 'gbc' && url === '/games/pokemon-gold.gbc';
        const cartridge = saveMode === 'cartridge' && id === `rom-${sha256}` &&
          (url.startsWith(`blob:${origin}/`) || /^\/games\/[a-z0-9-]+\.(gb|gbc|gba)$/.test(url));
        if (!gold && !cartridge) return;
        identity = { sha256, platform, core: platform === 'gba' ? 'mgba' : 'gambatte' };
        mode = gold ? 'gold' : 'cartridge';
        if (event.data.restore) restore = mode === 'gold' ? event.data.restore : parseGameBackup(JSON.stringify(event.data.restore), identity);
        if (event.data.state) stateRestore = parseStateBackup(JSON.stringify(event.data.state), identity);
        configured = true;
        window.EJS_core = identity.core;
        window.EJS_controlScheme = platform === 'gba' ? 'gba' : 'gb';
        window.EJS_gameUrl = url;
        window.EJS_gameName = id;
        window.EJS_gameID = gold ? 250 : Number.parseInt(sha256.slice(0, 12), 16);
        if (platform === 'gba') {
          keys.a = 65; keys.s = 83;
          window.EJS_defaultControls[0][10] = { value: 'a' };
          window.EJS_defaultControls[0][11] = { value: 's' };
        }
        void boot();
        return;
      }
      if (type === 'key') input(key, down === true);
      if (type === 'release') release();
      if (type === 'pause') pause(value === true);
      if (type === 'sound' && started && !exiting) {
        if (value) window.goldResumeAudio();
        click(value ? 'unmute' : 'mute');
      }
      if (type === 'save' && !exiting) save();
      if (type === 'export') save(true);
      if (type === 'export-raw') save(false, true);
      if (type === 'snapshot' && started && !exiting) click('snapshot');
      if (type === 'stop') {
        if (exiting) return;
        exiting = true; release();
        if (started) { pause(true); click('mute'); if (!busy) save(); }
        else send('stopped');
      }
    } catch (error) { fail(`Mensaje "${type}"`, error); }
  });
  addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); pause(true); } });
  addEventListener('pagehide', () => { release(); if (started) save(); });
  document.addEventListener('keydown', event => {
    if (!event.isTrusted) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); pause(!paused); }
    else if (event.key === 'Tab') { event.preventDefault(); send('focus-host'); }
    else if (event.altKey && event.key.toLowerCase() === 'q') { event.preventDefault(); send('exit'); }
    else if (keys[event.key] && !event.repeat) held.add(event.key);
  }, true);
  document.addEventListener('keyup', event => { if (event.isTrusted) held.delete(event.key); }, true);
  addEventListener('error', event => fail('Error de JavaScript', event.error ?? event.message,
    event.filename ? `${event.filename.replace(origin, '')}:${event.lineno}:${event.colno}` : ''));
  addEventListener('unhandledrejection', event => {
    // EmulatorJS's native export first saves RAM, then awaits a screenshot.
    // If that action rejects before EJS_onSaveSave, do not leave the adapter
    // permanently busy: the player must be able to retry or explicitly exit.
    // iOS rejects audio playback started outside a user gesture with
    // NotAllowedError. The game keeps running muted, so it is not fatal.
    if (event?.reason?.name === 'NotAllowedError') {
      console.warn('[gameboy] Bloqueado por el navegador (autoplay):', event.reason);
      event.preventDefault?.();
      return;
    }
    if (!busy) { fail('Promesa rechazada', event?.reason); return; }
    busy = false; exportNext = false; rawNext = false;
    send('storage-error');
    if (exiting) { exiting = false; send('stop-failed'); }
  });
  async function boot() {
    if (parent === window || !configured || booted || exiting) return;
    booted = true;
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        const shown = document.querySelector('.ejs_error_text');
        if (shown) { observer.disconnect(); fail('EmulatorJS', shown.textContent); }
      });
      observer.observe(document.getElementById('game'), { childList: true, subtree: true, attributes: true });
    }
    try {
      if (mode === 'cartridge') {
        if (restore) await restoreGameCartridge(restore, window.EJS_gameName, identity);
        else {
          const native = await readCartridge(window.EJS_gameName, identity.core);
          if (native.legacy && native.sram) await restoreGameCartridge(createGameCartridgeBackup(native.sram, native.rtc, identity), window.EJS_gameName, identity);
        }
      }
      if (mode === 'gold') {
        const imported = restore ?? JSON.parse(localStorage.getItem(SAVE_KEY + '.restore') || 'null');
        if (imported) {
          await restoreCartridge(imported);
          try { localStorage.setItem(SAVE_KEY, JSON.stringify(imported)); localStorage.removeItem(SAVE_KEY + '.restore'); } catch { send('storage-error'); }
        } else {
          const native = await readCartridge();
          const mirror = localStorage.getItem(SAVE_KEY);
          if (native.legacy && native.sram) await restoreCartridge(createCartridgeBackup(native.sram, native.rtc));
          if (!native.sram && mirror) await restoreCartridge(JSON.parse(mirror));
        }
      }
    } catch (error) {
      console.error('[gameboy] Partida guardada:', error);
      send('storage-error');
      if (restore) { fail('No se pudo restaurar el respaldo', error); return; }
    }
    if (exiting) return;
    if (stateRestore) window.EJS_loadStateURL = decode(stateRestore.state);
    const loader = document.createElement('script');
    loader.src = '/emulatorjs/4.2.3/data/loader.js';
    loader.onerror = () => fail('No se pudo descargar', loader.src);
    document.body.appendChild(loader);
  }
  boot();
})();
