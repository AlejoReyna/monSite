import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(path, imports = {}, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require: name => imports[name], ...globals });
  return exports;
}
const introModule = load('src/lib/terminal/intro.ts');
const { TERMINAL_COPY } = load('src/lib/terminal/copy.ts');
const copyFor = language => {
  const copy = TERMINAL_COPY[language];
  return { heading: copy.welcomeHeading, prefix: copy.welcomePrefix, portfolio: copy.welcomePortfolio, invitation: copy.assistantInvitation };
};

test('every frame is a contiguous prefix, and each stage waits for the previous stage', () => {
  for (const language of ['es', 'en']) {
    const copy = copyFor(language);
    const intro = introModule.createTerminalIntro(copy);
    for (let elapsed = 0; elapsed <= intro.duration + 50; elapsed += 13) {
      const frame = introModule.terminalIntroFrame(intro, elapsed);
      assert.ok(`${copy.heading}!`.startsWith(frame.heading));
      assert.ok(`${copy.prefix} ${copy.portfolio}`.startsWith(frame.prefix + frame.portfolio));
      assert.ok(copy.invitation.startsWith(frame.invitation));
      if (frame.subtitleVisible) assert.equal(frame.heading, `${copy.heading}!`);
      if (frame.controlsVisible) assert.equal(frame.prefix + frame.portfolio, `${copy.prefix} ${copy.portfolio}`);
      if (frame.invitation) {
        assert.ok(frame.controlsVisible);
        assert.ok(elapsed > intro.controlsStart + 2 * introModule.INTRO_BUTTON_STAGGER_MS + introModule.INTRO_FADE_MS);
      }
    }
  }
});

function harness() {
  let now = 0, timerId = 0, cursor = 0, dirty = false, reduced = false;
  let options = { copy: copyFor('es'), visible: true, key: 'es-0' };
  const slots = [], effects = [], timers = new Map(), motionListeners = new Set(), observers = new Set();
  const equal = (a, b) => a?.length === b?.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, value => { slots[index].value = value; dirty = true; }];
    },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!slots[index] || !equal(slots[index].deps, deps)) slots[index] = { value: factory(), deps };
      return slots[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !equal(slots[index].deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: effect() };
      });
    },
  };
  const { useTerminalIntro } = load('src/hooks/useTerminalIntro.ts', { react, '@/lib/terminal/intro': introModule }, {
    performance: { now: () => now },
    window: {
      setTimeout(callback, delay) { timers.set(++timerId, { callback, at: now + delay }); return timerId; },
      clearTimeout(id) { timers.delete(id); },
      matchMedia: () => ({ get matches() { return reduced; }, addEventListener: (_event, listener) => motionListeners.add(listener), removeEventListener: (_event, listener) => motionListeners.delete(listener) }),
    },
    document: { documentElement: { classList: { contains: () => false } } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe() { observers.add(this); }
      disconnect() { observers.delete(this); }
    },
  });
  const render = updates => {
    options = { ...options, ...updates };
    let frame, renders = 0;
    do {
      dirty = false; cursor = 0;
      // This host supplies the hook runtime without a browser.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      frame = useTerminalIntro(options.copy, options.visible, options.key);
      assert.ok(++renders < 5, 'reset must settle without a render loop');
    } while (dirty);
    effects.splice(0).forEach(effect => effect());
    return frame;
  };
  const advance = milliseconds => {
    const end = now + milliseconds;
    while (true) {
      const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].callback();
      render();
      assert.ok(timers.size <= 1, 'only one animation timer may be active');
    }
    now = end;
    return render();
  };
  return { render, advance, timers, observers, reduce() { reduced = true; motionListeners.forEach(listener => listener()); return render(); }, dispose() { slots.forEach(slot => slot.cleanup?.()); } };
}

test('clear and language changes cancel the old sequence and start with no visible text or controls', () => {
  const h = harness();
  h.render();
  assert.equal(h.advance(6000).invitation, copyFor('es').invitation);
  const reset = h.render({ key: 'es-1' });
  assert.equal(reset.heading, '');
  assert.equal(reset.invitation, '');
  assert.equal(reset.controlsVisible, false);
  assert.equal(h.advance(960).heading, 'Bi');
  const translated = h.render({ key: 'en-1', copy: copyFor('en') });
  assert.equal(translated.heading, '');
  assert.equal(h.advance(6000).heading, 'Welcome!');
  h.dispose();
});

test('hiding cancels the clock; restoring restarts it and cleanup leaves no timers or observers', () => {
  const h = harness();
  h.render();
  h.advance(1000);
  const hidden = h.render({ visible: false });
  assert.equal(hidden.heading, '');
  assert.equal(h.timers.size, 0);
  assert.equal(h.observers.size, 0);
  assert.equal(h.render({ visible: true }).heading, '');
  assert.equal(h.advance(960).heading, 'Bi');
  h.dispose();
  assert.equal(h.timers.size, 0);
  assert.equal(h.observers.size, 0);
});

test('reduced motion completes every stage immediately and stops the timer', () => {
  const h = harness();
  h.render();
  const frame = h.reduce();
  assert.equal(frame.heading, 'Bienvenido!');
  assert.equal(frame.portfolio, copyFor('es').portfolio);
  assert.equal(frame.invitation, copyFor('es').invitation);
  assert.equal(frame.controlsVisible, true);
  assert.equal(h.timers.size, 0);
  h.dispose();
});
