import { AiProtocolError, isRequestId, nativeSize, normalizeActParams, normalizeWaitParams } from './ai-protocol.js';
/* Runs AI commands inside the isolated player with the same synthetic keys and
 * native pause/play buttons the host uses. Captures read only the DOM canvas
 * EmulatorJS renders into; never EJS_emulator, GameManager or Module.
 *
 * The core renders from requestAnimationFrame and its WebGL drawing buffer may
 * be cleared once presented. A frame is therefore read inside an animation
 * frame callback queued after the emulator's own (it re-queues itself at the
 * end of each run), and the native pause is clicked in that same callback, so
 * the returned image is exactly the frame the game stays paused on. */
const BLANK_RETRIES = 2;
// Browsers can return a cleared WebGL buffer with colour-management noise
// (channel values of 0-1) instead of exact black.
const NEAR_BLACK = 3;
const SEEN_LIMIT = 128;

class Aborted extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fail = (code, message) => new AiProtocolError(code, message);
const round = value => Math.round(value);
const ABORT_MESSAGES = {
  stopped: 'Stopped before finishing.', cancelled: 'Cancelled before finishing.',
  'user-control': 'The user took control.', 'page-hidden': 'The page was hidden; the game was paused.',
  'session-changed': 'The game session closed.', interrupted: 'Interrupted by another control.',
};

