# Mobile mac layout

The reference is commit `916cb21` (October 14, 2025), the latest local commit before March 9, 2026. There are no local commits between October 2025 and April 2026.

Mobile now follows that revision’s composition: a single centered `/16.gif`, a terminal window at the bottom with 10px side margins and 80px dock clearance, and a separate bottom dock. The terminal uses the current macOS chrome and chat implementation and opens by default. Close/minimize return focus to the dock launcher; maximize expands within the mobile viewport. Chat stays mounted when the window is hidden. Visual viewport measurements move the terminal above the on-screen keyboard; input text uses 16px to avoid iOS focus zoom.

The character selector, Alice animation, and thought dots were removed from the mobile component. The wallpaper containing Alice is replaced by a plain dark background below 1024px. A top-left Terminal / Folders switch sits below the menu bar on mobile. Folders view hides the character and terminal while keeping chat mounted, and exposes the two-column project folders. Terminal view shows the character at 1.5× scale, with the folders blurred, dimmed, and inert behind it. The existing Finder window remains available from the dock and folder buttons. The Terminal dock button also restores Terminal view.

Desktop layout and shared chat implementation remain unchanged; mobile view state is passed through the hero and desktop picker. Shared stylesheet changes are restricted to max-width: 1023px.

Validation: targeted ESLint, TypeScript, and the production build passed; the local route returned HTTP 200. Physical-device keyboard behavior has not been tested.
