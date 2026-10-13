const DATA = "/emulatorjs/4.2.3/data/";
// Fetching warms the ordinary HTTP cache. Never creates a worker, audio context or emulator.
export function preloadGameBoy(signal: AbortSignal) {
  return Promise.allSettled([
    "loader.js", "emulator.min.js", "emulator.min.css", "compression/extract7z.js",
    "cores/gambatte-legacy-wasm.data", "cores/reports/gambatte.json",
  ].map(file => fetch(DATA + file, { signal }).then(response => {
    if (!response.ok) throw new Error(file);
    return response.arrayBuffer();
  })));
}
