import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function harness(initialWidth = 1280) {
  let width = initialWidth, height = 800, cursor = 0, dirty = false, current, controlledEnabled;
  const slots = [], effects = [], mediaListeners = new Set(), resizeListeners = new Set(), frames = new Map(), captures = new Set();
  let frameId = 0;
  const media = { get matches() { return width >= 1024; }, addEventListener: (_event, fn) => mediaListeners.add(fn), removeEventListener: (_event, fn) => mediaListeners.delete(fn) };
  const equal = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; dirty = true; }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { value: { current: initial } }; return slots[index].value; },
    useCallback(fn, deps) { const index = cursor++; if (!slots[index] || !equal(slots[index].deps, deps)) slots[index] = { value: fn, deps }; return slots[index].value; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !equal(slots[index].deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      });
    },
  };
  const document = { documentElement: { style: { cursor: '', userSelect: '' } } };
  const window = {
    matchMedia: () => media,
    addEventListener: (_event, fn) => resizeListeners.add(fn),
    removeEventListener: (_event, fn) => resizeListeners.delete(fn),
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const parent = { getBoundingClientRect: () => ({ left: 0, top: 0, width, height }) };
  const node = {
    get offsetParent() { return width >= 1024 ? parent : null; },
    getBoundingClientRect() { const style = current?.style; return { left: style?.left ?? 400, top: style?.top ?? 160, width: style?.width ?? 740, height: style?.height ?? 500 }; },
    getClientRects() { return width >= 1024 ? [this.getBoundingClientRect()] : []; },
    setPointerCapture: id => captures.add(id),
    hasPointerCapture: id => captures.has(id),
    releasePointerCapture: id => captures.delete(id),
  };
  const source = readFileSync(new URL('../src/lib/desktop/use-window-frame.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: () => react, window, document, requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame });
  const ref = { current: node };
  const render = (enabled = controlledEnabled) => {
    controlledEnabled = enabled;
    let passes = 0;
    do {
      dirty = false; cursor = 0;
      current = exports.useWindowFrame(ref, { minWidth: 380, minHeight: 280, insets: () => ({ top: 30, bottom: 90 }), enabled: controlledEnabled });
      effects.splice(0).forEach(effect => effect());
      assert.ok(++passes < 10, 'hook must settle without a render loop');
    } while (dirty);
    return current;
  };
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); return render(); };
  const event = (x, y) => ({ button: 0, pointerId: 1, clientX: x, clientY: y, currentTarget: node, target: { closest: () => null }, preventDefault() {}, stopPropagation() {} });
  return {
    render, flush, captures, document,
    resize(nextWidth, nextHeight = height) {
      const wasDesktop = media.matches;
      width = nextWidth; height = nextHeight;
      resizeListeners.forEach(fn => fn());
      if (wasDesktop !== media.matches) mediaListeners.forEach(fn => fn());
      render();
      return flush();
    },
    start(x = 450, y = 175) { current.startMove(event(x, y)); return render(); },
    move(x, y) { current.tracking.onPointerMove(event(x, y)); return render(); },
    end(x = 450, y = 175) { current.tracking.onPointerUp(event(x, y)); return render(); },
    resizeEdge(edge, x, y) { current.handleProps(edge).onPointerDown(event(x, y)); return render(); },
    dispose() { slots.forEach(slot => slot.cleanup?.()); },
  };
}

test('mobile → lg enables the title grip and all eight resize grips', () => {
  const h = harness(390);
  assert.equal(h.render().resizable, false);
  assert.equal(h.resize(1280).resizable, true);
  h.start();
  assert.equal(h.captures.size, 1);
  const moved = h.move(530, 205);
  assert.equal(moved.style.left, 480);
  assert.equal(moved.style.top, 190);
  h.end();
  for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    h.resizeEdge(edge, 550, 300);
    assert.equal(h.captures.size, 1, edge);
    const resized = h.move(570, 310);
    assert.ok(resized.style.width >= 380, edge);
    assert.ok(resized.style.height >= 280, edge);
    h.end();
    assert.equal(h.captures.size, 0, edge);
  }
  h.dispose();
});

test('crossing into mobile during a drag releases capture and clears selection locks', () => {
  const h = harness();
  h.render(); h.flush();
  h.start(); h.move(500, 190);
  assert.equal(h.document.documentElement.style.userSelect, 'none');
  h.resize(390);
  assert.equal(h.captures.size, 0);
  assert.equal(h.document.documentElement.style.userSelect, '');
  h.resize(1280);
  h.start();
  const before = h.render().style.left;
  assert.equal(h.move(470, 175).style.left, before + 20);
  h.end(); h.dispose();
});

test('crossing into mobile during resize clears the grip cursor and restores a usable frame', () => {
  const h = harness();
  h.render(); h.flush();
  h.resizeEdge('se', 1140, 660);
  h.move(1200, 690);
  assert.equal(h.document.documentElement.style.cursor, 'nwse-resize');
  h.resize(390);
  assert.equal(h.captures.size, 0);
  assert.equal(h.document.documentElement.style.cursor, '');
  const restored = h.resize(1024, 540);
  assert.ok(restored.style.width <= 1024);
  assert.ok(restored.style.height <= 420);
  assert.ok(restored.style.top >= 30);
  h.resizeEdge('e', 850, 250);
  const before = h.render().style.width;
  assert.equal(h.move(830, 250).style.width, before - 20);
  h.end(); h.dispose();
});

test('the terminal renderer can own the breakpoint without a second drag controller', () => {
  const h = harness(390);
  h.render(false);
  assert.equal(h.resize(1280).resizable, false);
  assert.equal(h.render(true).resizable, true);
  h.flush(); h.start(); h.move(500, 190);
  const savedLeft = h.render().style.left;
  h.render(false);
  assert.equal(h.captures.size, 0);
  assert.equal(h.document.documentElement.style.userSelect, '');
  h.resize(390);
  h.resize(1280);
  h.render(true); h.flush();
  assert.equal(h.render().style.left, savedLeft);
  h.start();
  assert.equal(h.move(470, 175).style.left, savedLeft + 20);
  h.end(); h.dispose();
});
