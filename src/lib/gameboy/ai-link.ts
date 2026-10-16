import { AI_PATH, AI_PROTOCOL, AI_PROTOCOL_VERSION, AI_SUBPROTOCOL, encodeBase64, isRequestId, nativeSize } from "../../../public/gameboy/ai-protocol.js";
import type { GamePlatform } from "./library";

/* Connects the active emulator session to the local MCP bridge. Nothing here
 * connects on its own: the user enters a pairing code, then explicitly grants
 * control, which first stores an initial backup through the bridge. Commands
 * reach the iframe only through the existing authenticated postMessage channel. */
export const PAIRING_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PAIRING_CODE_LENGTH = 8;
const MAX_MESSAGE_CHARS = 64 * 1024;
const MAX_BACKUP_CHARS = 3 * 1024 * 1024;
const HANDSHAKE_MS = 8000;
const BACKUP_MS = 20000;
const STOP_MS = 2500;
const SEEN_LIMIT = 256;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
/** The public multi-agent bridge (scripts/gameboy-mcp-remote.mjs behind HTTPS). */
export const REMOTE_BRIDGE_URL = "wss://mcp.alexisrs.dev/gameboy-ai";
const REMOTE_URL = /^wss:\/\/[a-z0-9.-]+(?::\d{2,5})?\/gameboy-ai$/;

export type AiLinkError = "invalid-code-format" | "invalid-port" | "unreachable" | "invalid-code" | "already-paired"
  | "handshake-timeout" | "protocol" | "closed" | "backup-failed" | "backup-timeout";
