export const GOLD_SAVE_KEY = "monsite.gold.cartridge.v1";
export const GOLD_ROM_SHA256 = "fb0016d27b1e5374e1ec9fcad60e6628d8646103b5313ca683417f52b97e7e4e";
export type GoldBackup = {
  format: "monsite-gold-cartridge";
  version: 1;
  rom: string;
  savedAt: string;
  sram: string;
  rtc?: string;
};

function decodedSize(value: unknown): number {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4) return -1;
  return value.length / 4 * 3 - (value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0);
}

/** Cartridge SRAM is exactly 32 KiB for this ROM; RTC is a separate Libretro file. */
export function parseGoldBackup(text: string): GoldBackup {
  if (text.length > 100_000) throw new Error("Backup too large");
  const value = JSON.parse(text) as Partial<GoldBackup> | null;
  if (!value || value.format !== "monsite-gold-cartridge" || value.version !== 1 ||
      value.rom !== GOLD_ROM_SHA256 || typeof value.savedAt !== "string" ||
      !Number.isFinite(Date.parse(value.savedAt)) || decodedSize(value.sram) !== 32768 ||
      (value.rtc !== undefined && decodedSize(value.rtc) !== 8)) {
    throw new Error("Invalid Pokémon Gold cartridge backup");
  }
  return value as GoldBackup;
}

export const GAME_KEYS: Record<string, string> = {
  ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
  KeyX: "x", KeyZ: "z", Enter: "Enter", ShiftLeft: "Shift", ShiftRight: "Shift",
};
