import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GAME_BACKUP_LIMIT, parseGameBackup } from '../../public/gameboy/backups.js';
import { AiProtocolError } from '../../public/gameboy/ai-protocol.js';

/* Initial backups taken before an AI session's first command. They are the
 * same JSON the player exports, so "Importar respaldo" restores them, and each
 * one is written exactly once (never overwritten by later saves). */
export const GOLD_GAME_ID = 'pokemon-gold';
export const GOLD_ROM_SHA256 = 'fb0016d27b1e5374e1ec9fcad60e6628d8646103b5313ca683417f52b97e7e4e';
const GOLD_BACKUP_LIMIT = 100_000;
const GAME_FOLDER = /^(pokemon-gold|rom-[a-f0-9]{64})$/;
const GRANT_ID = /^g-[0-9a-f]{16}$/;

const invalid = message => new AiProtocolError('invalid-argument', message);
function decodedSize(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4) return -1;
  return value.length / 4 * 3 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
}

/** Same rules as parseGoldBackup in src/lib/gameboy/save.ts (the tests compare both). */
export function validateGoldBackup(value) {
  if (!value || value.format !== 'monsite-gold-cartridge' || value.version !== 1 || value.rom !== GOLD_ROM_SHA256 ||
      typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt)) || decodedSize(value.sram) !== 32768 ||
      (value.rtc !== undefined && decodedSize(value.rtc) !== 8)) throw invalid('Invalid Pokémon Gold cartridge backup.');
  return value;
}

/** Returns whether the backup lacks verified clock data. */
export function validateInitialBackup(text, game) {
  if (typeof text !== 'string' || !text.length || text.length > GAME_BACKUP_LIMIT) throw invalid('The backup is empty or too large.');
  let value;
  try { value = JSON.parse(text); } catch { throw invalid('The backup is not valid JSON.'); }
  if (value?.format === 'monsite-gold-cartridge') {
    if (game.id !== GOLD_GAME_ID || game.sha256 !== GOLD_ROM_SHA256 || text.length > GOLD_BACKUP_LIMIT) throw invalid('The backup does not belong to this game.');
    validateGoldBackup(value);
    return { partial: value.rtc === undefined };
  }
  if (value?.format === 'monsite-game-cartridge') {
    try {
      parseGameBackup(text, { sha256: game.sha256, platform: game.platform, core: game.platform === 'gba' ? 'mgba' : 'gambatte' });
    } catch { throw invalid('The backup does not belong to this game or is damaged.'); }
    return { partial: value.partial === true };
  }
  throw invalid('Unknown backup format.');
}

export function createBackupStore({ directory, clock = () => new Date() }) {
  if (!path.isAbsolute(directory)) throw new Error('The backup directory must be absolute.');
  return {
    directory,
    async saveInitial({ game, grantId, text }) {
      if (!GRANT_ID.test(grantId)) throw invalid('Invalid grant id.');
      const folder = path.join(directory, GAME_FOLDER.test(game.id) ? game.id : 'other');
      await mkdir(folder, { recursive: true, mode: 0o700 });
      const file = path.join(folder, `${clock().toISOString().replace(/[:.]/g, '-')}-${grantId}.json`);
      // 'wx' fails instead of replacing an existing file.
      await writeFile(file, text, { flag: 'wx', mode: 0o600 });
      return { file, bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') };
    },
  };
}
