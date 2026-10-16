// Game Boy AI bridge: protocol, player executor, host adapter, bridge core,
// PNG/MCP results and WebSocket checks. Simulated adapters only: no port is
// bound and no browser or emulator runs, so this does not prove the real
// game works end to end (see docs/gameboy-ai-mcp.md for that procedure).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, duplexPair } from 'node:stream';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { inflateSync } from 'node:zlib';
import WebSocket from 'ws';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import * as protocol from '../public/gameboy/ai-protocol.js';
import { createAiPlayer } from '../public/gameboy/ai-player.js';
import { createGameCartridgeBackup } from '../public/gameboy/cartridge.js';
import { GOLD_ROM_SHA256, createBackupStore, validateGoldBackup, validateInitialBackup } from './gameboy-mcp/backups.mjs';
import { CLOSE_CODES, createBridge } from './gameboy-mcp/bridge.mjs';
import { ConfigError, DEFAULT_ORIGINS, createLogger, parseConfig, parseRemoteConfig } from './gameboy-mcp/config.mjs';
import { main } from './gameboy-mcp/main.mjs';
import { crc32, encodePng, framePng, uniformColor, upscale } from './gameboy-mcp/png.mjs';
import { createBridgeServer, validateUpgrade } from './gameboy-mcp/server.mjs';
import { clientIp, createRemoteHub } from './gameboy-mcp/remote.mjs';
import { INSTRUCTIONS, createGameBoyMcpServer } from './gameboy-mcp/tools.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
// Evaluated in this realm so results compare with deepStrictEqual.
const transpile = (file, load = () => assert.fail('unexpected import')) => {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function (exports, require) {${source}\n})`)(exports, load);
  return exports;
};
const aiLink = transpile('../src/lib/gameboy/ai-link.ts', name => { assert.ok(name.endsWith('/public/gameboy/ai-protocol.js')); return protocol; });
const save = transpile('../src/lib/gameboy/save.ts');
const settle = () => new Promise(resolve => setImmediate(resolve));
const SESSION = 's-00000000000000a1';
const OTHER_SESSION = 's-00000000000000b2';
const GRANT = 'g-0123456789abcdef';
const GOLD = Object.freeze({ id: 'pokemon-gold', title: 'Pokémon Gold', platform: 'gbc', sha256: GOLD_ROM_SHA256 });
const goldBackup = (changes = {}) => JSON.stringify({
  format: 'monsite-gold-cartridge', version: 1, rom: GOLD_ROM_SHA256, savedAt: '2026-10-16T12:00:00.000Z',
  sram: Buffer.alloc(32768, 0x42).toString('base64'), rtc: Buffer.alloc(8, 1).toString('base64'), ...changes,
});
function gbFrame(seed = 1, width = 160, height = 144) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const shade = [[224, 248, 208], [136, 192, 112], [52, 104, 86], [8, 24, 32]][(index + seed + Math.floor(index / width)) % 4];
    rgba.set([...shade, 255], index * 4);
  }
  return rgba;
}
function fakeTimers() {
  let now = 0, id = 0;
  const pending = new Map();
  return {
    pending, get now() { return now; },
    setTimeout: (callback, ms) => { pending.set(++id, { callback, at: now + ms }); return id; },
    clearTimeout: timer => { pending.delete(timer); },
    advance(ms) {
      now += ms;
      for (const [timer, entry] of [...pending].sort((a, b) => a[1].at - b[1].at)) {
        if (entry.at <= now && pending.delete(timer)) entry.callback();
      }
    },
  };
}
function decodePng(png) {
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    assert.equal(png.readUInt32BE(offset + 8 + length), crc32(png.subarray(offset + 4, offset + 8), data), `${type} CRC`);
    chunks.push({ type, data });
    offset += 12 + length;
  }
  const header = chunks[0].data;
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4), colorType = header[9];
  const palette = chunks.find(item => item.type === 'PLTE')?.data;
  const raw = inflateSync(Buffer.concat(chunks.filter(item => item.type === 'IDAT').map(item => item.data)));
  const channels = colorType === 3 ? 1 : 3;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * (width * channels + 1)], 0);
    for (let x = 0; x < width; x++) {
      const at = y * (width * channels + 1) + 1 + x * channels;
      const source = colorType === 3 ? palette.subarray(raw[at] * 3, raw[at] * 3 + 3) : raw.subarray(at, at + 3);
      rgba.set([...source, 255], (y * width + x) * 4);
    }
  }
  return { width, height, depth: header[8], colorType, rgba, types: chunks.map(item => item.type) };
}

test('button and duration validation rejects unknown, repeated, contradictory and out-of-range input', () => {
  const { normalizeActParams, normalizeWaitParams, validateButtons } = protocol;
  assert.deepEqual(normalizeActParams({ buttons: ['a'], holdMs: 100 }, 'gbc'), { buttons: ['a'], keys: ['x'], holdMs: 100, settleMs: 250 });
  assert.deepEqual(normalizeActParams({ buttons: ['b', 'left', 'select'], holdMs: 50, settleMs: 0 }, 'gb').keys, ['z', 'ArrowLeft', 'Shift']);
  assert.deepEqual(validateButtons(['l', 'r'], 'gba'), ['l', 'r']);
  for (const [buttons, pattern] of [
    [[], /non-empty/], ['a', /non-empty/], [['A'], /Unknown/], [['jump'], /Unknown/], [[1], /Unknown/], [['a', 'a'], /repeated/],
    [['up', 'down'], /opposite/], [['left', 'right', 'a'], /opposite/], [['start', 'select', 'a', 'b'], /At most 3/],
  ]) assert.throws(() => validateButtons(buttons, 'gbc'), error => error.code === 'invalid-argument' && pattern.test(error.message));
  assert.throws(() => validateButtons(['l'], 'gbc'), /Game Boy Advance/);
  assert.deepEqual(validateButtons(['l']), ['l'], 'shape-only checks wait for a session to know the platform');
  for (const holdMs of [49, 2001, 100.5, NaN, Infinity, '100', null, undefined, -1]) {
    assert.throws(() => normalizeActParams({ buttons: ['a'], holdMs }, 'gbc'), error => error.code === 'invalid-argument');
  }
  for (const holdMs of [50, 2000]) assert.equal(normalizeActParams({ buttons: ['a'], holdMs }, 'gbc').holdMs, holdMs);
  assert.throws(() => normalizeActParams({ buttons: ['a'], holdMs: 100, settleMs: 2001 }, 'gbc'), /settle_ms/);
  assert.equal(normalizeWaitParams({ durationMs: 10000 }).durationMs, 10000);
  for (const durationMs of [49, 10001, 1.5]) assert.throws(() => normalizeWaitParams({ durationMs }), /duration_ms/);
  assert.equal(protocol.commandTimeoutMs('act', { holdMs: 2000, settleMs: 2000 }), 9000);
  assert.equal(protocol.commandTimeoutMs('wait', { durationMs: 10000 }), 15000);
  assert.equal(protocol.isRequestId('a'.repeat(64)), true);
  for (const value of ['', 'a'.repeat(65), 'with space', 'x/y', 7]) assert.equal(protocol.isRequestId(value), false);
});

test('captures become lossless, pixel-exact PNG images at a small integer scale', () => {
  const frame = { width: 160, height: 144, rgba: gbFrame(3) };
  const { png, width, height } = framePng(frame, 3);
  assert.deepEqual([width, height], [480, 432]);
  const decoded = decodePng(png);
  assert.deepEqual([decoded.width, decoded.height, decoded.depth, decoded.colorType], [480, 432, 8, 3]);
  assert.deepEqual(decoded.types, ['IHDR', 'PLTE', 'IDAT', 'IEND']);
  for (const [x, y] of [[0, 0], [2, 2], [3, 0], [479, 431], [241, 100]]) {
    const source = (Math.floor(y / 3) * 160 + Math.floor(x / 3)) * 4;
    assert.deepEqual([...decoded.rgba.subarray((y * 480 + x) * 4, (y * 480 + x) * 4 + 4)], [...frame.rgba.subarray(source, source + 4)]);
  }
  assert.ok(png.length < 20000, `a Game Boy frame stays small (${png.length} bytes)`);
  const colorful = Buffer.alloc(240 * 160 * 4);
  for (let index = 0; index < 240 * 160; index++) colorful.set([index & 255, (index >> 8) & 255, 99, 255], index * 4);
  const rgb = decodePng(encodePng({ width: 240, height: 160, rgba: colorful }));
  assert.equal(rgb.colorType, 2, 'more than 256 colours falls back to RGB');
  assert.deepEqual(rgb.rgba, colorful);
  assert.deepEqual(upscale(Buffer.from([1, 2, 3, 255]), 1, 1, 2), Buffer.from([1, 2, 3, 255, 1, 2, 3, 255, 1, 2, 3, 255, 1, 2, 3, 255]));
  assert.equal(uniformColor(Buffer.from([0, 0, 0, 255, 0, 0, 0, 255])), '#000000');
  assert.equal(uniformColor(gbFrame()), null);
  assert.throws(() => encodePng({ width: 2, height: 2, rgba: Buffer.alloc(3) }));
});

// The iframe executor with a simulated EmulatorJS: the "engine" renders at
// the start of each animation frame while running, and its WebGL buffer is
// cleared after presentation unless preserved.
function playerRig({ platform = 'gbc', width = 640, height = 576, engineEvery = 1, preserve = false, running = false } = {}) {
  const log = [], draws = [], held = new Set(), timers = new Map();
  let frames = [], timerId = 0, frameId = 0, player;
  const state = { paused: !running, exiting: false, started: true, clock: 0, ticks: 0, rendered: 0, buffer: null, content: 'pattern', drawThrows: false, noCanvas: false, clearedNoise: false };
  const canvas = {
    width, height, listeners: new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    getContext: type => type === 'webgl2' ? { getContextAttributes: () => ({ preserveDrawingBuffer: preserve }) } : null,
  };
  const createCanvas = (w, h) => {
    const data = new Uint8ClampedArray(w * h * 4);
    const context = {
      imageSmoothingEnabled: true, fillStyle: '',
      fillRect() { data.fill(0); for (let index = 3; index < data.length; index += 4) data[index] = 255; },
      drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh) {
        draws.push({ source, sx, sy, sw, sh, dx, dy, dw, dh, smoothing: context.imageSmoothingEnabled });
        if (state.drawThrows) throw Object.assign(new Error('denied'), { name: 'SecurityError' });
        // Real browsers may add colour-management noise to a cleared buffer.
        if (state.buffer === null && state.clearedNoise) { for (let index = 0; index < w * h; index++) data.set([index % 3 === 0 ? 1 : 0, index % 3 === 1 ? 1 : 0, index % 3 === 2 ? 1 : 0], index * 4); return; }
        if (state.buffer === null || state.content === 'black') return;
        for (let index = 0; index < w * h; index++) {
          data.set(state.content === 'white' ? [255, 255, 255] : [state.buffer & 255, index % w, Math.floor(index / w) & 255], index * 4);
        }
      },
      getImageData: () => ({ data: new Uint8ClampedArray(data) }),
    };
    return { width: w, height: h, getContext: () => context };
  };
  const deps = {
    input(key, down) {
      if (!state.started || (down && (state.paused || state.exiting)) || down === held.has(key)) return;
      if (down) held.add(key); else held.delete(key);
      log.push(`${down ? 'down' : 'up'} ${key}`);
    },
    pause(value) {
      for (const key of [...held]) deps.input(key, false);
      if (!state.started || value === state.paused) return;
      state.paused = value;
      log.push(value ? 'pause' : 'play');
      if (!value) player.noteResumed();
    },
    isPaused: () => state.paused, isStarted: () => state.started, isExiting: () => state.exiting, isHeld: key => held.has(key),
    getCanvas: () => state.noCanvas ? null : canvas, createCanvas, platform: () => platform,
    requestAnimationFrame: callback => { frames.push({ id: ++frameId, callback }); return frameId; },
    cancelAnimationFrame: id => { frames = frames.filter(frame => frame.id !== id); },
    setTimeout: (callback, ms) => { timers.set(++timerId, { callback, at: state.clock + ms }); return timerId; },
    clearTimeout: id => { timers.delete(id); },
    now: () => state.clock,
  };
  player = createAiPlayer(deps);
  function frameTick() {
    state.ticks++;
    const queued = frames;
    frames = [];
    // EmulatorJS re-queues its main loop at the end of every run, so it renders first.
    if (!state.paused && state.ticks % engineEvery === 0) { state.rendered++; state.buffer = state.rendered; log.push(`render ${state.rendered}`); }
    for (const { callback } of queued) callback();
    if (!preserve) state.buffer = null;
  }
  async function step() {
    await settle();
    state.clock += 4;
    for (const [id, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) {
      if (timer.at <= state.clock && timers.delete(id)) { timer.callback(); await settle(); }
    }
    if (state.clock % 16 === 0) { frameTick(); await settle(); }
  }
  async function drive(promise, limit = 20000) {
    let done = false, value;
    promise.then(result => { done = true; value = result; });
    for (let elapsed = 0; elapsed < limit && !done; elapsed += 4) await step();
    await settle();
    assert.ok(done, 'the command finished');
    return value;
  }
  async function until(predicate, limit = 5000) {
    for (let elapsed = 0; elapsed < limit && !predicate(); elapsed += 4) await step();
    assert.ok(predicate(), 'condition reached');
  }
  const controls = () => log.filter(entry => !entry.startsWith('render'));
  return { player, deps, state, log, draws, held, canvas, drive, until, controls, frameTick };
}
const act = (requestId, buttons, holdMs = 100, settleMs = 50) => ({ requestId, kind: 'act', params: { buttons, holdMs, settleMs } });

test('act resumes, presses together, waits, releases, then captures the exact frame it pauses on', async () => {
  const rig = playerRig({ running: true });
  rig.player.setEnabled(true);
  const result = await rig.drive(rig.player.execute(act('r-1', ['a', 'up'], 100, 48)));
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(rig.controls(), ['pause', 'play', 'down x', 'down ArrowUp', 'up x', 'up ArrowUp', 'pause'],
    'enabling AI mode freezes the game; the action then runs resume → press → hold → release → pause');
  assert.equal(result.paused, true);
  assert.deepEqual([result.frame.width, result.frame.height, result.frame.data.length], [160, 144, 160 * 144 * 4]);
  const rendered = rig.state.rendered;
  assert.equal(result.frame.data[0], rendered & 255, 'the image is the last frame the engine rendered before pausing');
  for (let tick = 0; tick < 10; tick++) rig.frameTick();
  assert.equal(rig.state.rendered, rendered, 'nothing runs after the capture');
  assert.ok(Math.abs(result.timing.holdMs - 100) <= 8, `measured hold ${result.timing.holdMs} ms`);
  assert.equal(result.capture.source, 'live-frame');
  assert.equal(rig.held.size, 0);
  const draw = rig.draws.at(-1);
  assert.deepEqual([draw.dw, draw.dh, draw.smoothing], [160, 144, false], 'nearest-neighbour sampling at native resolution');
});

test('observe returns the pause frame without advancing, or runs exactly one frame when none is known', async () => {
  const rig = playerRig({ running: true });
  rig.player.setEnabled(true);
  const acted = await rig.drive(rig.player.execute(act('r-1', ['b'])));
  const before = rig.state.rendered;
  const observed = await rig.drive(rig.player.execute({ requestId: 'r-2', kind: 'observe' }));
  assert.equal(observed.capture.source, 'pause-frame');
  assert.deepEqual(observed.frame.data, acted.frame.data);
  assert.equal(rig.state.rendered, before);
  assert.equal(rig.controls().at(-1), 'pause');

  const paused = playerRig();
  paused.player.setEnabled(true);
  assert.deepEqual(paused.controls(), [], 'a paused game stays paused when AI mode starts');
  const first = await paused.drive(paused.player.execute({ requestId: 'r-1', kind: 'observe' }));
  assert.equal(first.capture.source, 'one-frame-advance');
  assert.deepEqual(paused.log, ['play', 'render 1', 'pause']);
  assert.equal(first.frame.data[0], 1);

  const preserved = playerRig({ preserve: true });
  preserved.state.buffer = 9;
  preserved.player.setEnabled(true);
  const direct = await preserved.drive(preserved.player.execute({ requestId: 'r-1', kind: 'observe' }));
  assert.equal(direct.capture.source, 'preserved-buffer');
  assert.equal(direct.capture.drawingBuffer, 'preserved');
  assert.deepEqual(preserved.log, [], 'a preserved buffer is read without running the game');
});

test('wait runs without buttons for the requested time and pauses with a capture', async () => {
  const rig = playerRig();
  rig.player.setEnabled(true);
  const result = await rig.drive(rig.player.execute({ requestId: 'w-1', kind: 'wait', params: { durationMs: 400 } }));
  assert.equal(result.ok, true);
  assert.deepEqual(rig.controls(), ['play', 'pause']);
  assert.ok(result.timing.ranMs >= 400 && result.timing.ranMs <= 440, `ran ${result.timing.ranMs} ms`);
  assert.ok(rig.state.rendered >= 24, 'about 25 frames ran in 400 ms');
});

test('a cleared WebGL buffer is retried while running; a genuinely black screen is still accepted', async () => {
  const skipping = playerRig({ engineEvery: 2 });
  skipping.state.clearedNoise = true; // Seen in Chrome: a cleared buffer read back as 0/1 noise.
  skipping.player.setEnabled(true);
  for (let index = 1; index <= 6; index++) {
    const result = await skipping.drive(skipping.player.execute(act(`r-${index}`, ['a'], 50, 0)));
    assert.equal(result.ok, true);
    assert.equal(result.frame.data[0], skipping.state.rendered & 255, 'never a blank buffer from a frame the engine skipped');
    assert.ok(result.capture.attempts <= 2);
  }
  const black = playerRig();
  black.state.content = 'black';
  black.player.setEnabled(true);
  const result = await black.drive(black.player.execute(act('r-1', ['a'], 50, 0)));
  assert.equal(result.ok, true);
  assert.equal(result.capture.attempts, 3);
  assert.equal(result.capture.uniform, true);
  assert.equal(black.state.paused, true);
});

test('capture failures are errors, never images, and still release the buttons and pause', async () => {
  for (const breakIt of [
    rig => { rig.state.noCanvas = true; },
    rig => { rig.canvas.width = 0; },
    rig => { rig.state.drawThrows = true; },
    rig => { rig.canvas.listeners.get('webglcontextlost')(); },
  ]) {
    const rig = playerRig();
    rig.player.setEnabled(true);
    await rig.drive(rig.player.execute({ requestId: 'r-0', kind: 'wait', params: { durationMs: 50 } }));
    breakIt(rig);
    const result = await rig.drive(rig.player.execute(act('r-1', ['start'])));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'capture-failed');
    assert.equal(result.frame, undefined);
    assert.equal(rig.held.size, 0);
    assert.equal(rig.state.paused, true);
  }
});

test('the executor crops letterboxed and pillarboxed canvases to the centred game area', async () => {
  for (const [width, height, expected] of [[1200, 576, { sx: 280, sy: 0, sw: 640, sh: 576 }], [640, 900, { sx: 0, sy: 162, sw: 640, sh: 576 }]]) {
    const rig = playerRig({ width, height });
    rig.player.setEnabled(true);
    await rig.drive(rig.player.execute({ requestId: 'r-1', kind: 'observe' }));
    const { sx, sy, sw, sh } = rig.draws.at(-1);
    assert.deepEqual({ sx, sy, sw, sh }, expected);
  }
  const gba = playerRig({ platform: 'gba', width: 720, height: 480 });
  gba.player.setEnabled(true);
  const result = await gba.drive(gba.player.execute(act('r-1', ['l', 'r'])));
  assert.deepEqual([result.frame.width, result.frame.height], [240, 160]);
  assert.deepEqual(gba.controls().slice(0, 3), ['play', 'down a', 'down s']);
});

test('stop has priority over a running action: it releases at once, pauses and is idempotent', async () => {
  const rig = playerRig();
  rig.player.setEnabled(true);
  const running = rig.player.execute(act('r-1', ['right'], 2000, 0));
  await rig.until(() => rig.held.has('ArrowRight'));
  assert.deepEqual(rig.player.stop(), { paused: true });
  assert.equal(rig.held.size, 0, 'buttons are lifted synchronously');
  assert.deepEqual(rig.controls(), ['play', 'down ArrowRight', 'up ArrowRight', 'pause']);
  const result = await rig.drive(running);
  assert.equal(result.error.code, 'stopped');
  assert.deepEqual(rig.player.stop(), { paused: true });
  assert.deepEqual(rig.controls(), ['play', 'down ArrowRight', 'up ArrowRight', 'pause'], 'repeated stops never resume or press');
  const waiting = rig.player.execute({ requestId: 'w-1', kind: 'wait', params: { durationMs: 10000 } });
  await rig.until(() => !rig.state.paused);
  const clock = rig.state.clock;
  rig.player.stop();
  assert.equal(rig.state.paused, true, 'a long wait stops at once');
  assert.equal((await rig.drive(waiting)).error.code, 'stopped');
  assert.ok(rig.state.clock - clock < 100, 'it did not wait for the 10 s to pass');
});

test('other controls, hidden pages and teardown interrupt an action safely', async () => {
  const external = playerRig();
  external.player.setEnabled(true);
  const running = external.player.execute(act('r-1', ['a'], 500, 0));
  await external.until(() => external.held.has('x'));
  external.deps.pause(true); // e.g. the host's pause after opening the save menu
  const interrupted = await external.drive(running);
  assert.equal(interrupted.error.code, 'interrupted');
  assert.equal(external.held.size, 0);

  const hidden = playerRig();
  hidden.player.setEnabled(true);
  const waiting = hidden.player.execute({ requestId: 'w-1', kind: 'wait', params: { durationMs: 5000 } });
  await hidden.until(() => !hidden.state.paused);
  hidden.player.interrupt('page-hidden');
  const result = await hidden.drive(waiting);
  assert.equal(result.error.code, 'page-hidden');
  assert.equal(hidden.state.paused, true);

  const taken = playerRig();
  taken.player.setEnabled(true);
  const pressing = taken.player.execute(act('r-1', ['b'], 2000, 0));
  await taken.until(() => taken.held.has('z'));
  taken.player.setEnabled(false); // "Tomar control"
  assert.equal(taken.held.size, 0);
  assert.equal(taken.state.paused, true);
  assert.equal((await taken.drive(pressing)).error.code, 'user-control');
  assert.equal((await taken.drive(taken.player.execute(act('r-2', ['b'])))).error.code, 'user-control');
});

test('the executor runs a request id once, one command at a time, and validates before touching the game', async () => {
  const rig = playerRig();
  rig.player.setEnabled(true);
  const first = rig.player.execute(act('same', ['a'], 200, 0));
  assert.equal((await rig.player.execute(act('other', ['b']))).error.code, 'busy');
  assert.equal((await rig.player.execute(act('same', ['a'], 200, 0))).error.code, 'duplicate-request');
  assert.equal((await rig.drive(first)).ok, true);
  assert.equal((await rig.player.execute(act('same', ['a'], 200, 0))).error.code, 'duplicate-request');
  assert.equal(rig.controls().filter(entry => entry === 'play').length, 1);
  for (const [request, code] of [
    [act('r-3', ['up', 'down']), 'invalid-argument'], [act('r-4', ['l']), 'invalid-argument'], [act('r-5', ['a'], 5), 'invalid-argument'],
    [{ requestId: 'r-6', kind: 'jump' }, 'invalid-argument'], [{ requestId: 'bad id', kind: 'observe' }, 'invalid-argument'],
  ]) {
    const before = rig.controls().length;
    assert.equal((await rig.drive(rig.player.execute(request))).error.code, code);
    assert.equal(rig.controls().length, before, 'invalid commands never resume or press');
  }
  const off = playerRig({ running: true });
  assert.equal((await off.player.execute(act('r-1', ['a']))).error.code, 'user-control');
  assert.deepEqual(off.log, [], 'with AI mode off the executor does nothing');
});

test('a stray stop never pauses a user-controlled game, and re-enabling keeps its own synchronized freeze', async () => {
  const user = playerRig({ running: true });
  assert.deepEqual(user.player.stop(), { paused: false });
  assert.deepEqual(user.log, [], 'AI mode off: the user keeps playing');
  const rig = playerRig({ running: true });
  rig.player.setEnabled(true);
  rig.player.setEnabled(false);
  rig.deps.pause(false); // The user resumes...
  rig.player.setEnabled(true); // ...and grants control again before the first freeze settled.
  await settle(); // The first freeze winds down; the second still waits for a frame.
  const result = await rig.drive(rig.player.execute(act('r-1', ['a'])));
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(rig.controls(), ['pause', 'play', 'pause', 'play', 'down x', 'up x', 'pause']);
});

// Host adapter between the bridge WebSocket and the player iframe.
function linkRig() {
  const posted = [], sockets = [], timers = fakeTimers();
  let ids = 0;
  class FakeSocket {
    constructor(url, protocols) { Object.assign(this, { url, protocols, readyState: 0, sent: [] }); sockets.push(this); }
    send(text) { this.sent.push(JSON.parse(text)); }
    close(code = 1000) { this.readyState = 3; this.onclose?.({ code }); }
    open() { this.readyState = 1; this.onopen?.({}); }
    message(data) { this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) }); }
  }
  const states = [];
  const link = aiLink.createAiLink({
    createSocket: (url, protocols) => new FakeSocket(url, protocols), postToPlayer: message => posted.push(message),
    onChange: state => states.push(state), randomId: bytes => String(++ids).padStart(bytes * 2, '0'),
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout, now: () => timers.now,
  });
  const rig = { link, posted, sockets, timers, states, get socket() { return sockets.at(-1); } };
  rig.pair = () => { link.connect('abcd-efgh', 41887); rig.socket.open(); rig.socket.message({ type: 'welcome' }); };
  rig.game = (ready = true, hostSession = 'host-1', game = GOLD) => link.setSession({ hostSession, ready, paused: false, game });
  rig.sent = type => rig.socket.sent.filter(message => message.type === type);
  rig.grant = () => {
    link.requestControl();
    link.handlePlayerMessage({ type: 'ai-backup', backup: goldBackup() });
    const { grantId } = rig.sent('backup').at(-1);
    rig.socket.message({ type: 'backup-saved', grantId, file: `/home/user/.monsite-gameboy-mcp/backups/pokemon-gold/x-${grantId}.json` });
    return grantId;
  };
  rig.command = (requestId, kind = 'act', params = { buttons: ['a'], holdMs: 100, settleMs: 0 }, sessionId = link.sessionId) =>
    rig.socket.message({ type: 'command', requestId, sessionId, kind, params, timeoutMs: 5100, budget: { used: 1, limit: 200 } });
  return rig;
}

test('pairing sends the code only in the first message, never in the URL, and maps refusals', () => {
  const rig = linkRig();
  assert.equal(rig.link.connect('abcd-efgh', 41887), true);
  assert.equal(rig.socket.url, 'ws://127.0.0.1:41887/gameboy-ai');
  assert.deepEqual(rig.socket.protocols, ['monsite-gameboy-ai.v1']);
  assert.doesNotMatch(rig.socket.url, /ABCD|EFGH|abcd/i);
  rig.socket.open();
  assert.deepEqual(rig.socket.sent, [{ type: 'hello', protocol: 'monsite-gameboy-ai', version: 1, code: 'ABCDEFGH' }]);
  rig.socket.message({ type: 'error', code: 'invalid-code' });
  rig.socket.close(4001);
  assert.equal(rig.link.state.status, 'error');
  assert.equal(rig.link.state.error, 'invalid-code');
  for (const [code, port, error] of [['ABC', 41887, 'invalid-code-format'], ['ABCD-EFG0', 41887, 'invalid-code-format'], ['ABCDEFGH', 80, 'invalid-port']]) {
    const other = linkRig();
    assert.equal(other.link.connect(code, port), false);
    assert.equal(other.sockets.length, 0);
    assert.equal(other.link.state.error, error);
  }
  const unreachable = linkRig();
  unreachable.link.connect('ABCDEFGH', 41887);
  unreachable.socket.close(1006);
  assert.equal(unreachable.link.state.error, 'unreachable');
  const slow = linkRig();
  slow.link.connect('ABCDEFGH', 41887);
  slow.socket.open();
  slow.timers.advance(8000);
  assert.equal(slow.link.state.error, 'handshake-timeout');
  for (const host of ['localhost', '127.0.0.1', '[::1]']) assert.equal(aiLink.isLoopbackPage({ hostname: host }), true);
  for (const host of ['gba.alexisrs.dev', undefined]) assert.equal(aiLink.isLoopbackPage({ hostname: host }), false);
  const remote = linkRig();
  assert.equal(remote.link.connect('ABCDEFGH', aiLink.REMOTE_BRIDGE_URL), true);
  assert.equal(remote.socket.url, 'wss://mcp.alexisrs.dev/gameboy-ai');
  for (const endpoint of ['ws://mcp.alexisrs.dev/gameboy-ai', 'wss://mcp.alexisrs.dev/gameboy-ai?code=ABCDEFGH', 'https://mcp.alexisrs.dev/gameboy-ai']) {
    const other = linkRig();
    assert.equal(other.link.connect('ABCDEFGH', endpoint), false, endpoint);
    assert.equal(other.sockets.length, 0);
  }
});

test('control needs an explicit grant whose initial backup was stored; failures keep the user in control', () => {
  const rig = linkRig();
  rig.pair();
  assert.equal(rig.link.requestControl(), false, 'no game yet');
  rig.game(false);
  assert.equal(rig.link.requestControl(), false, 'the game is still loading');
  rig.game(true);
  assert.equal(rig.link.requestControl(), true);
  assert.deepEqual(rig.posted.at(-1), { type: 'ai-backup' });
  assert.equal(rig.link.state.control, 'pending');
  rig.link.handlePlayerMessage({ type: 'ai-backup-failed', message: 'The cartridge save could not be read.' });
  assert.equal(rig.link.state.control, 'user');
  assert.equal(rig.link.state.backup.state, 'failed');
  assert.equal(rig.link.state.error, 'backup-failed');
  assert.equal(rig.posted.some(message => message.type === 'ai-mode'), false);

  rig.link.requestControl();
  rig.link.handlePlayerMessage({ type: 'ai-backup', backup: goldBackup() });
  const failed = rig.sent('backup').at(-1);
  assert.equal(failed.sessionId, rig.link.sessionId);
  rig.socket.message({ type: 'backup-failed', grantId: failed.grantId, message: 'EACCES: could not write the backup file.' });
  assert.equal(rig.link.state.control, 'user');
  assert.match(rig.link.state.backup.message, /EACCES/);

  rig.link.requestControl();
  rig.timers.advance(20000);
  assert.equal(rig.link.state.error, 'backup-timeout');

  const grantId = rig.grant();
  assert.equal(rig.link.state.control, 'ai');
  assert.equal(rig.link.state.backup.state, 'saved');
  assert.deepEqual(rig.posted.at(-1), { type: 'ai-mode', value: true });
  assert.deepEqual(rig.sent('state').at(-1), { type: 'state', hidden: false, control: 'ai', grantId,
    session: { id: rig.link.sessionId, game: GOLD, ready: true, paused: false } });
});

test('the host relays only current-session commands, never twice, and returns frames as base64 RGBA', () => {
  const rig = linkRig();
  rig.pair();
  rig.game();
  rig.command('early');
  assert.equal(rig.sent('result').at(-1).error.code, 'user-control');
  rig.grant();
  rig.command('old', 'act', undefined, OTHER_SESSION);
  assert.equal(rig.sent('result').at(-1).error.code, 'stale-session');
  rig.command('c-1');
  const forwarded = rig.posted.filter(message => message.type === 'ai-command');
  assert.deepEqual(forwarded, [{ type: 'ai-command', requestId: 'c-1', kind: 'act', params: { buttons: ['a'], holdMs: 100, settleMs: 0 } }]);
  rig.command('c-2');
  assert.equal(rig.sent('result').at(-1).error.code, 'busy');
  rig.command('c-1');
  assert.equal(rig.sent('result').at(-1).error.code, 'duplicate-request');
  assert.equal(rig.posted.filter(message => message.type === 'ai-command').length, 1);
  const data = new Uint8ClampedArray(gbFrame(5));
  rig.link.handlePlayerMessage({ type: 'ai-result', requestId: 'c-1', ok: true, paused: true, frame: { width: 160, height: 144, data },
    capture: { source: 'live-frame', attempts: 1, junk: { nested: true } }, timing: { holdMs: 101 } });
  const result = rig.sent('result').at(-1);
  assert.equal(result.ok, true);
  assert.deepEqual(Buffer.from(result.frame.data, 'base64'), Buffer.from(data));
  assert.deepEqual(result.capture, { source: 'live-frame', attempts: 1 });
  assert.deepEqual(rig.link.state.lastAction, { kind: 'act', detail: 'a · 100 ms', ok: true, at: 0 });
  rig.command('c-3', 'observe', {});
  rig.link.handlePlayerMessage({ type: 'ai-result', requestId: 'c-3', ok: true, frame: { width: 160, height: 100, data } });
  assert.equal(rig.sent('result').at(-1).error.code, 'capture-failed');
  rig.link.handlePlayerMessage({ type: 'ai-result', requestId: 'c-3', ok: true, frame: { width: 160, height: 144, data } });
  assert.equal(rig.sent('result').filter(message => message.requestId === 'c-3').length, 1, 'late duplicates are dropped');
});

test('host timeouts, cancels, stops, hidden pages, take-over and lost bridges all stop the player', () => {
  const rig = linkRig();
  rig.pair();
  rig.game();
  rig.grant();
  rig.command('t-1');
  rig.timers.advance(5100 + 1500);
  assert.equal(rig.posted.at(-1).type, 'ai-stop');
  assert.equal(rig.sent('result').at(-1).error.code, 'timeout');
  rig.command('t-2');
  rig.socket.message({ type: 'cancel', requestId: 't-2' });
  assert.equal(rig.posted.at(-1).type, 'ai-stop');
  assert.equal(rig.sent('result').at(-1).error.code, 'cancelled');
  rig.command('t-3');
  rig.socket.message({ type: 'stop', requestId: 'stop-1' });
  assert.equal(rig.sent('result').at(-1).error.code, 'stopped');
  assert.deepEqual(rig.posted.at(-1), { type: 'ai-stop', requestId: 'stop-1' });
  rig.link.handlePlayerMessage({ type: 'ai-stopped', requestId: 'stop-1', paused: true });
  assert.deepEqual(rig.sent('stopped').at(-1), { type: 'stopped', requestId: 'stop-1', paused: true });
  rig.command('t-4');
  rig.link.setHidden(true);
  assert.equal(rig.sent('result').at(-1).error.code, 'page-hidden');
  rig.command('t-5');
  assert.equal(rig.sent('result').at(-1).error.code, 'page-hidden');
  rig.link.setHidden(false);
  rig.command('t-6');
  rig.link.takeControl();
  assert.equal(rig.sent('result').at(-1).error.code, 'user-control');
  assert.deepEqual(rig.posted.at(-1), { type: 'ai-mode', value: false });
  assert.equal(rig.sent('state').at(-1).control, 'user');
  const posted = rig.posted.length;
  rig.socket.message({ type: 'stop', requestId: 'stop-2' });
  assert.equal(rig.posted.length, posted, 'stopping an agent without control never pauses the user\'s game');
  assert.equal(rig.sent('stopped').at(-1).requestId, 'stop-2');

  rig.grant();
  rig.command('t-7');
  rig.socket.close(1006);
  assert.deepEqual(rig.posted.at(-1), { type: 'ai-mode', value: false });
  assert.equal(rig.link.state.control, 'user');
  assert.equal(rig.link.state.error, 'closed');
});

test('a reload or another game revokes control and rejects work for the previous session', () => {
  const rig = linkRig();
  rig.pair();
  rig.game();
  rig.grant();
  const first = rig.link.sessionId;
  rig.command('s-1');
  rig.game(true, 'host-2', { ...GOLD });
  assert.notEqual(rig.link.sessionId, first);
  assert.equal(rig.sent('result').at(-1).error.code, 'session-changed');
  assert.equal(rig.link.state.control, 'user');
  assert.equal(rig.link.state.backup.state, 'none', 'the next game needs its own initial backup');
  rig.command('s-2', 'act', undefined, first);
  assert.equal(rig.sent('result').at(-1).error.code, 'stale-session');
  rig.link.setSession(null);
  assert.equal(rig.sent('state').at(-1).session, null);
});

// Bridge core with simulated connections.
function connection(origin = 'http://localhost:3000') {
  const conn = { origin, sent: [], closed: null, send(text) { conn.sent.push(JSON.parse(text)); }, close(code, reason) { conn.closed = { code, reason }; } };
  return conn;
}
function bridgeRig({ maxActions = 200, saveInitial } = {}) {
  const timers = fakeTimers(), logs = [], saved = [];
  let ids = 0, codes = 0;
  const backups = { saveInitial: saveInitial ?? (async ({ game, grantId, text }) => { saved.push({ game, grantId, text }); return { file: `/backups/${game.id}/${grantId}.json` }; }) };
  const logger = Object.fromEntries(['error', 'warn', 'info', 'debug'].map(level => [level, message => logs.push(`${level}: ${message}`)]));
  const bridge = createBridge({ backups, logger, maxActions, timers, now: () => timers.now, newId: () => `req-${++ids}`, pairingCode: () => ['ABCDEFGH', 'JKMNPQRS', 'TUVWXYZ2'][codes++ % 3] });
  bridge.setListening({ state: 'listening', url: 'ws://127.0.0.1:41887/gameboy-ai', allowedOrigins: [...DEFAULT_ORIGINS] });
  const rig = { bridge, timers, logs, saved };
  rig.connect = (code, origin) => {
    const conn = connection(origin);
    const handle = bridge.attach(conn);
    const link = { conn, handle, send: message => handle.receive(JSON.stringify(message)) };
    if (code) link.send({ type: 'hello', protocol: 'monsite-gameboy-ai', version: 1, code });
    return link;
  };
  rig.pair = () => rig.connect(bridge.status().pairing.code);
  rig.state = (link, session = {}, extra = {}) => link.send({ type: 'state', control: 'user', hidden: false, ...extra,
    session: session === null ? null : { id: SESSION, game: GOLD, ready: true, paused: true, ...session } });
  rig.grant = async (link, grantId = GRANT, sessionId = SESSION) => {
    link.send({ type: 'backup', grantId, sessionId, backup: goldBackup() });
    await settle();
    rig.state(link, { id: sessionId }, { control: 'ai', grantId });
  };
  rig.ready = async () => { const link = rig.pair(); rig.state(link); await rig.grant(link); return link; };
  rig.commands = link => link.conn.sent.filter(message => message.type === 'command');
  rig.reply = (link, command, extra = {}) => link.send({ type: 'result', requestId: command.requestId, ok: true, paused: true,
    frame: { width: 160, height: 144, encoding: 'rgba8', data: gbFrame(extra.seed ?? 1).toString('base64') }, capture: { source: 'live-frame', attempts: 1 }, ...extra });
  return rig;
}
const ACT = { session_id: SESSION, buttons: ['a'], duration_ms: 100 };
const rejection = async (promiseOrFn, code) => {
  let error;
  try { await (typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn); } catch (caught) { error = caught; }
  assert.ok(error, `expected ${code}`);
  assert.equal(error.code, code, error.message);
  return error;
};

test('pairing codes are single use, expire, lock after five misses and never reach the logs', async () => {
  const rig = bridgeRig();
  const status = rig.bridge.status();
  assert.equal(status.available, false);
  assert.match(status.reason, /No browser tab is paired/);
  assert.deepEqual([status.pairing.code, status.pairing.expires_in_s, status.pairing.single_use], ['ABCD-EFGH', 300, true]);
  assert.equal(rig.bridge.status().pairing.code, 'ABCD-EFGH', 'the same code until used or expired');
  for (let attempt = 0; attempt < 5; attempt++) {
    const wrong = rig.connect('ZZZZ-ZZZZ');
    assert.deepEqual(wrong.conn.sent, [{ type: 'error', code: 'invalid-code' }]);
    assert.equal(wrong.conn.closed.code, CLOSE_CODES.invalidCode);
    wrong.handle.closed();
  }
  const locked = rig.connect('ABCD-EFGH');
  assert.equal(locked.conn.closed.code, CLOSE_CODES.invalidCode, 'five misses burn the code');
  locked.handle.closed();
  const fresh = rig.bridge.status().pairing.code;
  assert.equal(fresh, 'JKMN-PQRS');
  rig.timers.advance(300_001);
  const late = rig.connect(fresh);
  assert.equal(late.conn.closed.code, CLOSE_CODES.invalidCode, 'expired');
  late.handle.closed();
  const code = rig.bridge.status().pairing.code;
  const tab = rig.connect(code.toLowerCase());
  assert.deepEqual(tab.conn.sent.at(-1), { type: 'welcome', protocol: 'monsite-gameboy-ai', version: 1 });
  assert.equal(rig.bridge.status().pairing, undefined);
  assert.equal(rig.bridge.status().browser.origin, 'http://localhost:3000');
  const second = rig.connect(code);
  assert.deepEqual(second.conn.sent, [{ type: 'error', code: 'already-paired' }], 'one paired tab at a time');
  tab.handle.closed();
  const reused = rig.connect(code);
  assert.equal(reused.conn.closed.code, CLOSE_CODES.invalidCode, 'a used code cannot pair again');
  const logText = rig.logs.join('\n');
  for (const secret of ['ABCDEFGH', 'ABCD-EFGH', 'JKMNPQRS', 'JKMN-PQRS', 'TUVWXYZ2', 'TUVW-XYZ2']) assert.ok(!logText.includes(secret), 'no codes in logs');
});

test('unpaired sockets are limited and must say hello in time; malformed messages close the link', () => {
  const rig = bridgeRig();
  const first = rig.connect(), second = rig.connect(), third = rig.connect();
  assert.deepEqual(third.conn.sent, [{ type: 'error', code: 'busy' }]);
  assert.equal(third.conn.closed.code, CLOSE_CODES.protocol);
  rig.timers.advance(10_000);
  assert.deepEqual([first.conn.closed.code, second.conn.closed.code], [CLOSE_CODES.timeout, CLOSE_CODES.timeout]);
  first.handle.closed(); second.handle.closed(); // The sockets' close events.
  const broken = rig.connect();
  assert.equal(broken.conn.closed, null);
  broken.handle.receive('not json');
  assert.deepEqual([broken.conn.sent, broken.conn.closed.code], [[{ type: 'error', code: 'protocol' }], CLOSE_CODES.protocol]);
  broken.handle.closed();
  const tab = rig.pair();
  tab.send({ type: 'state', control: 'user', session: { id: 'session-1', game: GOLD, ready: true } });
  assert.equal(tab.conn.closed.code, CLOSE_CODES.protocol, 'session ids are validated');
});

test('commands need a paired tab, a ready game, the current session id and a grant backed by a stored backup', async () => {
  const rig = bridgeRig();
  await rejection(() => rig.bridge.act(ACT), 'not-connected');
  const tab = rig.pair();
  await rejection(() => rig.bridge.observe({}), 'no-session');
  rig.state(tab, { ready: false });
  await rejection(() => rig.bridge.act(ACT), 'not-ready');
  rig.state(tab);
  await rejection(() => rig.bridge.act(ACT), 'user-control');
  rig.state(tab, {}, { control: 'ai', grantId: GRANT });
  assert.equal(rig.bridge.status().control, 'user', 'claiming control without a stored backup is ignored');
  assert.ok(rig.logs.some(line => line.includes('without a stored initial backup')));
  await rig.grant(tab);
  assert.equal(rig.bridge.status().control, 'ai');
  assert.equal(rig.bridge.status().initial_backup.file, `/backups/pokemon-gold/${GRANT}.json`);
  assert.deepEqual(tab.conn.sent.find(message => message.type === 'backup-saved'), { type: 'backup-saved', grantId: GRANT, file: `/backups/pokemon-gold/${GRANT}.json`, partial: false });
  await rejection(() => rig.bridge.act({ ...ACT, session_id: OTHER_SESSION }), 'stale-session');
  await rejection(() => rig.bridge.act({ ...ACT, session_id: undefined }), 'invalid-argument');
  await rejection(() => rig.bridge.act({ ...ACT, buttons: ['l'] }), 'invalid-argument');
  await rejection(() => rig.bridge.act({ ...ACT, buttons: ['up', 'down'] }), 'invalid-argument');
  assert.equal(rig.commands(tab).length, 0, 'nothing reached the browser');
  const pending = rig.bridge.act(ACT);
  const [command] = rig.commands(tab);
  assert.deepEqual({ ...command, requestId: undefined }, { type: 'command', requestId: undefined, sessionId: SESSION, kind: 'act',
    params: { buttons: ['a'], holdMs: 100, settleMs: 250 }, timeoutMs: 5350, budget: { used: 1, limit: 200 } });
  rig.reply(tab, command, { timing: { holdMs: 101, settleMs: 250 } });
  const result = await pending;
  assert.deepEqual([result.frame.width, result.frame.height, result.frame.rgba.length, result.scale], [160, 144, 92160, 3]);
  assert.equal(result.meta.session_id, SESSION);
  assert.equal(result.meta.capture_id, `${SESSION}:1`);
  assert.equal(result.meta.changed_since_previous_capture, null);
  assert.deepEqual(result.meta.action, { buttons: ['a'], duration_ms: 100, settle_ms: 250 });
  assert.equal(result.meta.actions_used, 1);
  for (const [seed, changed, streak] of [[1, false, 1], [1, false, 2], [2, true, 0]]) {
    const next = rig.bridge.wait({ session_id: SESSION, duration_ms: 100 });
    rig.reply(tab, rig.commands(tab).at(-1), { seed });
    const meta = (await next).meta;
    assert.equal(meta.changed_since_previous_capture, changed);
    assert.equal(meta.unchanged_streak, streak, 'an unchanged screen is visible to the agent');
  }
});

test('a duplicated request_id never repeats the action; reusing it for another command is refused', async () => {
  const rig = bridgeRig();
  const tab = await rig.ready();
  const first = rig.bridge.act({ ...ACT, request_id: 'move-1' });
  const retried = rig.bridge.act({ ...ACT, request_id: 'move-1' });
  assert.equal(rig.commands(tab).length, 1);
  rig.reply(tab, rig.commands(tab)[0]);
  const [original, copy] = await Promise.all([first, retried]);
  assert.equal(original.meta.deduplicated, false);
  assert.equal(copy.meta.deduplicated, true);
  assert.equal(copy.meta.capture_id, original.meta.capture_id);
  const later = await rig.bridge.act({ ...ACT, request_id: 'move-1' });
  assert.equal(later.meta.capture_id, original.meta.capture_id);
  assert.equal(rig.commands(tab).length, 1, 'a single command reached the browser');
  await rejection(() => rig.bridge.act({ ...ACT, request_id: 'move-1', duration_ms: 200 }), 'request-id-conflict');
  await rejection(() => rig.bridge.act({ ...ACT, request_id: 'bad id' }), 'invalid-argument');
  const failing = rig.bridge.act({ ...ACT, request_id: 'move-2' });
  tab.send({ type: 'result', requestId: rig.commands(tab).at(-1).requestId, ok: false, error: { code: 'interrupted', message: 'Paused by another control.' } });
  await rejection(failing, 'interrupted');
  await rejection(() => rig.bridge.act({ ...ACT, request_id: 'move-2' }), 'interrupted');
  assert.equal(rig.commands(tab).length, 2);
});

test('stop has priority: it cancels the running command, empties the queue, pauses and is idempotent', async () => {
  const rig = bridgeRig();
  const tab = await rig.ready();
  const running = rig.bridge.act(ACT);
  const queued = [rig.bridge.wait({ session_id: SESSION, duration_ms: 500 }), rig.bridge.act({ ...ACT, buttons: ['b'] })];
  await rejection(() => rig.bridge.act(ACT), 'queue-full');
  const [command] = rig.commands(tab);
  const stopping = rig.bridge.stop();
  const ordered = tab.conn.sent.slice(-2);
  assert.deepEqual(ordered.map(message => message.type), ['cancel', 'stop']);
  assert.equal(ordered[0].requestId, command.requestId);
  for (const promise of [running, ...queued]) await rejection(promise, 'stopped');
  assert.equal(rig.commands(tab).length, 1, 'queued commands never reached the browser');
  tab.send({ type: 'stopped', requestId: ordered[1].requestId, paused: true });
  assert.deepEqual(await stopping, { stopped: true, cancelled: 3, browser_connected: true, confirmed: true, paused: true });
  rig.reply(tab, command);
  assert.equal(rig.bridge.status().busy, false, 'a late result is ignored');
  const again = rig.bridge.stop();
  tab.send({ type: 'stopped', requestId: tab.conn.sent.at(-1).requestId, paused: true });
  assert.deepEqual(await again, { stopped: true, cancelled: 0, browser_connected: true, confirmed: true, paused: true });
  const unconfirmed = rig.bridge.stop();
  rig.timers.advance(3000);
  assert.equal((await unconfirmed).confirmed, false);
  assert.deepEqual(await createBridge({ backups: {}, logger: createLogger({ write() {} }) }).stop(),
    { stopped: true, cancelled: 0, browser_connected: false, confirmed: false, paused: null });
});

test('timeouts and MCP cancellations cancel the browser command and stop the game', async () => {
  const rig = bridgeRig();
  const tab = await rig.ready();
  const slow = rig.bridge.act({ ...ACT, duration_ms: 2000, settle_ms: 0 });
  const behind = rig.bridge.observe({});
  const [command] = rig.commands(tab);
  rig.timers.advance(command.timeoutMs);
  const error = await rejection(slow, 'timeout');
  assert.match(error.message, /7000 ms/);
  await rejection(behind, 'cancelled');
  assert.deepEqual(tab.conn.sent.slice(-2).map(message => message.type), ['cancel', 'stop']);
  const controller = new AbortController();
  const cancelled = rig.bridge.wait({ session_id: SESSION, duration_ms: 1000 }, { signal: controller.signal });
  const waiting = rig.commands(tab).at(-1);
  controller.abort();
  await rejection(cancelled, 'cancelled');
  assert.deepEqual(tab.conn.sent.at(-1), { type: 'cancel', requestId: waiting.requestId });
  const aborted = new AbortController();
  aborted.abort();
  await rejection(() => rig.bridge.act({ ...ACT, request_id: 'gone' }, { signal: aborted.signal }), 'cancelled');
  const retried = rig.bridge.act({ ...ACT, request_id: 'gone' });
  assert.equal(rig.commands(tab).at(-1).params.buttons[0], 'a', 'a pre-cancelled key never blocks a later retry');
  rig.reply(tab, rig.commands(tab).at(-1));
  assert.equal((await retried).meta.request_id, 'gone');
});

test('disconnection, reloads, game changes, hidden tabs and taking control all reject pending work', async () => {
  const rig = bridgeRig();
  let tab = await rig.ready();
  let pending = rig.bridge.act(ACT);
  rig.state(tab, {}, { control: 'ai', grantId: GRANT, hidden: true });
  await rejection(pending, 'page-hidden');
  await rejection(() => rig.bridge.act(ACT), 'page-hidden');
  rig.state(tab, {}, { control: 'ai', grantId: GRANT });
  pending = rig.bridge.act(ACT);
  rig.state(tab, {}, { control: 'user' });
  await rejection(pending, 'user-control');
  rig.state(tab, {}, { control: 'ai', grantId: GRANT });
  // A used grant cannot be claimed again: a new backup is needed.
  await rejection(() => rig.bridge.act(ACT), 'user-control');
  await rig.grant(tab, 'g-00000000000000ff');
  pending = rig.bridge.act(ACT);
  rig.state(tab, { id: OTHER_SESSION }, { control: 'ai', grantId: 'g-00000000000000ff' });
  await rejection(pending, 'session-changed');
  assert.equal(rig.bridge.status().control, 'user');
  await rejection(() => rig.bridge.act(ACT), 'stale-session');
  await rig.grant(tab, 'g-00000000000000fe', OTHER_SESSION);
  pending = rig.bridge.act({ ...ACT, session_id: OTHER_SESSION });
  tab.handle.closed();
  await rejection(pending, 'disconnected');
  const status = rig.bridge.status();
  assert.equal(status.browser, null);
  assert.equal(status.control, 'none');
  assert.ok(status.pairing.code, 'a reload needs a new pairing code');
  tab = rig.pair();
  rig.state(tab, { id: OTHER_SESSION });
  await rejection(() => rig.bridge.act({ ...ACT, session_id: OTHER_SESSION }), 'user-control');
});

test('the action budget is per grant and observe does not spend it', async () => {
  const rig = bridgeRig({ maxActions: 2 });
  const tab = await rig.ready();
  for (let index = 0; index < 2; index++) {
    const pending = rig.bridge.act(ACT);
    rig.reply(tab, rig.commands(tab).at(-1));
    await pending;
  }
  const observed = rig.bridge.observe({});
  rig.reply(tab, rig.commands(tab).at(-1));
  assert.equal((await observed).meta.actions_used, 2);
  await rejection(() => rig.bridge.act(ACT), 'budget-exhausted');
  await rejection(() => rig.bridge.wait({ session_id: SESSION, duration_ms: 100 }), 'budget-exhausted');
  assert.equal(rig.bridge.status().available, false);
  assert.match(rig.bridge.status().reason, /budget/);
  rig.state(tab, {}, { control: 'user' });
  await rig.grant(tab, 'g-00000000000000aa');
  assert.deepEqual(rig.bridge.status().actions, { used: 0, limit: 2 });
});

test('initial backups are validated against the running game and a failure never grants control', async () => {
  const rig = bridgeRig({ saveInitial: async () => { throw Object.assign(new Error('denied'), { code: 'EACCES' }); } });
  const tab = rig.pair();
  rig.state(tab);
  tab.send({ type: 'backup', grantId: GRANT, sessionId: SESSION, backup: goldBackup() });
  await settle();
  assert.deepEqual(tab.conn.sent.at(-1), { type: 'backup-failed', grantId: GRANT, message: 'EACCES: could not write the backup file.' });
  rig.state(tab, {}, { control: 'ai', grantId: GRANT });
  assert.equal(rig.bridge.status().control, 'user');
  const ok = bridgeRig();
  const other = ok.pair();
  ok.state(other);
  for (const [backup, pattern] of [
    [goldBackup({ rom: 'f'.repeat(64) }), /Gold/], [goldBackup({ sram: 'AAAA' }), /Gold/], ['{', /JSON/], [JSON.stringify({ format: 'other' }), /Unknown/],
  ]) {
    other.send({ type: 'backup', grantId: GRANT, sessionId: SESSION, backup });
    await settle();
    assert.equal(other.conn.sent.at(-1).type, 'backup-failed');
    assert.match(other.conn.sent.at(-1).message, pattern);
  }
  other.send({ type: 'backup', grantId: GRANT, sessionId: OTHER_SESSION, backup: goldBackup() });
  await settle();
  assert.match(other.conn.sent.at(-1).message, /session changed/);
  assert.equal(ok.saved.length, 0);
  other.send({ type: 'backup', grantId: 'grant', sessionId: SESSION, backup: goldBackup() });
  assert.equal(other.conn.closed.code, CLOSE_CODES.protocol);
});

test('initial backup files are written once, privately, and in the format "Importar respaldo" accepts', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gameboy-ai-backups-'));
  try {
    const store = createBackupStore({ directory, clock: () => new Date('2026-10-16T12:00:00.000Z') });
    const text = goldBackup();
    const saved = await store.saveInitial({ game: GOLD, grantId: GRANT, text });
    assert.equal(saved.file, path.join(directory, 'pokemon-gold', `2026-10-16T12-00-00-000Z-${GRANT}.json`));
    assert.equal(await readFile(saved.file, 'utf8'), text);
    assert.equal((await stat(saved.file)).mode & 0o777, 0o600);
    assert.deepEqual(save.parseGoldBackup(await readFile(saved.file, 'utf8')), JSON.parse(text), 'the player can import it');
    await assert.rejects(store.saveInitial({ game: GOLD, grantId: GRANT, text: goldBackup({ savedAt: '2026-10-17T00:00:00.000Z' }) }), { code: 'EEXIST' });
    assert.equal(await readFile(saved.file, 'utf8'), text, 'never overwritten');
    await store.saveInitial({ game: { ...GOLD, id: '../escape' }, grantId: 'g-00000000000000ee', text });
    assert.deepEqual((await readdir(directory)).sort(), ['other', 'pokemon-gold']);
    await assert.rejects(store.saveInitial({ game: GOLD, grantId: '../x', text }), /grant/);
    assert.throws(() => createBackupStore({ directory: 'relative/backups' }), /absolute/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('initial backup validation matches the player\'s own Gold rules and generic cartridge identity', () => {
  for (const changes of [{}, { rtc: undefined }, { rom: 'x' }, { version: 2 }, { sram: 'AA==' }, { rtc: 'AA==' }, { savedAt: 'later' }, { format: 'monsite-game-state' }]) {
    const value = JSON.parse(goldBackup(changes));
    let mine = true, player = true;
    try { validateGoldBackup(value); } catch { mine = false; }
    try { save.parseGoldBackup(JSON.stringify(value)); } catch { player = false; }
    assert.equal(mine, player, JSON.stringify(Object.keys(changes)));
  }
  assert.deepEqual(validateInitialBackup(goldBackup(), GOLD), { partial: false });
  assert.deepEqual(validateInitialBackup(goldBackup({ rtc: undefined }), GOLD), { partial: true });
  assert.throws(() => validateInitialBackup(goldBackup(), { ...GOLD, id: 'rom-' + GOLD_ROM_SHA256 }), /does not belong/);
  const doom = { id: 'rom-' + 'f'.repeat(64), title: 'Doom', platform: 'gba', sha256: 'f'.repeat(64) };
  const generic = JSON.stringify(createGameCartridgeBackup(new Uint8Array(512), undefined, { sha256: doom.sha256, platform: 'gba', core: 'mgba' }));
  assert.deepEqual(validateInitialBackup(generic, doom), { partial: false });
  assert.throws(() => validateInitialBackup(generic, { ...doom, sha256: 'e'.repeat(64) }), /does not belong/);
  assert.throws(() => validateInitialBackup('x'.repeat(2 * 1024 * 1024 + 1), doom), /too large/);
});

test('upgrades need the exact path, a loopback Host, an allow-listed Origin and the subprotocol', () => {
  const config = { port: 41887, allowedOrigins: [...DEFAULT_ORIGINS] };
  const headers = { upgrade: 'websocket', host: '127.0.0.1:41887', origin: 'http://localhost:3000', 'sec-websocket-protocol': 'monsite-gameboy-ai.v1' };
  const check = (changes = {}, extra = {}) => validateUpgrade({ method: 'GET', url: '/gameboy-ai', ...extra, headers: { ...headers, ...changes } }, config);
  assert.deepEqual(check(), { ok: true, origin: 'http://localhost:3000' });
  assert.equal(check({ host: 'localhost:41887', origin: 'http://127.0.0.1:3000' }).ok, true);
  for (const [changes, extra, reason] of [
    [{ origin: 'https://evil.example' }, {}, 'origin'], [{ origin: undefined }, {}, 'origin'], [{ origin: 'null' }, {}, 'origin'],
    [{ origin: 'http://localhost:3001' }, {}, 'origin'], [{ origin: 'https://gba.alexisrs.dev' }, {}, 'origin'],
    [{ origin: 'localhost:3000' }, {}, 'origin'], [{ origin: 'http://localhost:3000/' }, {}, 'origin'], [{ origin: ' http://localhost:3000' }, {}, 'origin'],
    [{ origin: 'HTTP://LOCALHOST:3000' }, {}, 'origin'], [{ origin: ['http://localhost:3000'] }, {}, 'origin'],
    [{ host: 'attacker.example:41887' }, {}, 'host'], [{ host: '127.0.0.1:1234' }, {}, 'host'], [{ host: undefined }, {}, 'host'],
    [{}, { url: '/gameboy-ai?code=ABCDEFGH' }, 'path'], [{}, { url: '/' }, 'path'], [{}, { method: 'POST' }, 'method'],
    [{ upgrade: undefined }, {}, 'upgrade'], [{ 'sec-websocket-protocol': 'chat' }, {}, 'subprotocol'],
  ]) assert.equal(check(changes, extra).reason, reason);
  assert.equal(validateUpgrade({ method: 'GET', url: '/gameboy-ai', headers: { ...headers, origin: 'https://gba.alexisrs.dev' } },
    { port: 41887, allowedOrigins: ['https://gba.alexisrs.dev'] }).ok, true, 'production origins only when configured');
});

// The real `ws` server and client over an in-memory socket pair: the HTTP
// server is never bound to a port.
function memorySocket(stream) {
  return Object.assign(stream, { setTimeout() { return stream; }, setNoDelay() { return stream; }, setKeepAlive() { return stream; }, remoteAddress: '127.0.0.1' });
}
function memoryClient(bridgeServer, { origin = 'http://localhost:3000', host = '127.0.0.1:41887', protocols = ['monsite-gameboy-ai.v1'] } = {}) {
  const [client, server] = duplexPair();
  bridgeServer.server.emit('connection', memorySocket(server));
  const socket = new WebSocket(`ws://${host}/gameboy-ai`, protocols, { origin, createConnection: () => memorySocket(client) });
  // What the OS would report to the server when the TCP connection drops.
  socket.dropConnection = () => { socket.terminate(); server.destroy(); };
  return socket;
}
const outcome = socket => new Promise(resolve => {
  socket.once('open', () => resolve({ open: true }));
  socket.once('unexpected-response', (request, response) => resolve({ open: false, status: response.statusCode }));
  socket.once('error', error => resolve({ open: false, error: error.message }));
});

