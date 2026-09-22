"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

// A window's geometry in its surface's coordinates. `null` keeps the stylesheet's centred default
// until the visitor first grabs an edge or the title bar, so the opening layout is unchanged.
export type WindowFrame = { x: number; y: number; width: number; height: number };
export type WindowEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export const WINDOW_EDGES: WindowEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

const CURSORS: Record<WindowEdge, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
// Below this the Dock rail owns the layout and windows are laid out by CSS alone.
const RESIZABLE_QUERY = "(min-width: 1024px)";
// As on macOS a window may slide partly off the sides and bottom, but enough of its title bar
// always stays on the desktop to grab it again; it never slides under the menu bar.
const VISIBLE_WIDTH = 120;
const TITLE_BAR = 50;
// Clicks on the lights, back button or links never start a move.
const INTERACTIVE = "button, a, input, select, textarea, [role='button']";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// The usable area of the window's positioned parent: full width, from `top` down to `bottom`.
type Bounds = { width: number; top: number; bottom: number };
export type WindowInsets = { top: number; bottom: number };

function place(frame: WindowFrame, bounds: Bounds): WindowFrame {
  return {
    ...frame,
    x: clamp(frame.x, VISIBLE_WIDTH - frame.width, bounds.width - VISIBLE_WIDTH),
    y: clamp(frame.y, bounds.top, bounds.bottom - TITLE_BAR),
  };
}

// Shrinks a frame that no longer fits its surface, then brings its title bar back in reach.
function fit(frame: WindowFrame, bounds: Bounds, minWidth: number, minHeight: number): WindowFrame {
  const room = bounds.bottom - bounds.top;
  const width = clamp(frame.width, Math.min(minWidth, bounds.width), bounds.width);
  const height = clamp(frame.height, Math.min(minHeight, room), room);
  return place({ ...frame, width, height }, bounds);
}

type Drag = { mode: WindowEdge | "move"; pointerX: number; pointerY: number; start: WindowFrame; bounds: Bounds; parent: DOMRect };

/**
 * macOS-style window geometry: drag the title bar to move, any edge or corner to resize (the
 * opposite edge stays put), never smaller than the minimum or above the menu bar. The frame survives
 * close/reopen and zoom, as macOS remembers where a window was. `insets` keeps a window whose parent
 * spans the whole screen clear of the menu bar and Dock.
 */
export function useWindowFrame(
  windowRef: RefObject<HTMLElement | null>,
  { minWidth, minHeight, insets }: { minWidth: number; minHeight: number; insets?: () => WindowInsets },
) {
  const [frame, setFrame] = useState<WindowFrame | null>(null);
  const [resizable, setResizable] = useState(false);
  const drag = useRef<Drag | null>(null);
  const insetsRef = useRef(insets);
  useEffect(() => { insetsRef.current = insets; });
  const measure = useCallback(() => {
    const parent = windowRef.current?.offsetParent?.getBoundingClientRect();
    if (!parent) return null;
    const { top, bottom } = insetsRef.current?.() ?? { top: 0, bottom: 0 };
    return { parent, bounds: { width: parent.width, top, bottom: parent.height - bottom } };
  }, [windowRef]);

  useEffect(() => {
    const query = window.matchMedia(RESIZABLE_QUERY);
    const sync = () => setResizable(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // A smaller browser window pulls a moved or resized window back within reach.
  useEffect(() => {
    if (!frame) return;
    const onResize = () => {
      const area = measure();
      if (area) setFrame(current => current && fit(current, area.bounds, minWidth, minHeight));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [frame, measure, minWidth, minHeight]);

  const begin = useCallback((mode: Drag["mode"], event: ReactPointerEvent<HTMLElement>) => {
    const node = windowRef.current;
    const area = measure();
    if (event.button !== 0 || !node || !area) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = node.getBoundingClientRect();
    const start = { x: rect.left - area.parent.left, y: rect.top - area.parent.top, width: rect.width, height: rect.height };
    drag.current = { mode, pointerX: event.clientX, pointerY: event.clientY, start, ...area };
    event.currentTarget.setPointerCapture(event.pointerId);
    // Resize cursors and no text selection hold even when the pointer outruns the handle.
    if (mode !== "move") document.documentElement.style.cursor = CURSORS[mode];
    document.documentElement.style.userSelect = "none";
    setFrame(start);
  }, [windowRef, measure]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const active = drag.current;
    if (!active) return;
    const { mode, start, bounds } = active;
    const dx = event.clientX - active.pointerX;
    const dy = event.clientY - active.pointerY;
    if (mode === "move") {
      setFrame(place({ ...start, x: start.x + dx, y: start.y + dy }, bounds));
      return;
    }
    const minW = Math.min(minWidth, bounds.width);
    const minH = Math.min(minHeight, bounds.bottom - bounds.top);
    let left = start.x, top = start.y, right = start.x + start.width, bottom = start.y + start.height;
    // An edge already past the desktop may stay there, but a resize never pushes one further out.
    if (mode.includes("e")) right = clamp(right + dx, left + minW, Math.max(bounds.width, right));
    if (mode.includes("w")) left = clamp(left + dx, Math.min(0, left), right - minW);
    if (mode.includes("s")) bottom = clamp(bottom + dy, top + minH, Math.max(bounds.bottom, bottom));
    if (mode.includes("n")) top = clamp(top + dy, Math.min(bounds.top, top), bottom - minH);
    setFrame({ x: left, y: top, width: right - left, height: bottom - top });
  }, [minWidth, minHeight]);

  const onPointerEnd = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    document.documentElement.style.cursor = "";
    document.documentElement.style.userSelect = "";
  }, []);

  useEffect(() => () => {
    document.documentElement.style.cursor = "";
    document.documentElement.style.userSelect = "";
  }, []);

  const tracking = { onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onLostPointerCapture: onPointerEnd };
  const style: CSSProperties | undefined = resizable && frame
    ? { top: frame.y, left: frame.x, width: frame.width, height: frame.height, transform: "none" }
    : undefined;
  const handleProps = (edge: WindowEdge) => ({
    "data-edge": edge,
    "aria-hidden": true,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => begin(edge, event),
    ...tracking,
  });
  // Spread on the title bar; a no-op below the desktop breakpoint.
  const titleBarProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (resizable && !(event.target as Element).closest(INTERACTIVE)) begin("move", event);
    },
    ...tracking,
  };
  // For windows whose own code decides what counts as the title bar.
  const startMove = (event: ReactPointerEvent<HTMLElement>) => begin("move", event);
  return { style, resizable, framed: Boolean(style), handleProps, titleBarProps, startMove, tracking };
}
