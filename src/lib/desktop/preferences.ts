"use client";

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

export function applyMotionPreference(reduced: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("mac-reduced-motion", reduced);
  document.documentElement.classList.toggle("mac-focus-mode", false);
}

export function applyFocusModeClass(active: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("mac-focus-mode", active);
}
