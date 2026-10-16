import os from 'node:os';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createBackupStore } from './backups.mjs';
import { createBridge } from './bridge.mjs';
import { ConfigError, USAGE, createLogger, parseConfig } from './config.mjs';
import { createBridgeServer } from './server.mjs';
import { createGameBoyMcpServer } from './tools.mjs';

/** Wires configuration, the bridge, its loopback server and MCP over stdio.
 * Streams, exit, signals and the server factory are injectable for tests. */
export async function main({
  argv, env, home = os.homedir(), stdin, stdout, stderr, exit, signals = process, createServer = createBridgeServer,
}) {
  let config;
  try { config = parseConfig(argv, env, { home }); }
  catch (error) {
    stderr.write(`${error instanceof ConfigError ? error.message : error}\n\n${USAGE}\n`);
    exit(2);
    return null;
  }
  if (config.help) { stderr.write(`${USAGE}\n`); exit(0); return null; }

  const logger = createLogger(stderr, config.logLevel);
  const bridge = createBridge({ backups: createBackupStore({ directory: config.backupDir }), logger, maxActions: config.maxActions });
  bridge.setListening({ allowedOrigins: config.allowedOrigins });
  const mcp = createGameBoyMcpServer({ bridge, logger });
  const bridgeServer = createServer({ bridge, port: config.port, allowedOrigins: config.allowedOrigins, logger });

  let closing = false;
  async function shutdown(reason, code = 0) {
    if (closing) return;
    closing = true;
    logger.info(`Shutting down (${reason}).`);
    const force = setTimeout(() => exit(code), 2000);
    force.unref();
    try {
      bridge.close();
      await bridgeServer.close();
      await mcp.close();
    } catch (error) { logger.warn(`Shutdown: ${error.message}`); }
    clearTimeout(force);
    exit(code);
  }
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) signals.on(signal, () => void shutdown(signal));
  mcp.server.onclose = () => void shutdown('the MCP client closed stdio');
  await mcp.connect(new StdioServerTransport(stdin, stdout));
  try {
    const url = await bridgeServer.listen();
    bridge.setListening({ state: 'listening', url, error: null });
    logger.info(`Bridge listening on ${url}; allowed origins: ${config.allowedOrigins.join(', ')}.`);
  } catch (error) {
    const message = error.code === 'EADDRINUSE' ? `port ${config.port} is already in use` : `${error.code ?? 'error'}: ${error.message}`;
    bridge.setListening({ state: 'failed', error: message });
    logger.error(`Bridge unavailable: ${message}. MCP tools stay up and report it.`);
  }
  return { bridge, shutdown };
}
