import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { AI_BUTTONS, AI_LIMITS, AiProtocolError, MAX_SIMULTANEOUS_BUTTONS } from '../../public/gameboy/ai-protocol.js';
import { framePng } from './png.mjs';

export const SERVER_INFO = Object.freeze({ name: 'monsite-gameboy', version: '0.1.0' });
export const INSTRUCTIONS = `Plays the Game Boy emulator open in the user's browser tab. Requires a vision model.
Loop: observe -> choose ONE short action -> act -> look at the returned image -> repeat.
- Call get_status first. If no tab is paired, give the user the pairing code it returns.
- Pass the session_id from the latest observe/get_status; a reload or game change makes it stale, then observe again.
- Prefer short presses (about 100 ms to press a button, about 270 ms per tile when walking in Pokémon) and wait for text or animations.
- The game is paused between commands. Timing is real time in milliseconds, not exact frames.
- Stop (call stop and report to the user) when the screen does not change after a few actions (see unchanged_streak), when you are lost, or when the action budget runs out. Never try to work around a refusal.
- Give each act/wait a fresh request_id; retrying with the same id returns the first result instead of pressing again.`;

const sessionId = { type: 'string', pattern: '^s-[0-9a-f]{16}$', description: 'session_id from the latest observe or get_status. Commands for an older session (reload, other game) are rejected.' };
const requestId = { type: 'string', pattern: '^[A-Za-z0-9._:-]{1,64}$', description: 'Optional idempotency key. Repeating a request_id never repeats the action: it returns the original result.' };
const scale = { type: 'integer', minimum: AI_LIMITS.scale.min, maximum: AI_LIMITS.scale.max, description: 'Whole-number pixel upscale of the native frame. Default: 3 for GB/GBC (480x432), 2 for GBA (480x320).' };

function json(value) {
  return JSON.stringify(value, null, 2);
}
export function errorResult(error, logger) {
  const known = error instanceof AiProtocolError;
  if (!known) logger?.error(`Unexpected tool failure: ${error?.stack ?? error}`);
  const body = known
    ? { code: error.code, message: error.message, ...(error.hint ? { hint: error.hint } : {}) }
    : { code: 'internal', message: 'Unexpected server error; see the MCP server log.' };
  return { isError: true, content: [{ type: 'text', text: json({ error: body }) }] };
}
/** A real MCP image block plus metadata that identifies the session and capture. */
export function frameResult({ frame, scale: factor, meta }) {
  const { png, width, height } = framePng(frame, factor);
  return {
    content: [
      { type: 'text', text: json({ ...meta, image: { mime_type: 'image/png', width, height, scale: factor, native: [frame.width, frame.height], bytes: png.length } }) },
      { type: 'image', data: png.toString('base64'), mimeType: 'image/png' },
    ],
  };
}

export function createGameBoyMcpServer({ bridge, logger }) {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  const guarded = handler => async (...args) => {
    try { return await handler(...args); } catch (error) { return errorResult(error, logger); }
  };
  server.registerTool('get_status', {
    title: 'Game Boy status',
    description: 'Bridge, browser pairing, game, session, pause and control state. Says clearly when no emulator is connected and returns a single-use pairing code to give the user. Does not touch the game.',
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  }, guarded(async () => ({ content: [{ type: 'text', text: json(bridge.status()) }] })));
  server.registerTool('observe', {
    title: 'Observe the screen',
    description: 'Returns the current game screen as a PNG image plus session/capture metadata. Usually does not advance the game; if the game was paused without a synchronized capture it runs exactly one frame to get one (capture_source tells which).',
    inputSchema: fromJsonSchema({ type: 'object', additionalProperties: false, properties: { scale } }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, guarded(async (args, ctx) => frameResult(await bridge.observe(args, { signal: ctx.mcpReq.signal }))));
  server.registerTool('act', {
    title: 'Press buttons',
    description: `Resumes the game, holds the buttons together for duration_ms, releases them, lets the game run settle_ms (default ${AI_LIMITS.settleMs.default}), pauses and returns the resulting screen. Buttons: ${Object.keys(AI_BUTTONS).join(', ')} (l/r only on GBA); at most ${MAX_SIMULTANEOUS_BUTTONS} together, never opposite directions. Times are approximate real-time milliseconds, not exact frames. Buttons are always released, even on errors.`,
    inputSchema: fromJsonSchema({
      type: 'object', additionalProperties: false, required: ['session_id', 'buttons', 'duration_ms'],
      properties: {
        session_id: sessionId,
        buttons: { type: 'array', minItems: 1, maxItems: MAX_SIMULTANEOUS_BUTTONS, uniqueItems: true, items: { type: 'string', enum: Object.keys(AI_BUTTONS) }, description: 'Buttons held together, e.g. ["a"] or ["b", "left"].' },
        duration_ms: { type: 'integer', minimum: AI_LIMITS.holdMs.min, maximum: AI_LIMITS.holdMs.max, description: 'How long to hold the buttons.' },
        settle_ms: { type: 'integer', minimum: AI_LIMITS.settleMs.min, maximum: AI_LIMITS.settleMs.max, description: 'Extra running time after releasing, before the capture.' },
        request_id: requestId, scale,
      },
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, guarded(async (args, ctx) => frameResult(await bridge.act(args, { signal: ctx.mcpReq.signal }))));
  server.registerTool('wait', {
    title: 'Let the game run',
    description: `Resumes the game without pressing anything for duration_ms (${AI_LIMITS.waitMs.min}-${AI_LIMITS.waitMs.max}), pauses and returns the resulting screen. Use it for text, animations and transitions.`,
    inputSchema: fromJsonSchema({
      type: 'object', additionalProperties: false, required: ['session_id', 'duration_ms'],
      properties: {
        session_id: sessionId,
        duration_ms: { type: 'integer', minimum: AI_LIMITS.waitMs.min, maximum: AI_LIMITS.waitMs.max, description: 'Running time before pausing.' },
        request_id: requestId, scale,
      },
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, guarded(async (args, ctx) => frameResult(await bridge.wait(args, { signal: ctx.mcpReq.signal }))));
  server.registerTool('stop', {
    title: 'Stop',
    description: 'Highest priority. Cancels the running command, empties the queue, releases every button and pauses. Safe to call repeatedly; it never presses anything.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, guarded(async () => ({ content: [{ type: 'text', text: json(await bridge.stop()) }] })));
  return server;
}
