import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../src/lib/terminal/konami.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const exports = {};
vm.runInNewContext(outputText, { exports });
const { advanceKonami } = exports;

test('accepts the reference sequence, including uppercase letters, one step at a time', () => {
  const input = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'];
  let progress = 0;
  for (const key of input) {
    const next = advanceKonami(progress, key);
    assert.equal(next, progress + 1);
    progress = next;
  }
  assert.equal(progress, 10);
});

test('wrong keys do not advance or erase accepted steps; correction continues the sequence', () => {
  let progress = advanceKonami(0, 'ArrowUp');
  assert.equal(advanceKonami(progress, 'ArrowDown'), 1);
  assert.equal(advanceKonami(progress, 'x'), 1);
  progress = advanceKonami(progress, 'ArrowUp');
  assert.equal(progress, 2);
  assert.equal(advanceKonami(progress, 'ArrowDown'), 3);
});

test('a completed code stays complete when more keys arrive', () => {
  assert.equal(advanceKonami(10, 'ArrowUp'), 10);
  assert.equal(advanceKonami(10, 'a'), 10);
});
