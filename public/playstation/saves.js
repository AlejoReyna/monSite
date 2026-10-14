export const CARD_BYTES = 128 * 1024;
export function parseCard(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== CARD_BYTES || bytes[0] !== 0x4d || bytes[1] !== 0x43) throw new Error('Invalid PS1 memory card');
  return bytes;
}
export function gameName(id, extension) {
  if (!/^[a-f0-9]{64}$/.test(id) || !['pbp', 'bin'].includes(extension)) throw new Error('Invalid PS1 identity');
  return `ps1-${id}.${extension}`;
}
export function saveName(id, extension) {
  gameName(id, extension);
  // Both PBP and our explicit BIN cue use the same content basename.
  return `ps1-${id}`;
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
    request.onblocked = () => reject(new Error('Memory card database blocked'));
  });
}
/** Native IDBFS format, pinned to the vendored core. Only before engine boot. */
export async function restoreCard(name, bytes) {
  if (!/^ps1-[a-f0-9]{64}$/.test(name)) throw new Error('Invalid save name');
  parseCard(bytes);
  const db = await open();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('FILE_DATA', 'readwrite');
      tx.objectStore('FILE_DATA').put({ timestamp: new Date(), mode: 33206, contents: bytes }, `/data/saves/${name}.srm`);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function waitForCard(name, bytes) {
  parseCard(bytes);
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const db = await open();
    let saved;
    try {
      saved = await new Promise((resolve, reject) => {
        const tx = db.transaction('FILE_DATA', 'readonly');
        const req = tx.objectStore('FILE_DATA').get(`/data/saves/${name}.srm`);
        tx.oncomplete = () => resolve(req.result?.contents);
        tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    if (saved?.length === bytes.length && bytes.every((byte, index) => byte === saved[index])) return;
  }
  throw new Error('Memory card has not persisted');
}
