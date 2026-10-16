// Workaround for Safari 26's native OMG register-allocation memory spike.
// This does not cap linear WASM memory. Only two pinned gambatte binaries match.
// Related WebKit report: https://bugs.webkit.org/show_bug.cgi?id=304810#c11
const PINNED_HASHES = new Set([
  '06b258cb6cccf67a352e26121952c3a291bf1b3ba41de5ec12c137df9021d5fa',
  '3bf4428d882c6c6b27858c5864fe920fd6afa1cd04007f37291e19be541d6676',
]);
let installed = false;
export function installSafariWasmGuard() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
  if (installed || !(ios || safari) || !window.WebAssembly) return;
  installed = true;
  const join = chunks => {
    const out = new Uint8Array(chunks.reduce((n, x) => n + x.length, 0));
    let at = 0;
    for (const chunk of chunks) { out.set(chunk, at); at += chunk.length; }
    return out;
  };
  const uint = n => {
    const bytes = [];
    do { const b = n & 127; n >>>= 7; bytes.push(b | (n ? 128 : 0)); } while (n);
    return new Uint8Array(bytes);
  };
  async function pad(input) {
    const b = ArrayBuffer.isView(input)
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input);
    // Never transform other cores or a different release of gambatte.
    if (![4040490, 4039147].includes(b.length) || b[0] !== 0 || b[1] !== 97) return input;
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))]
      .map(x => x.toString(16).padStart(2, '0')).join('');
    if (!PINNED_HASHES.has(digest)) return input;
    const read = at => {
      let n = 0, shift = 0, v;
      do { v = b[at++]; n |= (v & 127) << shift; shift += 7; } while (v & 128);
      return [n >>> 0, at];
    };
    const chunks = [b.subarray(0, 8)];
    for (let at = 8; at < b.length;) {
      const start = at, id = b[at++];
      let size; [size, at] = read(at);
      const end = at + size;
      if (id !== 10) { chunks.push(b.subarray(start, end)); at = end; continue; }
      let count; [count, at] = read(at);
      const code = [uint(count)];
      for (let index = 0; index < count; index++) {
        let length; [length, at] = read(at);
        const bodyStart = at, bodyEnd = at + length;
        if (length >= 32768 && length < 160000) {
          let groups, p; [groups, p] = read(at);
          for (let g = 0; g < groups; g++) { [, p] = read(p); p++; }
          // An empty block branches past unreachable nops. Original code,
          // locals, signatures, exports and data remain byte-for-byte intact.
          const skipped = new Uint8Array(160000 - length);
          skipped.fill(0x01);
          skipped.set([0x02, 0x40, 0x0c, 0x00]);
          skipped[skipped.length - 1] = 0x0b;
          code.push(uint(160000), b.subarray(bodyStart, p), skipped, b.subarray(p, bodyEnd));
        } else code.push(uint(length), b.subarray(bodyStart, bodyEnd));
        at = bodyEnd;
      }
      const section = join(code);
      chunks.push(new Uint8Array([10]), uint(section.length), section);
      at = end;
    }
    return join(chunks);
  }
  const instantiate = WebAssembly.instantiate;
  WebAssembly.instantiate = async function(input, imports, ...rest) {
    const binary = input instanceof WebAssembly.Module ? input : await pad(input);
    return instantiate.call(WebAssembly, binary, imports, ...rest);
  };
  const instantiateStreaming = WebAssembly.instantiateStreaming;
  if (instantiateStreaming) {
    WebAssembly.instantiateStreaming = async function(response, imports, ...rest) {
      const resolved = await response;
      // Leave native status/MIME validation and unknown binaries unchanged.
      if (!resolved.ok || resolved.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/wasm') {
        return instantiateStreaming.call(WebAssembly, resolved, imports, ...rest);
      }
      const binary = await resolved.clone().arrayBuffer();
      const padded = await pad(binary);
      if (padded === binary) return instantiateStreaming.call(WebAssembly, resolved, imports, ...rest);
      return instantiate.call(WebAssembly, padded, imports, ...rest);
    };
  }
}
