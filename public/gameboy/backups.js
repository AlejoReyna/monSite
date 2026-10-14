// Pure, shared validators used by both the host and its isolated iframe.
export const MAX_SRAM_BYTES = 1024 * 1024;
export const MAX_STATE_BYTES = 8 * 1024 * 1024;
export const GAME_BACKUP_LIMIT = 2 * 1024 * 1024;
export const STATE_BACKUP_LIMIT = 12 * 1024 * 1024;
export const CORE_RUNTIMES = Object.freeze({ gambatte: '4.2.3:gambatte:2.0.2', mgba: '4.2.3:mgba:2.0.2' });

export function encodedSize(value) {
  if (typeof value !== 'string' || value.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return -1;
  return value.length / 4 * 3 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
}
function identity(value, expected) {
  if (!value || typeof value !== 'object' || !/^[a-f0-9]{64}$/.test(value.rom) ||
      !['gb', 'gbc', 'gba'].includes(value.platform) ||
      value.core !== (value.platform === 'gba' ? 'mgba' : 'gambatte') ||
      typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) throw new Error('Invalid backup identity');
  if (expected && (value.rom !== expected.sha256 || value.core !== expected.core || value.platform !== expected.platform)) throw new Error('Backup belongs to another ROM');
}
export function parseGameBackup(text, expected) {
  if (typeof text !== 'string' || text.length > GAME_BACKUP_LIMIT) throw new Error('Backup too large');
  const value = JSON.parse(text);
  identity(value, expected);
  const size = encodedSize(value.sram);
  if (value.format !== 'monsite-game-cartridge' || value.version !== 1 || size < 0 || size > MAX_SRAM_BYTES ||
      (value.rtc !== undefined && (encodedSize(value.rtc) <= 0 || encodedSize(value.rtc) > 4096)) ||
      (value.partial !== undefined && value.partial !== true)) throw new Error('Invalid cartridge backup');
  return { format: value.format, version: 1, rom: value.rom, core: value.core, platform: value.platform,
    savedAt: value.savedAt, sram: value.sram, ...(value.rtc !== undefined ? { rtc: value.rtc } : {}),
    ...(value.partial === true ? { partial: true } : {}) };
}
export function parseStateBackup(text, expected) {
  if (typeof text !== 'string' || text.length > STATE_BACKUP_LIMIT) throw new Error('State too large');
  const value = JSON.parse(text);
  identity(value, expected);
  const size = encodedSize(value.state);
  if (value.format !== 'monsite-game-state' || value.version !== 1 ||
      value.runtime !== CORE_RUNTIMES[value.core] || size <= 0 || size > MAX_STATE_BYTES) throw new Error('Incompatible state');
  return { format: value.format, version: 1, rom: value.rom, core: value.core, platform: value.platform,
    savedAt: value.savedAt, runtime: value.runtime, state: value.state };
}
