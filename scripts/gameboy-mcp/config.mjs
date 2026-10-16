import path from 'node:path';
import { AI_DEFAULT_PORT } from '../../public/gameboy/ai-protocol.js';

export const DEFAULT_ORIGINS = Object.freeze(['http://localhost:3000', 'http://127.0.0.1:3000']);
export const LOG_LEVELS = Object.freeze(['error', 'warn', 'info', 'debug']);
export const USAGE = `Usage: node scripts/gameboy-mcp.mjs [options]

Local MCP server (stdio) plus a 127.0.0.1 WebSocket bridge for the Game Boy page.
Started by an MCP client; stdout is reserved for MCP. Logs go to stderr.

Options (environment variable in brackets):
  --port <1024-65535>       Bridge port, default ${AI_DEFAULT_PORT} [GAMEBOY_MCP_PORT]
  --allow-origin <origin>   Page origin allowed to connect; repeat for several. Replaces
                            the default list (${DEFAULT_ORIGINS.join(', ')})
                            [GAMEBOY_MCP_ALLOWED_ORIGINS, comma separated]
  --backup-dir <path>       Absolute folder for initial backups, default
                            ~/.monsite-gameboy-mcp/backups [GAMEBOY_MCP_BACKUP_DIR]
  --max-actions <1-10000>   act/wait commands per control grant, default 200 [GAMEBOY_MCP_MAX_ACTIONS]
  --log-level <level>       ${LOG_LEVELS.join(' | ')}, default info [GAMEBOY_MCP_LOG_LEVEL]
  --help                    Show this help on stderr and exit`;

export class ConfigError extends Error {}

