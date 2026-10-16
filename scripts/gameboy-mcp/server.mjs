import http from 'node:http';
import { WebSocketServer } from 'ws';
import { AI_PATH, AI_SUBPROTOCOL } from '../../public/gameboy/ai-protocol.js';

/* Loopback WebSocket endpoint for the paired browser tab. Plain HTTP requests
 * get an empty 404; upgrades are checked before the handshake. */
export const MAX_PAYLOAD = 4 * 1024 * 1024;
const STATUS_TEXT = { 400: 'Bad Request', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 426: 'Upgrade Required' };
const HEARTBEAT_MS = 15_000;

/** Pure check of an upgrade request: exact path, expected Host (DNS rebinding), allow-listed Origin and subprotocol.
 * Locally the Host is the loopback port; behind the public proxy it is the public host name. */
export function validateUpgrade({ method, url, headers }, { port, allowedOrigins, allowedHosts = [`127.0.0.1:${port}`, `localhost:${port}`] }) {
  const refuse = (status, reason) => ({ ok: false, status, reason });
  if (method !== 'GET') return refuse(405, 'method');
  // No query strings: nothing secret ever travels in the URL.
  if (url !== AI_PATH) return refuse(404, 'path');
  if (String(headers.upgrade ?? '').toLowerCase() !== 'websocket') return refuse(426, 'upgrade');
  const host = String(headers.host ?? '').toLowerCase();
  if (!allowedHosts.includes(host)) return refuse(403, 'host');
  const { origin } = headers;
  if (typeof origin !== 'string' || !allowedOrigins.includes(origin)) return refuse(403, 'origin');
  const protocols = String(headers['sec-websocket-protocol'] ?? '').split(',').map(value => value.trim());
  if (!protocols.includes(AI_SUBPROTOCOL)) return refuse(400, 'subprotocol');
  return { ok: true, origin };
}

export function createBridgeServer({ bridge, port, allowedOrigins, logger, host = '127.0.0.1' }) {
  const wss = new WebSocketServer({
    noServer: true, maxPayload: MAX_PAYLOAD, perMessageDeflate: false,
    handleProtocols: protocols => protocols.has(AI_SUBPROTOCOL) ? AI_SUBPROTOCOL : false,
  });
  const server = http.createServer((request, response) => {
    response.writeHead(404, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
    response.end();
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 5000;
  server.maxHeadersCount = 64;
  server.on('upgrade', (request, socket, head) => {
    const verdict = validateUpgrade(request, { port, allowedOrigins });
    if (!verdict.ok) {
      logger.warn(`Refused a WebSocket upgrade (${verdict.reason}; origin ${String(request.headers.origin ?? 'none').slice(0, 80)}).`);
      socket.end(`HTTP/1.1 ${verdict.status} ${STATUS_TEXT[verdict.status]}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
      return;
    }
    wss.handleUpgrade(request, socket, head, ws => {
      let alive = true;
      ws.on('pong', () => { alive = true; });
      ws.heartbeat = () => {
        if (!alive) { ws.terminate(); return; }
        alive = false;
        ws.ping();
      };
      const handle = bridge.attach({
        origin: verdict.origin,
        send: text => { if (ws.readyState === ws.OPEN) ws.send(text); },
        close: (code, reason) => ws.close(code, reason),
      });
      ws.on('message', (data, isBinary) => {
        if (isBinary) { ws.close(4003, 'protocol'); return; }
        handle.receive(data.toString('utf8'));
      });
      ws.on('close', () => handle.closed());
      ws.on('error', error => logger.warn(`WebSocket error: ${error.message}`));
    });
  });
  const heartbeat = setInterval(() => { for (const ws of wss.clients) ws.heartbeat?.(); }, HEARTBEAT_MS);
  heartbeat.unref();
  return {
    server, wss,
    /** Binds 127.0.0.1 only. Resolves with the URL, or rejects (e.g. EADDRINUSE). */
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen({ port, host, exclusive: true }, () => {
          server.off('error', reject);
          resolve(`ws://${host}:${port}${AI_PATH}`);
        });
      });
    },
    close() {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.terminate();
      wss.close();
      return new Promise(resolve => { if (!server.listening) { resolve(); return; } server.close(() => resolve()); });
    },
  };
}
