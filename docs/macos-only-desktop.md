# macOS-only desktop

The home hero is now macOS only. The Windows 95 and Ubuntu desktops, and the picker
that switched between them, have been removed from `main`. They are kept on the branch
`archive/windows-ubuntu-desktops`.

## Why

`DesktopPicker` stopped mounting the other desktops in `e9515a9` (2026-09-16) and has
rendered only `MacDesktop` since then. Their components, styles, chat themes and
wallpaper still shipped with the site but could not be reached. Removing them leaves a
single desktop to maintain.

## What was removed

| Item | Path |
|---|---|
| Windows 95 desktop | `src/components/v2/windows-desktop.tsx`, `windows-desktop.module.css` |
| Ubuntu desktop | `src/components/v2/ubuntu-desktop.tsx`, `ubuntu-desktop.module.css` |
| Ubuntu wallpaper | `public/racoons_linux.webp` (94,534 bytes) |
| OS picker dialog and preview styles | `.startup`, `.startupDialog`, `.dialog`, `.eyebrow`, `.close`, `.options`, `.winPreview`, `.macPreview`, `.ubuntuPreview` in `src/components/v2/desktop-picker.module.css` |
| Terminal themes for those desktops | `"windows"` and `"ubuntu"` in `ChatInterface`'s `theme` prop (`src/components/chat-interface.tsx`), including the `C:\ALEXIS>` prompt, and the `.windows` / `.ubuntu` rules in `chat-interface.module.css` |

`ChatInterface` now accepts `theme="mac"` or `theme="default"` (used by the v3 page variant).

## The archive branch

`archive/windows-ubuntu-desktops` points at `e10a8e5` (“Show purple wallpaper on mobile
and tablet”), the last commit on `main` before the removal. Everything listed above is
still in it.

Two points in history are useful:

- **`e10a8e5`** (the branch tip) has the components, styles, themes and wallpaper, but the
  picker is already unwired. Nothing on this commit mounts the other desktops.
- **`35ea55a`** (2026-09-15, “Add terminal-style boot greeter for mac theme”) is the last
  commit where the picker worked: `desktop-picker.tsx` there imports `WindowsDesktop` and
  `UbuntuDesktop`, exports `DesktopTheme = "windows" | "mac" | "ubuntu"`, and renders the
  startup dialog.

The archive branch was created before the home desktop's image optimization (the WebP
wallpaper, the still frame for the coffee art and the pre-sized icons), so it still uses the
older, larger assets.

## Bringing a desktop back

Look at it as it was:

```sh
git switch archive/windows-ubuntu-desktops   # components present, picker unwired
git switch --detach 35ea55a                  # picker working
git switch main                              # back
```

Restore the files onto the current `main`:

```sh
git checkout archive/windows-ubuntu-desktops -- \
  src/components/v2/windows-desktop.tsx src/components/v2/windows-desktop.module.css \
  src/components/v2/ubuntu-desktop.tsx src/components/v2/ubuntu-desktop.module.css \
  public/racoons_linux.webp
```

The restored files alone don't show anything. You also need to:

1. Re-add the `windows` / `ubuntu` values to `ChatInterface`'s `theme` prop, its prompt, and
   the matching CSS rules. The archived versions are in
   `git show archive/windows-ubuntu-desktops:src/components/chat-interface.tsx` and
   `git show archive/windows-ubuntu-desktops:src/components/chat-interface.module.css`.
2. Re-add the picker styles to `desktop-picker.module.css`, and the picker state, dialog and
   rendering to `desktop-picker.tsx`, using `35ea55a` as the reference
   (`git show 35ea55a:src/components/v2/desktop-picker.tsx`).
3. Check the restored desktops against the current mac desktop: the hero, the terminal
   sessions and the desktop store have changed since `35ea55a`.
