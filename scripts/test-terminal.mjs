import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, require: name => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
    Response, ReadableStream, TextEncoder, TextDecoder, AbortController, DOMException,
    crypto: webcrypto, Date, Error, ...globals,
  });
  return exports;
}
const commands = load('src/lib/terminal/commands.ts');
const stream = load('src/lib/dialogue/stream.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));
const jsonReply = text => Response.json({ message: text, model: 'test-model' });

// Minimal hook host: hook state and refs survive render; provider calls are mocked.
function harness(fetch, timeoutMs = 60_000) {
  const slots = [];
  const cleanups = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(value) {
      const index = cursor++;
      return slots[index] ??= { current: value };
    },
    useCallback: callback => callback,
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = true; cleanups.push(effect()); }
    },
  };
  const { useChat } = load('src/hooks/useChat.ts', { react, '@/lib/dialogue/stream': stream }, {
    fetch,
    window: { setInterval, clearInterval, clearTimeout, setTimeout: (callback, ms) => setTimeout(callback, ms === 60_000 ? timeoutMs : ms) },
  });
  return {
    // This test host supplies the hook runtime; it does not render through React.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    current() { cursor = 0; return useChat(); },
    unmount() { cleanups.forEach(cleanup => cleanup?.()); },
  };
}

test('shell aliases resolve locally while ordinary assistant replies stay natural language', () => {
  assert.equal(commands.parseTerminalCommand('ls', 'shell'), '/projects');
  assert.equal(commands.parseTerminalCommand('  WHOAMI ', 'shell'), '/about');
  assert.equal(commands.parseTerminalCommand('4', 'shell'), '/ai');
  assert.equal(commands.parseTerminalCommand('4', 'assistant'), null);
  assert.equal(commands.parseTerminalCommand('contact', 'assistant'), null);
  assert.equal(commands.parseTerminalCommand('/contact', 'assistant'), '/contact');
  assert.equal(commands.parseTerminalCommand('/delete', 'shell'), 'unknown');
  assert.equal(commands.parseTerminalCommand('tell me about payments', 'shell'), null);
});

test('completion only consumes slash prefixes and does not complete multiline drafts', () => {
  assert.deepEqual([...commands.completeTerminalCommand('/pro')], ['/projects']);
  assert.deepEqual([...commands.completeTerminalCommand('/c')], ['/contact', '/clear']);
  assert.equal(commands.completeTerminalCommand('hello').length, 0);
  assert.equal(commands.completeTerminalCommand('/about\nmore').length, 0);
});

test('duplicate submit is locked synchronously and complete turns become request history', async () => {
  let resolve;
  const calls = [];
  const h = harness((_url, options) => {
    calls.push(JSON.parse(options.body));
    return calls.length === 1 ? new Promise(done => { resolve = done; }) : Promise.resolve(jsonReply('second reply'));
  });
  const chat = h.current();
  const first = chat.sendMessage('first');
  await chat.sendMessage('duplicate');
  assert.equal(calls.length, 1);
  assert.equal(h.current().isLoading, true);
  resolve(jsonReply('first reply'));
  await first;
  assert.equal(h.current().messages.length, 2);
  assert.ok(h.current().messages.every(message => !message.pending && message.outcome === 'complete'));
  await h.current().sendMessage('second');
  assert.deepEqual(calls[1].messages.map(message => message.content), ['first', 'first reply', 'second']);
  assert.equal(h.current().modelUsed, 'test-model');
});

test('stopping a streamed reply preserves partial text and excludes it from future context', async () => {
  const calls = [];
  const h = harness(async (_url, options) => {
    calls.push(JSON.parse(options.body));
    if (calls.length > 1) return jsonReply('new reply');
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"delta","text":"Partial reply"}\n\n'));
        options.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')));
      },
    }), { headers: { 'content-type': 'text/event-stream' } });
  });
  const pending = h.current().sendMessage('first');
  await tick();
  assert.equal(h.current().isStreaming, true);
  assert.equal(h.current().messages.at(-1).content, 'Partial reply');
  h.current().stop();
  await pending;
  assert.equal(h.current().isLoading, false);
  assert.ok(h.current().messages.every(message => !message.pending && message.outcome === 'stopped'));
  await h.current().sendMessage('next');
  assert.deepEqual(calls[1].messages.map(message => message.content), ['next']);
});

