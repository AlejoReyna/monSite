# Mobile mac layout

The reference is commit `916cb21` (October 14, 2025), the latest local commit before March 9, 2026. There are no local commits between October 2025 and April 2026.

Mobile now follows that revision’s composition: a single centered `/16.gif`, a terminal window at the bottom with 10px side margins and 80px dock clearance, and a separate bottom dock. The terminal uses the current macOS chrome and chat implementation and opens by default. Close/minimize return focus to the dock launcher; maximize expands within the mobile viewport. Chat stays mounted when the window is hidden. Visual viewport measurements move the terminal above the on-screen keyboard; input text uses 16px to avoid iOS focus zoom.

The character selector, Alice animation, and thought dots were removed from the mobile component. The wallpaper containing Alice is replaced by a plain dark background below 1024px. A top-left Terminal / Folders switch sits below the menu bar on mobile. Folders view hides the character and terminal while keeping chat mounted, and exposes the two-column project folders. Terminal view shows the character at 1.75× scale, with the folders blurred, dimmed, and inert behind it. The existing Finder window remains available from the dock and folder buttons. The Terminal dock button also restores Terminal view.

Desktop layout and shared chat implementation remain unchanged; mobile view state is passed through the hero and desktop picker. Shared stylesheet changes are restricted to max-width: 1023px.

Validation: targeted ESLint, TypeScript, and the production build passed; the local route returned HTTP 200. Physical-device keyboard behavior has not been tested.

## Mobile animation performance follow-up

The mobile character layer starts at `top: 0` inside the hero, within the stage at z-index 30. The menu bar remains above it at z-index 50 and the view switch at 34. The character keeps its 1.75× scale and aspect ratio.

Mobile uses one native animated WebP image instead of the desktop SVG filter/clip-path renderer. The GIF is 17,020,818 bytes; the 888×1383 WebP is 1,729,462 bytes (89.8% smaller), with a approximately 54KB still frame. Pillow encoded it at quality 85 and grouped repeated source frames: 79 original frames become 35 encoded frames with the same 5,640ms visual timeline. Every source frame was compared at its timestamp against the decoded WebP; maximum mean per-channel error was 0.752/255 over the dark backdrop. Transparency is retained.

The mobile renderer switches to the still frame when offscreen, in the Folders view, in a background tab, or when reduced motion is requested. Hidden desktop GIF renderers mount only at desktop widths to avoid a redundant 16MB mobile download. Desktop keeps its original artwork and rendering, mounting after the viewport breakpoint is known.

Validation: production build, targeted ESLint, TypeScript, asset timeline/alpha/quality checks, and whitespace checks passed. Physical-device frame timing has not been measured; this reduces transfer and rendering work without inventing intermediate frames or claiming a higher source frame rate.

The mobile asset removes the 25 fully transparent top rows shared by every original GIF frame. No opaque source pixels are cropped. With the image translated by the menu bar height, the hair now aligns with the bar’s lower edge instead of leaving the source-file headroom as a gap. The loop remains 5,640ms.
