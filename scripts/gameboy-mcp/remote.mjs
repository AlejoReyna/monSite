import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { Readable } from 'node:stream';
import { WebSocketServer } from 'ws';
import { WebStandardStreamableHTTPServerTransport, isInitializeRequest, readRequestBody } from '@modelcontextprotocol/server';
import { AI_PATH, AI_SUBPROTOCOL } from '../../public/gameboy/ai-protocol.js';
import { CLOSE_CODES, createBridge } from './bridge.mjs';
import { MAX_PAYLOAD, validateUpgrade } from './server.mjs';
import { createGameBoyMcpServer } from './tools.mjs';

/* Public, multi-agent deployment behind an HTTPS proxy. Every MCP session
 * (one agent) owns one bridge; a browser tab reaches the agent whose pairing
 * code its user typed. The code is the authorization: no agent controls a
 * tab without its owner. Limits are per client IP as reported by the proxy. */
const MAX_BODY = 1024 * 1024;
const HELLO_TIMEOUT_MS = 10_000;
const WINDOW_MS = 10 * 60_000;
const STATUS_TEXT = { 400: 'Bad Request', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 426: 'Upgrade Required', 429: 'Too Many Requests' };

function jsonRpcError(status, code, message) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), { status, headers: { 'content-type': 'application/json' } });
}
/** Fixed-window counter per key; prunes itself. */
export function createRateLimiter({ limit, windowMs = WINDOW_MS, now = Date.now }) {
  const hits = new Map();
  return {
    allow(key) {
      const time = now();
      if (hits.size > 10_000) for (const [entry, value] of hits) if (value.until <= time) hits.delete(entry);
      const entry = hits.get(key);
      if (!entry || entry.until <= time) { hits.set(key, { count: 1, until: time + windowMs }); return true; }
      entry.count++;
      return entry.count <= limit;
    },
    blocked(key) { const entry = hits.get(key); return Boolean(entry && entry.until > now() && entry.count >= limit); },
  };
}

export function createRemoteHub({
  logger, publicHost, allowedOrigins, maxSessions = 20, idleMs = 30 * 60_000, maxActions = 200,
  timers = globalThis, now = Date.now, newSessionId = randomUUID, sessionsPerIp = 30, failedPairingsPerIp = 10,
}) {
  const sessions = new Map();
  const bridgeUrl = `wss://${publicHost}${AI_PATH}`;
  // The browser downloads its own initial backup; the server only validates it.
  const backups = { saveInitial: async () => ({ file: null }) };
  const newSessions = createRateLimiter({ limit: sessionsPerIp, now });
  const failedPairings = createRateLimiter({ limit: failedPairingsPerIp, now });

  function touch(entry) {
    timers.clearTimeout(entry.timer);
    entry.timer = timers.setTimeout(() => void close(entry.id, 'idle'), idleMs);
  }
  async function close(id, reason) {
    const entry = sessions.get(id);
    if (!entry) return;
    sessions.delete(id);
    timers.clearTimeout(entry.timer);
    entry.bridge.close();
    logger.info(`Agent session closed (${reason}); ${sessions.size} active.`);
    try { await entry.server.close(); } catch { /* Already closed. */ }
  }

  async function handleMcp(request, ip = 'unknown') {
    const id = request.headers.get('mcp-session-id');
    if (id) {
      const entry = sessions.get(id);
      if (!entry) return jsonRpcError(404, -32001, 'Session not found. Reconnect to start a new session.');
      touch(entry);
      return entry.transport.handleRequest(request);
    }
    if (request.method !== 'POST') return jsonRpcError(400, -32000, 'Missing Mcp-Session-Id header.');
    if (!newSessions.allow(ip)) return jsonRpcError(429, -32000, 'Too many new sessions from this address.');
    if (sessions.size >= maxSessions) return jsonRpcError(503, -32000, 'The server is full. Try again later.');
    const read = await readRequestBody(request, MAX_BODY);
    if (read.tooLarge) return jsonRpcError(413, -32000, 'Request too large.');
    let body;
    try { body = JSON.parse(read.text); } catch { return jsonRpcError(400, -32700, 'Parse error.'); }
    if (!isInitializeRequest(body)) return jsonRpcError(400, -32600, 'The first request of a session must be initialize.');
    const bridge = createBridge({ backups, logger, maxActions, timers, now, gamePage: `https://gba.alexisrs.dev` });
    bridge.setListening({ state: 'listening', url: bridgeUrl, error: null, allowedOrigins });
    const entry = { id: null, bridge, server: createGameBoyMcpServer({ bridge, logger }), timer: null, transport: null };
    entry.transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: newSessionId,
      onsessioninitialized: sessionId => {
        entry.id = sessionId;
        sessions.set(sessionId, entry);
        touch(entry);
        logger.info(`Agent session opened; ${sessions.size} active.`);
      },
      onsessionclosed: sessionId => void close(sessionId, 'client'),
      enableDnsRebindingProtection: true, allowedHosts: [publicHost], maxRequestBodySize: MAX_BODY,
    });
    entry.server.server.onclose = () => { if (entry.id) void close(entry.id, 'transport'); };
    await entry.server.connect(entry.transport);
    return entry.transport.handleRequest(request, { parsedBody: body });
  }

  /** A browser socket: its first message must be a hello whose code an agent issued. */
  function attachBrowser(conn, ip = 'unknown') {
    let handle = null;
    const refuse = (code, closeCode) => { conn.send(JSON.stringify({ type: 'error', code })); conn.close(closeCode, code); };
    const timer = timers.setTimeout(() => { if (!handle) refuse('handshake-timeout', CLOSE_CODES.timeout); }, HELLO_TIMEOUT_MS);
    return {
      receive(text) {
        if (handle) { handle.receive(text); return; }
        let message = null;
        try { message = JSON.parse(text); } catch { /* Refused below. */ }
        if (message?.type !== 'hello') { refuse('protocol', CLOSE_CODES.protocol); return; }
        if (failedPairings.blocked(ip)) { refuse('invalid-code', CLOSE_CODES.invalidCode); return; }
        const entry = [...sessions.values()].find(item => item.bridge.matchesPairingCode(message.code));
        if (!entry) {
          failedPairings.allow(ip);
          logger.warn('Pairing refused: no agent session issued that code.');
          refuse('invalid-code', CLOSE_CODES.invalidCode);
          return;
        }
        timers.clearTimeout(timer);
        handle = entry.bridge.attach(conn);
        handle.receive(text);
      },
      closed() { timers.clearTimeout(timer); handle?.closed(); },
    };
  }

  return {
    handleMcp, attachBrowser, close,
    get size() { return sessions.size; },
    async closeAll() { await Promise.all([...sessions.keys()].map(id => close(id, 'shutdown'))); },
  };
}

