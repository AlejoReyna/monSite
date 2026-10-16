#!/usr/bin/env node
// Local MCP server (stdio) and loopback WebSocket bridge for the Game Boy page.
// Launched by an MCP client. stdout carries JSON-RPC only; every log goes to stderr.
import { main } from './gameboy-mcp/main.mjs';

// A stray console.log from any module would corrupt the MCP stream.
for (const method of ['log', 'info', 'debug', 'trace', 'warn']) {
  console[method] = (...values) => process.stderr.write(`${values.map(String).join(' ')}\n`);
}

let app = null;
function fatal(label, error) {
  process.stderr.write(`[gameboy-mcp] fatal ${label}: ${error?.stack ?? error}\n`);
  if (app) void app.shutdown(label, 1);
  else process.exit(1);
}
process.on('uncaughtException', error => fatal('uncaught exception', error));
process.on('unhandledRejection', error => fatal('unhandled rejection', error));

app = await main({
  argv: process.argv.slice(2), env: process.env,
  stdin: process.stdin, stdout: process.stdout, stderr: process.stderr,
  exit: code => process.exit(code),
});
