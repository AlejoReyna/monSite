# Safari chrome investigation — PR #77

Baseline: `d9ea48167ad2aa388101f065a60b14f7ba25156e`, branch
`fix/gameboy-transparent-case`. No PR #78 changes are included.

## Device and method

Tested on the physical iPhone 16e running iOS 26.6.2, Safari 26.6.1, compact
bottom toolbar, on October 16, 2026. Safari Web Inspector on the Mac was attached
to the iPhone's actual preview tab. Screenshots came from Apple's `devicectl`
screenshot capture, including the browser chrome. No local server or build ran.
The iOS 27 simulator was not used as evidence.

Initially Safari reported “No inspectable contents”. After the device was
connected by USB and inspection became available, the observations below were
made on that physical iPhone. The initial access problem is resolved.

The static fixture at `<preview>/gameboy/chrome-test.html` isolates modal fixed
`showModal()`, nonmodal fixed `show()`, and normal absolute content. It controls
metadata, html/body backgrounds, fixed edge elements and paint clipping.
Options survive reload; its JSON log survives reload in the same tab. The
storage keys are separate from the player and cartridge saves.

## Baseline observations

| Selected case, changed without reload | Upper bar | Lower bar |
| --- | --- | --- |
| Classic | Classic beige | Classic beige |
| Green | Retains classic beige | Green |
| Red | Retains classic beige | Red |
| Transparent, immediately after red | Retains classic beige | Retains red |

There were **zero `theme-color` metas** in this baseline tab. Removing metadata
did not fix the stale bars. The transparent board had a bottom gap: the SVG's
12px inset plus the internal gap below its base rectangle.

Another issue affected the reload comparison: after storing `transparent` and
reloading `/gba`, the Inspector read storage = `transparent`, dialog
`data-case` = `classic`. This was repeated without manual interaction. The
fixture, which has no React hydration, did restore its stored color on reload.

## Controlled comparisons

| Fixture experiment | Observed upper / lower bars |
| --- | --- |
| Modal, no meta, classic → green in place | Classic / white |
| Reload modal with green already saved | Green / white |
| Add meta and change modal to red | Retains green / white |
| Fixed nonmodal dialog, red | Retains green / white |
| Switch that existing page to normal content | Prior fixed-edge tints remain until reload |
| Fresh reload with normal red content | Red / red |
| Normal content red → green, without reload | Green / green |
| Real 16px fixed edge elements inside modal, red | Red / red |
| Same edge elements, transparent, meta present | Transparent / transparent |
| Upper edge red, lower edge green; dialog `#485956`, canvas `#18191d`, meta blue | **Red / green** |

In the last experiment the lower element had `background-clip: content-box`
and 16px of padding filling its 16px border box. It had no painted content area:
the page remained visible beneath it, while the lower Safari bar still followed
its computed green `background-color`. This distinguishes the sampled property
from the visible pixels, the dialog, the canvas and the meta. The element was a
real DOM node inside the modal top layer.

## Diagnosis

On this iOS build, full-viewport fixed containers can preserve an earlier edge
tint. The fixed fullscreen dialog is insufficient for hot updates; the modal
top layer itself is not excluded from tinting. The opaque bottom toolbar can
update the lower tint, whereas the transparent toolbar can preserve the
preceding case's tint. Repainting html/body or removing metadata does not
override these retained edge colors.

With the fix, the bars independently follow `background-color` on
`[data-chrome-edge="top"]` and `[data-chrome-edge="bottom"]`. Both are real,
full-width, 16px-high fixed elements directly inside the dialog, outside the
animated/contained `.content`. Clipping their background paint preserves the
visible board and controls. They have no pointer or accessibility interaction.

This agrees with WebKit's
[`LocalFrameView::fixedContainerEdges`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp):
it hit-tests edge centers, examines fixed/sticky containers and their computed
backgrounds, and can retain a previous tint for viewport-sized containers. The
16px boxes exceed its thin-box background threshold. The device experiments,
rather than the source alone, establish the behavior here. This is a workaround
for Safari's sampling heuristic, not a standardized browser-chrome API.

## Implementation and regression coverage

- Edge colors follow `--case-chrome-color` and become `#000000` in fullscreen.
  Desktop hides the edge elements.
- After the user's visual correction, transparent chrome matches the **visible
  board**, `#2f5043`: `#254d3c` at `.72` opacity over the existing `#485956`
  canvas. The independent canvas stays unchanged to avoid darkening the board
  again. Classic, green and red retain their existing colors.
- Mobile transparent SVG keeps its top/side inset, extends to the bottom, and
  extends the base rectangle beyond the SVG's bottom clip. The bottom toolbar
  stays transparent; desktop SVG geometry is unchanged.
- The browser-only stored preference is restored in a layout effect after
  hydration instead of relying on the server's classic state initializer.
- `/gba` supplies initial `theme-color` metadata for Android/older Safari. The
  host updates existing tags and restores their exact prior content/media. It
  still does not create metadata when embedded in a page without any.
- Existing tests remain. Added coverage checks four stored cases through
  mobile/fullscreen/desktop transitions, distinct light/dark metadata, a tag
  with missing attributes and standalone metadata. The harness resolves the
  actual CSS variables; a separate test calculates the board's composited color
  from the SVG fill, opacity and canvas, preventing the previous tone mismatch.

## iPhone verification checklist

1. Open `<preview>/gba` in Safari with the compact bottom toolbar.
2. Select classic (`#d5d3c6`), green (`#73935b`), red (`#bc4e4b`) and transparent
   (board green `#2f5043`) without reload. Both bars should follow each case.
3. On transparent, inspect the board beneath the bottom buttons all the way to
   the console's lower edge; there should be no old 12px gap or opaque toolbar.
4. Enter fullscreen: both bars black. Leave fullscreen: both return to the case.
5. Reload with transparent selected: it must remain transparent. Rotate and
   repeat. On the portfolio, enter/exit the player and check light/dark chrome.

Physical Android verification and older iOS versions are outside the tested
device matrix; their metadata behavior is protected by the host tests.
