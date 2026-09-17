export type PixelLayer = { width: number; height: number; paths: { key: string; d: string; fill: string }[] };

// Each row is one art pixel tall; runs of the same palette key merge into one crisp path.
export function pixelLayer(rows: readonly string[], palette: Record<string, string>): PixelLayer {
  const paths = new Map<string, string>();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let end = x + 1;
      while (row[end] === row[x]) end += 1;
      if (palette[row[x]]) paths.set(row[x], `${paths.get(row[x]) ?? ""}M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  return { width: rows[0].length, height: rows.length, paths: Array.from(paths, ([key, d]) => ({ key, d, fill: palette[key] })) };
}

export function PixelArt({ layers, scale, className }: { layers: PixelLayer[]; scale: number; className?: string }) {
  const [{ width, height }] = layers;
  return <svg className={className} width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true">
    {layers.flatMap((layer, index) => layer.paths.map(path => <path key={`${index}${path.key}`} d={path.d} fill={path.fill} data-pixel={path.key} />))}
  </svg>;
}

const LIGHT = ["..ooo..", ".owcco.", "owcccco", "occccco", "occccco", ".occco.", "..ooo.."];

// Glyph pixels ("g") stay hidden until the lights are hovered, as on macOS.
export const PIXEL_TRAFFIC = {
  close: [pixelLayer(LIGHT, { o: "#7c241e", w: "#ffb4ae", c: "#ff5f57" }), pixelLayer([".......", ".......", "..g.g..", "...g...", "..g.g..", ".......", "......."], { g: "#4d0d09" })],
  minimize: [pixelLayer(LIGHT, { o: "#7a5200", w: "#ffe3a3", c: "#febc2e" }), pixelLayer([".......", ".......", ".......", "..ggg..", ".......", ".......", "......."], { g: "#5c3b00" })],
  maximize: [pixelLayer(LIGHT, { o: "#0f5c1d", w: "#a3f2ad", c: "#29c840" }), pixelLayer([".......", ".......", "...g...", "..ggg..", "...g...", ".......", "......."], { g: "#0a4414" })],
  restore: [pixelLayer(LIGHT, { o: "#0f5c1d", w: "#a3f2ad", c: "#29c840" }), pixelLayer([".......", ".......", "...g...", "..g.g..", "...g...", ".......", "......."], { g: "#0a4414" })],
};

export const PIXEL_ARROWS = {
  back: [pixelLayer(["...a...", "..a....", ".a.....", "aaaaaaa", ".a.....", "..a....", "...a..."], { a: "currentColor" })],
  open: [pixelLayer(["...aaaa", ".....aa", "....a.a", "...a..a", "..a....", ".a.....", "a......"], { a: "currentColor" })],
};
