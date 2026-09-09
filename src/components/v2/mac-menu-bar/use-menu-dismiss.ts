"use client";

import { useEffect, useRef } from "react";
import type { MenuId } from "@/lib/desktop/types";

export function useMenuDismiss(
  openMenu: MenuId,
  setOpenMenu: (id: MenuId) => void,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        // Spotlight is portaled conceptually as fixed; still close when outside bar
        // except when search/assistant panels handle their own overlay.
        if (openMenu !== "search") setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [openMenu, setOpenMenu, rootRef]);
}

export function useHoverSwitch(
  openMenu: MenuId,
  setOpenMenu: (id: MenuId) => void,
  menuId: MenuId,
  enabled: boolean,
) {
  return {
    onMouseEnter: () => {
      if (enabled && openMenu && openMenu !== menuId && openMenu !== "search" && openMenu !== "assistant" && openMenu !== "datetime" && openMenu !== "overflow") {
        setOpenMenu(menuId);
      }
    },
  };
}

export function useOutsideClick(
  open: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onCloseRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref]);
}
