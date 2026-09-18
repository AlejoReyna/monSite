import type { Language } from "@/components/lang-context";

/* Desktop icon arrangement for the mac theme. Icons move freely like the macOS
   desktop; Clean Up, Clean Up By and Sort By put them back in order. Everything
   here is pure so the store, the menu bar and the icon layer agree on positions. */

export type DesktopIconKind = "folder" | "application" | "web";
export type DesktopIconMeta = { id: string; title: string; kind: DesktopIconKind };
/** Offset of an icon's top-right corner from the desktop's top-right corner, so
    moved icons follow the right edge on resize just like the default columns. */
export type IconPoint = { right: number; top: number };
export type IconBounds = { width: number; height: number };
export type IconSortKey = "name" | "kind";
export type IconSortMode = "none" | "grid" | IconSortKey;
export type IconOrder = "default" | IconSortKey;
export type DesktopIconLayout = {
  sortBy: IconSortMode;
  /** Arrangement shown while `positions` is null: never moved, or cleaned up by a key. */
  order: IconOrder;
  positions: Record<string, IconPoint> | null;
};
export type DesktopIconCommand =
  | { type: "cleanUp" }
  | { type: "cleanUpBy"; order: IconOrder }
  | { type: "sortBy"; mode: IconSortMode }
  | { type: "place"; moves: Record<string, IconPoint> }
  | { type: "reset" };
export type IconLayoutContext = { items: DesktopIconMeta[]; bounds: IconBounds | null };

export const ICON_LAYOUT_STORAGE_KEY = "mac_desktop_icons_v1";
export const DEFAULT_ICON_LAYOUT: DesktopIconLayout = { sortBy: "none", order: "default", positions: null };
/** Same geometry as the original two-column grid: 124px columns, 14px/8px gaps, 15px from the top and 22px from the right. */
export const ICON_GRID = { width: 124, height: 88, gapX: 8, gapY: 14, top: 15, right: 22, columns: 2 } as const;
/** Width the default icon columns claim along the desktop's right edge: margin,
    both columns and the gap between them. Windows open clear of this strip, so
    changing the grid above moves them instead of burying the icons. */
export const ICON_COLUMN_STRIP =
  ICON_GRID.right + ICON_GRID.columns * ICON_GRID.width + (ICON_GRID.columns - 1) * ICON_GRID.gapX;
export const ICON_SORT_MODES: readonly IconSortMode[] = ["none", "grid", "name", "kind"];
const ICON_ORDERS: readonly IconOrder[] = ["default", "name", "kind"];
const PITCH_X = ICON_GRID.width + ICON_GRID.gapX;
const PITCH_Y = ICON_GRID.height + ICON_GRID.gapY;
/** A drop covering more than this share of another icon is nudged to the nearest free cell. */
const MAX_OVERLAP = 0.5;

export const ICON_KIND_LABELS: Record<DesktopIconKind, Record<Language, string>> = {
  folder: { en: "Folder", es: "Carpeta", zh: "文件夹" },
  application: { en: "Application", es: "Aplicación", zh: "应用程序" },
  web: { en: "Web Location", es: "Ubicación web", zh: "网页位置" },
};

export const ICON_ARRANGE_COPY: Record<Language, { desktop: string; view: string; open: string; cleanUp: string; cleanUpBy: string; sortBy: string; none: string; grid: string; name: string; kind: string; restore: string }> = {
  en: { desktop: "Desktop", view: "View", open: "Open", cleanUp: "Clean Up", cleanUpBy: "Clean Up By", sortBy: "Sort By", none: "None", grid: "Snap to Grid", name: "Name", kind: "Kind", restore: "Restore Default Layout" },
  es: { desktop: "Escritorio", view: "Visualización", open: "Abrir", cleanUp: "Ordenar", cleanUpBy: "Ordenar por", sortBy: "Clasificar por", none: "Ninguno", grid: "Ajustar a la cuadrícula", name: "Nombre", kind: "Tipo", restore: "Restaurar disposición original" },
  zh: { desktop: "桌面", view: "显示", open: "打开", cleanUp: "整理", cleanUpBy: "整理方式", sortBy: "排序方式", none: "无", grid: "吸附到网格", name: "名称", kind: "种类", restore: "恢复默认排列" },
};

