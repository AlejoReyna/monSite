import type { Language } from "@/components/lang-context";

export type DesktopWindowId = "finder" | "terminal" | "mail" | "about" | "preferences" | "tour";

export type DesktopWindow = {
  id: DesktopWindowId;
  title: string;
  open: boolean;
  focused: boolean;
};

export type AssistantVoiceId = "eve" | "ara" | "leo" | "rex" | "sal" | "luna";

export type DesktopPreferences = {
  reducedMotion: boolean;
  assistantVoice: AssistantVoiceId;
  hour12: boolean;
  soundsEnabled: boolean;
};

export type ConnectionStatus = "checking" | "reachable" | "unreachable";

export type FocusModeState = {
  active: boolean;
  endsAt: number | null;
};

export type AssistantState =
  | "idle"
  | "listening"
  | "thinking"
  | "executing"
  | "speaking"
  | "interrupted"
  | "error";

export type AllowlistedActionName =
  | "answer_portfolio"
  | "open_projects"
  | "explain_project"
  | "navigate_contact"
  | "change_language"
  | "toggle_focus"
  | "open_terminal";

export type DesktopAction =
  | { type: "answer_portfolio"; args: { topic?: string } }
  | { type: "open_projects"; args?: { projectId?: string } }
  | { type: "explain_project"; args: { projectId: string } }
  | { type: "navigate_contact"; args?: Record<string, never> }
  | { type: "change_language"; args: { language: Language } }
  | { type: "toggle_focus"; args: { enabled?: boolean } }
  | { type: "open_terminal"; args?: Record<string, never> };

export type MenuId =
  | "apple"
  | "app"
  | "file"
  | "go"
  | "window"
  | "help"
  | "focus"
  | "connection"
  | "battery"
  | "search"
  | "assistant"
  | "datetime"
  | "overflow"
  | null;

export type SpotlightResultKind = "project" | "page" | "command";

export type SpotlightResult = {
  id: string;
  kind: SpotlightResultKind;
  title: string;
  subtitle?: string;
  keywords: string[];
  action: () => void;
};

export const PREFS_STORAGE_KEY = "mac_desktop_prefs_v1";
export const FOCUS_DURATION_MS = 25 * 60 * 1000;
export const ASSISTANT_NAME = "Orbit";
export const DEFAULT_PREFS: DesktopPreferences = {
  reducedMotion: false,
  assistantVoice: "eve",
  hour12: true,
  soundsEnabled: true,
};
