export const GAME_ACCEPT = ".pbp,.bin";
export const MAX_GAME_BYTES = 768 * 1024 * 1024;
export const HASH_BLOCK_BYTES = 1024 * 1024;
export type GameExtension = "pbp" | "bin";
export type Ps1Assets = { gameUrl: string; biosUrl: string; biosName: string; id: string; extension: GameExtension };

/** Optional hosted files. Keep null to offer local selection only.
 * id: a fixed 64-character lowercase hexadecimal content identity.
 * Changing game contents must also change id; files need CORS when cross-origin.
 */
export const HOSTED_CRASH: Ps1Assets | null = null;

export function validateGame(file: Pick<File, "name" | "size">): GameExtension {
  const extension = file.name.match(/\.(pbp|bin)$/i)?.[1].toLowerCase() as GameExtension | undefined;
  if (!extension || file.size < 512 * 1024 || file.size > MAX_GAME_BYTES) throw new Error("game-file");
  return extension;
}

export function validateBios(file: Pick<File, "name" | "size">) {
  if (!/^(scph(?:1001|101|5500|5501|5502|7001)|PSXONPSP660)\.bin$/i.test(file.name) || file.size !== 512 * 1024) throw new Error("bios-file");
}

/** Content identity v1: SHA-256 chain over 1 MiB blocks. This is deliberately
 * not the whole-file SHA-256. It reads all bytes with bounded working memory,
 * remains stable across renames, and can be cancelled between block reads.
 */
export async function identifyGame(file: Blob, signal: AbortSignal, onProgress: (value: number) => void) {
  let chain = new Uint8Array(32);
  for (let offset = 0; offset < file.size; offset += HASH_BLOCK_BYTES) {
    signal.throwIfAborted();
    const bytes = new Uint8Array(await file.slice(offset, offset + HASH_BLOCK_BYTES).arrayBuffer());
    signal.throwIfAborted();
    const block = new Uint8Array(chain.length + bytes.length);
    block.set(chain); block.set(bytes, chain.length);
    chain = new Uint8Array(await crypto.subtle.digest("SHA-256", block));
    signal.throwIfAborted();
    onProgress(Math.min(1, (offset + bytes.length) / file.size));
  }
  return Array.from(chain, byte => byte.toString(16).padStart(2, "0")).join("");
}