test('the real WebSocket stack enforces Origin, Host and pairing without binding a port', async () => {
  const rig = bridgeRig();
  const warnings = [];
  const bridgeServer = createBridgeServer({ bridge: rig.bridge, port: 41887, allowedOrigins: [...DEFAULT_ORIGINS], logger: { warn: line => warnings.push(line), info() {}, error() {}, debug() {} } });
  try {
    assert.equal(bridgeServer.server.listening, false);
    let bound;
    const realListen = bridgeServer.server.listen;
    bridgeServer.server.listen = (options, ready) => { bound = options; ready(); return bridgeServer.server; };
    assert.equal(await bridgeServer.listen(), 'ws://127.0.0.1:41887/gameboy-ai');
    assert.deepEqual(bound, { port: 41887, host: '127.0.0.1', exclusive: true }, 'loopback only (checked without binding)');
    bridgeServer.server.listen = realListen;
    for (const [options, status] of [[{ origin: 'https://evil.example' }, 403], [{ host: 'attacker.example:41887' }, 403], [{ protocols: ['chat'] }, 400]]) {
      assert.equal((await outcome(memoryClient(bridgeServer, options))).status, status);
    }
    assert.equal(warnings.length, 3);
    const socket = memoryClient(bridgeServer);
    assert.deepEqual(await outcome(socket), { open: true });
    assert.equal(socket.protocol, 'monsite-gameboy-ai.v1');
    const welcome = new Promise(resolve => socket.once('message', data => resolve(JSON.parse(data.toString()))));
    socket.send(JSON.stringify({ type: 'hello', protocol: 'monsite-gameboy-ai', version: 1, code: rig.bridge.status().pairing.code }));
    assert.equal((await welcome).type, 'welcome');
    assert.equal(rig.bridge.status().browser.origin, 'http://localhost:3000');
    const closed = new Promise(resolve => socket.once('close', resolve));
    // Like a tab closing abruptly. (An orderly close would keep ws's 30 s close
    // timer alive: the in-memory pair has no TCP close to clear it.)
    socket.dropConnection();
    await closed;
    await settle();
    assert.equal(rig.bridge.status().browser, null);
  } finally { await bridgeServer.close(); }
});