export function createAiPlayer({
  input, pause, isPaused, isStarted, isExiting, isHeld, getCanvas, createCanvas, platform,
  requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, now,
}) {
  let enabled = false;
  let current = null;
  let entering = null;
  let pausedFrame = null;
  let work = null;
  let preserved;
  const watched = new WeakSet();
  const lost = new WeakSet();
  const seen = new Set();

  function control() {
    const block = { reason: null, timer: null, frame: null, wake: null, keys: [] };
    block.abort = code => {
      if (block.reason) return;
      block.reason = code;
      if (block.timer !== null) clearTimeout(block.timer);
      if (block.frame !== null) cancelAnimationFrame(block.frame);
      block.timer = block.frame = null;
      block.wake?.();
    };
    return block;
  }
  const waitFor = (block, schedule) => new Promise((resolve, reject) => {
    if (block.reason) { reject(new Aborted(block.reason)); return; }
    block.wake = () => { block.wake = null; reject(new Aborted(block.reason)); };
    schedule(resolve, reject);
  });
  const sleep = (block, ms) => waitFor(block, resolve => {
    block.timer = setTimeout(() => { block.timer = null; block.wake = null; resolve(); }, ms);
  });
  // Runs task synchronously inside the animation frame callback.
  const onFrame = (block, task) => waitFor(block, (resolve, reject) => {
    block.frame = requestAnimationFrame(() => {
      block.frame = null; block.wake = null;
      if (block.reason) { reject(new Aborted(block.reason)); return; }
      try { resolve(task()); } catch (error) { reject(error); }
    });
  });
  function releaseKeys(block) {
    for (const key of block?.keys ?? []) input(key, false);
    if (block) block.keys = [];
  }
  function freeze() {
    if (isStarted() && !isExiting() && !isPaused()) pause(true);
  }

  function canvasElement() {
    const canvas = getCanvas();
    if (!canvas) throw fail('capture-failed', 'The emulator canvas is not available.');
    if (!watched.has(canvas)) {
      watched.add(canvas);
      canvas.addEventListener?.('webglcontextlost', () => lost.add(canvas));
      canvas.addEventListener?.('webglcontextrestored', () => lost.delete(canvas));
    }
    if (lost.has(canvas)) throw fail('capture-failed', 'The emulator lost its WebGL context.');
    if (!(canvas.width > 0 && canvas.height > 0)) throw fail('capture-failed', 'The emulator canvas has no size.');
    return canvas;
  }
  // Only after the game started: getContext then returns the engine's own
  // context instead of creating one.
  function drawingBuffer(canvas) {
    if (preserved === undefined && isStarted()) {
      try {
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        preserved = gl?.getContextAttributes?.()?.preserveDrawingBuffer === true;
      } catch { preserved = false; }
    }
    return preserved === undefined ? 'unknown' : preserved ? 'preserved' : 'not-preserved';
  }
  function read(canvas) {
    const [width, height] = nativeSize(platform());
    const aspect = width / height;
    let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
    // RetroArch centres the core's aspect ratio inside the canvas.
    if (sw / sh > aspect) { sw = sh * aspect; sx = (canvas.width - sw) / 2; }
    else { sh = sw / aspect; sy = (canvas.height - sh) / 2; }
    if (!work || work.width !== width || work.height !== height) work = createCanvas(width, height);
    const context = work.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!context) throw fail('capture-failed', 'No 2D canvas is available for captures.');
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    try { context.drawImage(canvas, sx, sy, sw, sh, 0, 0, width, height); }
    catch (error) { throw fail('capture-failed', `The emulator canvas could not be read (${error?.name ?? 'Error'}).`); }
    const data = context.getImageData(0, 0, width, height).data;
    if (data?.length !== width * height * 4) throw fail('capture-failed', 'The capture has an unexpected size.');
    return { width, height, data, sourceWidth: canvas.width, sourceHeight: canvas.height, pixelsPerDot: Math.round(sw / width * 100) / 100 };
  }
  function nearBlack(data) {
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] > NEAR_BLACK || data[index + 1] > NEAR_BLACK || data[index + 2] > NEAR_BLACK) return false;
    }
    return true;
  }
  function uniform(data) {
    for (let index = 4; index < data.length; index += 4) {
      if (data[index] !== data[0] || data[index + 1] !== data[1] || data[index + 2] !== data[2]) return false;
    }
    return true;
  }
  async function captureAndPause(block) {
    for (let attempt = 1; ; attempt++) {
      const frame = await onFrame(block, () => {
        if (isPaused() || !isStarted() || isExiting()) throw fail('interrupted', 'The game was paused or closed before the capture.');
        const canvas = canvasElement();
        const captured = read(canvas);
        const flat = uniform(captured.data);
        // A cleared buffer reads as (near) black. Give the engine up to two
        // more frames; a genuinely black screen is then accepted as such.
        const buffer = drawingBuffer(canvas);
        if (buffer !== 'preserved' && nearBlack(captured.data) && attempt <= BLANK_RETRIES) return null;
        pause(true);
        if (!isPaused()) throw fail('interrupted', 'The game could not be paused after the capture.');
        return { ...captured, uniform: flat, attempts: attempt, drawingBuffer: buffer };
      });
      if (frame) { pausedFrame = frame; return frame; }
    }
  }
  function resume() {
    pause(false);
    if (isPaused()) throw fail('interrupted', 'The game could not be resumed.');
  }
  function ready() {
    if (!enabled) throw fail('user-control', 'AI control is not enabled in the player.');
    if (!isStarted()) throw fail('not-ready', 'The game has not started yet.');
    if (isExiting()) throw fail('session-changed', 'The player is closing.');
  }

  async function observe(block) {
    ready();
    if (!isPaused()) return { frame: await captureAndPause(block), source: 'live-frame' };
    if (pausedFrame) return { frame: pausedFrame, source: 'pause-frame' };
    const canvas = canvasElement();
    if (drawingBuffer(canvas) === 'preserved') {
      const captured = read(canvas);
      pausedFrame = { ...captured, uniform: uniform(captured.data), attempts: 1, drawingBuffer: 'preserved' };
      return { frame: pausedFrame, source: 'preserved-buffer' };
    }
    // Paused before any synchronized capture: run one frame and stop on it.
    resume();
    return { frame: await captureAndPause(block), source: 'one-frame-advance' };
  }
  async function act(block, params) {
    ready();
    const { keys, holdMs, settleMs } = normalizeActParams(params, platform());
    resume();
    const pressedAt = now();
    block.keys = keys;
    for (const key of keys) input(key, true);
    let releasedAt;
    try {
      if (!keys.every(key => isHeld(key))) throw fail('interrupted', 'The emulator did not accept the buttons.');
      await sleep(block, holdMs);
      if (isPaused() || !keys.every(key => isHeld(key))) throw fail('interrupted', 'Another control paused the game or released the buttons.');
    } finally {
      releaseKeys(block);
      releasedAt = now();
    }
    if (settleMs) {
      await sleep(block, settleMs);
      if (isPaused()) throw fail('interrupted', 'Another control paused the game.');
    }
    const frame = await captureAndPause(block);
    return { frame, source: 'live-frame', timing: { holdMs: round(releasedAt - pressedAt), settleMs, captureAfterReleaseMs: round(now() - releasedAt) } };
  }
  async function wait(block, params) {
    ready();
    const { durationMs } = normalizeWaitParams(params);
    resume();
    const startedAt = now();
    await sleep(block, durationMs);
    if (isPaused()) throw fail('interrupted', 'Another control paused the game.');
    const frame = await captureAndPause(block);
    return { frame, source: 'live-frame', timing: { ranMs: round(now() - startedAt) } };
  }

  function describe(error) {
    if (error instanceof Aborted) return { code: error.code, message: ABORT_MESSAGES[error.code] ?? 'Stopped.' };
    if (error instanceof AiProtocolError) return { code: error.code, message: error.message };
    return { code: 'internal', message: `${error?.name ?? 'Error'}: ${String(error?.message ?? error).slice(0, 200)}` };
  }
  async function execute({ requestId, kind, params }) {
    if (!isRequestId(requestId)) return { ok: false, error: { code: 'invalid-argument', message: 'Invalid request id.' } };
    // A request id runs at most once, however often it is delivered.
    if (seen.has(requestId)) return { ok: false, error: { code: 'duplicate-request', message: 'This request was already received.' } };
    seen.add(requestId);
    if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value);
    // With AI mode off the player belongs to the user: refuse without touching it.
    if (!enabled) return { ok: false, error: { code: 'user-control', message: 'AI control is not enabled in the player.' } };
    if (entering) await entering;
    if (current) return { ok: false, error: { code: 'busy', message: 'Another AI command is running.' } };
    const block = control();
    current = block;
    try {
      const run = kind === 'observe' ? observe : kind === 'act' ? act : kind === 'wait' ? wait : null;
      if (!run) throw fail('invalid-argument', 'Unknown command.');
      const { frame, source, timing } = await run(block, params);
      return {
        ok: true, paused: isPaused(), timing,
        frame: { width: frame.width, height: frame.height, data: frame.data },
        capture: { source, attempts: frame.attempts, uniform: frame.uniform, drawingBuffer: frame.drawingBuffer,
          sourceWidth: frame.sourceWidth, sourceHeight: frame.sourceHeight, pixelsPerDot: frame.pixelsPerDot },
      };
    } catch (error) {
      return { ok: false, paused: isPaused(), error: describe(error) };
    } finally {
      releaseKeys(block);
      if (current === block) current = null;
      // Whatever happened, an AI command never leaves the game running. After a
      // take-over, setEnabled(false) already paused and the user owns the game.
      if (enabled) try { freeze(); } catch { /* The player reports its own control errors. */ }
    }
  }

  /** Highest priority: cancels the command, releases its buttons and pauses. */
  function stop(reason = 'stopped') {
    const block = current;
    block?.abort(reason);
    releaseKeys(block);
    // Idle AI mode is always paused; a stray stop never pauses the user's game.
    if (enabled || block) freeze();
    return { paused: isPaused() };
  }
  /** For the player's own teardown and visibility paths, which pause by themselves. */
  function interrupt(reason) {
    const block = current;
    block?.abort(reason);
    releaseKeys(block);
  }
  function setEnabled(value) {
    if (value === enabled) return;
    enabled = value;
    if (!enabled) { stop('user-control'); return; }
    // Entering AI control freezes the game on a synchronized frame, so the
    // first observation does not need to advance it.
    if (!isStarted() || isExiting() || isPaused()) return;
    const block = control();
    current = block;
    const pending = captureAndPause(block).catch(() => { if (enabled) try { freeze(); } catch { /* Reported by the player. */ } })
      .finally(() => { if (current === block) current = null; if (entering === pending) entering = null; });
    entering = pending;
  }

  return {
    execute, stop, interrupt, setEnabled,
    isEnabled: () => enabled,
    isBusy: () => current !== null,
    /** Any resume invalidates the frame captured with the last pause. */
    noteResumed() { pausedFrame = null; },
  };
}
