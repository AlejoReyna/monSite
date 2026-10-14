import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { Blob, File } from 'node:buffer';
import * as saves from '../public/playstation/saves.js';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
function typescript(path, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, crypto: webcrypto, Uint8Array, Element: class {}, ...extra });
  return exports;
}
const detector = typescript('../src/lib/playstation/konami.ts');
const assets = typescript('../src/lib/playstation/assets.ts');
const presentation = typescript('../src/lib/gameboy/presentation.ts');
const reduceKeys = input => input.reduce((progress, key) => detector.advanceKonami(progress, key), 0);

test('Konami accepts exactly the sequence, mixed letter case, and overlapping starts', () => {
  assert.equal(reduceKeys([...detector.KONAMI_KEYS.slice(0, 8), 'B', 'A']), 10);
  assert.equal(reduceKeys(['ArrowUp', ...detector.KONAMI_KEYS]), 10);
  assert.equal(reduceKeys(['ArrowUp', 'ArrowUp', 'ArrowDown', 'x']), 0);
  assert.equal(reduceKeys(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowUp']), 1);
  assert.equal(reduceKeys(['b', 'a']), 0);
});

test('typing targets include native dialogs, terminals, and nested contenteditable elements', () => {
  class Element { constructor(selector) { this.selector = selector; } closest(query) { return query.includes(this.selector) ? this : null; } }
  const { isTypingTarget } = typescript('../src/lib/playstation/konami.ts', { Element });
  for (const selector of ['input', 'textarea', 'select', 'contenteditable', 'textbox', 'dialog']) assert.equal(isTypingTarget(new Element(selector)), true);
  assert.equal(isTypingTarget(new Element('canvas')), false);
  assert.equal(isTypingTarget(null), false);
});

test('file validation rejects unsupported formats and unreasonable sizes before reading', () => {
  assert.equal(assets.validateGame({ name: 'Crash.PBP', size: 512 * 1024 }), 'pbp');
  assert.equal(assets.validateGame({ name: 'Crash.bin', size: assets.MAX_GAME_BYTES }), 'bin');
  for (const file of [{ name: 'Crash.chd', size: 1024 * 1024 }, { name: 'Crash.zip', size: 1024 * 1024 }, { name: 'Crash.bin', size: assets.MAX_GAME_BYTES + 1 }, { name: 'Crash.pbp', size: 1 }]) assert.throws(() => assets.validateGame(file));
  assets.validateBios({ name: 'SCPH5501.BIN', size: 512 * 1024 });
  assert.throws(() => assets.validateBios({ name: 'scph5501.bin', size: 1 }));
  assert.throws(() => assets.validateBios({ name: 'random.bin', size: 512 * 1024 }));
});

test('content identity reads every byte in bounded blocks, is rename independent and cancellable', async () => {
  const bytes = Buffer.alloc(assets.HASH_BLOCK_BYTES * 2 + 42, 0x42);
  const file = new File([bytes], 'Crash.bin');
  const progress = [];
  const identity = await assets.identifyGame(file, new AbortController().signal, value => progress.push(value));
  let expected = Buffer.alloc(32);
  for (let offset = 0; offset < bytes.length; offset += assets.HASH_BLOCK_BYTES) expected = createHash('sha256').update(expected).update(bytes.subarray(offset, offset + assets.HASH_BLOCK_BYTES)).digest();
  assert.equal(identity, expected.toString('hex'));
  assert.equal(await assets.identifyGame(new File([bytes], 'Renamed.bin'), new AbortController().signal, () => {}), identity);
  bytes[assets.HASH_BLOCK_BYTES + 3] ^= 1;
  assert.notEqual(await assets.identifyGame(new Blob([bytes]), new AbortController().signal, () => {}), identity);
  assert.equal(progress.length, 3); assert.equal(progress.at(-1), 1);
  const abort = new AbortController(); let reads = 0;
  await assert.rejects(assets.identifyGame(file, abort.signal, () => { reads++; abort.abort(); }), error => error.name === 'AbortError');
  assert.equal(reads, 1);
});

function cardBytes() { const bytes = new Uint8Array(saves.CARD_BYTES); bytes[0] = 0x4d; bytes[1] = 0x43; return bytes; }
const id = 'a'.repeat(64);
test('memory-card identity matches native PBP and explicit single-track BIN filenames', () => {
  assert.equal(saves.gameName(id, 'pbp'), `ps1-${id}.pbp`);
  assert.equal(saves.saveName(id, 'pbp'), `ps1-${id}`);
  assert.equal(saves.saveName(id, 'bin'), `ps1-${id}`);
  assert.throws(() => saves.saveName('../bad', 'pbp'));
  assert.throws(() => saves.saveName(id, 'chd'));
  assert.equal(saves.parseCard(cardBytes()).length, 131072);
  assert.throws(() => saves.parseCard(new Uint8Array(131072)));
  assert.throws(() => saves.parseCard(new Uint8Array(1)));
});

test('native card restoration isolates the game path and persistence waits for matching bytes', async () => {
  const prior = globalThis.indexedDB, records = new Map(); let closed = 0;
  globalThis.indexedDB = { open() {
    const request = { result: {
      close() { closed++; },
      transaction() {
        const transaction = { objectStore: () => ({
          put: (value, path) => records.set(path, value),
          get: path => ({ result: records.get(path) }),
        }) };
        queueMicrotask(() => transaction.oncomplete()); return transaction;
      },
    } };
    queueMicrotask(() => request.onsuccess()); return request;
  } };
  try {
    records.set('/data/saves/pokemon-gold.srm', { contents: new Uint8Array([42]) });
    const card = cardBytes(), name = saves.saveName(id, 'pbp');
    await saves.restoreCard(name, card);
    assert.equal(records.get(`/data/saves/${name}.srm`).contents, card);
    assert.equal(records.get('/data/saves/pokemon-gold.srm').contents[0], 42);
    records.get(`/data/saves/${name}.srm`).contents = new Uint8Array(128 * 1024);
    const wait = saves.waitForCard(name, card);
    setTimeout(() => { records.get(`/data/saves/${name}.srm`).contents = card.slice(); }, 70);
    await wait; assert.ok(closed >= 3);
    await assert.rejects(saves.restoreCard('../bad', card));
  } finally { globalThis.indexedDB = prior; }
});

function bridge({ standalone = false, flush = async () => {}, restored = [], oversized = false } = {}) {
  const messages = [], clicks = [], appended = [], events = [], listeners = new Map(), intervals = new Map();
  const files = [], fetches = []; let intervalId = 0;
  const parent = { postMessage: data => messages.push(data) };
  const context = vm.createContext({
    parent, location: { origin: 'https://portfolio.test', search: '?session=test-session' }, URL, URLSearchParams,
    Uint8Array, AbortController, TransformStream, Response,
    File: class extends File { constructor(parts, name) { super(parts, name); files.push(this); } },
    fetch: async url => {
      fetches.push(url);
      const size = url.includes('bios') ? 512 * 1024 : oversized ? 769 * 1024 * 1024 : 2352 * 256;
      if (oversized && !url.includes('bios')) return new Response(null, { headers: { 'content-length': String(size) } });
      const bytes = new Uint8Array(size);
      if (!url.includes('bios')) { bytes.fill(0xff, 1, 11); bytes[15] = 2; }
      return new Response(bytes, { headers: { 'content-length': String(size) } });
    },
    gameName: saves.gameName, saveName: saves.saveName, parseCard: saves.parseCard,
    restoreCard: async (name, bytes) => restored.push({ name, bytes }), waitForCard: flush,
    setInterval: callback => { intervals.set(++intervalId, callback); return intervalId; }, clearInterval: value => intervals.delete(value),
    addEventListener: (type, callback) => listeners.set(type, callback),
    MutationObserver: class { observe() {} disconnect() {} },
    KeyboardEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } },
    MouseEvent: class { constructor(type) { this.type = type; } },
    document: {
      querySelectorAll: () => Object.values(context.EJS_Buttons).filter(value => value?.displayName).map(value => ({
        textContent: value.displayName,
        closest: () => ({ click: () => { clicks.push(value.displayName); value.callback?.(); if (value.displayName === 'ps1-save') void context.EJS_onSaveSave({ save: cardBytes() }); } }),
      })),
      getElementById: () => ({ dispatchEvent: event => events.push(event) }),
      createElement: () => ({}), body: { appendChild: element => appended.push(element) },
      addEventListener: (type, callback) => listeners.set(`document:${type}`, callback),
      dispatchEvent: event => events.push(event),
    },
  });
  context.window = context;
  if (standalone) context.parent = context;
  vm.runInContext(read('../public/playstation/bridge.js').replace(/^import[^\n]+\n/gm, ''), context);
  const message = (data, source = parent, origin = 'https://portfolio.test') => listeners.get('message')?.({ source, origin, data: { channel: 'ps1-host', session: 'test-session', ...data } });
  const configure = async change => message({ type: 'configure', assets: { gameUrl: 'blob:https://portfolio.test/game', biosUrl: 'blob:https://portfolio.test/bios', biosName: 'SCPH5501.BIN', id, extension: 'pbp', ...change } });
  return { context, messages, clicks, appended, events, listeners, intervals, files, fetches, message, configure };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('frame is inert until authenticated configuration; wrong source/origin/session cannot boot', async () => {
  const h = bridge();
  assert.equal(h.appended.length, 0); assert.equal(h.fetches.length, 0);
  assert.equal(h.messages[0].type, 'frame-ready');
  const config = { type: 'configure', assets: { gameUrl: 'https://assets.test/crash.pbp', biosUrl: 'https://assets.test/bios.bin', biosName: 'scph5501.bin', id, extension: 'pbp' } };
  await h.message(config, {}, 'https://portfolio.test');
  await h.message(config, undefined, 'https://evil.test');
  await h.message({ ...config, session: 'wrong' });
  assert.equal(h.fetches.length, 0);
  await h.configure({ gameUrl: 'javascript:alert(1)' });
  assert.equal(h.appended.length, 0);
  await h.configure();
  assert.equal(h.appended.length, 1); assert.equal(h.fetches.length, 2);
  await h.configure(); assert.equal(h.appended.length, 1);
  assert.equal(h.context.EJS_threads, false);
  assert.equal(h.context.EJS_disableCue, true);
  assert.equal(h.context.EJS_gameUrl.name, `ps1-${id}.pbp`);
  assert.equal(h.context.EJS_biosUrl.name, 'scph5501.bin');
  assert.equal(bridge({ standalone: true }).messages.length, 0);
});

test('BIN uses an explicit MODE2 cue, restores only its card before boot, and caps hosted downloads', async () => {
  const restored = [], h = bridge({ restored });
  await h.message({ type: 'configure', assets: { gameUrl: 'https://assets.test/renamed.bin', biosUrl: 'https://assets.test/bios.bin', biosName: 'scph5501.bin', id, extension: 'bin' }, card: cardBytes() });
  assert.equal(restored[0].name, `ps1-${id}`);
  assert.equal(h.context.EJS_disableCue, true);
  assert.equal(h.context.EJS_gameUrl.name, `ps1-${id}.cue`);
  assert.match(await h.context.EJS_gameUrl.text(), /TRACK 01 MODE2\/2352/);
  assert.ok(h.context.EJS_externalFiles[`/ps1-${id}.bin`].startsWith('blob:'));
  const tooLarge = bridge({ oversized: true }); await tooLarge.configure();
  assert.equal(tooLarge.appended.length, 0);
  assert.equal(tooLarge.messages.at(-1).type, 'error');
});

test('close acknowledges only after persistence, releases held keys, and cancels periodic saves', async () => {
  let resolveFlush;
  const h = bridge({ flush: () => new Promise(resolve => { resolveFlush = resolve; }) });
  await h.configure(); h.context.EJS_onGameStart();
  await h.message({ type: 'key', key: 'x', down: true });
  await h.message({ type: 'stop' });
  assert.equal(h.messages.some(value => value.type === 'stopped'), false);
  assert.equal(h.intervals.size, 0);
  assert.equal(h.events.at(-1).type, 'keyup');
  resolveFlush(); await settle();
  assert.equal(h.messages.at(-1).type, 'stopped');
  assert.ok(h.clicks.includes('ps1-pause')); assert.ok(h.clicks.includes('ps1-mute'));
});

test('failed persistence offers the raw card and keeps the player alive for recovery', async () => {
  const h = bridge({ flush: async () => { throw new Error('Quota'); } });
  await h.configure(); h.context.EJS_onGameStart(); await h.message({ type: 'stop' }); await settle();
  assert.equal(h.messages.some(value => value.type === 'stopped'), false);
  assert.equal(h.messages.at(-1).type, 'stop-failed');
  assert.equal(h.messages.find(value => value.type === 'card').bytes.length, saves.CARD_BYTES);
  assert.equal(h.intervals.size, 1);
  await h.message({ type: 'export' }); await settle();
  assert.equal(h.messages.filter(value => value.type === 'card').length, 2);
});

test('hidden tabs pause and save, and paused games reject fresh directional input', async () => {
  const h = bridge(); await h.configure(); h.context.EJS_onGameStart();
  h.context.document.hidden = true; h.listeners.get('document:visibilitychange')(); await settle();
  assert.ok(h.clicks.includes('ps1-pause'));
  const count = h.events.length; await h.message({ type: 'key', key: 'ArrowUp', down: true });
  assert.equal(h.events.length, count);
  await h.message({ type: 'pause', value: false });
  await h.message({ type: 'key', key: 'ArrowUp', down: true });
  assert.equal(h.events.at(-1).type, 'keydown');
  h.listeners.get('blur')(); assert.equal(h.events.at(-1).type, 'keyup');
});

test('initial player renders local selection in both languages, without an engine iframe', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  let language = 'es';
  const component = typescript('../src/components/playstation/crash-player.tsx', { require: module => {
    if (module === '@/components/lang-context') return { useLanguage: () => ({ language }) };
    if (module === '@/lib/playstation/assets') return assets;
    if (module === '@/lib/gameboy/presentation') return presentation;
    if (module.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return require(module);
  } });
  for (const locale of ['es', 'en']) {
    language = locale;
    const html = renderToStaticMarkup(React.createElement(component.default, { onExit() {} }));
    assert.match(html, /Crash Bandicoot/); assert.match(html, /accept="\.pbp,\.bin"/);
    assert.match(html, locale === 'es' ? /Iniciar Crash/ : /Start Crash/);
    assert.doesNotMatch(html, /<iframe/);
  }
});

// Real host handlers with deterministic hooks and DOM boundaries. These tests
// check lifecycle behavior without starting a server or allocating a WASM core.
function host(componentName) {
  const slots = [], listeners = new Map(), timers = new Map(), messages = [], revoked = [];
  let cursor = 0, dirty = true, tree, frameNode, frameSurface, exits = 0, now = 1, timerId = 0, urlId = 0;
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      slots[index].setter ??= value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; dirty = true; };
      return [slots[index].value, slots[index].setter];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useCallback(fn, deps) { const index = cursor++; if (!equal(slots[index]?.deps, deps)) slots[index] = { fn, deps }; return slots[index].fn; },
    useEffect(effect, deps) { const index = cursor++; if (!equal(slots[index]?.deps, deps)) slots[index] = { effect, deps, pending: true, cleanup: slots[index]?.cleanup }; },
  };
  class Element {
    constructor(selector = '') { this.selector = selector; this.open = false; this.dataset = {}; }
    closest(selector) { return this.selector && selector.includes(this.selector) ? this : null; }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    hasAttribute(name) { return name === 'data-paused' && this.paused; }
    click() {} remove() {}
  }
  const document = { activeElement: null, documentElement: new Element(), fullscreenEnabled: false,
    body: { appendChild() {} }, createElement: () => new Element(),
    addEventListener: (name, callback) => listeners.set(`document:${name}`, callback), removeEventListener: name => listeners.delete(`document:${name}`),
  };
  const location = { origin: 'https://portfolio.test' };
  const window = { location,
    addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name),
    dispatchEvent: event => listeners.get(event.type)?.(event),
  };
  const component = typescript(`../src/components/playstation/${componentName}.tsx`, {
    require: name => {
      if (name === 'react') return hooks;
      if (name === 'next/dynamic') return { __esModule: true, default: () => function LazyPlayer() {} };
      if (name === '@/components/lang-context') return { useLanguage: () => ({ language: 'es' }) };
      if (name === '@/lib/playstation/assets') return assets;
      if (name === '@/lib/playstation/konami') return { ...detector, isTypingTarget: target => target instanceof Element && !!target.closest('input, textarea, select, contenteditable, textbox, dialog') };
      if (name === '@/lib/gameboy/presentation') return presentation;
      if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      return require(name);
    },
    document, window, location, HTMLElement: Element, Element, Event: class { constructor(type) { this.type = type; } },
    AbortController, Blob, performance: { now: () => now },
    URL: { createObjectURL: () => `blob:https://portfolio.test/file-${++urlId}`, revokeObjectURL: url => revoked.push(url) },
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout: id => timers.delete(id),
  });
  function walk(node, callback) {
    if (Array.isArray(node)) { node.forEach(child => walk(child, callback)); return; }
    if (!node?.props) return;
    callback(node); walk(node.props.children, callback);
  }
  function render() {
    let turns = 0;
    do {
      assert.ok(++turns < 10, 'render settles'); cursor = 0; dirty = false;
      tree = component.default({ onExit: () => { exits++; } });
      let nextFrame;
      walk(tree, node => {
        if (node.type === 'iframe') {
          if (frameNode?.key !== node.key) frameSurface = { postMessage: message => messages.push(message) };
          nextFrame = node; node.props.ref.current = { contentWindow: frameSurface, src: node.props.src };
        } else if (node.props.ref) {
          node.props.ref.current ??= new Element(node.type === 'dialog' ? 'dialog' : '');
          node.props.ref.current.paused = node.props['data-paused'];
        }
      });
      if (!nextFrame && frameNode) frameNode.props.ref.current = null;
      frameNode = nextFrame;
      for (const slot of slots) if (slot?.pending) { slot.pending = false; slot.cleanup?.(); slot.cleanup = slot.effect(); }
    } while (dirty);
  }
  const find = predicate => { let found; walk(tree, node => { if (!found && predicate(node)) found = node; }); assert.ok(found, 'element exists'); return found; };
  const receive = (data, overrides = {}) => {
    const session = frameNode ? new URL(frameNode.props.src, location.origin).searchParams.get('session') : '';
    listeners.get('message')?.({ source: frameSurface, origin: location.origin, data: { channel: 'ps1-player', session, ...data }, ...overrides }); render();
  };
  const key = (key, overrides = {}) => {
    let consumed = false;
    listeners.get('keydown')?.({ key, target: null, repeat: false, preventDefault() { consumed = true; }, stopPropagation() {}, stopImmediatePropagation() {}, ...overrides });
    now += 100; render(); return consumed;
  };
  render();
  return { render, find, receive, key, document, messages, revoked, timers, listeners, Element,
    get frame() { return frameNode; }, get exits() { return exits; },
    setNow(value) { now = value; },
    expire(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.fn(); } render(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test('live detector ignores repeated/editable keys, expires prefixes, and locks navigation only on opening', () => {
  const h = host('crash-easter-egg');
  assert.equal(h.key('ArrowUp'), false);
  h.key('ArrowUp', { repeat: true });
  assert.equal(h.document.documentElement.dataset.crashOpen, undefined);
  h.setNow(4000); h.key('ArrowDown');
  for (const key of detector.KONAMI_KEYS) h.key(key, { target: new h.Element('input') });
  assert.equal(h.document.documentElement.dataset.crashOpen, undefined);
  const consumed = detector.KONAMI_KEYS.map(key => h.key(key));
  assert.equal(consumed[0], false); assert.equal(consumed.slice(1).every(Boolean), true);
  assert.equal(h.document.documentElement.dataset.crashOpen, 'true');
  assert.equal(h.find(node => node.type === 'dialog').props.ref.current.open, true);
  h.find(node => node.type?.name === 'LazyPlayer').props.onExit(); h.render();
  assert.equal(h.document.documentElement.dataset.crashOpen, undefined);
  h.unmount(); assert.equal(h.listeners.size, 0);
});

async function selectAndStart(h, ready = true) {
  const game = new File([new Uint8Array(512 * 1024)], 'Crash.pbp');
  const bios = new File([new Uint8Array(512 * 1024)], 'scph5501.bin');
  for (const [accept, file] of [['.pbp,.bin', game], ['.bin', bios]]) {
    h.find(node => node.type === 'input' && node.props.accept === accept).props.onChange({ target: { files: [file] } }); h.render();
  }
  await h.find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children[0] === 'Iniciar Crash').props.onClick(); h.render();
  h.frame.props.onLoad(); if (ready) h.receive({ type: 'ready' });
}

test('host aggregates touch and keyboard, waits for close acknowledgement, and releases URLs/listeners', async () => {
  const h = host('crash-player'); assert.equal(h.frame, undefined);
  await selectAndStart(h);
  const cross = h.find(node => node.props['data-key'] === 'x');
  const event = { preventDefault() {}, pointerId: 1, currentTarget: { setPointerCapture() {} } };
  cross.props.onPointerDown(event); h.key('x', { code: 'KeyX' });
  assert.equal(h.messages.filter(value => value.type === 'key' && value.down).length, 1);
  cross.props.onPointerUp(event);
  assert.equal(h.messages.filter(value => value.type === 'key' && !value.down).length, 0);
  h.listeners.get('keyup')({ code: 'KeyX' });
  assert.equal(h.messages.filter(value => value.type === 'key' && !value.down).length, 1);
  h.find(node => node.props['aria-label'] === 'Cerrar').props.onClick(); h.render();
  assert.equal(h.exits, 0); assert.ok(h.frame);
  h.receive({ type: 'stopped' }, { origin: 'https://evil.test' }); assert.equal(h.exits, 0);
  h.receive({ type: 'stopped' }); assert.equal(h.exits, 1);
  h.unmount(); assert.equal(h.revoked.length, 2); assert.equal(h.listeners.size, 0); assert.equal(h.timers.size, 0);
});

test('close timeout preserves the frame and permits export or an explicit discard', async () => {
  const h = host('crash-player'); await selectAndStart(h);
  h.find(node => node.props['aria-label'] === 'Cerrar').props.onClick(); h.render(); h.expire(8000);
  assert.equal(h.exits, 0); assert.ok(h.frame);
  assert.ok(h.messages.some(value => value.type === 'cancel-stop'));
  h.find(node => node.type === 'button' && node.props.children === 'Exportar tarjeta').props.onClick();
  assert.equal(h.messages.at(-1).type, 'export');
  h.find(node => node.type === 'button' && node.props.children === 'Cerrar sin guardar').props.onClick();
  assert.equal(h.exits, 1); h.unmount();
});

test('loading can be cancelled, and watchdog follows activity rather than total transfer duration', async () => {
  const cancelled = host('crash-player'); await selectAndStart(cancelled, false);
  cancelled.find(node => node.props['aria-label'] === 'Cerrar').props.onClick();
  assert.equal(cancelled.exits, 1); assert.equal(cancelled.revoked.length, 2); cancelled.unmount();
  const h = host('crash-player'); await selectAndStart(h, false);
  const initialTimers = [...h.timers.keys()];
  h.receive({ type: 'loading-progress', stage: 'game', value: 20 });
  assert.ok(initialTimers.every(id => !h.timers.has(id)));
  assert.ok(h.frame); h.expire(180000); assert.equal(h.frame, undefined);
  assert.equal(h.find(node => node.type === 'input' && node.props.accept === '.pbp,.bin').props.type, 'file');
  h.unmount(); assert.equal(h.revoked.length, 2);
});

test('runtime errors preserve the running frame for card export, including errors during close', async () => {
  const h = host('crash-player'); await selectAndStart(h);
  h.receive({ type: 'error' }); assert.ok(h.frame); assert.equal(h.exits, 0);
  assert.ok(h.messages.some(value => value.type === 'pause' && value.value));
  h.find(node => node.props['aria-label'] === 'Cerrar').props.onClick(); h.render();
  h.receive({ type: 'error' }); assert.ok(h.frame); assert.equal(h.exits, 0);
  assert.ok(h.find(node => node.type === 'button' && node.props.children === 'Cerrar sin guardar'));
  h.unmount();
});