// MCP over the SDK's in-memory transport, as a host such as Claude would call it.
async function mcpRig(rig = bridgeRig()) {
  const server = createGameBoyMcpServer({ bridge: rig.bridge, logger: createLogger({ write() {} }) });
  const [client, transport] = InMemoryTransport.createLinkedPair();
  const inbox = [];
  client.onmessage = message => inbox.push(message);
  await server.connect(transport);
  await client.start();
  let id = 0;
  const request = async (method, params = {}) => {
    const message = { jsonrpc: '2.0', id: ++id, method, params };
    await client.send(message);
    for (let tries = 0; tries < 200 && !inbox.some(item => item.id === message.id); tries++) await settle();
    return inbox.find(item => item.id === message.id);
  };
  const init = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  await client.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const call = async (name, args = {}) => (await request('tools/call', { name, arguments: args })).result;
  return { rig, server, client, inbox, request, call, init, sendRaw: message => client.send(message) };
}

test('MCP: a 2025-era client initializes and sees five tools with strict schemas and instructions', async () => {
  const mcp = await mcpRig();
  assert.equal(mcp.init.result.protocolVersion, '2025-06-18');
  assert.equal(mcp.init.result.serverInfo.name, 'monsite-gameboy');
  assert.equal(mcp.init.result.instructions, INSTRUCTIONS);
  const { tools } = (await mcp.request('tools/list')).result;
  assert.deepEqual(tools.map(tool => tool.name), ['get_status', 'observe', 'act', 'wait', 'stop']);
  const act = tools.find(tool => tool.name === 'act');
  assert.deepEqual(act.inputSchema.required, ['session_id', 'buttons', 'duration_ms']);
  assert.equal(act.inputSchema.additionalProperties, false);
  assert.deepEqual(act.inputSchema.properties.buttons.items.enum, ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select', 'l', 'r']);
  assert.deepEqual([act.inputSchema.properties.duration_ms.minimum, act.inputSchema.properties.duration_ms.maximum], [50, 2000]);
  assert.equal(act.annotations.destructiveHint, true);
  assert.equal(tools.find(tool => tool.name === 'stop').annotations.idempotentHint, true);
  assert.match(act.description, /not exact frames/, 'no frame precision is promised');
  assert.doesNotMatch(JSON.stringify(tools), /frame-exact|frame-accurate|frame-perfect|per frame/i);
  for (const name of ['shell', 'eval', 'load_rom', 'read_file']) assert.equal(tools.some(tool => tool.name.includes(name)), false);
  for (const version of ['2025-11-25', '2024-11-05']) {
    const [client, transport] = InMemoryTransport.createLinkedPair();
    const replies = [];
    client.onmessage = message => replies.push(message);
    await createGameBoyMcpServer({ bridge: bridgeRig().bridge, logger: createLogger({ write() {} }) }).connect(transport);
    await client.start();
    await client.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: version, capabilities: {}, clientInfo: { name: 't', version: '1' } } });
    for (let tries = 0; tries < 100 && !replies.length; tries++) await settle();
    assert.equal(replies[0].result.protocolVersion, version);
  }
});

