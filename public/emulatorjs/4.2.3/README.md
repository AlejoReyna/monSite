# EmulatorJS 4.2.3 / Gambatte / mGBA

Official, precompiled files downloaded from https://cdn.emulatorjs.org/4.2.3/data/.
Only the single-thread Game Boy and GBA cores and their 7z extractor are included.
`manifest.json` records byte sizes and SHA-256 hashes. Do not replace these files
with `stable`, `latest`, `nightly` or an unpinned CDN URL.

- EmulatorJS 4.2.3: GPL-3.0, https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3
- Gambatte core bundle: build 2025-06-14, minimum EJS 4.2.2, core version 2.0.2.
  GPL-2.0; source: https://github.com/EmulatorJS/gambatte-libretro
- mGBA core bundle: build 2025-06-14, minimum EJS 4.2.2, core version 2.0.2.
  MPL-2.0; source: https://github.com/EmulatorJS/mgba.
  Its original bundled license is in `licenses/mGBA-bundled-license.txt`.
  WebGL2 bundle: 1,055,616 bytes; legacy bundle: 1,054,993 bytes. Only the
  selected variant downloads when a GBA game starts; neither is preloaded.
- RetroArch frontend: GPL-3.0; build/source infrastructure:
  https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3 and
  https://github.com/EmulatorJS/RetroArch
- 7z extractor: 7-Zip licensing, see `licenses/7zip-license.txt`.
  Source: https://github.com/ip7z/7zip

The archives' own Gambatte and mGBA licenses are preserved verbatim,
alongside EmulatorJS, RetroArch, and 7-Zip notices. Original binaries are unmodified. ROM licensing is
separate from these emulator licenses.
