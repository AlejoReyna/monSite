"use client";

import { useCopy } from "@/components/use-copy";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import { ICON_ARRANGE_COPY, ICON_GRID, isAutoSorted, resolveIconPositions, type DesktopIconMeta, type IconBounds, type IconPoint, type IconSortMode } from "@/lib/desktop/icon-layout";
import DesktopContextMenu, { type ContextMenuEntry } from "./desktop-context-menu";

export type DesktopIconItem = DesktopIconMeta & {
  art: ReactNode;
  ariaLabel: string;
  /** Link icons (the AWS badge) navigate natively instead of opening Finder. */
  href?: string;
  onOpen?: (button: HTMLButtonElement) => void;
};

// Below the lg breakpoint the icons are a static grid (mobile Folders view).
const FREE_LAYOUT = "(min-width: 1024px)";
const DRAG_THRESHOLD = 4;

type Press = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  dragging: boolean;
  /** Escape removed the drag image; the release still must not open the icon. */
  cancelled: boolean;
  end: (commit: boolean) => void;
};

const iconStyle = (point: IconPoint) => ({ "--icon-right": `${point.right}px`, "--icon-top": `${point.top}px` }) as CSSProperties;

/** The click that follows a drag or a Command/Shift-click must not open the icon. Browsers dispatch it
    right after pointerup in the same task, so the listener only lives until the next task. */
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
}