test('MCP: status says clearly when no emulator is connected; errors are readable tool errors', async () => {
  const mcp = await mcpRig();
  const status = await mcp.call('get_status');
  const body = JSON.parse(status.content[0].text);
  assert.equal(body.available, false);
  assert.match(body.reason, /No browser tab is paired/);
  assert.match(body.pairing.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const observe = await mcp.call('observe');
  assert.equal(observe.isError, true);
  assert.equal(JSON.parse(observe.content[0].text).error.code, 'not-connected');
  const contradictory = await mcp.call('act', { session_id: SESSION, buttons: ['left', 'right'], duration_ms: 100 });
  assert.equal(contradictory.isError, true);
  assert.match(contradictory.content[0].text, /opposite directions/);
  for (const args of [{ session_id: SESSION, buttons: ['a'], duration_ms: 10 }, { session_id: SESSION, buttons: ['a', 'a'], duration_ms: 100 },
    { session_id: SESSION, buttons: ['turbo'], duration_ms: 100 }, { buttons: ['a'], duration_ms: 100 }, { session_id: SESSION, buttons: ['a'], duration_ms: 100, script: 'x' }]) {
    const result = await mcp.call('act', args);
    assert.equal(result.isError, true, JSON.stringify(args));
  }
  const stop = await mcp.call('stop');
  assert.deepEqual(JSON.parse(stop.content[0].text), { stopped: true, cancelled: 0, browser_connected: false, confirmed: false, paused: null });
});

test('MCP: observe and act return a real PNG image block plus session and capture metadata', async () => {
  const mcp = await mcpRig();
  const tab = await mcp.rig.ready();
  const pending = mcp.call('observe');
  for (let tries = 0; tries < 100 && !mcp.rig.commands(tab).length; tries++) await settle();
  mcp.rig.reply(tab, mcp.rig.commands(tab)[0], { capture: { source: 'pause-frame', attempts: 1 } });
  const observed = await pending;
  assert.equal(observed.isError, undefined);
  assert.deepEqual(observed.content.map(block => block.type), ['text', 'image']);
  assert.equal(observed.content[1].mimeType, 'image/png');
  const png = decodePng(Buffer.from(observed.content[1].data, 'base64'));
  assert.deepEqual([png.width, png.height], [480, 432]);
  const meta = JSON.parse(observed.content[0].text);
  assert.equal(meta.session_id, SESSION);
  assert.equal(meta.capture_id, `${SESSION}:1`);
  assert.equal(meta.capture_source, 'pause-frame');
  assert.deepEqual(meta.image, { mime_type: 'image/png', width: 480, height: 432, scale: 3, native: [160, 144], bytes: Buffer.from(observed.content[1].data, 'base64').length });
  assert.doesNotMatch(observed.content[0].text, /iVBOR/, 'the image is not hidden inside the text');
  const acted = mcp.call('act', { session_id: SESSION, buttons: ['a'], duration_ms: 100, request_id: 'a-1', scale: 2 });
  for (let tries = 0; tries < 100 && mcp.rig.commands(tab).length < 2; tries++) await settle();
  mcp.rig.reply(tab, mcp.rig.commands(tab)[1]);
  const result = await acted;
  assert.deepEqual([decodePng(Buffer.from(result.content[1].data, 'base64')).width], [320]);
  assert.equal(JSON.parse(result.content[0].text).request_id, 'a-1');
  const status = JSON.parse((await mcp.call('get_status')).content[0].text);
  assert.equal(status.available, true);
  assert.equal(status.session.session_id, SESSION);
  assert.deepEqual(status.last_action, { kind: 'act', buttons: ['a'], duration_ms: 100, settle_ms: 250, ok: true, at: new Date(0).toISOString() });
});

test('MCP: a cancelled tool call cancels the browser command', async () => {
  const mcp = await mcpRig();
  const tab = await mcp.rig.ready();
  await mcp.sendRaw({ jsonrpc: '2.0', id: 99, method: 'tools/call', params: { name: 'wait', arguments: { session_id: SESSION, duration_ms: 5000 } } });
  for (let tries = 0; tries < 100 && !mcp.rig.commands(tab).length; tries++) await settle();
  const [command] = mcp.rig.commands(tab);
  await mcp.sendRaw({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 99, reason: 'user pressed stop' } });
  for (let tries = 0; tries < 100 && tab.conn.sent.at(-1).type !== 'cancel'; tries++) await settle();
  assert.deepEqual(tab.conn.sent.at(-1), { type: 'cancel', requestId: command.requestId });
  assert.equal(mcp.rig.bridge.status().busy, false);
});

