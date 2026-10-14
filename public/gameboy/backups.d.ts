import type { GameCore, GamePlatform } from "../../src/lib/gameboy/library";
export type BackupIdentity = { sha256: string; core: GameCore; platform: GamePlatform };
export type GameBackup = {
  format: "monsite-game-cartridge"; version: 1; rom: string; core: GameCore; platform: GamePlatform;
  savedAt: string; sram: string; rtc?: string; partial?: true;
};
export type StateBackup = {
  format: "monsite-game-state"; version: 1; rom: string; core: GameCore; platform: GamePlatform;
  savedAt: string; runtime: string; state: string;
};
export const MAX_SRAM_BYTES: number;
export const MAX_STATE_BYTES: number;
export const GAME_BACKUP_LIMIT: number;
export const STATE_BACKUP_LIMIT: number;
export const CORE_RUNTIMES: Readonly<Record<GameCore, string>>;
export function encodedSize(value: unknown): number;
export function parseGameBackup(text: string, expected?: BackupIdentity): GameBackup;
export function parseStateBackup(text: string, expected?: BackupIdentity): StateBackup;