/** Desktop icons that move like Finder's: press to select, drag to move (a drag image follows the pointer), click to open. */
export default function DesktopIcons({ items, interactive, label, className, iconClassName, ghostClassName }: {
  items: DesktopIconItem[];
  interactive: boolean;
  label: string;
  className: string;
  iconClassName: string;
  ghostClassName: string;
}) {
  const copyText = useCopy();
  const { language } = useLanguage();
  const { iconLayout, iconMotion, arrangeIcons, registerIconContext } = useDesktopStore();
  const copy = ICON_ARRANGE_COPY[language];
  const layerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const press = useRef<Press | null>(null);
  const [bounds, setBounds] = useState<IconBounds | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [drag, setDrag] = useState<{ origins: Record<string, IconPoint>; host: HTMLElement } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; iconId: string | null; host: HTMLElement; keyboard: boolean } | null>(null);
  // Without bounds (server render) this is the default arrangement, so markup hydrates cleanly.
  const positions = resolveIconPositions(iconLayout, items, bounds, language);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  // Menu bar commands run in the store and need the same icons and desktop size.
  useEffect(() => {
    registerIconContext({ items: items.map(({ id, title, kind }) => ({ id, title, kind })), bounds });
  });

  // Clicking anywhere else, or Escape, clears the selection.
  useEffect(() => {
    if (!selected.length) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.("[data-desktop-icon], [data-desktop-menu]")) setSelected([]);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setSelected([]);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected.length]);

  // Right-click (or Shift+F10 / the Menu key) on an icon or the empty desktop.
  useEffect(() => {
    const host = layerRef.current?.closest<HTMLElement>("[data-desktop-root]");
    if (!host || !interactive) return;
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const icon = target?.closest<HTMLElement>("[data-desktop-icon]");
      const onDesktop = icon ? layerRef.current?.contains(icon) : target?.closest("[data-desktop-background]");
      if (!onDesktop || !window.matchMedia(FREE_LAYOUT).matches) return;
      event.preventDefault();
      // Keyboard-invoked menus carry no pointer position; anchor them under the icon.
      const keyboard = event.button !== 2 && !event.ctrlKey;
      const rect = icon?.getBoundingClientRect();
      const id = icon?.dataset.desktopIcon ?? null;
      setSelected(current => (id ? (current.includes(id) ? current : [id]) : []));
      setMenu({ x: keyboard && rect ? rect.left + rect.width / 2 : event.clientX, y: keyboard && rect ? rect.bottom : event.clientY, iconId: id, host, keyboard });
    };
    host.addEventListener("contextmenu", onContextMenu);
    return () => host.removeEventListener("contextmenu", onContextMenu);
  }, [interactive]);

  useLayoutEffect(() => {
    if (drag && ghostRef.current && press.current) ghostRef.current.style.transform = `translate3d(${press.current.dx}px, ${press.current.dy}px, 0)`;
  }, [drag]);

  // Escape drops the drag image and leaves every icon where it was.
  useEffect(() => {
    if (!drag) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !press.current) return;
      event.preventDefault();
      press.current.cancelled = true;
      setDrag(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [drag]);

  // Stop tracking the pointer if the desktop unmounts mid-drag.
  useEffect(() => {
    const presses = press;
    return () => presses.current?.end(false);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    // Control-click is the Mac secondary click; it opens the context menu instead.
    if (!event.isPrimary || event.button !== 0 || event.ctrlKey || !interactive || !window.matchMedia(FREE_LAYOUT).matches) return;
    const host = layerRef.current?.closest<HTMLElement>("[data-desktop-root]");
    if (!host) return;
    // A press whose release never arrived must not leave its drag image behind.
    press.current?.end(false);
    const toggle = event.metaKey || event.shiftKey;
    let ids = selected.includes(id) ? selected : [id];
    if (toggle) {
      // Command/Shift-click toggles the selection without opening, as in Finder.
      ids = selected.includes(id) ? selected.filter(other => other !== id) : [...selected, id];
      setSelected(ids);
    } else if (!selected.includes(id)) {
      setSelected(ids);
    }
    // Deselecting with a modifier only swallows the click; nothing is dragged.
    const origins: Record<string, IconPoint> = ids.includes(id) ? Object.fromEntries(ids.filter(dragged => positions[dragged]).map(dragged => [dragged, positions[dragged]])) : {};
    const maxRight = (bounds?.width ?? Infinity) - ICON_GRID.width;
    const maxTop = (bounds?.height ?? Infinity) - ICON_GRID.height;
    // Pointer offsets that keep every dragged icon on the desktop.
    const limits = Object.values(origins).reduce((range, point) => ({
      minX: Math.max(range.minX, point.right - maxRight),
      maxX: Math.min(range.maxX, point.right),
      minY: Math.max(range.minY, -point.top),
      maxY: Math.min(range.maxY, maxTop - point.top),
    }), { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity });
    const pointerId = event.pointerId;
    const session: Press = { x: event.clientX, y: event.clientY, dx: 0, dy: 0, dragging: false, cancelled: false, end: () => {} };

    // Tracked on the window rather than the icon: pointer capture is not delivered
    // reliably in every browser, and a lost pointerup would strand the drag image.
    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      // A mouse moving with no button held was released somewhere we never heard about.
      if (move.pointerType === "mouse" && !(move.buttons & 1)) return session.end(true);
      const dx = move.clientX - session.x;
      const dy = move.clientY - session.y;
      if (session.cancelled) return;
      if (!session.dragging) {
        if (!Object.keys(origins).length || Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        session.dragging = true;
        setMenu(null);
        setDrag({ origins, host });
      }
      session.dx = Math.min(Math.max(dx, limits.minX), limits.maxX);
      session.dy = Math.min(Math.max(dy, limits.minY), limits.maxY);
      if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${session.dx}px, ${session.dy}px, 0)`;
    };
    const onUp = (up: PointerEvent) => {
      if (up.pointerId === pointerId) session.end(true);
    };
    const onCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === pointerId) session.end(false);
    };
    const onBlur = () => session.end(false);
    let ended = false;
    session.end = (commit: boolean) => {
      if (ended) return;
      ended = true;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onBlur);
      if (press.current === session) press.current = null;
      if (toggle || session.dragging) swallowNextClick();
      if (!session.dragging) return;
      setDrag(null);
      if (!commit || session.cancelled || (!session.dx && !session.dy)) return;
      arrangeIcons({
        type: "place",
        moves: Object.fromEntries(Object.entries(origins).map(([dragged, point]) => [dragged, { right: point.right - session.dx, top: point.top + session.dy }])),
      });
    };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("blur", onBlur);
    press.current = session;
    // Capture only keeps hover effects off other elements while dragging; tracking does not depend on it.
    try {
      event.currentTarget.setPointerCapture(pointerId);
    } catch {
      /* not capturable; the window listeners still follow the pointer */
    }
  };

  const open = (item: DesktopIconItem, element: HTMLElement | null) => {
    if (item.href) window.open(item.href, "_blank", "noopener,noreferrer");
    else if (element instanceof HTMLButtonElement) item.onOpen?.(element);
  };

  // Links open natively; clicks that end a drag or a modifier-click are swallowed before reaching here.
  const onClick = (event: ReactMouseEvent<HTMLElement>, item: DesktopIconItem) => {
    if (!item.href) open(item, event.currentTarget);
  };

  const iconProps = (item: DesktopIconItem) => ({
    className: iconClassName,
    style: iconStyle(positions[item.id]),
    "data-desktop-icon": item.id,
    "data-selected": selected.includes(item.id) || undefined,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => onPointerDown(event, item.id),
    // Images and links are natively draggable; that would cancel the pointer drag.
    onDragStart: (event: ReactMouseEvent<HTMLElement>) => event.preventDefault(),
    onClick: (event: ReactMouseEvent<HTMLElement>) => onClick(event, item),
  });

  const menuEntries = (): ContextMenuEntry[] => {
    const target = items.find(item => item.id === menu?.iconId);
    const autoSorted = isAutoSorted(iconLayout.sortBy);
    const sortItem = (mode: IconSortMode, text: string): ContextMenuEntry => ({ type: "item", id: `sortBy-${mode}`, label: text, checked: iconLayout.sortBy === mode, onSelect: () => arrangeIcons({ type: "sortBy", mode }) });
    return [
      ...(target ? [
        { type: "item", id: "open", label: copy.open, onSelect: () => open(target, menu?.host.querySelector<HTMLElement>(`[data-desktop-icon="${target.id}"]`) ?? null) },
        { type: "separator", id: "open-separator" },
      ] satisfies ContextMenuEntry[] : []),
      { type: "item", id: "cleanUp", label: copy.cleanUp, disabled: autoSorted, onSelect: () => arrangeIcons({ type: "cleanUp" }) },
      { type: "submenu", id: "cleanUpBy", label: copy.cleanUpBy, disabled: autoSorted, entries: [
        { type: "item", id: "cleanUpBy-name", label: copy.name, onSelect: () => arrangeIcons({ type: "cleanUpBy", order: "name" }) },
        { type: "item", id: "cleanUpBy-kind", label: copy.kind, onSelect: () => arrangeIcons({ type: "cleanUpBy", order: "kind" }) },
      ] },
      { type: "submenu", id: "sortBy", label: copy.sortBy, entries: [
        sortItem("none", copy.none),
        sortItem("grid", copy.grid),
        { type: "separator", id: "sortBy-separator" },
        sortItem("name", copy.name),
        sortItem("kind", copy.kind),
      ] },
      { type: "separator", id: "restore-separator" },
      { type: "item", id: "restore", label: copy.restore, onSelect: () => arrangeIcons({ type: "reset" }) },
    ];
  };

  return <>
    <div ref={layerRef} className={className} inert={!interactive} aria-hidden={!interactive} aria-label={label} data-animate={iconMotion || undefined}>
      {items.map(item => item.href
        ? <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.ariaLabel} draggable={false} {...iconProps(item)}>{item.art}<strong>{copyText(item.title)}</strong></a>
        : <button key={item.id} type="button" aria-label={item.ariaLabel} {...iconProps(item)}>{item.art}<strong>{copyText(item.title)}</strong></button>)}
    </div>
    {drag && createPortal(
      <div ref={ghostRef} className={`${className} ${ghostClassName}`} aria-hidden="true">
        {items.filter(item => drag.origins[item.id]).map(item => <div key={item.id} className={iconClassName} style={iconStyle(drag.origins[item.id])} data-selected="">{item.art}<strong>{copyText(item.title)}</strong></div>)}
      </div>,
      drag.host,
    )}
    {menu && createPortal(
      // Keyed by position: a right-click elsewhere reopens a fresh menu even when React batches close + open.
      <DesktopContextMenu key={`${menu.x},${menu.y}`} host={menu.host} x={menu.x} y={menu.y} label={copy.desktop} entries={menuEntries()} focusFirst={menu.keyboard} onClose={() => setMenu(null)} />,
      menu.host,
    )}
  </>;
}
