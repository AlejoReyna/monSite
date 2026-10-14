import { gameName, parseCard, restoreCard, saveName, waitForCard } from './saves.js';

/* Pinned public EmulatorJS configuration and UI callbacks. No WASM internals. */
(() => {
  const origin = location.origin;
  const session = new URLSearchParams(location.search).get('session');
  if (parent === window || !session) return;
  const send = (type, extra = {}) => parent.postMessage({ channel: 'ps1-player', session, type, ...extra }, origin);
  const keys = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, x: 88, z: 90, c: 67, v: 86, a: 65, s: 83, q: 81, w: 87, Enter: 13, Shift: 16 };
  const held = new Set();
  let configured = false, started = false, paused = false, stopping = false;
  let busy = false, exportPending = false, name, timer;
  const localUrls = [];
  const download = new AbortController();
  async function namedFile(url, filename, limit, stage) {
    const response = await fetch(url, { signal: download.signal });
    if (!response.ok || Number(response.headers.get('content-length')) > limit) throw new Error('Invalid asset response');
    // Stream through the browser's Blob machinery instead of accumulating
    // a second game-sized JS array. The counter also caps chunked responses.
    let loaded = 0, lastProgress = -1, lastBytes = 0;
    const total = Number(response.headers.get('content-length'));
    const stream = response.body?.pipeThrough(new TransformStream({
      transform(chunk, output) {
        loaded += chunk.byteLength;
        if (loaded > limit) throw new Error('Asset too large');
        const value = total > 0 ? Math.min(100, Math.floor(loaded / total * 100)) : null;
        if (value !== lastProgress || loaded - lastBytes >= 1024 * 1024) {
          lastProgress = value; lastBytes = loaded; send('loading-progress', { stage, value });
        }
        output.enqueue(chunk);
      },
    }));
    const blob = await (stream ? new Response(stream).blob() : response.blob());
    if (!blob.size || blob.size > limit) throw new Error('Invalid asset size');
    return new File([blob], filename);
  }
  function startSaving() {
    clearInterval(timer);
    timer = setInterval(() => { if (!paused && !stopping) save(); }, 30000);
  }
  const click = action => {
    const label = [...document.querySelectorAll('.ejs_menu_button span')].find(el => el.textContent === `ps1-${action}`);
    if (!label) throw new Error('Missing player control');
    label.closest('button').click();
  };
  function input(key, down) {
    if (!keys[key] || !started || (down && (paused || stopping)) || down === held.has(key)) return;
    if (down) held.add(key); else held.delete(key);
    document.getElementById('game').dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, keyCode: keys[key], which: keys[key], bubbles: true }));
  }
  function release() { [...held].forEach(key => input(key, false)); }
  function pause(value) {
    release();
    if (started && value !== paused) click(value ? 'pause' : 'play');
  }
  function save(exportFile = false) {
    exportPending ||= exportFile;
    if (!started || busy) return;
    busy = true;
    try { click('save'); } catch { busy = false; send(stopping ? 'stop-failed' : 'save-failed'); }
  }
  function validUrl(value) {
    if (typeof value !== 'string') return false;
    if (value.startsWith(`blob:${origin}/`)) return true;
    try {
      const url = new URL(value, origin);
      return !url.username && !url.password && (url.protocol === 'https:' || (url.origin === origin && url.protocol === 'http:'));
    } catch { return false; }
  }
  const control = (action, callback) => ({ visible: true, displayName: `ps1-${action}`, callback });
  window.EJS_Buttons = {
    play: control('play', () => { paused = false; send('paused', { value: false }); }),
    pause: control('pause', () => { paused = true; send('paused', { value: true }); }),
    mute: control('mute', () => send('sound', { value: false })),
    unmute: control('unmute', () => send('sound', { value: true })),
    saveSavFiles: control('save'), restart: false, settings: false, fullscreen: false,
    loadState: false, saveState: false, screenRecord: false, gamepad: false, cheat: false,
    volume: false, loadSavFiles: false, quickSave: false, quickLoad: false, screenshot: false,
    cacheManager: false, exitEmulation: false, netplay: false, diskButton: false, contextMenu: false,
  };
  window.EJS_onSaveSave = async ({ save: exported }) => {
    // Copy the card before awaiting IDBFS; later exports must not mutate it.
    let bytes;
    try {
      bytes = parseCard(new Uint8Array(exported ?? []));
      await waitForCard(name, bytes);
      send('saved');
      if (exportPending) send('card', { bytes });
      if (stopping) send('stopped');
    } catch {
      // Offer a downloadable card even if browser persistence is unavailable.
      if (bytes && (exportPending || stopping)) send('card', { bytes });
      send(stopping ? 'stop-failed' : 'save-failed');
      stopping = false;
      startSaving();
    } finally { busy = false; exportPending = false; }
  };
  window.EJS_onGameStart = () => {
    if (stopping || started) return;
    started = true;
    click('mute');
    send('ready');
    startSaving();
  };
  addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== origin || event.data?.channel !== 'ps1-host' || event.data.session !== session) return;
    const { type, key, down, value } = event.data;
    try {
      if (type === 'configure') {
        const assets = event.data.assets;
        if (configured || !assets || !validUrl(assets.gameUrl) || !validUrl(assets.biosUrl)) return;
        if (!/^(scph(?:1001|101|5500|5501|5502|7001)|PSXONPSP660)\.bin$/i.test(assets.biosName)) throw new Error('Invalid BIOS name');
        name = saveName(assets.id, assets.extension);
        configured = true;
        if (event.data.card) await restoreCard(name, parseCard(event.data.card));
        const biosName = /^PSXONPSP660\.bin$/i.test(assets.biosName) ? 'PSXONPSP660.bin' : assets.biosName.toLowerCase();
        const bios = await namedFile(assets.biosUrl, biosName, 512 * 1024, 'bios');
        if (bios.size !== 512 * 1024) throw new Error('Invalid BIOS size');
        const game = await namedFile(assets.gameUrl, gameName(assets.id, assets.extension), 768 * 1024 * 1024, 'game');
        if (game.size < 512 * 1024) throw new Error('Invalid game size');
        if (stopping) return;
        let content = game, externalFiles = {};
        if (assets.extension === 'bin') {
          const header = new Uint8Array(await game.slice(0, 16).arrayBuffer());
          if (game.size % 2352 || header[0] !== 0 || header[11] !== 0 || !header.slice(1, 11).every(byte => byte === 0xff) || ![1, 2].includes(header[15])) throw new Error('Not a single-track raw BIN');
          const binUrl = URL.createObjectURL(game); localUrls.push(binUrl);
          externalFiles = { [`/${game.name}`]: binUrl };
          content = new File([`FILE "${game.name}" BINARY\n  TRACK 01 MODE${header[15]}/2352\n    INDEX 01 00:00:00\n`], `${name}.cue`);
        }
        Object.assign(window, {
          EJS_player: '#game', EJS_core: 'pcsx_rearmed', EJS_controlScheme: 'psx',
          EJS_gameUrl: content, EJS_biosUrl: bios, EJS_gameName: name,
          EJS_disableCue: true, EJS_externalFiles: externalFiles,
          EJS_gameID: Number.parseInt(assets.id.slice(0, 12), 16),
          EJS_pathtodata: '/emulatorjs/4.2.3/data/', EJS_threads: false,
          EJS_startOnLoaded: true, EJS_noAutoFocus: true, EJS_disableDatabases: true,
          EJS_disableLocalStorage: true, EJS_language: 'en-US', EJS_disableAutoLang: false,
          EJS_volume: 0.45, EJS_backgroundColor: '#080a10',
          EJS_defaultOptions: { shader: 'disabled', 'save-save-interval': '0', 'save-state-location': 'browser' },
          EJS_defaultControls: { 0: Object.fromEntries([[0, 'x'], [1, 'z'], [8, 'c'], [9, 'v'], [10, 'a'], [11, 's'], [12, 'q'], [13, 'w'], [2, 'shift'], [3, 'enter'], [4, 'up arrow'], [5, 'down arrow'], [6, 'left arrow'], [7, 'right arrow']].map(([id, value]) => [id, { value }])), 1: {}, 2: {}, 3: {} },
        });
        const observer = new MutationObserver(() => {
          if (document.querySelector('.ejs_error_text')) { observer.disconnect(); send('error'); }
        });
        observer.observe(document.getElementById('game'), { childList: true, subtree: true, attributes: true });
        const loader = document.createElement('script');
        loader.src = '/emulatorjs/4.2.3/data/loader.js'; loader.onerror = () => send('error');
        document.body.appendChild(loader);
      }
      if (type === 'key') input(key, down === true);
      if (type === 'release') release();
      if (type === 'pause') pause(value === true);
      if (type === 'sound' && started && !stopping) {
        if (value) document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        click(value ? 'unmute' : 'mute');
      }
      if (type === 'save' && !stopping) save();
      if (type === 'export' && !stopping) save(true);
      if (type === 'cancel-stop') { stopping = false; startSaving(); }
      if (type === 'stop') {
        stopping = true; release(); clearInterval(timer);
        if (!started) { download.abort(); send('stopped'); }
        else { pause(true); click('mute'); save(); }
      }
    } catch { send(type === 'configure' ? 'error' : 'save-failed'); }
  });
  document.addEventListener('keydown', event => {
    if (!event.isTrusted) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); pause(!paused); }
    else if (event.key === 'Tab') { event.preventDefault(); send('focus-host'); }
    else if (keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] && !event.repeat) held.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  }, true);
  document.addEventListener('keyup', event => { if (event.isTrusted) held.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); }, true);
  addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && started && !stopping) { pause(true); save(); }
  });
  addEventListener('pagehide', () => { clearInterval(timer); release(); download.abort(); localUrls.forEach(url => URL.revokeObjectURL(url)); });
  addEventListener('error', () => send('error'));
  send('frame-ready');
})();
