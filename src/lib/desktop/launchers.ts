/* The Dock (lg+) and the mobile rail each render a launcher for the same windows, and CSS displays
   exactly one of the two at a time. Genie animations and focus returns must land on the launcher the
   viewer can actually see, so they resolve it here instead of by id. */

export type LauncherName = "projects" | "mail" | "terminal";

/** The visible launcher for a window, or the first one when neither is laid out (SSR, hidden desktop). */
export function launcherElement(name: LauncherName): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-launcher="${name}"]`));
  return nodes.find(node => node.offsetParent !== null) ?? nodes[0] ?? null;
}

export function focusLauncher(name: LauncherName): void {
  launcherElement(name)?.focus({ preventScroll: true });
}
