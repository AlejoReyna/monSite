/* IDBFS stores ordinary IndexedDB records. Pinned to the Emscripten backend
 * shipped with the vendored core (DB v21, FILE_DATA, timestamp index).
 * This adapter never accesses the WASM heap, Module or EJS private methods. */
export const SAVE_KEY = 'monsite.gold.cartridge.v1';
export const ROM = 'fb0016d27b1e5374e1ec9fcad60e6628d8646103b5313ca683417f52b97e7e4e';
const PATH = '/data/saves/pokemon-gold.';
export function encode(bytes) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
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
export async function readCartridge() {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('FILE_DATA', 'readonly');
      const store = transaction.objectStore('FILE_DATA');
      const sram = store.get(PATH + 'srm');
      const rtc = store.get(PATH + 'rtc');
      transaction.oncomplete = () => resolve({ sram: sram.result?.contents, rtc: rtc.result?.contents });
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
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
    if (files.sram && encode(files.sram) === encode(sram) && files.rtc?.length === 8) break;
  }
  if (!files?.sram || encode(files.sram) !== encode(sram) || files.rtc?.length !== 8) throw new Error('Cartridge flush incomplete');
  return createCartridgeBackup(sram, files.rtc);
}