/** The proxy (Caddy) is the only direct peer: trust its X-Forwarded-For when the
 * peer is loopback, or always with trustProxy (an unpublished Docker network). */
export function clientIp(request, trustProxy = false) {
  const direct = request.socket?.remoteAddress ?? '';
  const loopback = direct === '127.0.0.1' || direct === '::1' || direct === '::ffff:127.0.0.1';
  const forwarded = String(request.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return (loopback || trustProxy) && forwarded ? forwarded : direct || 'unknown';
}
export function toWebRequest(request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  const body = ['GET', 'HEAD', 'DELETE'].includes(request.method) ? undefined : Readable.toWeb(request);
  return new Request(`http://${request.headers.host ?? 'localhost'}${request.url}`, { method: request.method, headers, body, duplex: 'half' });
}
async function sendWebResponse(response, res) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  res.on('close', () => { reader.cancel().catch(() => {}); });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally { res.end(); }
}

export function createRemoteServer({ hub, port, host = '127.0.0.1', publicHost, allowedOrigins, logger, trustProxy = false }) {
  const wss = new WebSocketServer({
    noServer: true, maxPayload: MAX_PAYLOAD, perMessageDeflate: false,
    handleProtocols: protocols => protocols.has(AI_SUBPROTOCOL) ? AI_SUBPROTOCOL : false,
  });
  const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://local');
    try {
      if (pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end('ok'); return; }
      if (pathname !== '/mcp') { res.writeHead(404, { 'content-length': '0' }); res.end(); return; }
      await sendWebResponse(await hub.handleMcp(toWebRequest(req), clientIp(req, trustProxy)), res);
    } catch (error) {
      logger.error(`HTTP handler failed: ${error?.stack ?? error}`);
      if (!res.headersSent) { res.writeHead(500, { 'content-length': '0' }); }
      res.end();
    }
  });
  server.headersTimeout = 10_000;
  server.requestTimeout = 0; // MCP responses may stream (SSE).
  server.on('upgrade', (request, socket, head) => {
    const verdict = validateUpgrade(request, { allowedOrigins, allowedHosts: [publicHost] });
    if (!verdict.ok) {
      logger.warn(`Refused a WebSocket upgrade (${verdict.reason}; origin ${String(request.headers.origin ?? 'none').slice(0, 80)}).`);
      socket.end(`HTTP/1.1 ${verdict.status} ${STATUS_TEXT[verdict.status]}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
      return;
    }
    const ip = clientIp(request, trustProxy);
    wss.handleUpgrade(request, socket, head, ws => {
      let alive = true;
      ws.on('pong', () => { alive = true; });
      ws.heartbeat = () => { if (!alive) { ws.terminate(); return; } alive = false; ws.ping(); };
      const handle = hub.attachBrowser({
        origin: verdict.origin,
        send: text => { if (ws.readyState === ws.OPEN) ws.send(text); },
        close: (code, reason) => ws.close(code, reason),
      }, ip);
      ws.on('message', (data, isBinary) => { if (isBinary) { ws.close(4003, 'protocol'); return; } handle.receive(data.toString('utf8')); });
      ws.on('close', () => handle.closed());
      ws.on('error', error => logger.warn(`WebSocket error: ${error.message}`));
    });
  });
  const heartbeat = setInterval(() => { for (const ws of wss.clients) ws.heartbeat?.(); }, 15_000);
  heartbeat.unref();
  return {
    server,
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen({ port, host }, () => { server.off('error', reject); resolve(`http://${host}:${port}`); });
      });
    },
    async close() {
      clearInterval(heartbeat);
      await hub.closeAll();
      for (const ws of wss.clients) ws.terminate();
      wss.close();
      await new Promise(resolve => { if (!server.listening) { resolve(); return; } server.close(() => resolve()); server.closeAllConnections?.(); });
    },
  };
}