test('configuration: explicit origin list, bounded values, and help or errors only on stderr', () => {
  const home = '/Users/test';
  const defaults = parseConfig([], {}, { home });
  assert.deepEqual(defaults, { help: false, port: 41887, allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    backupDir: '/Users/test/.monsite-gameboy-mcp/backups', maxActions: 200, logLevel: 'info' });
  const configured = parseConfig(['--port=42000', '--allow-origin', 'http://localhost:3000', '--allow-origin=https://gba.alexisrs.dev', '--backup-dir', '~/saves', '--max-actions', '50'],
    { GAMEBOY_MCP_PORT: '43000', GAMEBOY_MCP_LOG_LEVEL: 'debug', GAMEBOY_MCP_ALLOWED_ORIGINS: 'http://127.0.0.1:3000' }, { home });
  assert.deepEqual(configured, { help: false, port: 42000, allowedOrigins: ['http://localhost:3000', 'https://gba.alexisrs.dev'], backupDir: '/Users/test/saves', maxActions: 50, logLevel: 'debug' });
  assert.deepEqual(parseConfig([], { GAMEBOY_MCP_ALLOWED_ORIGINS: 'http://localhost:4000, http://localhost:4000' }, { home }).allowedOrigins, ['http://localhost:4000']);
  for (const argv of [['--allow-origin', '*'], ['--allow-origin', 'null'], ['--allow-origin', 'http://localhost:3000/'], ['--allow-origin', 'http://localhost:3000/gba'],
    ['--allow-origin', 'ftp://localhost'], ['--port', '80'], ['--port', '70000'], ['--port', '4.5'], ['--backup-dir', 'relative'], ['--max-actions', '0'],
    ['--log-level', 'verbose'], ['--unknown'], ['--port']]) {
    assert.throws(() => parseConfig(argv, {}, { home }), ConfigError, argv.join(' '));
  }
  const lines = [];
  const logger = createLogger({ write: line => lines.push(line) }, 'warn');
  logger.info('hidden'); logger.warn('shown'); logger.error('shown too');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^\[gameboy-mcp\] \S+ warn: shown\n$/);
  const entry = fileURLToPath(new URL('./gameboy-mcp.mjs', import.meta.url));
  for (const [argv, status] of [[['--help'], 0], [['--port', '1'], 2]]) {
    const run = spawnSync(process.execPath, ['--max-old-space-size=128', entry, ...argv], { encoding: 'utf8', timeout: 20000 });
    assert.equal(run.status, status);
    assert.equal(run.stdout, '', 'stdout stays reserved for MCP');
    assert.match(run.stderr, /Usage: node scripts\/gameboy-mcp\.mjs/);
  }
});

