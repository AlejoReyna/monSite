// Shared by the local MCP bridge (Node), the host page and the isolated player.
// Pure data and validation: no DOM, timers, network or emulator access.
export const AI_PROTOCOL = 'monsite-gameboy-ai';
export const AI_PROTOCOL_VERSION = 1;
export const AI_SUBPROTOCOL = 'monsite-gameboy-ai.v1';
export const AI_DEFAULT_PORT = 41887;
export const AI_PATH = '/gameboy-ai';

/** Agent-facing button names and the player's keyboard keys (see bridge.js). */
export const AI_BUTTONS = Object.freeze({
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  a: 'x', b: 'z', start: 'Enter', select: 'Shift', l: 'a', r: 's',
});
export const GBA_ONLY_BUTTONS = Object.freeze(['l', 'r']);
// Three is enough for every ordinary combination and rules out A+B+Start+Select,
// the soft-reset chord that discards unsaved progress.
export const MAX_SIMULTANEOUS_BUTTONS = 3;
const OPPOSITES = [['up', 'down'], ['left', 'right']];

export const AI_LIMITS = Object.freeze({
  holdMs: Object.freeze({ min: 50, max: 2000 }),
  settleMs: Object.freeze({ min: 0, max: 2000, default: 250 }),
  waitMs: Object.freeze({ min: 50, max: 10000 }),
  scale: Object.freeze({ min: 1, max: 4 }),
  /** Resume, capture, encoding and transport time allowed beyond the requested durations. */
  overheadMs: 5000,
});
export const NATIVE_SIZES = Object.freeze({ gb: Object.freeze([160, 144]), gbc: Object.freeze([160, 144]), gba: Object.freeze([240, 160]) });
export const DEFAULT_SCALES = Object.freeze({ gb: 3, gbc: 3, gba: 2 });
const REQUEST_ID = /^[A-Za-z0-9._:-]{1,64}$/;

export class AiProtocolError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AiProtocolError';
    this.code = code;
  }
}

const invalid = message => new AiProtocolError('invalid-argument', message);
export const isRequestId = value => typeof value === 'string' && REQUEST_ID.test(value);

export function nativeSize(platform) {
  if (!Object.hasOwn(NATIVE_SIZES, platform)) throw new AiProtocolError('invalid-argument', 'Unknown platform.');
  return NATIVE_SIZES[platform];
}

export function validateInteger(value, { min, max }, name) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw invalid(`${name} must be an integer number of milliseconds between ${min} and ${max}.`);
  }
  return value;
}

/** Without a platform only the shape is checked; L/R need a GBA session. */
export function validateButtons(value, platform) {
  if (!Array.isArray(value) || value.length === 0) throw invalid('buttons must be a non-empty array.');
  if (value.length > MAX_SIMULTANEOUS_BUTTONS) {
    throw invalid(`At most ${MAX_SIMULTANEOUS_BUTTONS} buttons can be held together.`);
  }
  const buttons = [];
  for (const name of value) {
    if (typeof name !== 'string' || !Object.hasOwn(AI_BUTTONS, name)) {
      throw invalid(`Unknown button. Allowed: ${Object.keys(AI_BUTTONS).join(', ')}.`);
    }
    if (buttons.includes(name)) throw invalid(`Button "${name}" is repeated.`);
    if (platform !== undefined && platform !== 'gba' && GBA_ONLY_BUTTONS.includes(name)) {
      throw invalid(`Button "${name}" only exists on Game Boy Advance games.`);
    }
    buttons.push(name);
  }
  for (const [first, second] of OPPOSITES) {
    if (buttons.includes(first) && buttons.includes(second)) {
      throw invalid(`"${first}" and "${second}" are opposite directions and cannot be held together.`);
    }
  }
  return buttons;
}

export function normalizeActParams(params, platform) {
  const { buttons, holdMs, settleMs = AI_LIMITS.settleMs.default } = params ?? {};
  const names = validateButtons(buttons, platform);
  return {
    buttons: names,
    keys: names.map(name => AI_BUTTONS[name]),
    holdMs: validateInteger(holdMs, AI_LIMITS.holdMs, 'duration_ms'),
    settleMs: validateInteger(settleMs, AI_LIMITS.settleMs, 'settle_ms'),
  };
}

export function normalizeWaitParams(params) {
  return { durationMs: validateInteger(params?.durationMs, AI_LIMITS.waitMs, 'duration_ms') };
}

/** Upper bound for one command, from request to result. */
export function commandTimeoutMs(kind, params) {
  if (kind === 'act') return params.holdMs + params.settleMs + AI_LIMITS.overheadMs;
  if (kind === 'wait') return params.durationMs + AI_LIMITS.overheadMs;
  return AI_LIMITS.overheadMs;
}

/** Native-resolution RGBA frames only: a capture is never a scaled screenshot. */
export function validateFrame(frame, platform) {
  const [width, height] = nativeSize(platform);
  if (!frame || frame.width !== width || frame.height !== height || frame.data?.length !== width * height * 4) {
    throw new AiProtocolError('capture-failed', `Expected a ${width}x${height} RGBA frame.`);
  }
  return frame;
}

export function encodeBase64(bytes) {
  const data = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let binary = '';
  for (let offset = 0; offset < data.length; offset += 8192) binary += String.fromCharCode(...data.subarray(offset, offset + 8192));
  return btoa(binary);
}
