#!/usr/bin/env node
// Public multi-agent Game Boy MCP server (Streamable HTTP + browser WebSocket bridge).
// Run behind an HTTPS proxy; see docs/gameboy-ai-mcp.md ("Servidor público").
import { ConfigError, REMOTE_USAGE, createLogger, parseRemoteConfig } from './gameboy-mcp/config.mjs';
import { createRemoteHub, createRemoteServer } from './gameboy-mcp/remote.mjs';

let config;
try { config = parseRemoteConfig(process.argv.slice(2), process.env); }
catch (error) {
  process.stderr.write(`${error instanceof ConfigError ? error.message : error}\n\n${REMOTE_USAGE}\n`);
  process.exit(2);
}
if (config.help) { process.stdout.write(`${REMOTE_USAGE}\n`); process.exit(0); }

const logger = createLogger(process.stderr, config.logLevel);
const hub = createRemoteHub({ logger, publicHost: config.publicHost, allowedOrigins: config.allowedOrigins,
  maxSessions: config.maxSessions, idleMs: config.idleMinutes * 60_000, maxActions: config.maxActions });
const server = createRemoteServer({ hub, port: config.port, host: config.listenHost, trustProxy: config.trustProxy,
  publicHost: config.publicHost, allowedOrigins: config.allowedOrigins, logger });

let closing = false;
async function shutdown(reason, code = 0) {
  if (closing) return;
  closing = true;
  logger.info(`Shutting down (${reason}).`);
  setTimeout(() => process.exit(code), 5000).unref();
  try { await server.close(); } catch (error) { logger.warn(`Shutdown: ${error.message}`); }
  process.exit(code);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => void shutdown(signal));
process.on('uncaughtException', error => { logger.error(`Uncaught exception: ${error.stack ?? error}`); void shutdown('uncaught exception', 1); });
process.on('unhandledRejection', error => { logger.error(`Unhandled rejection: ${error?.stack ?? error}`); void shutdown('unhandled rejection', 1); });

const url = await server.listen();
logger.info(`Listening on ${url} for https://${config.publicHost}/mcp and wss://${config.publicHost}/gameboy-ai; origins: ${config.allowedOrigins.join(', ')}.`);
