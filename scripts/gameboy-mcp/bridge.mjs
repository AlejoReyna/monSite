import { randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  AI_BUTTONS, AI_LIMITS, AI_PROTOCOL, AI_PROTOCOL_VERSION, AiProtocolError, DEFAULT_SCALES, MAX_SIMULTANEOUS_BUTTONS,
  commandTimeoutMs, isRequestId, nativeSize, validateButtons, validateInteger,
} from '../../public/gameboy/ai-protocol.js';
import { validateInitialBackup } from './backups.mjs';
import { frameDigest, uniformColor } from './png.mjs';

/* Transport-agnostic core of the local bridge. One paired browser tab, one
 * game session, one command at a time. Everything addressed to a previous
 * session, connection or grant is refused. Logs never include pairing codes,
 * frames or backups. */
export const PAIRING_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PAIRING_LENGTH = 8;
const PAIRING_TTL_MS = 5 * 60_000;
const PAIRING_ATTEMPTS = 5;
const HELLO_TIMEOUT_MS = 10_000;
const MAX_UNPAIRED_SOCKETS = 2;
const MAX_QUEUE = 2;
const REQUEST_CACHE = 64;
const STOP_ACK_MS = 3000;
const SESSION_ID = /^s-[0-9a-f]{16}$/;
const GRANT_ID = /^g-[0-9a-f]{16}$/;
const ERROR_CODE = /^[a-z-]{1,40}$/;
export const CLOSE_CODES = Object.freeze({ invalidCode: 4001, alreadyPaired: 4002, protocol: 4003, timeout: 4004, shutdown: 4005 });

const failure = (code, message, hint) => Object.assign(new AiProtocolError(code, message), hint ? { hint } : {});
const protocolError = () => failure('protocol', 'Malformed bridge message.');
export const formatPairingCode = code => `${code.slice(0, 4)}-${code.slice(4)}`;
const randomPairingCode = () => Array.from({ length: PAIRING_LENGTH }, () => PAIRING_ALPHABET[randomInt(PAIRING_ALPHABET.length)]).join('');

