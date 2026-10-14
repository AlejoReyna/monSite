import { coreForPlatform, type GamePlatform } from "./library";

export const ROM_ACCEPT = ".gb,.gbc,.dmg,.gba";
export const MAX_ROM_BYTES = 8 * 1024 * 1024;
export const MAX_GBA_ROM_BYTES = 32 * 1024 * 1024;
export type RomFile = { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };

export class RomFileError extends Error {
  constructor(public readonly reason: "format" | "size" | "read") {
    super(reason);
  }
}

/** No logo/checksum restriction: patched
 * ROMs and homebrew may deliberately differ from Nintendo's original header. */
export async function identifyLocalRom(file: RomFile) {
  const extension = file.name.match(/\.(gb|gbc|dmg|gba)$/i)?.[1].toLowerCase();
  if (!extension) throw new RomFileError("format");
  let platform: GamePlatform = extension === "gba" ? "gba" : "gb";
  if (file.size < 16 * 1024 || file.size > (platform === "gba" ? MAX_GBA_ROM_BYTES : MAX_ROM_BYTES)) throw new RomFileError("size");
  let bytes: ArrayBuffer;
  try { bytes = await file.arrayBuffer(); }
  catch { throw new RomFileError("read"); }
  if (bytes.byteLength !== file.size) throw new RomFileError("read");
  // GB and GBC share a core. Read the cartridge's color flag so changing .gb
  // to .gbc does not change the backup identity of the same content.
  if (platform !== "gba" && (new Uint8Array(bytes)[0x143] & 0x80)) platform = "gbc";
  // Content identity keeps renamed files on the same save and different ROMs
  // on separate native save paths, even when their filenames are identical.
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { id: `rom-${sha256}`, sha256, platform, core: coreForPlatform(platform),
    saveMode: "cartridge" as const, source: "local" as const,
    title: file.name.replace(/\.(gb|gbc|dmg|gba)$/i, "") || file.name };
}