test('truncated SSE fails cleanly; retry replaces the failed turn instead of duplicating it', async () => {
  let count = 0;
  const h = harness(async () => ++count === 1
    ? new Response('data: {"type":"delta","text":"incomplete"}\n\n', { headers: { 'content-type': 'text/event-stream' } })
    : jsonReply('complete'));
  await h.current().sendMessage('hello');
  assert.equal(h.current().error, 'Stream interrupted');
  assert.ok(h.current().messages.every(message => !message.pending && message.outcome === 'failed'));
  h.current().retry();
  await tick();
  assert.equal(h.current().error, null);
  assert.equal(h.current().messages.length, 2);
  assert.equal(h.current().messages[0].content, 'hello');
  assert.equal(h.current().messages[1].content, 'complete');
});

test('clear invalidates an old request before a new turn, including late responses', async () => {
  const pending = [];
  const h = harness(() => new Promise(resolve => pending.push(resolve)));
  const old = h.current().sendMessage('old');
  h.current().clearMessages();
  const fresh = h.current().sendMessage('fresh');
  pending[0](jsonReply('stale output'));
  await old;
  assert.equal(h.current().isLoading, true);
  assert.equal(h.current().messages.length, 1);
  pending[1](jsonReply('fresh output'));
  await fresh;
  assert.deepEqual(Array.from(h.current().messages, message => message.content), ['fresh', 'fresh output']);
});

test('rate limits and timeout both release the prompt and remain retryable', async () => {
  const limited = harness(async () => Response.json({ error: 'quota', isRateLimit: true }, { status: 429 }));
  await limited.current().sendMessage('hello');
  assert.equal(limited.current().isRateLimit, true);
  assert.equal(limited.current().isLoading, false);
  assert.equal(limited.current().messages[0].outcome, 'failed');
  const timed = harness((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }), 5);
  await timed.current().sendMessage('hello');
  assert.equal(timed.current().error, 'timeout');
  assert.equal(timed.current().isLoading, false);
  assert.equal(timed.current().messages[0].pending, false);
});

test('unmount aborts in-flight work', async () => {
  let signal;
  const h = harness((_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }));
  const pending = h.current().sendMessage('hello');
  h.unmount();
  assert.equal(signal.aborted, true);
  await pending;
});

test('fragmented streaming completion keeps formatting, model metadata, and a final unterminated frame', async () => {
  const chunks = [
    'data: {"type":"del',
    'ta","text":"Line one\\n\\nLine two"}\r',
    '\n\r\ndata: {"type":"done","message":"Line one\\n\\nLine two","model":"stream-model"}',
  ];
  const h = harness(async () => new Response(new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk)));
      controller.close();
    },
  }), { headers: { 'content-type': 'text/event-stream' } }));
  await h.current().sendMessage('hello');
  assert.equal(h.current().error, null);
  assert.equal(h.current().isStreaming, false);
  assert.equal(h.current().messages.at(-1).content, 'Line one\n\nLine two');
  assert.equal(h.current().messages.at(-1).outcome, 'complete');
  assert.equal(h.current().modelUsed, 'stream-model');
});

test('provider error events preserve partial output and release loading state', async () => {
  const h = harness(async () => new Response([
    'data: {"type":"delta","text":"Partial"}\n\n',
    'data: {"type":"error","error":"Provider unavailable"}\n\n',
  ].join(''), { headers: { 'content-type': 'text/event-stream' } }));
  await h.current().sendMessage('hello');
  assert.equal(h.current().error, 'Provider unavailable');
  assert.equal(h.current().messages.at(-1).content, 'Partial');
  assert.equal(h.current().messages.at(-1).outcome, 'failed');
  assert.equal(h.current().isLoading, false);
});
