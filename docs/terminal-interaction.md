# Portfolio terminal

The terminal uses a shared monospace grid for its launcher, local command output,
contact form, and AI conversation. Its opaque surface, compact title bar, command
echoes, shaded user input, plain responses, and quiet status line take cues from
desktop shells and coding assistants. The AI identity is explicit; no tool runs,
model names, or progress percentages are fabricated.

## Interaction

- The welcome menu shows Projects and About in the top row, with Contact centered
  below them, without visible number labels. These three destinations are usable by pointer, keyboard, or numbers 1–3.
  The AI assistant remains available through `/ai` or an ordinary question.
- GitHub and LinkedIn icons below the welcome subtitle's divider link to Alexis's
  social profiles. The welcome input shows the fixed soft gray invitation “O habla
  con mi asistente de IA :)” (with English copy when selected), typed character
  by character after all three menu buttons appear. It disappears while the
  visitor writes and is never submitted as an input value. Reduced motion shows
  the buttons and invitation immediately.
- `/projects`, `/about`, `/contact`, `/ai`, `/menu`, `/help`, `/clear`, and `/exit`
  run locally. Shell aliases include `ls` and `whoami`. Ordinary text starts or
  continues the AI conversation. Unknown slash commands show local feedback.
- Project links open the existing Finder integration. Contact uses the existing
  email form and retains its draft when revisited.
- The input uses a filled slate surface without horizontal borders or a visible
  send button. Enter submits (including the phone keyboard's Send key);
  Shift+Enter inserts a newline. The menu's navigation hint is hidden, while
  keyboard navigation remains available. Up/Down recall input history at
  the first/last line and restore the current draft. Tab completes an unambiguous
  slash prefix. A visible Back to menu control remains above the output in every
  section, including the AI conversation; on phones it sits in white in the title
  bar's right corner, so the output keeps the full height. Returning to the menu preserves drafts
  and stops any active reply. The composer has no command shortcut bar.
- Streaming shows actual output and elapsed time. Esc, Ctrl+C, and the stop
  button interrupt a reply. Ctrl+C respects selected text. Ctrl+L or `/clear`
  resets the terminal to its original welcome screen: social links, three menu
  buttons and the typed invitation. It stops any active reply and clears output,
  contact drafts, input and command history; late replies cannot reappear. The
  window's position and size are preserved. `/exit` returns to the launcher shell.
- Interrupted and failed turns retain partial text, offer retry, and are excluded
  from later model context. Requests time out after 60 seconds. Retry replaces
  the last unsuccessful turn instead of duplicating it.
- A single scrollback viewport respects visitors reading earlier output. A
  latest-output button returns to the end. The composer stays outside scrollback.
- Local sections (About, Projects, Help, the AI intro) open at their first line
  instead of scrolled to their end, so the short phone terminal never starts
  mid-paragraph; a section that fits still ends at the bottom. AI replies keep
  following the output.
- On touch screens, tapping a menu option, example, or retry leaves the composer
  unfocused, so the on-screen keyboard opens only when the visitor taps the input.
  Typed commands keep the keyboard open.

## Single terminal window

- Opening or restoring the terminal uses a short macOS-style zoom and fade
  (740ms), then reveals the workspace after the window settles (780ms delay,
  140ms fade). The welcome heading types first, followed by the subtitle. Social
  icons and the three buttons fade in next, then the input invitation types.
  Timing follows each translation's character count, at 40ms per character;
  one clock reveals contiguous text prefixes and reserves the full text's space
  to avoid missing letters or shifting layout. Hiding or resetting cancels the
  clock before starting a fresh sequence.
  `/clear` replays the welcome sequence. Desktop and mobile share the animation;
  restoring keeps the mounted
  session intact. System reduced motion and the desktop's Reduce Motion setting
  show the window and content immediately.
- Desktop and mobile allow only one terminal at a time. The header has no plus
  button or menu for creating additional terminals.
- Clicking the Dock terminal icon focuses or restores the existing terminal,
  preserving its command history, draft, output, and AI conversation.
- Closing the terminal removes its session. The Dock icon can reopen a fresh
  session; repeated clicks never create another window alongside it.
- Minimizing or hiding the terminal preserves the session. The window switcher
  above the Dock can restore the minimized terminal.

## Responsive layout and access

The desktop terminal moves by dragging the title bar, including its Terminal
label and empty space. Window controls remain independent; a maximized terminal
must be restored before moving it. Double-clicking the title bar toggles maximize.
Crossing the mobile/desktop breakpoint cancels any active pointer capture and
clears grip cursors and selection locks. Desktop geometry stays preserved while
the mobile stage is shown and is refitted after returning to `lg`. The macOS
terminal uses the frame controller throughout; its hidden mobile counterpart
does not activate Framer Motion dragging.

On laptops the terminal opens at up to 740 × 500px, matching the larger reference
window; the available desktop space and Dock limit its dimensions. The shell is a
size query container, so headings, body text and the input scale with its width
and height. Desktop body text ranges from 12–16px; the compact layout ranges from
11–14px, with a 16–28px welcome heading and matching input/invitation sizes.
Contact fields retain their 16px touch minimum. Long output wraps; menu
descriptions collapse in narrow windows. English and Spanish copy is included.
The Windows and Ubuntu terminal themes were removed with those desktops; see
[macos-only-desktop.md](./macos-only-desktop.md).

The input has a unique label, output is a keyboard-scrollable region, and a
separate live region announces waiting and completed replies without announcing
each streaming token. Reduced motion disables the cursor and activity animations.

## Verification

Run `node --max-old-space-size=768 --test scripts/test-window-frame.mjs` to
check mobile → `lg` dragging, all eight grips, cancellation during breakpoint
changes and resizing after restoration.

Run `node --max-old-space-size=768 --test scripts/test-terminal-intro.mjs` to
check text order in both languages, reset and restoration, timer cleanup and
reduced motion.

Run `node --max-old-space-size=768 --test scripts/test-terminal.mjs` for eleven
offline tests of command routing, completion, duplicate-submit protection,
successful streaming, interruption, partial failure, retry, history isolation,
stale responses, rate limits, timeout, and unmount cleanup. The tests use mocked
provider responses and a lightweight hook host.

With dependencies installed, run targeted ESLint and TypeScript checks
sequentially with bounded heaps. Browser layout, window resizing, and phone
keyboard behavior need visual verification in a running site.
