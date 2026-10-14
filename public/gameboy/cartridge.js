import { parseGameBackup, MAX_SRAM_BYTES } from './backups.js';
/* IDBFS stores ordinary IndexedDB records. Pinned to the Emscripten backend
 * shipped with the vendored core (DB v21, FILE_DATA, timestamp index).
 * This adapter never accesses the WASM heap, Module or EJS private methods. */
export const SAVE_KEY = 'monsite.gold.cartridge.v1';
export const ROM = 'fb0016d27b1e5374e1ec9fcad60e6628d8646103b5313ca683417f52b97e7e4e';
const CORE_FOLDERS = { gambatte: 'Gambatte', mgba: 'mGBA' };
const DOOM_ID = 'rom-f5f4f0aac6c1884ef0b771dacb21a5d3f2152a066157f46abb39769c7f95deab';
function nativeDirectory(core) {
  if (!Object.hasOwn(CORE_FOLDERS, core)) throw new Error('Invalid core');
  return `/data/saves/${CORE_FOLDERS[core]}`;
}
const PATH = `${nativeDirectory('gambatte')}/pokemon-gold.`;
export function encode(bytes) {
  // IDBFS persists Int8Array views. Base64 consumes unsigned bytes, including
  // when the view starts inside a larger buffer; avoid copying the save.
  const data = ArrayBuffer.isView(bytes) ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) : new Uint8Array(bytes);
  let value = '';
  for (let i = 0; i < data.length; i += 8192) value += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(value);
}
export const decode = text => Uint8Array.from(atob(text), char => char.charCodeAt(0));
export function createCartridgeBackup(sram, rtc) {
  if (sram.length !== 32768 || (rtc && rtc.length !== 8)) throw new Error('Invalid cartridge data');
  return {
    format: 'monsite-gold-cartridge', version: 1, rom: ROM,
    savedAt: new Date().toISOString(), sram: encode(sram),
    ...(rtc ? { rtc: encode(rtc) } : {}),
  };
}
function open() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('/data/saves', 21);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('FILE_DATA');
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Save database blocked'));
  });
}
export async function readCartridge(gameName = 'pokemon-gold', core = 'gambatte') {
  if (gameName !== 'pokemon-gold' && !/^rom-[a-f0-9]{64}$/.test(gameName)) throw new Error('Invalid cartridge identity');
  const directory = nativeDirectory(core);
  const paths = [`${directory}/${gameName}.`, `/data/saves/${gameName}.`];
  // The first published Doom used its display filename as the native basename.
  // Migrate only this exact cartridge; an unrelated local ROM cannot claim it.
  if (gameName === DOOM_ID && core === 'mgba') paths.push(`${directory}/doom.`);
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('FILE_DATA', 'readonly');
      const store = transaction.objectStore('FILE_DATA');
      const candidates = paths.map(path => ({ sram: store.get(path + 'srm'), rtc: store.get(path + 'rtc') }));
      transaction.oncomplete = () => {
        const index = candidates.findIndex(files => files.sram.result?.contents);
        const files = candidates[Math.max(0, index)];
        resolve({ sram: files.sram.result?.contents, rtc: files.rtc.result?.contents, ...(index > 0 ? { legacy: true } : {}) });
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
export async function flushLocalCartridge(sram, gameName, core = 'gambatte') {
  // Acknowledging exit before IDBFS's queued transaction finishes can destroy
  // the iframe and lose the save. Wait on this ROM's files, never Gold's mirror.
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const files = await readCartridge(gameName, core);
    if (!sram.length || (files.sram && encode(files.sram) === encode(sram))) return;
  }
  throw new Error('Cartridge flush incomplete');
}
export async function restoreCartridge(backup) {
  if (backup.format !== 'monsite-gold-cartridge' || backup.version !== 1 || backup.rom !== ROM) throw new Error('Wrong backup');
  const sram = decode(backup.sram);
  const rtc = backup.rtc ? decode(backup.rtc) : null;
  if (sram.length !== 32768 || (rtc && rtc.length !== 8)) throw new Error('Invalid save size');
  const db = await open();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('FILE_DATA', 'readwrite');
      const store = transaction.objectStore('FILE_DATA');
      const timestamp = new Date();
      store.put({ timestamp, mode: 16877 }, nativeDirectory('gambatte'));
      store.put({ timestamp, mode: 33206, contents: sram }, PATH + 'srm');
      if (rtc) store.put({ timestamp, mode: 33206, contents: rtc }, PATH + 'rtc');
      else store.delete(PATH + 'rtc');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
export async function captureCartridge(sram) {
  // IDBFS autoPersist queues its transaction at the end of the current task.
  // Wait for that transaction, not just the SRAM export callback.
  let files;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    files = await readCartridge();
    if (files.sram && encode(files.sram) === encode(sram)) break;
  }
  if (!files?.sram || encode(files.sram) !== encode(sram)) throw new Error('Cartridge flush incomplete');
  return createCartridgeBackup(sram, files.rtc);
}

export async function captureGameCartridge(sram, gameName, identity) {
  if (!sram || sram.length > MAX_SRAM_BYTES) throw new Error('Invalid cartridge size');
  await flushLocalCartridge(sram, gameName, identity.core);
  const files = await readCartridge(gameName, identity.core);
  return createGameCartridgeBackup(sram, files.rtc, identity);
}

export function createGameCartridgeBackup(sram, rtc, identity, partial = false) {
  return parseGameBackup(JSON.stringify({
    format: 'monsite-game-cartridge', version: 1, rom: identity.sha256,
    platform: identity.platform, core: identity.core, savedAt: new Date().toISOString(),
    sram: encode(sram), ...(rtc?.length ? { rtc: encode(rtc) } : {}), ...(partial ? { partial: true } : {}),
  }), identity);
}

export async function restoreGameCartridge(backup, gameName, identity) {
  const value = parseGameBackup(JSON.stringify(backup), identity);
  if (!/^rom-[a-f0-9]{64}$/.test(gameName) || gameName !== `rom-${value.rom}`) throw new Error('Invalid cartridge identity');
  const db = await open();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('FILE_DATA', 'readwrite');
      const store = transaction.objectStore('FILE_DATA');
      const timestamp = new Date();
      const directory = nativeDirectory(identity.core);
      const path = `${directory}/${gameName}.`;
      store.put({ timestamp, mode: 16877 }, directory);
      // Restore only before mounting the engine. Its in-memory filesystem must
      // never overwrite an import written while an old session is still alive.
      if (value.sram.length) store.put({ timestamp, mode: 33206, contents: decode(value.sram) }, path + 'srm');
      else store.delete(path + 'srm');
      if (value.rtc) store.put({ timestamp, mode: 33206, contents: decode(value.rtc) }, path + 'rtc');
      else store.delete(path + 'rtc');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
