# Pokémon Gold easter egg

Currently unreachable: `HeroV2` no longer mounts `TerminalCloseEasterEgg`, so
closing the final terminal shows nothing. The flow below is what it did: close
the final terminal, wait two seconds, choose the fun option, complete ↑ ↑ ↓ ↓ ← → ← → B A. Correct steps stay green;
wrong input colors the next circle red without discarding progress. The completed
sequence stays visible for 600 ms, fades for 400 ms, then mounts GameBoyPlayer.
Reduced motion removes the fade while retaining the 600 ms completion feedback.
Exit recreates a terminal and restores the desktop.

## Runtime and assets

The client-only React component embeds `/gameboy/frame.html` as an internal engine
surface, not a replacement application. Standalone navigation does not boot it.
The frame uses the official, unmodified EmulatorJS 4.2.3 Gambatte precompiled core.
The app only warms its HTTP resources when entering the Konami challenge; no
emulator, worker, ROM download, WASM instance or audio context exists on the home
screen. The ROM is downloaded only by the unlocked player's frame.

The supplied desktop ROM was copied byte-for-byte to
`public/games/pokemon-gold.gbc` (2,097,152 bytes). It is publicly accessible at
`/games/pokemon-gold.gbc` on the application's origin. The desktop source path is
never sent to visitors. Nothing has been published or deployed.

Resources, checksums, licenses and source links are under
`public/emulatorjs/4.2.3/`. No CDN availability is needed to play. The unmodified
vendor loader may make a nonessential update check on localhost; runtime assets
and cores are always local. Single-thread mode needs no COOP/COEP changes.

## Controls and lifecycle

Arrows move, X is A, Z is B, Enter is Start, Shift is Select, Escape toggles pause.
Alt+Q exits; Tab reaches the toolbar. All layouts show
D-pad, A/B, Start/Select with pointer capture and cancel/release handling.
Keyboard controls use `event.code` (physical X/Z keys). Native capture in the host
prevents game keys reaching the carousel/terminal. Both Shift keys are tracked so
releasing one does not release Select while the other is still held. The final
Konami A is not an emulator key, repeats are ignored, and the delayed transition
separates its keydown/touch from the game.

The player sits inside a pixel-art Game Boy shell: warm grey casing, square
corners, dark screen bezel, power LED, black D-pad, burgundy A/B buttons, physical
Select/Start buttons, and a speaker grille. CSS and crisp SVG shapes draw the
console; the existing local Minecraft font supplies pixel lettering. No bitmap,
new dependency or additional emulator instance is needed. The screen retains
its 10:9 ratio. On mobile the casing fills the viewport with safe-area padding
and keeps the reference's vertical silhouette: width-sized bezel and screen,
brand below them, D-pad at left, staggered A/B at right, Select/Start underneath,
and speaker at the lower right. The screen and bezel are not stretched into
viewport-height grid tracks. Short viewports scroll instead of cropping controls.
The toolbar stays fixed over the casing, with muted styling at rest and full
contrast on hover, keyboard focus, or touch press. Its muted appearance does not
disable working buttons. Backups open in a scrollable bottom drawer; the keyboard
legend also appears there on mobile, leaving more room for the game and controls.

The toolbar's four-square icon opens the casing picker: Classic, Transparent,
Green, and Red. Selection is stored under `monsite.gold.case.v1`; an invalid or
unreadable setting falls back to Classic. Transparent includes an exposed PCB,
chips, contacts, traces, and a translucent plastic reflection, drawn with SVG/CSS.
Palette changes update CSS variables and never replace the emulator iframe.

The four-corner toolbar button toggles fullscreen on desktop and mobile. It
requests the document root using the standard Fullscreen API, because a modal
dialog cannot itself request fullscreen. After native entry the existing dialog
is raised in the top layer, preserving its iframe. Browser `fullscreenchange`
events synchronize exits. Unsupported or rejected requests use an immersive
viewport layout with the same exit button; browser chrome can remain visible.
Owned fullscreen is released on exit/unmount, including pending requests that
finish late. An unrelated fullscreen session is never exited by this player.
Desktop fullscreen gives the screen more space and places controls alongside it.
Mobile fullscreen hides the decorative casing, labels, and bezel, and promotes
the same playable screen to a centered, aspect-preserving 10:9 fullscreen surface.
Pause/sound/exit/fullscreen controls stay visible; the existing touch controls sit
below the game in portrait and beside it in landscape. Black space letterboxes
the image instead of stretching it. The layout intent is captured before native
fullscreen resizes the viewport. Leaving fullscreen restores the casing and the
same iframe/session; it never restarts the ROM. API reference:
https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen

