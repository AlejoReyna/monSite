import type { Language } from "@/components/lang-context";

/* Dock size for the mac theme. One scalar — the tile edge — drives the whole Dock: glyphs, gaps,
   padding, corners and the gutter the windows and desktop icons keep clear of it. Everything here is
   pure so the handle, the Dock menu and Preferences agree on what a size means. */

export type DockLayout = { size: number };
/** The three sizes the menus offer; the slider in between is the drag handle. */
export type DockSizeName = "small" | "medium" | "large";

export const DOCK_STORAGE_KEY = "mac_dock_v1";
/** Tile edge in px. The default is the size the Dock shipped at, so a first visit looks unchanged. */
export const DOCK_SIZE = { min: 32, default: 48, max: 80, step: 4 } as const;
export const DEFAULT_DOCK_LAYOUT: DockLayout = { size: DOCK_SIZE.default };
export const DOCK_PRESETS: Record<DockSizeName, number> = { small: 36, medium: DOCK_SIZE.default, large: 68 };
export const DOCK_SIZE_NAMES = Object.keys(DOCK_PRESETS) as DockSizeName[];

export const DOCK_COPY: Record<Language, { dock: string; size: string; resize: string; settings: string } & Record<DockSizeName, string>> = {
  en: { dock: "Dock", size: "Dock Size", resize: "Drag to resize the Dock", settings: "Dock Settings…", small: "Small", medium: "Medium", large: "Large" },
  es: { dock: "Dock", size: "Tamaño del Dock", resize: "Arrastra para redimensionar el Dock", settings: "Ajustes del Dock…", small: "Pequeño", medium: "Mediano", large: "Grande" },
};

export const clampDockSize = (size: number): number =>
  Number.isFinite(size) ? Math.min(DOCK_SIZE.max, Math.max(DOCK_SIZE.min, Math.round(size))) : DOCK_SIZE.default;

/** Arrow keys walk a fixed grid, so one press always moves the Dock by the same amount. */
export const stepDockSize = (size: number, steps: number): number => clampDockSize(size + steps * DOCK_SIZE.step);

/** A drag lands anywhere; the menus only tick the preset it matches exactly. */
export const dockPresetOf = (size: number): DockSizeName | null =>
  DOCK_SIZE_NAMES.find(name => DOCK_PRESETS[name] === size) ?? null;

export function sanitizeDockLayout(value: unknown): DockLayout {
  const size = (value as { size?: unknown } | null | undefined)?.size;
  return typeof size === "number" && Number.isFinite(size) ? { size: clampDockSize(size) } : DEFAULT_DOCK_LAYOUT;
}
