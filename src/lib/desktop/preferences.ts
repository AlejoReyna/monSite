"use client";

import {
  DEFAULT_DOCK_LAYOUT,
  DOCK_STORAGE_KEY,
  sanitizeDockLayout,
  type DockLayout,
} from "./dock-layout";
import {
  DEFAULT_ICON_LAYOUT,
  ICON_LAYOUT_STORAGE_KEY,
  sanitizeIconLayout,
  type DesktopIconLayout,
} from "./icon-layout";
import {
  DEFAULT_PREFS,
  PREFS_STORAGE_KEY,
  type AssistantVoiceId,
  type DesktopPreferences,
} from "./types";

const VOICES: AssistantVoiceId[] = ["eve", "ara", "leo", "rex", "sal", "luna"];

function isVoice(value: unknown): value is AssistantVoiceId {
  return typeof value === "string" && (VOICES as string[]).includes(value);
}

export function loadPreferences(): DesktopPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<DesktopPreferences>;
    return {
      reducedMotion: Boolean(parsed.reducedMotion),
      assistantVoice: isVoice(parsed.assistantVoice) ? parsed.assistantVoice : DEFAULT_PREFS.assistantVoice,
      hour12: typeof parsed.hour12 === "boolean" ? parsed.hour12 : DEFAULT_PREFS.hour12,
      soundsEnabled: typeof parsed.soundsEnabled === "boolean" ? parsed.soundsEnabled : DEFAULT_PREFS.soundsEnabled,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePreferences(prefs: DesktopPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

// Icon arrangements last for the browser session: a new visit starts from the curated layout.
export function loadIconLayout(): DesktopIconLayout {
  if (typeof window === "undefined") return DEFAULT_ICON_LAYOUT;
  try {
    const raw = window.sessionStorage.getItem(ICON_LAYOUT_STORAGE_KEY);
    return raw ? sanitizeIconLayout(JSON.parse(raw)) : DEFAULT_ICON_LAYOUT;
  } catch {
    return DEFAULT_ICON_LAYOUT;
  }
}

export function saveIconLayout(layout: DesktopIconLayout): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ICON_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore quota / private mode */
  }
}

// The Dock size shares the icon arrangement's lifetime: it is part of how this visit's desktop is
// laid out, not a setting to carry over to the next one.
export function loadDockLayout(): DockLayout {
  if (typeof window === "undefined") return DEFAULT_DOCK_LAYOUT;
  try {
    const raw = window.sessionStorage.getItem(DOCK_STORAGE_KEY);
    return raw ? sanitizeDockLayout(JSON.parse(raw)) : DEFAULT_DOCK_LAYOUT;
  } catch {
    return DEFAULT_DOCK_LAYOUT;
  }
}

export function saveDockLayout(layout: DockLayout): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Set on <html> so the Dock, the desktop icon layer and the windows that keep clear of it all read
    the same size — they live in sibling trees, and a drag repaints through this without a render. */
export function applyDockSize(size: number): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--mac-dock-size", `${size}px`);
}

export function applyMotionPreference(reduced: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("mac-reduced-motion", reduced);
  document.documentElement.classList.toggle("mac-focus-mode", false);
}

export function applyFocusModeClass(active: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("mac-focus-mode", active);
}