test('stdio entry: stdout carries only MCP JSON-RPC, logs go to stderr, and closing stdin shuts down', async () => {
  const stdin = new PassThrough(), stdout = new PassThrough(), stderr = new PassThrough();
  const out = [], err = [], exits = [];
  stdout.on('data', chunk => out.push(chunk.toString()));
  stderr.on('data', chunk => err.push(chunk.toString()));
  const signals = new EventEmitter();
  const server = { listens: 0, closes: 0 };
  const createServer = () => ({ listen: async () => { server.listens++; return 'ws://127.0.0.1:41887/gameboy-ai'; }, close: async () => { server.closes++; } });
  const app = await main({ argv: ['--backup-dir', '/Users/test/backups'], env: {}, home: '/Users/test', stdin, stdout, stderr, exit: code => exits.push(code), signals, createServer });
  assert.ok(app);
  const responses = () => out.join('').split('\n').filter(Boolean).map(line => JSON.parse(line));
  const send = async (message, id) => {
    stdin.write(`${JSON.stringify(message)}\n`);
    for (let tries = 0; id !== undefined && tries < 200 && !responses().some(item => item.id === id); tries++) await settle();
  };
  await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'stdio-test', version: '1' } } }, 1);
  await send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, 2);
  await send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_status', arguments: {} } }, 3);
  const replies = responses();
  assert.ok(replies.every(reply => reply.jsonrpc === '2.0'), 'every stdout line is JSON-RPC');
  assert.equal(replies.find(reply => reply.id === 1).result.protocolVersion, '2025-06-18');
  assert.deepEqual(replies.find(reply => reply.id === 2).result.tools.map(tool => tool.name), ['get_status', 'observe', 'act', 'wait', 'stop']);
  const status = JSON.parse(replies.find(reply => reply.id === 3).result.content[0].text);
  assert.equal(status.bridge.url, 'ws://127.0.0.1:41887/gameboy-ai');
  assert.match(status.pairing.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const logs = err.join('');
  assert.match(logs, /\[gameboy-mcp\] \S+ info: Bridge listening on ws:\/\/127\.0\.0\.1:41887\/gameboy-ai/);
  assert.match(logs, /Issued a pairing code/);
  assert.ok(!logs.includes(status.pairing.code) && !logs.includes(status.pairing.code.replace('-', '')), 'the code stays out of the logs');
  assert.equal(signals.listenerCount('SIGTERM'), 1);
  stdin.end();
  for (let tries = 0; tries < 200 && !exits.length; tries++) await settle();
  assert.deepEqual(exits, [0]);
  assert.deepEqual(server, { listens: 1, closes: 1 });
  assert.match(err.join(''), /Shutting down \(the MCP client closed stdio\)/);
});