The engine adapter uses documented `EJS_*` options, lifecycle/save callbacks,
custom toolbar names/callbacks, and ordinary DOM clicks/KeyboardEvents. It does not
call `EJS_emulator`, `GameManager`, Module, WASM exports or private EJS methods.
Native UI selectors and IDBFS schema are deliberately pinned to the vendored
version and covered by adapter tests. Revalidate them when upgrading the vendor.

Pause runs the engine's native pause action. Hidden tabs and window blur release
all keys, flush the cartridge, and pause; resumption requires an explicit action.
The game boots automatically, initially muted; “Enable sound” forwards a gesture
for the bundled Emscripten audio unlock. Exiting releases keys, mutes, exports the
cartridge and awaits persistence before acknowledging stop. The host then removes
the iframe, destroying its audio context, animation callbacks, workers/listeners
and WASM realm. Errors also remove the frame before retry; retry replaces it,
never runs two frames. An unresponsive exit has a 2.5-second fallback.

## Persistence and clock

Use SAVE inside Pokémon Gold to create a cartridge save. The player flushes
battery-backed SRAM plus RTC every 15 seconds and on blur/hide/exit. It does not
automatically save/load instant states. Cartridge data remains in the browser's
native Emscripten IDBFS store and a small localStorage mirror. On boot the native
save wins over the mirror, preventing a newer pagehide flush being overwritten.
An explicit import atomically restores SRAM and RTC into IDBFS before boot.

The fixed ROM has 32 KiB SRAM and MBC3+timer+battery (header type 0x10). The bundled
Gambatte version exposes a uint64_t RTC base timestamp (8 bytes). RetroArch writes
it separately as `pokemon-gold.rtc`, beside `pokemon-gold.srm`. The adapter waits
for IDBFS's deferred transaction and captures both in the `.json` cartridge
backup. Import validates format, version, exact ROM hash, sizes, date and base64.
The cartridge clock uses elapsed host wall time and continues between sessions.
The bundled fork's RTC implementation uses `std::time(0) - baseTime_`:
https://github.com/EmulatorJS/gambatte-libretro/blob/master/libgambatte/src/mem/rtc.cpp

“Export save state” explicitly downloads a `.state` checkpoint. Its frozen RAM
and clock are different from cartridge persistence; it is not auto-restored and
cannot be imported through the cartridge backup picker. A checkpoint can be
loaded with a compatible EmulatorJS 4.2.3/Gambatte installation. The UI explains
the distinction. Storage failures surface a backup reminder.

The fixed Emscripten IDBFS backend uses IndexedDB database `/data/saves`, version
21, store `FILE_DATA`, timestamp index. The adapter uses standard IndexedDB
transactions to export/import the separate RTC without accessing engine internals.
The matching schema is in the precompiled core's JS and upstream IDBFS source:
https://github.com/emscripten-core/emscripten/blob/main/src/lib/libidbfs.js

## Verification

Run sequentially, with bounded Node heaps:

```
NODE_OPTIONS=--max-old-space-size=512 node --test scripts/test-konami.mjs
NODE_OPTIONS=--max-old-space-size=512 node --test scripts/test-terminal.mjs
NODE_OPTIONS=--max-old-space-size=512 node --test scripts/test-gameboy.mjs
NODE_OPTIONS=--max-old-space-size=512 node node_modules/eslint/bin/eslint.js src/components/v2/gameboy-player.tsx src/components/v2/konami-challenge.tsx src/components/v2/terminal-close-easter-egg.tsx src/lib/gameboy/save.ts src/lib/gameboy/preload.ts src/lib/gameboy/presentation.ts public/gameboy/bridge.js public/gameboy/cartridge.js scripts/test-gameboy.mjs
NODE_OPTIONS=--max-old-space-size=768 node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Manual audit: finish Konami using keyboard/taps (including wrong keys); start Gold,
set its clock, create an in-game save, exit, unlock again and choose CONTINUE.
Export/import the cartridge JSON, check its SRAM and 8-byte RTC, and verify the
clock advances after being outside the game. Test Escape, Alt+Q, sound, background
pause, held-key blur, repeated open/exit, and portrait/landscape touch layouts.
Switch through all four casings during a running game, verify selection persists
after returning, and check the square bottom corner. Toggle fullscreen in both
layouts, return with the toolbar/Escape, and exit the game while fullscreen.
On mobile check that fullscreen shows just the playable image and touch controls,
preserves 10:9 in both orientations, and returns to the unchanged casing layout.

During implementation Computer Use refused the active Brave URL and ended its
session. Interactive visual/audio/ROM-play/clock-continuation/mobile checks could
not be completed. The runtime WASM validates and initializes in bounded Node;
headless ROM execution requires browser-only ResizeObserver/WebGL facilities.
Adapter/static/HTTP checks do not prove the ROM renders or plays in a browser.
The existing local server at http://localhost:3000 was reused; no new server or
production build was run. These manual checks remain required before publishing.