/** Name and Kind keep icons arranged; dragging them snaps back, as on macOS. */
export const isAutoSorted = (mode: IconSortMode): mode is IconSortKey => mode === "name" || mode === "kind";

export function sortIcons(items: DesktopIconMeta[], order: IconOrder, language: Language): DesktopIconMeta[] {
  if (order === "default") return items;
  const collator = new Intl.Collator(language, { sensitivity: "base", numeric: true });
  // Array sort is stable, so ties keep the curated order.
  return [...items].sort((a, b) =>
    (order === "kind" ? collator.compare(ICON_KIND_LABELS[a.kind][language], ICON_KIND_LABELS[b.kind][language]) : 0)
    || collator.compare(a.title, b.title));
}

const cellPoint = (column: number, row: number): IconPoint => ({ right: ICON_GRID.right + column * PITCH_X, top: ICON_GRID.top + row * PITCH_Y });
const fits = (size: number, margin: number, box: number, pitch: number) => Math.max(1, Math.floor((size - margin - box) / pitch) + 1);
const distance = (a: IconPoint, b: IconPoint) => (a.right - b.right) ** 2 + (a.top - b.top) ** 2;
const overlap = (a: IconPoint, b: IconPoint) =>
  Math.max(0, ICON_GRID.width - Math.abs(a.right - b.right)) * Math.max(0, ICON_GRID.height - Math.abs(a.top - b.top)) / (ICON_GRID.width * ICON_GRID.height);

/** Tidy block anchored top-right: at least two columns, filled row by row, left to right. */
export function arrangeIconGrid(items: DesktopIconMeta[], bounds: IconBounds | null): Record<string, IconPoint> {
  const rows = bounds ? fits(bounds.height, ICON_GRID.top, ICON_GRID.height, PITCH_Y) : items.length;
  const columns = Math.max(ICON_GRID.columns, Math.ceil(items.length / rows));
  return Object.fromEntries(items.map((item, index) => [item.id, cellPoint(columns - 1 - index % columns, Math.floor(index / columns))]));
}

/** Every cell that fits on the desktop, rightmost column first; always room for `count` icons. */
function gridCells(bounds: IconBounds | null, count: number): IconPoint[] {
  const columns = bounds ? fits(bounds.width, ICON_GRID.right, ICON_GRID.width, PITCH_X) : count;
  const rows = Math.max(bounds ? fits(bounds.height, ICON_GRID.top, ICON_GRID.height, PITCH_Y) : count, Math.ceil(count / columns));
  return Array.from({ length: rows * columns }, (_, index) => cellPoint(index % columns, Math.floor(index / columns)));
}

function nearestCell(point: IconPoint, cells: IconPoint[], taken: ReadonlySet<number> = new Set()): number {
  let best = -1;
  cells.forEach((cell, index) => {
    if (!taken.has(index) && (best < 0 || distance(point, cell) < distance(point, cells[best]))) best = index;
  });
  return best;
}

/** Moves `ids` to the nearest free cells, closest icons first; every other icon holds the cell nearest to it. */
function snapToGrid(points: Record<string, IconPoint>, ids: string[], bounds: IconBounds | null): Record<string, IconPoint> {
  const cells = gridCells(bounds, Object.keys(points).length);
  const moving = new Set(ids);
  const taken = new Set(Object.entries(points).filter(([id]) => !moving.has(id)).map(([, point]) => nearestCell(point, cells)));
  const next = { ...points };
  ids
    .map((id, index) => ({ id, index, gap: distance(points[id], cells[nearestCell(points[id], cells)]) }))
    .sort((a, b) => a.gap - b.gap || a.index - b.index)
    .forEach(({ id }) => {
      const cell = nearestCell(points[id], cells, taken);
      taken.add(cell);
      next[id] = cells[cell];
    });
  return next;
}

export function clampIconPoint(point: IconPoint, bounds: IconBounds): IconPoint {
  const clamp = (value: number, max: number) => Math.min(Math.max(0, value), Math.max(0, max));
  return { right: clamp(point.right, bounds.width - ICON_GRID.width), top: clamp(point.top, bounds.height - ICON_GRID.height) };
}

