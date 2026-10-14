export const ROM_ACCEPT = ".gb,.gbc,.dmg";
export const MAX_ROM_BYTES = 8 * 1024 * 1024;
export type RomFile = { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };

export class RomFileError extends Error {
  constructor(public readonly reason: "format" | "size" | "read") {
    super(reason);
  }
}

/** Read only GB/GBC cartridge images. No logo/checksum restriction: patched
 * ROMs and homebrew may deliberately differ from Nintendo's original header. */
export async function identifyLocalRom(file: RomFile) {
  if (!/\.(gb|gbc|dmg)$/i.test(file.name)) throw new RomFileError("format");
  if (file.size < 16 * 1024 || file.size > MAX_ROM_BYTES) throw new RomFileError("size");
  let bytes: ArrayBuffer;
  try { bytes = await file.arrayBuffer(); }
  catch { throw new RomFileError("read"); }
  if (bytes.byteLength !== file.size) throw new RomFileError("read");
  // Content identity keeps renamed files on the same save and different ROMs
  // on separate native save paths, even when their filenames are identical.
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { id: `rom-${sha256}`, title: file.name.replace(/\.(gb|gbc|dmg)$/i, "") || file.name };
}