test('remote bridges keep the initial backup in the browser before control is granted', () => {
  const kept = [];
  for (const failing of [true, false]) {
    const posted = [], sockets = [], timers = fakeTimers();
    let ids = 0;
    const link = aiLink.createAiLink({
      createSocket: (url, protocols) => { const socket = { url, protocols, readyState: 0, sent: [], send(text) { socket.sent.push(JSON.parse(text)); }, close(code = 1000) { socket.readyState = 3; socket.onclose?.({ code }); } }; sockets.push(socket); return socket; },
      postToPlayer: message => posted.push(message), onChange() {}, randomId: bytes => String(++ids).padStart(bytes * 2, '0'),
      setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout, now: () => timers.now,
      keepBackupLocally: (backup, game) => { if (failing) throw new Error('Downloads are blocked.'); kept.push({ backup, game: game.id }); return 'pokemon-gold-respaldo-ia.json'; },
    });
    link.connect('ABCDEFGH', aiLink.REMOTE_BRIDGE_URL);
    const [socket] = sockets;
    socket.readyState = 1; socket.onopen(); socket.onmessage({ data: JSON.stringify({ type: 'welcome' }) });
    link.setSession({ hostSession: 'host-1', ready: true, paused: false, game: GOLD });
    link.requestControl();
    link.handlePlayerMessage({ type: 'ai-backup', backup: goldBackup() });
    if (failing) {
      assert.equal(link.state.control, 'user');
      assert.equal(link.state.backup.message, 'Downloads are blocked.');
      assert.equal(socket.sent.some(message => message.type === 'backup'), false, 'nothing is sent before the local copy exists');
      continue;
    }
    const { grantId } = socket.sent.find(message => message.type === 'backup');
    socket.onmessage({ data: JSON.stringify({ type: 'backup-saved', grantId, file: null, partial: false }) });
    assert.equal(link.state.control, 'ai');
    assert.equal(link.state.backup.file, 'pokemon-gold-respaldo-ia.json');
  }
  assert.deepEqual(kept, [{ backup: goldBackup(), game: 'pokemon-gold' }]);
});

