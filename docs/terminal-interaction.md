# Portfolio terminal

The terminal uses a shared monospace grid for its launcher, local command output,
contact form, and AI conversation. Its opaque surface, compact title bar, command
echoes, shaded user input, plain responses, and quiet status line take cues from
desktop shells and coding assistants. The AI identity is explicit; no tool runs,
model names, or progress percentages are fabricated.

## Interaction

- The welcome menu is immediately usable by pointer, keyboard, or numbers 1–4.
- `/projects`, `/about`, `/contact`, `/ai`, `/menu`, `/help`, `/clear`, and `/exit`
  run locally. Shell aliases include `ls` and `whoami`. Ordinary text starts or
  continues the AI conversation. Unknown slash commands show local feedback.
- Project links open the existing Finder integration. Contact uses the existing
  email form and retains its draft when revisited.
- Enter submits; Shift+Enter inserts a newline. Up/Down recall input history at
  the first/last line and restore the current draft. Tab completes an unambiguous
  slash prefix. A visible Back to menu control remains above the output in every
  section, including the AI conversation. Returning to the menu preserves drafts
  and stops any active reply. The composer has no command shortcut bar.
- Streaming shows actual output and elapsed time. Esc, Ctrl+C, and the stop
  button interrupt a reply. Ctrl+C respects selected text. Ctrl+L or `/clear`
  clears the conversation when idle; `/exit` returns to the launcher shell.
- Interrupted and failed turns retain partial text, offer retry, and are excluded
  from later model context. Requests time out after 60 seconds. Retry replaces
  the last unsuccessful turn instead of duplicating it.
- A single scrollback viewport respects visitors reading earlier output. A
  latest-output button returns to the end. The composer stays outside scrollback.

## Responsive layout and access

The shell is an inline-size query container. Body text uses
`clamp(12px, 10px + .5cqi, 16px)`, so resizing the terminal changes its text scale.
Touch layouts use a 13px body minimum and a 16px input minimum. Long output wraps;
menu descriptions collapse in narrow windows. Windows and Ubuntu retain their
own chrome and colors. English, Spanish, and Chinese copy is included.

The input has a unique label, output is a keyboard-scrollable region, and a
separate live region announces waiting and completed replies without announcing
each streaming token. Reduced motion disables the cursor and activity animations.

## Verification

Run `node --max-old-space-size=768 --test scripts/test-terminal.mjs` for ten
offline tests of command routing, completion, duplicate-submit protection,
successful streaming, interruption, partial failure, retry, history isolation,
stale responses, rate limits, timeout, and unmount cleanup. The tests use mocked
provider responses and a lightweight hook host.

Targeted ESLint and TypeScript checks run sequentially with bounded heaps. No
server, preview, or build was started. Browser layout, window resizing, and phone
keyboard behavior still need visual verification in a running site.