function parseSession(value) {
  if (value === null || value === undefined) return null;
  const game = value?.game;
  if (typeof value !== 'object' || typeof value.id !== 'string' || !SESSION_ID.test(value.id) || !game || typeof game !== 'object' ||
      typeof game.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(game.id) || typeof game.title !== 'string' ||
      !Object.hasOwn(DEFAULT_SCALES, game.platform) || typeof game.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(game.sha256)) throw protocolError();
  return {
    id: value.id, ready: value.ready === true, paused: value.paused === true,
    game: { id: game.id, title: game.title.slice(0, 120), platform: game.platform, sha256: game.sha256 },
  };
}
function decodeFrame(frame, platform) {
  const [width, height] = nativeSize(platform);
  const bytes = width * height * 4;
  if (!frame || frame.width !== width || frame.height !== height || frame.encoding !== 'rgba8' || typeof frame.data !== 'string' ||
      frame.data.length !== Math.ceil(bytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(frame.data)) {
    throw failure('capture-failed', 'The browser returned an invalid capture.', 'Call observe again; if it keeps failing, ask the user to reload the game.');
  }
  const rgba = Buffer.from(frame.data, 'base64');
  if (rgba.length !== bytes) throw failure('capture-failed', 'The browser returned an invalid capture.');
  return { width, height, rgba };
}
const primitives = (value, keys) => Object.fromEntries(keys.flatMap(key => {
  const item = value?.[key];
  return ['string', 'number', 'boolean'].includes(typeof item) ? [[key, typeof item === 'string' ? item.slice(0, 40) : item]] : [];
}));

export function createBridge({
  backups, logger, maxActions = 200, now = Date.now, timers = globalThis, newId = randomUUID, pairingCode = randomPairingCode,
  gamePage = 'the game page',
} = {}) {
  let listening = { state: 'starting', url: null, error: null, allowedOrigins: [] };
  let pairing = null;
  let browser = null;
  const unpaired = new Set();
  let session = null;
  let control = 'none';
  let hidden = false;
  let grant = null;
  const savedGrants = new Map();
  let current = null;
  const queue = [];
  const requests = new Map();
  const stopWaiters = new Map();
  let lastAction = null;
  let frames = { sessionId: null, count: 0, hash: null, unchanged: 0 };
  let closed = false;

  const send = message => browser?.link.conn.send(JSON.stringify(message));
  function refuse(link, code, closeCode) {
    link.conn.send(JSON.stringify({ type: 'error', code }));
    link.conn.close(closeCode, code);
  }

  function blocker(sessionId) {
    if (listening.state !== 'listening' && !browser) {
      return failure('not-connected', `The local bridge is not listening (${listening.error ?? 'starting'}).`,
        'Another Game Boy MCP process may own the port; stop it or configure another port.');
    }
    if (!browser) return failure('not-connected', 'No browser tab is paired with this MCP server.', 'Call get_status for a pairing code and ask the user to enter it in the game\'s AI panel.');
    if (!session) return failure('no-session', 'No game is open in the paired tab.', 'Ask the user to start a game.');
    if (!session.ready) return failure('not-ready', 'The game is loading or closing.', 'Call get_status again in a few seconds.');
    if (sessionId !== undefined && sessionId !== session.id) {
      return failure('stale-session', `session_id does not match the current game session (${session.id}).`, 'The page was reloaded or the game changed: observe again.');
    }
    if (control !== 'ai') return failure('user-control', 'The user has not granted control, or took it back.', 'Ask the user to press "Permitir que la IA controle" in the AI panel.');
    if (hidden) return failure('page-hidden', 'The game tab is hidden or minimized, so the emulator cannot run.', 'Ask the user to keep the game window visible.');
    return null;
  }
  function settle(entry, outcome) {
    if (entry.done) return;
    entry.done = true;
    entry.signal?.removeEventListener('abort', entry.onAbort);
    if (outcome instanceof Error) entry.reject(outcome); else entry.resolve(outcome);
    if (entry.kind !== 'observe' || outcome instanceof Error) {
      lastAction = {
        kind: entry.kind, ...entry.summary, ok: !(outcome instanceof Error),
        ...(outcome instanceof Error ? { error: outcome.code } : {}), at: new Date(now()).toISOString(),
      };
    }
  }
  /** Cancels the running command and empties the queue. */
  function cancelAll(code, message) {
    let count = 0;
    if (current) {
      const entry = current;
      current = null;
      timers.clearTimeout(entry.timer);
      send({ type: 'cancel', requestId: entry.id });
      settle(entry, failure(code, message));
      count++;
    }
    while (queue.length) { settle(queue.shift(), failure(code, message)); count++; }
    return count;
  }
  function pump() {
    while (!current && queue.length) {
      const entry = queue.shift();
      const blocked = blocker(entry.sessionId) ?? (entry.kind !== 'observe' && grant.actions >= maxActions ? budgetError() : null);
      if (blocked) { settle(entry, blocked); continue; }
      current = entry;
      if (entry.kind !== 'observe') grant.actions++;
      const timeoutMs = commandTimeoutMs(entry.kind, entry.params);
      entry.timer = timers.setTimeout(() => {
        if (current !== entry) return;
        current = null;
        send({ type: 'cancel', requestId: entry.id });
        send({ type: 'stop', requestId: newId() });
        settle(entry, failure('timeout', `No result within ${timeoutMs} ms; the command was cancelled and the game paused.`, 'Observe before acting again.'));
        cancelAll('cancelled', 'Cancelled because an earlier command timed out.');
        pump();
      }, timeoutMs);
      send({
        type: 'command', requestId: entry.id, sessionId: entry.sessionId, kind: entry.kind, params: entry.params, timeoutMs,
        budget: { used: grant.actions, limit: maxActions },
      });
    }
  }
  const budgetError = () => failure('budget-exhausted', `The action budget for this grant (${maxActions}) is used up.`,
    'Stop and report progress. The user can take control and grant it again to start a new budget.');
  function enqueue(entry) {
    if (queue.length >= MAX_QUEUE) throw failure('queue-full', 'Too many commands are waiting.', 'Wait for the previous result before sending more.');
    if (entry.signal?.aborted) throw failure('cancelled', 'Cancelled by the MCP client.');
    entry.id = newId();
    entry.sessionId = session.id;
    const promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
    if (entry.key) {
      requests.set(entry.key, { fingerprint: entry.fingerprint, promise });
      if (requests.size > REQUEST_CACHE) requests.delete(requests.keys().next().value);
      promise.catch(() => {});
    }
    if (entry.signal) {
      entry.onAbort = () => {
        if (current === entry) {
          current = null;
          timers.clearTimeout(entry.timer);
          send({ type: 'cancel', requestId: entry.id });
          settle(entry, failure('cancelled', 'Cancelled by the MCP client.'));
          cancelAll('cancelled', 'Cancelled together with an earlier command.');
          pump();
        } else if (queue.includes(entry)) {
          queue.splice(queue.indexOf(entry), 1);
          settle(entry, failure('cancelled', 'Cancelled by the MCP client.'));
        }
      };
      entry.signal.addEventListener('abort', entry.onAbort, { once: true });
    }
    queue.push(entry);
    pump();
    return promise;
  }
  function reuse(key, fingerprint) {
    const existing = requests.get(key);
    if (!existing) return null;
    if (existing.fingerprint !== fingerprint) {
      throw failure('request-id-conflict', 'request_id was already used for a different command.', 'Use a new request_id for a new action.');
    }
    return existing.promise.then(result => ({ ...result, meta: { ...result.meta, deduplicated: true } }));
  }
  function scaleFor(value, platform) {
    return value === undefined ? DEFAULT_SCALES[platform] : validateInteger(value, AI_LIMITS.scale, 'scale');
  }
  function requestKey(value) {
    if (value === undefined) return undefined;
    if (!isRequestId(value)) throw failure('invalid-argument', 'request_id must be 1-64 characters: letters, digits, ".", "_", ":" or "-".');
    return value;
  }
  function assertSessionId(value) {
    if (typeof value !== 'string' || !SESSION_ID.test(value)) {
      throw failure('invalid-argument', 'session_id is required; use the one returned by observe or get_status.');
    }
  }

  function receiveFrom(link, text) {
    let message;
    try { message = JSON.parse(text); } catch { message = null; }
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') { refuse(link, 'protocol', CLOSE_CODES.protocol); return; }
    if (!link.paired) { hello(link, message); return; }
    try {
      if (message.type === 'state') updateState(message);
      else if (message.type === 'result') result(message);
      else if (message.type === 'stopped') stopped(message);
      else if (message.type === 'backup') {
        if (typeof message.grantId !== 'string' || !GRANT_ID.test(message.grantId)) throw protocolError();
        void storeBackup(message);
      }
    } catch (error) {
      logger.warn(`Rejected a browser message (${error.code ?? 'error'}).`);
      refuse(link, 'protocol', CLOSE_CODES.protocol);
    }
  }
  function hello(link, message) {
    if (message.type !== 'hello' || message.protocol !== AI_PROTOCOL || message.version !== AI_PROTOCOL_VERSION) {
      refuse(link, 'protocol', CLOSE_CODES.protocol); return;
    }
    if (browser) { refuse(link, 'already-paired', CLOSE_CODES.alreadyPaired); return; }
    const code = typeof message.code === 'string' ? message.code.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    if (!pairing || pairing.expiresAt <= now()) {
      pairing = null;
      logger.warn('Pairing refused: no valid code was issued or it expired.');
      refuse(link, 'invalid-code', CLOSE_CODES.invalidCode); return;
    }
    if (code.length !== pairing.code.length || !timingSafeEqual(Buffer.from(code), Buffer.from(pairing.code))) {
      pairing.attempts++;
      if (pairing.attempts >= PAIRING_ATTEMPTS) pairing = null;
      logger.warn('Pairing refused: wrong code.');
      refuse(link, 'invalid-code', CLOSE_CODES.invalidCode); return;
    }
    pairing = null; // Single use.
    link.paired = true;
    timers.clearTimeout(link.timer);
    unpaired.delete(link);
    browser = { link, origin: link.conn.origin, connectedAt: new Date(now()).toISOString() };
    session = null; control = 'user'; hidden = false; grant = null;
    send({ type: 'welcome', protocol: AI_PROTOCOL, version: AI_PROTOCOL_VERSION });
    logger.info(`Browser tab paired (origin ${browser.origin}).`);
  }
  function updateState(message) {
    const next = parseSession(message.session);
    if (next?.id !== session?.id) {
      cancelAll('session-changed', 'The game session changed (reload or another game).');
      frames = { sessionId: next?.id ?? null, count: 0, hash: null, unchanged: 0 };
      grant = null;
      savedGrants.clear();
    }
    session = next;
    hidden = message.hidden === true;
    let nextControl = 'user';
    if (message.control === 'ai' && session) {
      const saved = savedGrants.get(message.grantId);
      if (grant?.id === message.grantId && grant.sessionId === session.id) nextControl = 'ai';
      else if (saved && saved.sessionId === session.id) {
        // Control exists only after this grant's initial backup was stored.
        savedGrants.delete(message.grantId);
        grant = { id: message.grantId, ...saved, actions: 0 };
        nextControl = 'ai';
        logger.info(`Control granted for ${session.game.id}.`);
      } else logger.warn('Ignored a control claim without a stored initial backup.');
    }
    if (control === 'ai' && nextControl !== 'ai') {
      cancelAll('user-control', 'The user took control of the game.');
      logger.info('The user took control.');
    }
    if (nextControl !== 'ai') grant = null;
    control = nextControl;
    if (hidden) cancelAll('page-hidden', 'The game tab was hidden; the game was paused.');
  }
  function result(message) {
    const entry = current;
    if (!entry || message.requestId !== entry.id) return; // Late or unknown: already settled.
    current = null;
    timers.clearTimeout(entry.timer);
    try {
      if (message.ok !== true) {
        const code = typeof message.error?.code === 'string' && ERROR_CODE.test(message.error.code) ? message.error.code : 'internal';
        const text = typeof message.error?.message === 'string' ? message.error.message.slice(0, 300) : 'The player failed.';
        throw failure(code, text, code === 'interrupted' ? 'Someone used the page while the AI acted. Observe again.' : undefined);
      }
      const frame = decodeFrame(message.frame, session.game.platform);
      settle(entry, describeFrame(entry, frame, message));
    } catch (error) {
      settle(entry, error instanceof AiProtocolError ? error : failure('internal', 'Unexpected result.'));
      // Later commands were planned on a state that did not happen.
      cancelAll('cancelled', 'Cancelled because an earlier command failed.');
    }
    pump();
  }
  function describeFrame(entry, frame, message) {
    const hash = frameDigest(frame.rgba);
    if (frames.sessionId !== entry.sessionId) frames = { sessionId: entry.sessionId, count: 0, hash: null, unchanged: 0 };
    const changed = frames.hash === null ? null : frames.hash !== hash;
    frames = { ...frames, count: frames.count + 1, hash, unchanged: changed === false ? frames.unchanged + 1 : 0 };
    const capture = primitives(message.capture, ['source', 'attempts', 'drawingBuffer', 'pixelsPerDot']);
    return {
      frame, scale: entry.scale,
      meta: {
        session_id: entry.sessionId, capture_id: `${entry.sessionId}:${frames.count}`, captured_at: new Date(now()).toISOString(),
        game: session.game.title, game_id: session.game.id, platform: session.game.platform, paused: message.paused === true,
        frame_sha256: hash.slice(0, 16), changed_since_previous_capture: changed, unchanged_streak: frames.unchanged,
        uniform_color: uniformColor(frame.rgba), capture_source: capture.source ?? 'unknown', capture,
        ...(entry.summary ? { action: entry.summary } : {}),
        timing: primitives(message.timing, ['holdMs', 'settleMs', 'captureAfterReleaseMs', 'ranMs']),
        ...(grant ? { actions_used: grant.actions, actions_limit: maxActions } : {}),
        request_id: entry.key ?? null, deduplicated: false,
      },
    };
  }
  function stopped(message) {
    const resolve = stopWaiters.get(message.requestId);
    if (!resolve) return;
    stopWaiters.delete(message.requestId);
    resolve({ paused: typeof message.paused === 'boolean' ? message.paused : null });
  }
  async function storeBackup(message) {
    const { grantId, sessionId } = message;
    const reply = (type, extra) => send({ type, grantId, ...extra });
    if (!session || sessionId !== session.id) { reply('backup-failed', { message: 'The game session changed.' }); return; }
    const game = session.game;
    try {
      const { partial } = validateInitialBackup(message.backup, game);
      const saved = await backups.saveInitial({ game, grantId, text: message.backup });
      if (session?.id !== sessionId) { reply('backup-failed', { message: 'The game session changed.' }); return; }
      savedGrants.set(grantId, { sessionId, file: saved.file, partial });
      reply('backup-saved', { file: saved.file, partial });
      logger.info(`Initial backup stored for ${game.id}${partial ? ' (partial: no verified clock)' : ''}.`);
    } catch (error) {
      const text = error instanceof AiProtocolError ? error.message : `${error.code ?? 'Error'}: could not write the backup file.`;
      logger.error(`Initial backup failed for ${game.id}: ${error.code ?? error.message}`);
      reply('backup-failed', { message: text });
    }
  }
  function disconnected() {
    browser = null; session = null; control = 'none'; hidden = false; grant = null;
    savedGrants.clear();
    cancelAll('disconnected', 'The browser tab disconnected (closed, reloaded or lost the connection).');
    for (const resolve of stopWaiters.values()) resolve(null);
    stopWaiters.clear();
    if (!closed) logger.info('Browser tab disconnected.');
  }

  function act(args, { signal } = {}) {
    // Shape errors first: they never depend on the browser's state.
    const buttons = validateButtons(args?.buttons);
    const holdMs = validateInteger(args?.duration_ms, AI_LIMITS.holdMs, 'duration_ms');
    const settleMs = args?.settle_ms === undefined ? AI_LIMITS.settleMs.default : validateInteger(args.settle_ms, AI_LIMITS.settleMs, 'settle_ms');
    assertSessionId(args?.session_id);
    const key = requestKey(args?.request_id);
    const fingerprint = JSON.stringify(['act', args.session_id, buttons, holdMs, settleMs, args.scale ?? null]);
    if (key) { const repeated = reuse(key, fingerprint); if (repeated) return repeated; }
    const blocked = blocker(args.session_id);
    if (blocked) throw blocked;
    validateButtons(buttons, session.game.platform);
    if (grant.actions >= maxActions) throw budgetError();
    const scale = scaleFor(args.scale, session.game.platform);
    return enqueue({ kind: 'act', params: { buttons, holdMs, settleMs }, summary: { buttons, duration_ms: holdMs, settle_ms: settleMs }, scale, signal, key, fingerprint });
  }
  function wait(args, { signal } = {}) {
    const durationMs = validateInteger(args?.duration_ms, AI_LIMITS.waitMs, 'duration_ms');
    assertSessionId(args?.session_id);
    const key = requestKey(args?.request_id);
    const fingerprint = JSON.stringify(['wait', args.session_id, durationMs, args.scale ?? null]);
    if (key) { const repeated = reuse(key, fingerprint); if (repeated) return repeated; }
    const blocked = blocker(args.session_id);
    if (blocked) throw blocked;
    if (grant.actions >= maxActions) throw budgetError();
    const scale = scaleFor(args.scale, session.game.platform);
    return enqueue({ kind: 'wait', params: { durationMs }, summary: { duration_ms: durationMs }, scale, signal, key, fingerprint });
  }
  function observe(args, { signal } = {}) {
    const blocked = blocker();
    if (blocked) throw blocked;
    const scale = scaleFor(args?.scale, session.game.platform);
    return enqueue({ kind: 'observe', params: {}, scale, signal });
  }
  /** Highest priority: never queued behind other commands, and idempotent. */
  async function stop() {
    const cancelled = cancelAll('stopped', 'Stopped by the stop tool.');
    if (!browser) return { stopped: true, cancelled, browser_connected: false, confirmed: false, paused: null };
    const requestId = newId();
    const acknowledged = new Promise(resolve => {
      stopWaiters.set(requestId, resolve);
      timers.setTimeout(() => { if (stopWaiters.delete(requestId)) resolve(null); }, STOP_ACK_MS);
    });
    send({ type: 'stop', requestId });
    const ack = await acknowledged;
    if (cancelled) logger.info(`Stop cancelled ${cancelled} command(s).`);
    return { stopped: true, cancelled, browser_connected: true, confirmed: ack !== null, paused: ack?.paused ?? null };
  }
  function status() {
    const blocked = blocker();
    let code = null;
    if (!browser && listening.state === 'listening') {
      if (!pairing || pairing.expiresAt <= now()) {
        pairing = { code: pairingCode(), expiresAt: now() + PAIRING_TTL_MS, attempts: 0 };
        logger.info('Issued a pairing code (valid for 5 minutes).');
      }
      code = pairing;
    }
    return {
      available: !blocked && grant.actions < maxActions,
      ...(blocked ? { reason: blocked.message, hint: blocked.hint ?? null } : grant.actions >= maxActions ? { reason: budgetError().message, hint: budgetError().hint } : {}),
      bridge: { listening: listening.state === 'listening', url: listening.url, allowed_origins: listening.allowedOrigins, error: listening.error },
      ...(code ? { pairing: {
        code: formatPairingCode(code.code), expires_in_s: Math.max(0, Math.ceil((code.expiresAt - now()) / 1000)), single_use: true,
        instructions: `Ask the user to open ${gamePage}, open the AI panel (the robot icon), type this code, press "Conectar IA", start a game and press "Permitir que la IA controle".`,
      } } : {}),
      browser: browser && { origin: browser.origin, connected_at: browser.connectedAt },
      session: session && {
        session_id: session.id, game: session.game.title, game_id: session.game.id, platform: session.game.platform,
        ready: session.ready, paused: session.paused, page_hidden: hidden,
      },
      control, busy: current !== null, queued: queue.length,
      actions: grant ? { used: grant.actions, limit: maxActions } : null,
      initial_backup: grant ? { file: grant.file, partial: grant.partial } : null,
      last_action: lastAction,
      limits: {
        buttons: Object.keys(AI_BUTTONS), gba_only: ['l', 'r'], max_simultaneous_buttons: MAX_SIMULTANEOUS_BUTTONS,
        duration_ms: [AI_LIMITS.holdMs.min, AI_LIMITS.holdMs.max], settle_ms: [AI_LIMITS.settleMs.min, AI_LIMITS.settleMs.max],
        settle_ms_default: AI_LIMITS.settleMs.default, wait_ms: [AI_LIMITS.waitMs.min, AI_LIMITS.waitMs.max],
        timing: 'Wall-clock milliseconds while the emulator runs in real time. There is no frame-exact stepping; the game pauses after every command.',
      },
    };
  }

  return {
    act, wait, observe, stop, status,
    setListening(next) { listening = { ...listening, ...next }; },
    /** Lets a multi-session server route a browser hello to the agent that issued its code. */
    matchesPairingCode(input) {
      if (browser || !pairing || pairing.expiresAt <= now() || typeof input !== 'string') return false;
      const code = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return code.length === pairing.code.length && timingSafeEqual(Buffer.from(code), Buffer.from(pairing.code));
    },
    /** Wires one WebSocket (or a test double) into the bridge. */
    attach(conn) {
      const link = { conn, paired: false, timer: null };
      if (closed || unpaired.size >= MAX_UNPAIRED_SOCKETS) {
        refuse(link, closed ? 'shutdown' : 'busy', closed ? CLOSE_CODES.shutdown : CLOSE_CODES.protocol);
        return { receive() {}, closed() {} };
      }
      unpaired.add(link);
      link.timer = timers.setTimeout(() => { if (!link.paired) refuse(link, 'handshake-timeout', CLOSE_CODES.timeout); }, HELLO_TIMEOUT_MS);
      return {
        receive: text => receiveFrom(link, text),
        closed() {
          timers.clearTimeout(link.timer);
          unpaired.delete(link);
          if (browser?.link === link) disconnected();
        },
      };
    },
    close() {
      closed = true;
      cancelAll('disconnected', 'The MCP server is shutting down.');
      if (browser) {
        send({ type: 'stop', requestId: newId() });
        browser.link.conn.close(CLOSE_CODES.shutdown, 'shutdown');
      }
      for (const link of unpaired) link.conn.close(CLOSE_CODES.shutdown, 'shutdown');
    },
  };
}