export type AiControl = "user" | "pending" | "ai";
export type AiLinkState = {
  status: "off" | "connecting" | "paired" | "error";
  control: AiControl;
  error: AiLinkError | null;
  hidden: boolean;
  backup: { state: "none" | "saving" | "saved" | "failed"; file?: string; partial?: boolean; message?: string };
  lastAction: { kind: string; detail: string; ok: boolean; code?: string; at: number } | null;
  actions: { used: number; limit: number } | null;
};
export const INITIAL_AI_STATE: AiLinkState = {
  status: "off", control: "user", error: null, hidden: false, backup: { state: "none" }, lastAction: null, actions: null,
};
export type AiSession = {
  hostSession: string;
  game: { id: string; title: string; platform: GamePlatform; sha256: string };
  ready: boolean;
  paused: boolean;
};
type SocketLike = Pick<WebSocket, "readyState" | "send" | "close" | "onopen" | "onmessage" | "onerror" | "onclose">;
type PlayerMessage = { type: string; [key: string]: unknown };
type Outcome = { ok: true; [key: string]: unknown } | { ok: false; error: { code: string; message: string }; paused?: boolean };
export type AiLinkOptions = {
  createSocket: (url: string, protocols: string[]) => SocketLike;
  postToPlayer: (message: PlayerMessage) => void;
  onChange: (state: AiLinkState) => void;
  /** Hex string from `bytes` random bytes. */
  randomId: (bytes: number) => string;
  setTimeout: (callback: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
  now: () => number;
  /** Remote bridges store nothing for the user: the page keeps the initial
   * backup itself (e.g. a download) and returns its file name. May throw. */
  keepBackupLocally?: (backup: string, game: AiSession["game"]) => string;
};

const CLOSE_ERRORS: Record<number, AiLinkError> = { 4001: "invalid-code", 4002: "already-paired", 4003: "protocol", 4004: "handshake-timeout" };
const BRIDGE_ERRORS: Record<string, AiLinkError> = { "invalid-code": "invalid-code", "already-paired": "already-paired", "handshake-timeout": "handshake-timeout" };
const BUTTON_NAME = /^[a-z]{1,6}$/;

export const normalizePairingCode = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Loopback pages talk to a local MCP process; every other page to the public bridge. */
export function isLoopbackPage(location: { hostname?: string }) {
  return Boolean(location.hostname && LOOPBACK_HOSTS.has(location.hostname));
}

const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
function sanitizeParams(kind: unknown, params: unknown) {
  const value = (params && typeof params === "object" ? params : {}) as Record<string, unknown>;
  if (kind === "observe") return {};
  if (kind === "wait") return { durationMs: number(value.durationMs) };
  if (kind !== "act" || !Array.isArray(value.buttons) || value.buttons.length > 4 ||
      !value.buttons.every(button => typeof button === "string" && BUTTON_NAME.test(button))) return null;
  return { buttons: value.buttons as string[], holdMs: number(value.holdMs), settleMs: number(value.settleMs) };
}
function describeCommand(kind: string, params: Record<string, unknown>) {
  if (kind === "act") return `${(params.buttons as string[]).join("+")} · ${params.holdMs} ms`;
  if (kind === "wait") return `${params.durationMs} ms`;
  return "";
}
function pick(value: unknown, keys: string[]) {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return Object.fromEntries(keys.filter(key => ["string", "number", "boolean"].includes(typeof source[key]))
    .map(key => [key, typeof source[key] === "string" ? (source[key] as string).slice(0, 40) : source[key]]));
}

export function createAiLink(options: AiLinkOptions) {
  const { createSocket, postToPlayer, onChange, randomId, setTimeout, clearTimeout, now, keepBackupLocally } = options;
  let remote = false;
  let localBackup: string | null = null;
  let state = INITIAL_AI_STATE;
  let socket: SocketLike | null = null;
  let opened = false, closingByUser = false, disposed = false;
  let failure: AiLinkError | null = null;
  let handshake: number | null = null;
  let session: (AiSession & { id: string }) | null = null;
  let relay: { requestId: string; kind: string; detail: string; timer: number } | null = null;
  let stopping: { requestId: string; timer: number } | null = null;
  let grant: { id: string; stage: "player" | "bridge"; timer: number } | null = null;
  let grantedId: string | null = null;
  const seen = new Set<string>();

  const update = (patch: Partial<AiLinkState>) => { state = { ...state, ...patch }; if (!disposed) onChange(state); };
  const transmit = (message: object) => { if (socket && opened && socket.readyState === 1) socket.send(JSON.stringify(message)); };
  const paired = () => state.status === "paired";
  function sendState() {
    if (!paired()) return;
    transmit({
      type: "state", hidden: state.hidden,
      control: state.control === "ai" ? "ai" : "user", grantId: state.control === "ai" ? grantedId : null,
      session: session && { id: session.id, game: session.game, ready: session.ready, paused: session.paused },
    });
  }
  function settleRelay(outcome: Outcome) {
    if (!relay) return;
    const { requestId, kind, detail, timer } = relay;
    clearTimeout(timer);
    relay = null;
    transmit({ type: "result", requestId, ...outcome });
    update({ lastAction: { kind, detail, ok: outcome.ok, ...(outcome.ok ? {} : { code: outcome.error.code }), at: now() } });
  }
  const rejected = (code: string, message: string): Outcome => ({ ok: false, error: { code, message } });
  function stopPlayer(tag: string) { postToPlayer({ type: "ai-stop", requestId: tag.slice(0, 64) }); }

  function onCommand(message: Record<string, unknown>) {
    const { requestId, sessionId, kind } = message;
    if (!isRequestId(requestId)) return;
    // Never forward a request id twice, even if the bridge repeats it.
    if (seen.has(requestId)) { transmit({ type: "result", requestId, ...rejected("duplicate-request", "This request was already received.") }); return; }
    seen.add(requestId);
    if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value as string);
    const budget = message.budget as { used?: unknown; limit?: unknown } | undefined;
    if (budget && number(budget.used) !== undefined && number(budget.limit) !== undefined) update({ actions: { used: budget.used as number, limit: budget.limit as number } });
    const reject = (code: string, text: string) => {
      transmit({ type: "result", requestId, ...rejected(code, text) });
      update({ lastAction: { kind: String(kind).slice(0, 10), detail: "", ok: false, code, at: now() } });
    };
    if (!session || sessionId !== session.id) return reject("stale-session", "The command belongs to another game session.");
    if (!session.ready) return reject("not-ready", "The game is not running.");
    if (state.control !== "ai") return reject("user-control", "The user has control of the game.");
    if (state.hidden) return reject("page-hidden", "The game page is hidden.");
    if (relay) return reject("busy", "Another command is running.");
    const params = sanitizeParams(kind, message.params);
    if (!params) return reject("invalid-argument", "Malformed command.");
    const limit = Math.min(Math.max(number(message.timeoutMs) ?? 0, 1000), 30000) + 1500;
    const timer = setTimeout(() => {
      stopPlayer(`timeout-${requestId}`);
      settleRelay(rejected("timeout", "The player did not answer in time; it was stopped and paused."));
    }, limit);
    relay = { requestId, kind: kind as string, detail: describeCommand(kind as string, params), timer };
    postToPlayer({ type: "ai-command", requestId, kind: kind as string, params });
  }
  function onStop(requestId: string) {
    if (relay) settleRelay(rejected("stopped", "Stopped by the agent."));
    // The user's own game is never paused by an agent that does not control it.
    if (!session || state.control !== "ai") { transmit({ type: "stopped", requestId, paused: session ? session.paused : null }); return; }
    if (stopping) { clearTimeout(stopping.timer); transmit({ type: "stopped", requestId: stopping.requestId, paused: null }); }
    const timer = setTimeout(() => {
      if (stopping?.requestId !== requestId) return;
      stopping = null;
      transmit({ type: "stopped", requestId, paused: null });
    }, STOP_MS);
    stopping = { requestId, timer };
    stopPlayer(requestId);
  }
  function failGrant(error: AiLinkError, message?: string) {
    if (!grant) return;
    clearTimeout(grant.timer);
    grant = null;
    update({ control: "user", error, backup: { state: "failed", ...(message ? { message: message.slice(0, 200) } : {}) } });
    sendState();
  }
  function onBackupSaved(message: Record<string, unknown>) {
    if (!grant || grant.stage !== "bridge" || message.grantId !== grant.id) return;
    clearTimeout(grant.timer);
    grantedId = grant.id;
    grant = null;
    const file = typeof message.file === "string" && message.file ? message.file : localBackup ?? "";
    update({ control: "ai", error: null, backup: { state: "saved", file: file.slice(-200), partial: message.partial === true } });
    postToPlayer({ type: "ai-mode", value: true });
    sendState();
  }
  function protocolError() {
    failure = "protocol";
    socket?.close(4003, "protocol");
  }
  function receive(raw: unknown) {
    if (typeof raw !== "string" || raw.length > MAX_MESSAGE_CHARS) { protocolError(); return; }
    let message: Record<string, unknown>;
    try { message = JSON.parse(raw); } catch { protocolError(); return; }
    if (!message || typeof message !== "object" || typeof message.type !== "string") { protocolError(); return; }
    if (message.type === "welcome" && state.status === "connecting") {
      if (handshake !== null) clearTimeout(handshake);
      handshake = null;
      update({ status: "paired", error: null });
      sendState();
    } else if (message.type === "error") failure = BRIDGE_ERRORS[String(message.code)] ?? "protocol";
    else if (!paired()) return;
    else if (message.type === "command") onCommand(message);
    else if (message.type === "cancel" && relay && message.requestId === relay.requestId) {
      stopPlayer(`cancel-${relay.requestId}`);
      settleRelay(rejected("cancelled", "Cancelled by the agent."));
    } else if (message.type === "stop" && isRequestId(message.requestId)) onStop(message.requestId);
    else if (message.type === "backup-saved") onBackupSaved(message);
    else if (message.type === "backup-failed" && grant?.stage === "bridge" && message.grantId === grant.id) {
      failGrant("backup-failed", typeof message.message === "string" ? message.message : undefined);
    }
  }
  function closed(code: number) {
    if (handshake !== null) clearTimeout(handshake);
    handshake = null;
    const wasPaired = state.status === "paired";
    socket = null; opened = false;
    if (relay) { clearTimeout(relay.timer); relay = null; }
    if (stopping) { clearTimeout(stopping.timer); stopping = null; }
    if (grant) { clearTimeout(grant.timer); grant = null; }
    grantedId = null;
    // A lost bridge cancels the AI: the player releases its buttons and pauses.
    if (state.control !== "user") postToPlayer({ type: "ai-mode", value: false });
    const error = closingByUser ? null : failure ?? (wasPaired ? "closed" : CLOSE_ERRORS[code] ?? "unreachable");
    failure = null;
    update({ status: error ? "error" : "off", error, control: "user", ...(state.backup.state === "saving" ? { backup: { state: "none" } } : {}) });
  }

  return {
    get state() { return state; },
    get sessionId() { return session?.id ?? null; },
    /** endpoint: a local port (ws://127.0.0.1) or the public wss:// bridge URL. */
    connect(codeInput: string, endpoint: number | string) {
      if (disposed || state.status === "connecting" || state.status === "paired") return false;
      const code = normalizePairingCode(codeInput);
      if (code.length !== PAIRING_CODE_LENGTH || [...code].some(char => !PAIRING_ALPHABET.includes(char))) {
        update({ status: "error", error: "invalid-code-format" }); return false;
      }
      const port = endpoint;
      if (typeof port === "number" && (!Number.isInteger(port) || port < 1024 || port > 65535)) { update({ status: "error", error: "invalid-port" }); return false; }
      if (typeof endpoint === "string" && !REMOTE_URL.test(endpoint)) { update({ status: "error", error: "invalid-port" }); return false; }
      remote = typeof endpoint === "string";
      const url = typeof endpoint === "string" ? endpoint : `ws://127.0.0.1:${endpoint}${AI_PATH}`;
      let next: SocketLike;
      // The code travels only in the first message, never in the URL.
      try { next = createSocket(url, [AI_SUBPROTOCOL]); }
      catch { update({ status: "error", error: "unreachable" }); return false; }
      socket = next; opened = false; closingByUser = false; failure = null;
      update({ status: "connecting", error: null });
      handshake = setTimeout(() => {
        if (socket !== next || state.status !== "connecting") return;
        failure = "handshake-timeout";
        next.close(4004, "timeout");
      }, HANDSHAKE_MS);
      next.onopen = () => {
        if (socket !== next) return;
        opened = true;
        next.send(JSON.stringify({ type: "hello", protocol: AI_PROTOCOL, version: AI_PROTOCOL_VERSION, code }));
      };
      next.onmessage = event => { if (socket === next) receive(event.data); };
      next.onerror = () => { /* onclose follows with the outcome. */ };
      next.onclose = event => { if (socket === next) closed(event.code); };
      return true;
    },
    disconnect() {
      if (!socket) { if (state.status === "error") update({ status: "off", error: null }); return; }
      closingByUser = true;
      socket.close(1000, "user");
    },
    setSession(next: AiSession | null) {
      if ((next?.hostSession ?? null) !== (session?.hostSession ?? null)) {
        // A reload or another game invalidates everything addressed to the old one.
        if (relay) settleRelay(rejected("session-changed", "The game session changed."));
        if (stopping) { clearTimeout(stopping.timer); transmit({ type: "stopped", requestId: stopping.requestId, paused: null }); stopping = null; }
        if (grant) { clearTimeout(grant.timer); grant = null; }
        grantedId = null;
        session = next ? { ...next, id: `s-${randomId(8)}` } : null;
        if (state.control !== "user" || state.backup.state !== "none") update({ control: "user", backup: { state: "none" } });
      } else if (next && session) {
        session = { ...session, ...next, id: session.id };
        if (!next.ready && relay) settleRelay(rejected("not-ready", "The game stopped running."));
      }
      sendState();
    },
    setHidden(hidden: boolean) {
      if (state.hidden === hidden) return;
      update({ hidden });
      if (hidden && relay) {
        stopPlayer(`hidden-${relay.requestId}`);
        settleRelay(rejected("page-hidden", "The game page was hidden; the game was paused."));
      }
      sendState();
    },
    /** Explicit activation: an initial backup must be stored before the first command. */
    requestControl() {
      if (!paired() || !session?.ready || state.control !== "user" || state.hidden) return false;
      const id = `g-${randomId(8)}`;
      grant = { id, stage: "player", timer: setTimeout(() => failGrant("backup-timeout"), BACKUP_MS) };
      update({ control: "pending", error: null, backup: { state: "saving" } });
      postToPlayer({ type: "ai-backup" });
      return true;
    },
    /** Cancels the AI at once; the player releases buttons and pauses. */
    takeControl() {
      const hadControl = state.control !== "user";
      if (grant) { clearTimeout(grant.timer); grant = null; }
      if (relay) settleRelay(rejected("user-control", "The user took control."));
      grantedId = null;
      if (hadControl) postToPlayer({ type: "ai-mode", value: false });
      update({ control: "user", ...(state.backup.state === "saving" ? { backup: { state: "none" } } : {}) });
      sendState();
    },
    handlePlayerMessage(data: PlayerMessage) {
      if (data.type === "ai-result" && relay && data.requestId === relay.requestId) {
        if (data.ok !== true || !session) {
          const error = (data.error && typeof data.error === "object" ? data.error : {}) as Record<string, unknown>;
          settleRelay({ ok: false, paused: data.paused === true,
            error: { code: typeof error.code === "string" ? error.code.slice(0, 40) : "internal", message: typeof error.message === "string" ? error.message.slice(0, 300) : "The player failed." } });
          return;
        }
        const frame = data.frame as { width?: unknown; height?: unknown; data?: unknown } | undefined;
        const [width, height] = nativeSize(session.game.platform);
        const pixels = frame?.data;
        if (!frame || frame.width !== width || frame.height !== height || !ArrayBuffer.isView(pixels) || pixels.byteLength !== width * height * 4) {
          settleRelay(rejected("capture-failed", "The player returned an invalid frame."));
          return;
        }
        settleRelay({
          ok: true, paused: data.paused === true,
          frame: { width, height, encoding: "rgba8", data: encodeBase64(pixels) },
          capture: pick(data.capture, ["source", "attempts", "uniform", "drawingBuffer", "sourceWidth", "sourceHeight", "pixelsPerDot"]),
          timing: pick(data.timing, ["holdMs", "settleMs", "captureAfterReleaseMs", "ranMs"]),
        });
      } else if (data.type === "ai-stopped" && stopping && data.requestId === stopping.requestId) {
        clearTimeout(stopping.timer);
        const { requestId } = stopping;
        stopping = null;
        transmit({ type: "stopped", requestId, paused: data.paused === true });
      } else if (data.type === "ai-backup" && grant?.stage === "player" && session) {
        if (typeof data.backup !== "string" || data.backup.length > MAX_BACKUP_CHARS) { failGrant("backup-failed"); return; }
        localBackup = null;
        if (remote) {
          if (!keepBackupLocally) { failGrant("backup-failed", "This page cannot keep a backup."); return; }
          try { localBackup = keepBackupLocally(data.backup, session.game); }
          catch (error) { failGrant("backup-failed", error instanceof Error ? error.message : undefined); return; }
        }
        grant.stage = "bridge";
        transmit({ type: "backup", grantId: grant.id, sessionId: session.id, backup: data.backup, partial: data.partial === true });
      } else if (data.type === "ai-backup-failed" && grant?.stage === "player") {
        failGrant("backup-failed", typeof data.message === "string" ? data.message : undefined);
      }
    },
    dispose() {
      if (disposed) return;
      if (socket) { closingByUser = true; socket.close(1000, "closed"); }
      disposed = true;
      for (const timer of [handshake, relay?.timer, stopping?.timer, grant?.timer]) if (timer != null) clearTimeout(timer);
      relay = stopping = grant = null; socket = null;
    },
  };
}
export type AiLink = ReturnType<typeof createAiLink>;
