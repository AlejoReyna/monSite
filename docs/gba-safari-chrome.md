# Safari chrome investigation — PR #77

Baseline: `d9ea48167ad2aa388101f065a60b14f7ba25156e` on
`fix/gameboy-transparent-case`. This investigation does not include PR #78.

## Reproduction page

Open `<preview>/gameboy/chrome-test.html` in Safari on the iPhone, using the
compact bottom toolbar. The file is static: no emulator, React, Next metadata
inheritance, or local server is needed. It uses a separate storage key from the
player and does not touch cartridge saves.

The controls isolate:

- `showModal()` (top layer), `show()` (fixed, outside the top layer), and normal
  positioned content.
- Present/absent `theme-color`, including on reload.
- A case-colored dialog with either a matching or dark html/body canvas.
- Real fixed elements at both edges, independently of the viewport-sized dialog.
- Hot changes versus reload with the options already saved.

Change only one variable at a time. For each layer and metadata setting, cycle
classic → green → red → transparent → black without reloading, then reload each
stored color. Repeat with edge elements enabled. Use screenshots of the whole
screen, including both browser bars, after dismissing the select menu. The JSON
download records configuration and computed styles; observations about the
browser bars must be entered manually because they are outside the DOM.

| Case | Intended tint |
| --- | --- |
| Classic | `#d5d3c6` |
| Green | `#73935b` |
| Red | `#bc4e4b` |
| Transparent | `#485956` (case composited over `#18191d`) |
| Fullscreen | `#000000` |

## Evidence and limitations

The connected physical device reports iOS 26.6.2; the installed simulator is
iOS 27.0. The latter is not evidence of iOS 26 behavior. Safari on the Mac initially
listed the physical device with “No inspectable contents”, including after the
user opened the baseline preview. After connecting by USB, `devicectl` confirms
`Transport Type: wired` and `Pairing State: paired`, but Safari still reports
“No inspectable contents”. Device Hub reports that screen sharing with this Mac
requires iOS 27 or later. iPhone observations and screenshots are pending; no
color behavior of either iPhone bar is established by this document.

The diagnostic page loads and its hot case selector works in macOS Safari 26.6.
This checks the fixture, not the iPhone browser chrome.

The current WebKit implementation provides a specific hypothesis to test:
[`LocalFrameView::fixedContainerEdges`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp)
distinguishes edge containers from viewport-sized fixed containers and can
retain a previous edge color for the latter. Thus changing the dialog's color
alone need not imply a fresh chrome color. This is source evidence, not a
confirmed diagnosis for the installed iOS build. The page's edge elements are
16px tall so their background can exceed the source's 10px thin-box threshold.

WebKit also tracks special handling for modal backdrops in
[bug 300965](https://bugs.webkit.org/show_bug.cgi?id=300965) and
[bug 302272](https://bugs.webkit.org/show_bug.cgi?id=302272). These reports do not
prove which element wins on this page. In particular, the earlier comments in
the player claiming that `theme-color` pins the first status-bar color remain
unverified and must not be treated as test results.

## Device evidence to collect

| Fixture configuration | Hot change: upper / lower | Stored reload: upper / lower | Screenshot |
| --- | --- | --- | --- |
| Modal, no meta, matching canvas | Pending | Pending | Pending |
| Modal, meta, matching canvas | Pending | Pending | Pending |
| Fixed nonmodal, no meta | Pending | Pending | Pending |
| Normal content, no meta | Pending | Pending | Pending |
| Modal, dark canvas, no meta | Pending | Pending | Pending |
| Modal with fixed edge elements | Pending | Pending | Pending |

Record each row for all four cases and black. Then inspect the real `/gba`
dialog and repeat the case cycle with its menus closed. A working result must
also survive entering/leaving fullscreen, rotation, and returning to the
portfolio with the original light/dark metadata restored.
