import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

// Minimal lossless PNG writer for native Game Boy frames. Nearest-neighbour
// integer scaling keeps every emulated pixel a sharp square block.
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = new Uint32Array(256).map((_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

export function crc32(...buffers) {
  let crc = 0xffffffff;
  for (const buffer of buffers) for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(head.subarray(4), data), 0);
  return Buffer.concat([head, data, tail]);
}

/** Opaque RGBA in; indexed PNG when there are at most 256 colours (every GB/GBC frame), else RGB. */
export function encodePng({ width, height, rgba }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4) {
    throw new Error('Invalid image dimensions');
  }
  const palette = new Map();
  for (let offset = 0; offset < rgba.length && palette.size <= 256; offset += 4) {
    const color = (rgba[offset] << 16) | (rgba[offset + 1] << 8) | rgba[offset + 2];
    if (!palette.has(color)) palette.set(color, palette.size);
  }
  const indexed = palette.size <= 256;
  const stride = indexed ? width : width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    let out = y * (stride + 1) + 1; // Filter byte 0 (None) precedes each row.
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      if (indexed) raw[out++] = palette.get((rgba[offset] << 16) | (rgba[offset + 1] << 8) | rgba[offset + 2]);
      else { raw[out++] = rgba[offset]; raw[out++] = rgba[offset + 1]; raw[out++] = rgba[offset + 2]; }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bit depth.
  header[9] = indexed ? 3 : 2; // Indexed colour or truecolour.
  const chunks = [chunk('IHDR', header)];
  if (indexed) {
    const plte = Buffer.alloc(palette.size * 3);
    for (const [color, index] of palette) {
      plte[index * 3] = color >> 16; plte[index * 3 + 1] = (color >> 8) & 255; plte[index * 3 + 2] = color & 255;
    }
    chunks.push(chunk('PLTE', plte));
  }
  chunks.push(chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat([SIGNATURE, ...chunks]);
}

export function upscale(rgba, width, height, factor) {
  const source = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  if (factor === 1) return Buffer.from(source);
  const out = Buffer.alloc(source.length * factor * factor);
  const outWidth = width * factor;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      for (let dy = 0; dy < factor; dy++) {
        let target = ((y * factor + dy) * outWidth + x * factor) * 4;
        for (let dx = 0; dx < factor; dx++, target += 4) source.copy(out, target, offset, offset + 4);
      }
    }
  }
  return out;
}

export function framePng({ width, height, rgba }, scale) {
  const png = encodePng({ width: width * scale, height: height * scale, rgba: upscale(rgba, width, height, scale) });
  return { png, width: width * scale, height: height * scale };
}

export function frameDigest(rgba) {
  return createHash('sha256').update(rgba).digest('hex');
}

/** Uniform frames (fades, transitions) are reported so they are not mistaken for capture failures. */
export function uniformColor(rgba) {
  for (let offset = 4; offset < rgba.length; offset += 4) {
    if (rgba[offset] !== rgba[0] || rgba[offset + 1] !== rgba[1] || rgba[offset + 2] !== rgba[2]) return null;
  }
  return `#${[rgba[0], rgba[1], rgba[2]].map(value => value.toString(16).padStart(2, '0')).join('')}`;
}
