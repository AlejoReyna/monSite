"use client";

import { useCopy } from "@/components/use-copy";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./desktop-context-menu.module.css";

export type ContextMenuEntry =
  | { type: "item"; id: string; label: string; onSelect: () => void; disabled?: boolean; /** Set for radio items. */ checked?: boolean }
  | { type: "submenu"; id: string; label: string; entries: ContextMenuEntry[]; disabled?: boolean }
  | { type: "separator"; id: string };

const ITEMS = ':scope > [role^="menuitem"]:not(:disabled), :scope > [data-submenu] > [role="menuitem"]:not(:disabled)';
const itemsOf = (menu: Element | null) => (menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEMS)) : []);

/** macOS-style context menu with one level of submenus, positioned inside `host` at client point (x, y). */
export default function DesktopContextMenu({ host, x, y, label, entries, focusFirst, onClose }: {
  host: HTMLElement;
  x: number;
  y: number;
  label: string;
  entries: ContextMenuEntry[];
  /** Keyboard-opened menus start on their first item. */
  focusFirst: boolean;
  onClose: () => void;
}) {
  const copyText = useCopy();
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const focusSubmenu = useRef(false);
  const onCloseRef = useRef(onClose);
  const [submenu, setSubmenu] = useState<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Open at the pointer; flip left or shift up when the desktop edge is near.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const area = host.getBoundingClientRect();
    const left = x - area.left;
    const top = y - area.top;
    menu.style.left = `${Math.max(4, left + menu.offsetWidth > area.width - 4 ? left - menu.offsetWidth : left)}px`;
    menu.style.top = `${Math.max(4, Math.min(top, area.height - menu.offsetHeight - 4))}px`;
  }, [host, x, y]);

  useLayoutEffect(() => {
    const panel = submenu ? menuRef.current?.querySelector<HTMLElement>(`[data-submenu="${submenu}"] > [role="menu"]`) : null;
    if (!panel) return;
    const area = host.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    panel.dataset.flip = String(rect.right > area.right - 4);
    if (rect.bottom > area.bottom - 4) panel.style.translate = `0 ${area.bottom - 4 - rect.bottom}px`;
  }, [host, submenu]);

  useEffect(() => {
    if (!submenu || !focusSubmenu.current) return;
    focusSubmenu.current = false;
    itemsOf(menuRef.current?.querySelector(`[data-submenu="${submenu}"] > [role="menu"]`) ?? null)[0]?.focus({ preventScroll: true });
  }, [submenu]);

  useEffect(() => {
    const menu = menuRef.current;
    previousFocus.current = document.activeElement as HTMLElement | null;
    (focusFirst ? itemsOf(menu)[0] : menu)?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      if (!menu?.contains(event.target as Node)) onCloseRef.current();
    };
    const dismiss = () => onCloseRef.current();
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [focusFirst]);

  const close = () => {
    if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    onClose();
  };

  const openSubmenu = (id: string, focus: boolean) => {
    focusSubmenu.current = focus;
    setSubmenu(id);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const current = event.target as HTMLElement;
    const list = current.closest('[role="menu"]');
    const items = itemsOf(list);
    const index = items.indexOf(current);
    const move = (to: number) => {
      event.preventDefault();
      items[(to + items.length) % items.length]?.focus({ preventScroll: true });
    };
    const backToTrigger = () => {
      event.preventDefault();
      setSubmenu(null);
      list?.parentElement?.querySelector<HTMLElement>(':scope > [role="menuitem"]')?.focus({ preventScroll: true });
    };
    const inSubmenu = list !== menuRef.current;
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index < 0 ? -1 : index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(-1);
    else if (event.key === "ArrowRight" && current.dataset.entry) {
      event.preventDefault();
      openSubmenu(current.dataset.entry, true);
    } else if (event.key === "ArrowLeft" && inSubmenu) backToTrigger();
    else if (event.key === "Escape" && inSubmenu) backToTrigger();
    else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close();
    }
  };

  // Hover highlights through focus, so mouse and keyboard share one active item.
  const hover = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") return;
    const item = event.currentTarget;
    item.focus({ preventScroll: true });
    if (item.parentElement === menuRef.current) setSubmenu(null);
    if (item.dataset.entry && item.closest('[role="menu"]') === menuRef.current) setSubmenu(item.dataset.entry);
  };

  const render = (list: ContextMenuEntry[]) => list.map(entry => {
    if (entry.type === "separator") return <div key={entry.id} className={styles.separator} role="separator" />;
    if (entry.type === "submenu") {
      const open = submenu === entry.id;
      return <div key={entry.id} className={styles.submenuWrap} data-submenu={entry.id}>
        <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={open} disabled={entry.disabled} data-entry={entry.id} className={styles.item} onPointerEnter={hover} onClick={() => openSubmenu(entry.id, true)}>
          <span className={styles.check} aria-hidden="true" /><span>{copyText(entry.label)}</span><span className={styles.chevron} aria-hidden="true">›</span>
        </button>
        {open && <div role="menu" aria-label={copyText(entry.label)} className={`${styles.menu} ${styles.submenu}`}>{render(entry.entries)}</div>}
      </div>;
    }
    return <button key={entry.id} type="button" role={entry.checked === undefined ? "menuitem" : "menuitemradio"} aria-checked={entry.checked} disabled={entry.disabled} className={styles.item} onPointerEnter={hover} onClick={() => { entry.onSelect(); close(); }}>
      <span className={styles.check} aria-hidden="true">{entry.checked ? "✓" : ""}</span><span>{copyText(entry.label)}</span>
    </button>;
  });

  return <div ref={menuRef} role="menu" aria-label={label} tabIndex={-1} data-desktop-menu="" className={styles.menu} onKeyDown={onKeyDown} onContextMenu={event => event.preventDefault()}>
    {render(entries)}
  </div>;
}