// Public multi-agent server: MCP over Streamable HTTP plus browser routing by
// pairing code, exercised with Web Request objects (no port is bound).
function remoteRig(options = {}) {
  const timers = fakeTimers(), logs = [];
  let sessions = 0;
  const logger = Object.fromEntries(['error', 'warn', 'info', 'debug'].map(level => [level, message => logs.push(`${level}: ${message}`)]));
  const hub = createRemoteHub({ logger, publicHost: 'mcp.alexisrs.dev', allowedOrigins: ['https://gba.alexisrs.dev'], timers, now: () => timers.now,
    newSessionId: () => `session-${++sessions}`, ...options });
  const post = (body, session, extra = {}) => hub.handleMcp(new Request('http://mcp.alexisrs.dev/mcp', {
    method: 'POST', body: JSON.stringify(body),
    headers: { host: 'mcp.alexisrs.dev', 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(session ? { 'mcp-session-id': session, 'mcp-protocol-version': '2025-06-18' } : {}), ...extra },
  }), extra.ip ?? '203.0.113.7');
  const read = async response => {
    const text = await response.text();
    const data = text.startsWith('{') ? text : text.split('\n').find(line => line.startsWith('data:'))?.slice(5);
    return data ? JSON.parse(data) : null;
  };
  const initialize = async ip => {
    const response = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'agent', version: '1' } } }, undefined, { ip });
    const session = response.headers.get('mcp-session-id');
    await read(response);
    if (session) await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, session);
    return { response, session };
  };
  const call = async (session, name, args = {}) => (await read(await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } }, session))).result;
  const browser = code => {
    const conn = connection('https://gba.alexisrs.dev');
    const handle = hub.attachBrowser(conn, '198.51.100.9');
    if (code) handle.receive(JSON.stringify({ type: 'hello', protocol: 'monsite-gameboy-ai', version: 1, code }));
    return { conn, handle };
  };
  return { hub, timers, logs, post, initialize, call, browser };
}

test('public server: each agent gets its own MCP session and pairing code; tabs reach only the agent that issued theirs', async () => {
  const rig = remoteRig();
  const first = await rig.initialize(), second = await rig.initialize();
  assert.deepEqual([first.session, second.session], ['session-1', 'session-2']);
  const codeOf = async session => JSON.parse((await rig.call(session, 'get_status')).content[0].text).pairing.code;
  const [codeA, codeB] = [await codeOf(first.session), await codeOf(second.session)];
  assert.notEqual(codeA, codeB);
  const status = JSON.parse((await rig.call(first.session, 'get_status')).content[0].text);
  assert.equal(status.bridge.url, 'wss://mcp.alexisrs.dev/gameboy-ai');
  assert.match(status.pairing.instructions, /https:\/\/gba\.alexisrs\.dev/);
  const tabB = rig.browser(codeB);
  assert.equal(tabB.conn.sent.at(-1).type, 'welcome');
  assert.equal(JSON.parse((await rig.call(second.session, 'get_status')).content[0].text).browser.origin, 'https://gba.alexisrs.dev');
  assert.equal(JSON.parse((await rig.call(first.session, 'get_status')).content[0].text).browser, null, 'the other agent stays unpaired');
  const wrong = rig.browser('ZZZZ-ZZZZ');
  assert.equal(wrong.conn.closed.code, CLOSE_CODES.invalidCode);
  const reused = rig.browser(codeB);
  assert.equal(reused.conn.closed.code, CLOSE_CODES.invalidCode, 'codes are single use');
  const unknown = await rig.post({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} }, 'session-404');
  assert.equal(unknown.status, 404);
  const notInit = await rig.post({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} });
  assert.equal(notInit.status, 400);
  const rebound = await rig.post({ jsonrpc: '2.0', id: 4, method: 'tools/list', params: {} }, first.session, { host: 'attacker.example' });
  assert.equal(rebound.status >= 400, true, 'the MCP endpoint checks its Host header');
  assert.ok(!rig.logs.join('\n').includes(codeA.replace('-', '')) && !rig.logs.join('\n').includes(codeA), 'codes stay out of the logs');
});

test('public server: idle sessions close and free their tab; limits stop floods and code guessing', async () => {
  const rig = remoteRig({ maxSessions: 2, sessionsPerIp: 3, failedPairingsPerIp: 2, idleMs: 60_000 });
  const first = await rig.initialize();
  const code = JSON.parse((await rig.call(first.session, 'get_status')).content[0].text).pairing.code;
  const tab = rig.browser(code);
  assert.equal(tab.conn.sent.at(-1).type, 'welcome');
  await rig.initialize();
  assert.equal((await rig.initialize()).response.status, 503, 'the server is full');
  assert.equal((await rig.initialize()).response.status, 429, 'too many new sessions from one address');
  assert.equal((await rig.initialize('192.0.2.1')).response.status, 503);
  rig.timers.advance(60_000);
  await settle();
  assert.equal(rig.hub.size, 0);
  assert.equal(tab.conn.closed.code, CLOSE_CODES.shutdown, 'closing an agent session frees its tab');
  for (let attempt = 0; attempt < 2; attempt++) rig.browser('AAAA-AAAA');
  const fresh = await rig.initialize('192.0.2.1');
  const valid = JSON.parse((await rig.call(fresh.session, 'get_status')).content[0].text).pairing.code;
  assert.equal(rig.browser(valid).conn.closed.code, CLOSE_CODES.invalidCode, 'an address that kept guessing is refused even with a valid code');
  const silent = rig.browser();
  rig.timers.advance(10_000);
  assert.equal(silent.conn.closed.code, CLOSE_CODES.timeout);
});

test('public server: client addresses come from the proxy, and the container options are bounded', () => {
  const request = (peer, forwarded) => ({ socket: { remoteAddress: peer }, headers: forwarded ? { 'x-forwarded-for': forwarded } : {} });
  assert.equal(clientIp(request('127.0.0.1', '203.0.113.9, 10.0.0.1')), '203.0.113.9');
  assert.equal(clientIp(request('172.18.0.4', '203.0.113.9')), '172.18.0.4', 'a non-loopback peer is not trusted by default');
  assert.equal(clientIp(request('172.18.0.4', '203.0.113.9'), true), '203.0.113.9', 'trusted inside the unpublished Docker network');
  assert.equal(clientIp(request('172.18.0.4'), true), '172.18.0.4');
  const config = parseRemoteConfig(['--listen-host', '0.0.0.0', '--trust-proxy', '--port', '8787'], { GAMEBOY_MCP_PUBLIC_HOST: 'mcp.alexisrs.dev' });
  assert.deepEqual([config.listenHost, config.trustProxy, config.publicHost, config.allowedOrigins], ['0.0.0.0', true, 'mcp.alexisrs.dev', ['https://gba.alexisrs.dev', 'https://alexisrs.dev', 'https://www.alexisrs.dev']]);
  for (const argv of [['--listen-host', '203.0.113.1'], ['--public-host', 'not a host'], ['--max-sessions', '0'], ['--allow-origin', 'https://gba.alexisrs.dev/']]) {
    assert.throws(() => parseRemoteConfig(argv, {}), ConfigError, argv.join(' '));
  }
});