/** Where each icon is drawn. Clamping is not stored, so a narrow window never rewrites the saved layout. */
export function resolveIconPositions(layout: DesktopIconLayout, items: DesktopIconMeta[], bounds: IconBounds | null, language: Language): Record<string, IconPoint> {
  let points: Record<string, IconPoint>;
  if (isAutoSorted(layout.sortBy) || !layout.positions) {
    points = arrangeIconGrid(sortIcons(items, isAutoSorted(layout.sortBy) ? layout.sortBy : layout.order, language), bounds);
  } else {
    const stored = layout.positions;
    points = Object.fromEntries(items.filter(item => stored[item.id]).map(item => [item.id, stored[item.id]]));
    // Icons added after the layout was saved take the first free cell, like new files on a Mac.
    const cells = gridCells(bounds, items.length);
    const taken = new Set(Object.values(points).map(point => nearestCell(point, cells)));
    for (const item of items) {
      if (points[item.id]) continue;
      const cell = cells.findIndex((_, index) => !taken.has(index));
      taken.add(cell);
      points[item.id] = cells[cell];
    }
  }
  return bounds ? Object.fromEntries(Object.entries(points).map(([id, point]) => [id, clampIconPoint(point, bounds)])) : points;
}

export function applyIconCommand(layout: DesktopIconLayout, command: DesktopIconCommand, { items, bounds }: IconLayoutContext, language: Language): DesktopIconLayout {
  const ids = items.map(item => item.id);
  switch (command.type) {
    case "reset":
      return DEFAULT_ICON_LAYOUT;
    case "sortBy":
      if (command.mode === layout.sortBy) return layout;
      // Leaving Name/Kind keeps that arrangement (order was set when it was chosen).
      if (isAutoSorted(command.mode)) return { sortBy: command.mode, order: command.mode, positions: null };
      if (command.mode === "grid" && layout.positions && ids.length) {
        return { ...layout, sortBy: "grid", positions: snapToGrid(resolveIconPositions(layout, items, bounds, language), ids, bounds) };
      }
      return { ...layout, sortBy: command.mode };
    case "cleanUp":
      if (isAutoSorted(layout.sortBy) || !layout.positions || !ids.length) return layout;
      return { ...layout, positions: snapToGrid(resolveIconPositions(layout, items, bounds, language), ids, bounds) };
    case "cleanUpBy":
      if (isAutoSorted(layout.sortBy)) return layout;
      return { ...layout, order: command.order, positions: null };
    case "place": {
      if (isAutoSorted(layout.sortBy)) return layout;
      const points = resolveIconPositions(layout, items, bounds, language);
      const moved = Object.keys(command.moves).filter(id => points[id]);
      if (!moved.length) return layout;
      const next = { ...points };
      for (const id of moved) {
        const point = { right: Math.round(command.moves[id].right), top: Math.round(command.moves[id].top) };
        next[id] = bounds ? clampIconPoint(point, bounds) : point;
      }
      const movedSet = new Set(moved);
      const snapping = layout.sortBy === "grid"
        ? moved
        : moved.filter(id => ids.some(other => !movedSet.has(other) && overlap(next[id], next[other]) > MAX_OVERLAP));
      return { ...layout, positions: snapping.length ? snapToGrid(next, snapping, bounds) : next };
    }
  }
}

export function sanitizeIconLayout(value: unknown): DesktopIconLayout {
  if (!value || typeof value !== "object") return DEFAULT_ICON_LAYOUT;
  const raw = value as { sortBy?: unknown; order?: unknown; positions?: unknown };
  const sortBy = ICON_SORT_MODES.find(mode => mode === raw.sortBy) ?? "none";
  if (isAutoSorted(sortBy)) return { sortBy, order: sortBy, positions: null };
  const order = ICON_ORDERS.find(item => item === raw.order) ?? "default";
  const entries = raw.positions && typeof raw.positions === "object"
    ? Object.entries(raw.positions as Record<string, unknown>).flatMap(([id, point]) => {
      const { right, top } = (point ?? {}) as { right?: unknown; top?: unknown };
      return typeof right === "number" && typeof top === "number" && Number.isFinite(right) && Number.isFinite(top) && right >= 0 && top >= 0
        ? [[id, { right, top }] as const]
        : [];
    })
    : [];
  return { sortBy, order, positions: entries.length ? Object.fromEntries(entries) : null };
}
