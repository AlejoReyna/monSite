import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/gameboy/safari-wasm-guard.js', import.meta.url), 'utf8');
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.6 Safari/605.1.15';
const chrome = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';
const emptyModule = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);

function harness(userAgent = safari, platform = 'MacIntel', maxTouchPoints = 0) {
  const calls = [], streamingCalls = [];
  const wasm = {
    Module: class {},
    instantiate: async (...args) => { calls.push(args); return { instance: 'native instance' }; },
    instantiateStreaming: async (...args) => { streamingCalls.push(args); return { instance: 'native stream' }; },
  };
  const context = vm.createContext({ navigator: { userAgent, platform, maxTouchPoints }, WebAssembly: wasm, crypto: webcrypto, Uint8Array, ArrayBuffer });
  context.window = context;
  vm.runInContext(source.replace('export function ', 'function '), context);
  return { wasm, calls, streamingCalls, install: () => context.installSafariWasmGuard() };
}

test('the guard selects Safari and iOS WebKit, leaving desktop Chromium untouched', () => {
  for (const ua of [safari, 'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile Safari/604.1']) {
    const h = harness(ua), original = h.wasm.instantiate;
    h.install(); assert.notEqual(h.wasm.instantiate, original);
    const installed = h.wasm.instantiate;
    h.install(); assert.equal(h.wasm.instantiate, installed);
  }
  const h = harness(chrome), original = h.wasm.instantiate;
  h.install(); assert.equal(h.wasm.instantiate, original);
});

test('unknown WASM and compiled modules preserve their inputs and compile options', async () => {
  const h = harness(); h.install();
  const imports = {}, options = { builtins: ['js-string'] };
  const result = await h.wasm.instantiate(emptyModule, imports, options);
  assert.equal(result.instance, 'native instance');
  assert.equal(h.calls[0][0], emptyModule);
  assert.equal(h.calls[0][1], imports);
  assert.equal(h.calls[0][2], options);
  const compiled = new h.wasm.Module();
  await h.wasm.instantiate(compiled, imports);
  assert.equal(h.calls[1][0], compiled);
});

test('streaming delegates unknown binaries and invalid MIME/status responses to the native API', async () => {
  const h = harness(); h.install();
  for (const response of [
    new Response(emptyModule, { headers: { 'Content-Type': 'application/wasm' } }),
    new Response(emptyModule, { headers: { 'Content-Type': 'text/plain' } }),
    new Response(emptyModule, { status: 404, headers: { 'Content-Type': 'application/wasm' } }),
  ]) {
    const imports = {}, options = {};
    const result = await h.wasm.instantiateStreaming(Promise.resolve(response), imports, options);
    assert.equal(result.instance, 'native stream');
    const call = h.streamingCalls.at(-1);
    assert.equal(call[0], response); assert.equal(call[1], imports); assert.equal(call[2], options);
    assert.equal(response.bodyUsed, false);
  }
  assert.equal(h.calls.length, 0);
});

// Validate the actual shipped core without compiling or running the emulator.
const hasBsdtar = spawnSync('bsdtar', ['--version'], { stdio: 'ignore' }).status === 0;
function core(variant) {
  return execFileSync('bsdtar', ['-xOf', new URL(`../public/emulatorjs/4.2.3/data/cores/gambatte${variant}-wasm.data`, import.meta.url).pathname, 'gambatte_libretro.wasm'], { maxBuffer: 8 * 1024 * 1024 });
}
function decode(bytes) {
  let at = 8;
  const uint = () => {
    let result = 0, shift = 0, b;
    do { b = bytes[at++]; result += (b & 127) * 2 ** shift; shift += 7; } while (b & 128);
    return result;
  };
  const sections = [], bodies = [];
  while (at < bytes.length) {
    const id = bytes[at++], length = uint(), start = at, end = at + length;
    if (id === 10) {
      const count = uint();
      for (let i = 0; i < count; i++) {
        const length = uint(); bodies.push(bytes.slice(at, at + length)); at += length;
      }
    } else sections.push([id, Buffer.from(bytes.slice(start, end)).toString('hex')]);
    at = end;
  }
  return { sections, bodies };
}
function localsEnd(bytes) {
  let at = 0;
  const uint = () => { let n = 0, shift = 0, b; do { b = bytes[at++]; n += (b & 127) * 2 ** shift; shift += 7; } while (b & 128); return n; };
  const groups = uint();
  for (let i = 0; i < groups; i++) { uint(); at++; }
  return at;
}

for (const variant of ['', '-legacy']) {
  test(`pinned gambatte${variant} remains valid with only the five large function bodies changed`, { skip: !hasBsdtar && 'requires bsdtar to read the shipped 7z core' }, async () => {
    const input = core(variant), h = harness(); h.install();
    await h.wasm.instantiate(input, {});
    const output = h.calls[0][0];
    assert.notEqual(output, input);
    assert.equal(WebAssembly.validate(output), true);
    const before = decode(input), after = decode(output);
    assert.deepEqual(after.sections, before.sections);
    assert.equal(after.bodies.length, before.bodies.length);
    const changed = [];
    for (let i = 0; i < before.bodies.length; i++) {
      const old = Buffer.from(before.bodies[i]), next = Buffer.from(after.bodies[i]);
      if (old.equals(next)) continue;
      changed.push(i);
      assert.equal(next.length, 160000);
      const locals = localsEnd(old), added = next.length - old.length;
      assert.deepEqual(next.subarray(0, locals), old.subarray(0, locals));
      assert.deepEqual([...next.subarray(locals, locals + 4)], [0x02, 0x40, 0x0c, 0x00]);
      assert.equal(next[locals + added - 1], 0x0b);
      assert.equal(next.subarray(locals + 4, locals + added - 1).every(b => b === 0x01), true);
      assert.deepEqual(next.subarray(locals + added), old.subarray(locals));
    }
    assert.deepEqual(changed, [17, 700, 1103, 1377, 1725]);
    // Same-length, valid WASM from another revision must not be rewritten.
    const different = Uint8Array.from(input); different[different.length - 1] ^= 1;
    await h.wasm.instantiate(different, {});
    assert.equal(h.calls[1][0], different);
  });
}

test('the pinned streaming core uses the protected binary and preserves imports', { skip: !hasBsdtar && 'requires bsdtar' }, async () => {
  const h = harness(); h.install();
  const imports = {}, options = {};
  await h.wasm.instantiateStreaming(new Response(core('-legacy'), { headers: { 'Content-Type': 'application/wasm' } }), imports, options);
  assert.equal(h.streamingCalls.length, 0);
  assert.equal(h.calls[0][0].length, 4598990);
  assert.equal(h.calls[0][1], imports);
  assert.equal(h.calls[0][2], options);
  assert.equal(WebAssembly.validate(h.calls[0][0]), true);
});
