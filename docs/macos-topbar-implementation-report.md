# macOS Portfolio Top-Bar Redesign — Implementation Report

## Summary

Replaced the decorative macOS menu bar (Notion / ShieldHalf / Aperture / CirclePlay icons, faux Wi‑Fi/battery, Search→Terminal shortcut) with a production-quality interactive top bar:

**Left:** Apple · active app name · File · Go · Window · Help
**Right:** Focus · Connection · Battery (when supported) · Search (Spotlight) · Orbit assistant orb · Date/time calendar

Shared desktop state lives in `src/lib/desktop/` (`DesktopStoreProvider`) and synchronizes Projects Finder, Terminal visibility (via `hero-v2`), menus, Spotlight, and Orbit actions. Preferences persist in `localStorage` (language stays on existing `app_lang`; motion / voice / hour format / UI sounds on `mac_desktop_prefs_v1`). **Microphone permission is never auto-restored.**

Orbit assistant pipeline (not Apple Siri, never claims to be Siri):

1. Mic → `POST /api/assistant/stt` (xAI STT proxy)
2. Transcript / text → `POST /api/assistant` (Kimi `kimi-k2.6` + allowlisted tools)
3. Reply → `POST /api/assistant/tts` (xAI TTS proxy)

Allowlisted actions: answer portfolio, open Projects, explain project, navigate Contact, change language, toggle Focus, open Terminal.

## Validation notes

- `npm install` succeeded in `/workspace/monsite`.
- `npx tsc --noEmit`: **no errors in new/changed menu-bar, desktop lib, or assistant API files.**
- Remaining tsc errors are pre-existing slice gaps (`@/hooks/useChat`, `./data/chat-enhancements` missing from this mirror) in `chat-interface.tsx` — not introduced by this work.
- Full `next build` was not required beyond typecheck; CSS module class names were cross-checked against TSX usage.
- Imports use `@/` aliases consistent with the real app.

## Required environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `MOONSHOT_API_KEY` or `KIMI_API_KEY` | Orbit text + tools (`/api/assistant`), also hero chat | Without these, Orbit returns honest `unavailable`. |
| `KIMI_BASE_URL` | optional | Default `https://api.moonshot.ai/v1` |
| `KIMI_MODEL` | optional | Default `kimi-k2.6` |
| `XAI_API_KEY` | Orbit STT + TTS | Without it, text Orbit still works; mic/TTS report unavailable. |
| Existing chat/contact vars | unchanged | `OPENAI_API_KEY`, `CHAT_PROVIDER`, `NEXT_WEB3FORMS_KEY` |

Documented in `README.md`.

## Limitations

- xAI STT uses unary `POST /v1/stt` (recorded WebM blob) rather than a browser WebSocket stream; UX still covers listening → thinking → reply. Streaming STT/TTS WebSockets would need an additional edge proxy for auth.
- Battery Status API is Chromium-oriented; control is hidden when unsupported (no fake battery).
- Connection status probes `/api/chat` reachability (site backend), not OS Wi‑Fi; assistant availability is reported separately via `/api/assistant/health`.
- Focus mode pauses decorative animations (CSS classes `mac-focus-mode` / `mac-reduced-motion`) for up to 25 minutes; it is **not** system Focus / Do Not Disturb.
- Curated portfolio facts for Orbit are duplicated in `src/lib/desktop/portfolio-content.ts` (kept in sync with Finder projects manually).
- `chat-interface.tsx` left unchanged — hero Terminal chat remains separate from Orbit.
- `mac-projects.tsx` unchanged structurally; open/close now driven by the shared store from `desktop-picker`.
- In-memory rate limits on STT/TTS reset on serverless cold starts; cookie quota (`orbit_quota_v1`, 30 turns / 2.5h) gates assistant turns.
- Mobile: left menus collapse; Search + Orbit remain reachable.

## Key paths

- UI: `src/components/v2/mac-menu-bar/*`, `desktop-picker.tsx`
- State: `src/lib/desktop/*`
- API: `src/app/api/assistant/{route,stt,tts,health}/`
- Sync: `hero-v2.tsx` passes `terminalOpen` / `onTerminalOpenChange`

## Post-sync validation (Mac checkout)

- Synced implementation into `/Users/alexis/Documents/monSite`.
- Fixed CSS `:global` / `@media` comma selector (Turbopack parse error).
- Fixed React Compiler lint issues in spotlight, dismiss hook, desktop store, assistant panel.
- `npm run lint`: **0 errors** (pre-existing warnings remain elsewhere).
- `npm run build`: **success** — routes include `/api/assistant`, `/stt`, `/tts`, `/health`.