function origin(value) {
  let url;
  try { url = new URL(value); } catch { throw new ConfigError(`Invalid origin: ${value}`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value) {
    throw new ConfigError(`Origins are scheme://host[:port] with no path or trailing slash: ${value}`);
  }
  return value;
}
function integer(value, min, max, name) {
  const number = Number(value);
  if (!/^\d+$/.test(String(value)) || number < min || number > max) throw new ConfigError(`${name} must be an integer between ${min} and ${max}.`);
  return number;
}

/** Command-line options override environment variables. */
export function parseConfig(argv, env, { home }) {
  const config = {
    help: false, port: AI_DEFAULT_PORT, allowedOrigins: [...DEFAULT_ORIGINS],
    backupDir: path.join(home, '.monsite-gameboy-mcp', 'backups'), maxActions: 200, logLevel: 'info',
  };
  const set = {
    port: value => { config.port = integer(value, 1024, 65535, 'port'); },
    origins: values => {
      const list = values.map(item => item.trim()).filter(Boolean).map(origin);
      if (!list.length) throw new ConfigError('At least one allowed origin is required.');
      config.allowedOrigins = [...new Set(list)];
    },
    backupDir: value => {
      const expanded = value.startsWith('~/') ? path.join(home, value.slice(2)) : value;
      if (!path.isAbsolute(expanded)) throw new ConfigError('backup-dir must be an absolute path (or start with ~/).');
      config.backupDir = path.normalize(expanded);
    },
    maxActions: value => { config.maxActions = integer(value, 1, 10000, 'max-actions'); },
    logLevel: value => {
      if (!LOG_LEVELS.includes(value)) throw new ConfigError(`log-level must be one of ${LOG_LEVELS.join(', ')}.`);
      config.logLevel = value;
    },
  };
  if (env.GAMEBOY_MCP_PORT) set.port(env.GAMEBOY_MCP_PORT);
  if (env.GAMEBOY_MCP_ALLOWED_ORIGINS) set.origins(env.GAMEBOY_MCP_ALLOWED_ORIGINS.split(','));
  if (env.GAMEBOY_MCP_BACKUP_DIR) set.backupDir(env.GAMEBOY_MCP_BACKUP_DIR);
  if (env.GAMEBOY_MCP_MAX_ACTIONS) set.maxActions(env.GAMEBOY_MCP_MAX_ACTIONS);
  if (env.GAMEBOY_MCP_LOG_LEVEL) set.logLevel(env.GAMEBOY_MCP_LOG_LEVEL);
  const origins = [];
  for (let index = 0; index < argv.length; index++) {
    const [flag, inline] = argv[index].split(/=(.*)/s, 2);
    const value = () => {
      const next = inline ?? argv[++index];
      if (next === undefined) throw new ConfigError(`${flag} needs a value.`);
      return next;
    };
    if (flag === '--help' || flag === '-h') config.help = true;
    else if (flag === '--port') set.port(value());
    else if (flag === '--allow-origin') origins.push(value());
    else if (flag === '--backup-dir') set.backupDir(value());
    else if (flag === '--max-actions') set.maxActions(value());
    else if (flag === '--log-level') set.logLevel(value());
    else throw new ConfigError(`Unknown option: ${flag}`);
  }
  if (origins.length) set.origins(origins);
  return config;
}

/** stderr only: stdout carries the MCP JSON-RPC stream. */
export function createLogger(stream, level = 'info') {
  const threshold = LOG_LEVELS.indexOf(level);
  const write = (name, message) => {
    if (LOG_LEVELS.indexOf(name) <= threshold) stream.write(`[gameboy-mcp] ${new Date().toISOString()} ${name}: ${message}\n`);
  };
  return Object.fromEntries(LOG_LEVELS.map(name => [name, message => write(name, message)]));
}

export const REMOTE_ORIGINS = Object.freeze(['https://gba.alexisrs.dev', 'https://alexisrs.dev', 'https://www.alexisrs.dev']);
export const REMOTE_USAGE = `Usage: node scripts/gameboy-mcp-remote.mjs [options]

Public multi-agent server: MCP over Streamable HTTP at https://<public-host>/mcp and the
browser bridge at wss://<public-host>/gameboy-ai. Run it behind an HTTPS proxy (Caddy).

Options (environment variable in brackets):
  --port <1024-65535>      Local HTTP port for the proxy, default 8787 [GAMEBOY_MCP_REMOTE_PORT]
  --listen-host <address>  127.0.0.1 (default) or 0.0.0.0 inside a container whose port is
                           not published; only the proxy can reach it
  --trust-proxy            Use X-Forwarded-For from any peer (unpublished Docker network)
  --public-host <host>     Public host name, default mcp.alexisrs.dev [GAMEBOY_MCP_PUBLIC_HOST]
  --allow-origin <origin>  Page origin allowed to connect; repeat for several. Replaces the
                           default list (${REMOTE_ORIGINS.join(', ')})
                           [GAMEBOY_MCP_ALLOWED_ORIGINS, comma separated]
  --max-sessions <1-500>   Agent sessions at once, default 20 [GAMEBOY_MCP_MAX_SESSIONS]
  --idle-minutes <1-1440>  Close an idle agent session after this, default 30 [GAMEBOY_MCP_IDLE_MINUTES]
  --max-actions <1-10000>  act/wait commands per control grant, default 200 [GAMEBOY_MCP_MAX_ACTIONS]
  --log-level <level>      ${LOG_LEVELS.join(' | ')}, default info [GAMEBOY_MCP_LOG_LEVEL]
  --help                   Show this help and exit`;

export function parseRemoteConfig(argv, env) {
  const config = { help: false, port: 8787, listenHost: '127.0.0.1', trustProxy: false, publicHost: 'mcp.alexisrs.dev', allowedOrigins: [...REMOTE_ORIGINS], maxSessions: 20, idleMinutes: 30, maxActions: 200, logLevel: 'info' };
  const set = {
    port: value => { config.port = integer(value, 1024, 65535, 'port'); },
    publicHost: value => {
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value)) throw new ConfigError(`Invalid public host: ${value}`);
      config.publicHost = value;
    },
    origins: values => {
      const list = values.map(item => item.trim()).filter(Boolean).map(origin);
      if (!list.length) throw new ConfigError('At least one allowed origin is required.');
      config.allowedOrigins = [...new Set(list)];
    },
    maxSessions: value => { config.maxSessions = integer(value, 1, 500, 'max-sessions'); },
    idleMinutes: value => { config.idleMinutes = integer(value, 1, 1440, 'idle-minutes'); },
    maxActions: value => { config.maxActions = integer(value, 1, 10000, 'max-actions'); },
    logLevel: value => { if (!LOG_LEVELS.includes(value)) throw new ConfigError(`log-level must be one of ${LOG_LEVELS.join(', ')}.`); config.logLevel = value; },
  };
  for (const [name, key] of [['GAMEBOY_MCP_REMOTE_PORT', 'port'], ['GAMEBOY_MCP_PUBLIC_HOST', 'publicHost'], ['GAMEBOY_MCP_MAX_SESSIONS', 'maxSessions'],
    ['GAMEBOY_MCP_IDLE_MINUTES', 'idleMinutes'], ['GAMEBOY_MCP_MAX_ACTIONS', 'maxActions'], ['GAMEBOY_MCP_LOG_LEVEL', 'logLevel']]) if (env[name]) set[key](env[name]);
  if (env.GAMEBOY_MCP_ALLOWED_ORIGINS) set.origins(env.GAMEBOY_MCP_ALLOWED_ORIGINS.split(','));
  const origins = [];
  const flags = { '--port': 'port', '--public-host': 'publicHost', '--max-sessions': 'maxSessions', '--idle-minutes': 'idleMinutes', '--max-actions': 'maxActions', '--log-level': 'logLevel' };
  for (let index = 0; index < argv.length; index++) {
    const [flag, inline] = argv[index].split(/=(.*)/s, 2);
    const value = () => { const next = inline ?? argv[++index]; if (next === undefined) throw new ConfigError(`${flag} needs a value.`); return next; };
    if (flag === '--help' || flag === '-h') config.help = true;
    else if (flag === '--trust-proxy') config.trustProxy = true;
    else if (flag === '--listen-host') {
      const host = value();
      if (!['127.0.0.1', '0.0.0.0', '::'].includes(host)) throw new ConfigError('listen-host must be 127.0.0.1, 0.0.0.0 or ::.');
      config.listenHost = host;
    } else if (flag === '--allow-origin') origins.push(value());
    else if (Object.hasOwn(flags, flag)) set[flags[flag]](value());
    else throw new ConfigError(`Unknown option: ${flag}`);
  }
  if (origins.length) set.origins(origins);
  return config;
}
