import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(import.meta.dirname, '..');
function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const path = resolve(root, file);
    if (cache.has(path)) return cache.get(path);
    if (path.endsWith('.json')) return JSON.parse(readFileSync(path, 'utf8'));
    const exports = {};
    cache.set(path, exports);
    const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    vm.runInNewContext(outputText, {
      exports,
      require(name) {
        if (name in overrides) return overrides[name];
        const base = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(path), name);
        const candidate = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
        if (!candidate) throw new Error(`Unexpected import: ${name}`);
        return load(candidate);
      },
    });
    return exports;
  }
  return load;
}
const load = loader();
const { resolveLanguage, isLanguage, LANGUAGES, DEFAULT_LANGUAGE } = load('src/lib/language.ts');
const { translateText, translateContent } = load('src/lib/locale-copy.ts');

test('only English and Spanish are supported; old and invalid preferences fall back to Spanish', () => {
  assert.equal(JSON.stringify(LANGUAGES), '["en","es"]');
  assert.equal(DEFAULT_LANGUAGE, 'es');
  assert.equal(resolveLanguage('es'), 'es');
  assert.equal(resolveLanguage('en'), 'en');
  for (const value of ['zh', 'zh-CN', 'fr', '', null, undefined, {}]) {
    assert.equal(isLanguage(value), false);
    assert.equal(resolveLanguage(value), 'es');
  }
});

test('server pages use the same locale normalization for persisted cookies', async () => {
  for (const value of ['es', 'en', 'zh', undefined]) {
    const server = loader({ 'next/headers': { cookies: async () => ({ get: () => value ? { value } : undefined }) } });
    const { getRequestLanguage, getCopy } = server('src/lib/request-language.ts');
    const language = value === 'en' ? 'en' : 'es';
    assert.equal(await getRequestLanguage(), language);
    assert.equal((await getCopy())('Page not found'), language === 'es' ? 'Página no encontrada' : 'Page not found');
  }
});

test('shared copy translates both source languages and preserves inline whitespace', () => {
  assert.equal(translateText('  Página no encontrada ', 'en'), '  Page not found ');
  assert.equal(translateText('Page not found', 'es'), 'Página no encontrada');
  assert.equal(translateText('Next.js', 'es'), 'Next.js');
  assert.equal(translateText('', 'en'), '');
  const pairs = JSON.parse(readFileSync(resolve(root, 'src/lib/locale-copy.json'), 'utf8'));
  assert.ok(pairs.every(pair => pair.length === 2 && pair.every(value => typeof value === 'string' && value.trim())));
});

test('translating data leaves identifiers, links and executable code unchanged', () => {
  const original = { title: 'Page not found', id: 'Page not found', href: '/projects/test', code: 'Page not found', content: ['Página no encontrada'] };
  const translated = translateContent(original, 'es');
  assert.equal(translated.title, 'Página no encontrada');
  assert.equal(translated.id, original.id);
  assert.equal(translated.code, original.code);
  assert.equal(translated.href, original.href);
  assert.equal(original.title, 'Page not found');
});

test('terminal keeps twenty unique conversation starters in each supported language', () => {
  const { TERMINAL_COPY } = load('src/lib/terminal/copy.ts');
  assert.equal(JSON.stringify(Object.keys(TERMINAL_COPY).sort()), '["en","es"]');
  for (const language of LANGUAGES) {
    assert.equal(TERMINAL_COPY[language].openers.length, 20);
    assert.equal(new Set(TERMINAL_COPY[language].openers).size, 20);
  }
});

test('assistant language actions accept en/es and reject unsupported values', () => {
  const { parseToolCall, ASSISTANT_TOOLS } = load('src/lib/desktop/actions.ts');
  for (const language of LANGUAGES) assert.equal(parseToolCall('change_language', { language }).args.language, language);
  assert.ok(parseToolCall('change_language', { language: 'zh' }).error);
  const tool = ASSISTANT_TOOLS.find(tool => tool.function.name === 'change_language');
  assert.equal(JSON.stringify(tool.function.parameters.properties.language.enum), '["en","es"]');
});

test('blog variants have matching structure, URLs and code, with translated prose and chapters', () => {
  const { getAllPosts, getPost } = load('src/lib/blog/posts.ts');
  const { getPostChapters, getPostHeadings } = load('src/lib/blog/chapters.ts');
  const slug = getAllPosts()[0].slug;
  assert.equal(getPost(slug).locale, 'es-MX');
  const en = getPost(slug, 'en');
  const es = getPost(slug, 'es');
  assert.equal(en.locale, 'en-US');
  assert.equal(es.locale, 'es-MX');
  assert.notEqual(en.title, es.title);
  assert.equal(en.slug, es.slug);
  assert.equal(en.blocks.length, es.blocks.length);
  for (let i = 0; i < en.blocks.length; i++) {
    assert.equal(en.blocks[i].kind, es.blocks[i].kind);
    if (en.blocks[i].kind === 'code') assert.equal(en.blocks[i].code, es.blocks[i].code);
  }
  const chapters = getPostChapters(en.blocks);
  const headings = getPostHeadings(en.blocks);
  assert.ok(chapters.every(chapter => headings.some(heading => heading.id === chapter.id)));
  assert.notEqual(chapters[0].title, getPostChapters(es.blocks)[0].title);
  assert.equal(getAllPosts('es')[0].title, es.title);
  assert.equal(getAllPosts('en')[0].title, en.title);
});
