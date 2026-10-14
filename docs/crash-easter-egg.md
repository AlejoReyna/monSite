# Crash Bandicoot Easter egg

The home page recognizes `↑ ↑ ↓ ↓ ← → ← → B A` outside editable fields and
other dialogs. Letters are case insensitive; repeated keydown events are ignored.
After 2.5 seconds between keys, or a wrong key, the detector starts over while
retaining overlapping prefixes. The first arrow keeps normal navigation; after
the second up arrow, matching keys are consumed. A small `↑↑` button on touch
devices opens a six-button keypad for the same sequence.

The secret opens a native modal dialog, suspends carousel navigation, and loads
the React player chunk. **No PS1 engine, game or BIOS is fetched before Start.**
EmulatorJS 4.2.3's shared frontend is reused; only one of the two PCSX ReARMed
variants loads. Both variants together add 2,078,263 bytes to the repository,
plus the report, license and application code. This is hosted weight, not initial
visitor transfer. Measure the actual JS transfer and runtime memory in a browser
before making performance claims.

## Local files

Choose your game and a compatible 512 KiB retail BIOS with its original filename.
Supported names: `scph1001.bin`, `scph101.bin`, `scph5500.bin`, `scph5501.bin`,
`scph5502.bin`, `scph7001.bin`, `PSXONPSP660.bin`. Names are normalized before the
engine sees them. Region/content compatibility still needs checking with your
files. No copyrighted game or BIOS has been added to this repository.

Supported game files: `.pbp`, or a **single-track 2352-byte-sector `.bin`**
(512 KiB–768 MiB). The adapter creates an explicit cue for single-track BIN,
detecting MODE1/MODE2 from its raw sector header; PBP runs directly. Multi-track BIN/CUE collections, ZIP archives and
CHD are not supported by this integration. Keep the game's original tracks;
do not just rename another file to one of these extensions.

Local files stay in the browser and are not uploaded. The player reads the game
in 1 MiB blocks to derive a content identity without a game-sized hashing buffer.
The algorithm is a SHA-256 chain seeded with 32 zero bytes, each step hashing
the prior digest followed by the next block. It is **not** the ordinary whole-file
SHA-256. Renames keep the same identity; changes anywhere in the file change it.
Emulation itself still loads the full image and uses additional WASM memory.

## Hosted assets

Set `HOSTED_CRASH` in `src/lib/playstation/assets.ts` to enable Start without local
selection. This adds no asset fetch until the visitor starts the game:

```ts
export const HOSTED_CRASH: Ps1Assets | null = {
  gameUrl: "https://your-asset-host.example/crash-v1.pbp",
  biosUrl: "https://your-asset-host.example/scph5501.bin",
  biosName: "scph5501.bin",
  id: "YOUR_FIXED_64_CHARACTER_LOWERCASE_HEXADECIMAL_CONTENT_ID",
  extension: "pbp",
};
```

Replace the placeholder id with the game identity (prefer the local identity
above if sharing saves with local selection). Change the id when changing game
bytes. `extension` must match the real file format. Check distribution permissions,
CORS, file-size limits, bandwidth and versioned URL caching before publishing.
Use HTTPS on external hosts. The iframe fetches files only once, aborts on unload,
caps streamed downloads, then passes **named File objects** to EJS. Preserving the
BIOS name is essential, and deterministic game filenames keep save paths stable
even when hosted URLs have different filenames.

## Controls and saves

Arrows move; X = Cross, Z = Square, C = Circle, V = Triangle; A/S = L1/R1,
Q/W = L2/R2; Enter = Start, Shift = Select. Escape pauses. Touch devices have
the D-pad, four face buttons, Start and Select. Sound starts muted and can be
enabled explicitly. Fullscreen uses the existing document-root controller with
an immersive layout fallback on browsers that lack native fullscreen.

Save inside Crash itself. The player periodically exports the first native memory
card to flush it to EJS's IndexedDB filesystem. Save/Export buttons trigger the
same flush. Cards are isolated by game content identity. The first card uses a
128 KiB raw `.mcr`/`.srm` format with the `MC` header; optional imports are written
before engine boot and replace that game's card. Instant save states and the
second memory card are not included.

Both PBP and the explicit BIN cue use `/data/saves/ps1-<id>.srm`.
Closing a running game pauses it, exports its
card, and waits until the IndexedDB contents match before removing the iframe.
If persistence fails or times out, the player offers Export and an explicit
Close without saving. Hiding the tab pauses rather than resuming automatically.

## Verification

Static checks run sequentially with bounded Node heaps:

```sh
NODE_OPTIONS=--max-old-space-size=768 node --test scripts/test-playstation.mjs
NODE_OPTIONS=--max-old-space-size=768 node --test scripts/test-gameboy.mjs
NODE_OPTIONS=--max-old-space-size=768 node node_modules/eslint/bin/eslint.js src/lib/playstation src/components/playstation src/components/v3/hero-carousel-sequence.tsx public/playstation
NODE_OPTIONS=--max-old-space-size=1024 node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The old `scripts/test-konami.mjs` references an independently deleted terminal
feature and does not test this new detector.

Browser QA needs real game/BIOS files and explicit permission to run a server.
Use only `npm run dev -- --allow-server`, one instance at a time. Check Chrome
and Safari, empty-cache network requests before/after Start, keyboard navigation,
touch input, pause/sound, interrupted loading, close/reopen, memory-card recovery
and resource release. Do not run a build or server implicitly.

The loading watchdog expires after three minutes of inactivity, resetting on
download progress; it is not a three-minute total transfer limit.
