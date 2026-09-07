// Port fiel del engine canvas de "Pokefolio Remastered.html"
// Mapa 320x276, pixel-art dibujado por código, sin assets externos.

export interface BuildingHitbox {
  x: number;
  y: number;
  w: number;
  h: number;
  door: number;
  dest: number;
}

export type Face = "up" | "down" | "left" | "right";

const FRONT = [
  ".....OOOOOO.....",
  "...OOHHHHYYOO...",
  "..OHHHYYYYYYHO..",
  "..OHYYYYYYYYHO..",
  ".OHHYYYYYYHHHHO.",
  ".OHHYYHHHHHHHHHO.",
  ".OHHHHHHHHHHHHHO.",
  "..OHHHSSSSSHHHHO",
  "..OHHSSSSSSSHHHO.",
  "..OHSKSSSSSKSHO.",
  "...OGSSSSSSGO...",
  "..OGGGGGGGGGGO..",
  ".OSGGGGGGGGGGSO.",
  ".OSGGOOOOOOGGSO.",
  "....ONNNNNO....",
  "....ONNOONNO....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

const BACK: string[] = [
  ".....OOOOOO.....",
  "...OOHHHHYYOO...",
  "..OHHHYYYYYYHO..",
  "..OHYYYYYYYYHO..",
  ".OHHYYYYYYHHHHO.",
  ".OHHYYHHHHHHHHHO.",
  ".OHHHHHHHHHHHHHO.",
  "..OHHHHHHHHHHHO.",
  "..OHHHHHHHHHHHO.",
  "...OGHHHHHHGO...",
  "..OGGGGGGGGGGO..",
  ".OSGGGGGGGGGGSO.",
  ".OSGGGGGGGGGGSO.",
  "....ONNNNNO....",
  "....ONNOONNO....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

const PALETTE: Record<string, string> = {
  O: "#20242e",
  H: "#6e4a26",
  Y: "#9c6f3f",
  S: "#f2c19b",
  K: "#20242e",
  G: "#34343f",
  N: "#1f1f26",
  W: "#d7d7d7",
  B: "#2e4f9e",
  D: "#33333f",
  // Extras para los sprites dedicados
  C: "#d33f2e", // gorra roja del prota
  L: "#9aa0a6", // pelo canoso del profesor
  R: "#c0392b", // camisa del profesor
};

// ALEXIS, el prota: gorra roja, chamarra azul, como el rival de tu partida.
const ALEXIS_FRONT: string[] = [
  ".....OOOOOO.....",
  "...OOCCCCCCOO...",
  "..OCCCCCCCCCCO..",
  "..OHHSSSSSSHHO..",
  ".OHHSSSSSSSSSHO.",
  ".OHSKSSSSSSKSHO.",
  "..OHSSSSSSSSHO..",
  "...OSSSSSSSSO...",
  "..OBBBBBBBBBBO..",
  "..OBBWWBBBBBBO..",
  "..OSBBBBBBBBSO..",
  "..OSBBBBBBBBSO..",
  "..OGGBBBBBBGGO..",
  "...ONNNNNNNNO...",
  "....ONNNNNO.....",
  "....ONNOONNO....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

const ALEXIS_BACK: string[] = [
  ".....OOOOOO.....",
  "...OOCCCCCCOO...",
  "..OCCCCCCCCCCO..",
  "..OHHHHHHHHHHO..",
  ".OHHHHHHHHHHHHO.",
  ".OHHHHHHHHHHHHO.",
  "..OHHHHHHHHHHO..",
  "...OBBBBBBBBO...",
  "..OBBBBBBBBBBO..",
  "..OBBBBBBBBBBO..",
  "..OBBBBBBBBBBO..",
  "..OBBBBBBBBBBO..",
  "..OBBBBBBBBBBO..",
  "...ONNNNNNNNO...",
  "....ONNNNNO.....",
  "....ONNOONNO....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

// PROF. ROBLE, estilo Oak original: pelo canoso, bata blanca, camisa roja.
const OAK_FRONT: string[] = [
  ".....OOOOOO.....",
  "...OOLLLLLLOO...",
  "..OLLLLLLLLLLO..",
  "..OLSSSSSSSLLO..",
  ".OLSSSKSSKSSLO..",
  ".OLSSSSSSSSSSLO.",
  "..OWWWWWWWWWWO..",
  "..OWWWRRRRWWWO..",
  "..OWWRRRRRRWWO..",
  "..OSWWRRRRWWSO..",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  ".OWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWO.",
  "....OHHHHHO.....",
  "....OHHOHHO.....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

const OAK_BACK: string[] = [
  ".....OOOOOO.....",
  "...OOLLLLLLOO...",
  "..OLLLLLLLLLLO..",
  "..OLLLLLLLLLLO..",
  ".OLLLLLLLLLLLLO.",
  ".OLLLLLLLLLLLLO.",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  "..OWWWWWWWWWWO..",
  ".OWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWO.",
  "....OHHHHHO.....",
  "....OHHOHHO.....",
  "....ODDOODDO....",
  "....OOOOOOOO....",
];

export type Character = "generic" | "player" | "oak";

export function getSpriteRows(face: Face, char: Character = "generic"): string[] {
  return getCharacterRows(char, face);
}

export function getCharacterRows(char: Character, face: Face): string[] {
  if (char === "oak") return face === "up" ? OAK_BACK : OAK_FRONT;
  if (char === "player") return face === "up" ? ALEXIS_BACK : ALEXIS_FRONT;
  return face === "up" ? BACK : FRONT;
}

export function getPalette() {
  return PALETTE;
}

// --- primitivas ---

export function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function poly(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  c: string,
) {
  const lo = Math.min(...points.map((p) => p[1]));
  const hi = Math.max(...points.map((p) => p[1]));
  for (let y = lo; y <= hi; y++) {
    const xs: number[] = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];
      if ((a[1] > y) !== (b[1] > y))
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      rect(ctx, Math.ceil(xs[i]), y, Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1, 1, c);
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  palette: Record<string, string>,
) {
  rows.forEach((row, j) =>
    [...row].forEach((v, i) => {
      if (palette[v]) rect(ctx, x + i, y + j, 1, 1, palette[v]);
    }),
  );
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 8, y + 25, 10, 6, "#527453");
  rect(ctx, x + 10, y + 24, 6, 7, "#6c6550");
  rect(ctx, x + 11, y + 25, 2, 5, "#a69465");
  function inside(i: number, j: number) {
    return (
      (i - 13) ** 2 / 160 + (j - 13) ** 2 / 185 < 1 &&
      !(j < 5 && ((i < 7 && j < 8 - i / 2) || (i > 18 && j < (i - 13) / 2)))
    );
  }
  for (let j = 0; j < 28; j++)
    for (let i = 0; i < 27; i++) {
      if (!inside(i, j)) continue;
      const edge =
        !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1);
      const n = (i * 37 + j * 19 + i * j) % 23;
      let c = edge
        ? "#44572b"
        : j > 21
          ? "#5f702e"
          : i > 20
            ? "#6c802f"
            : n < 4
              ? "#7b9036"
              : n < 8
                ? "#a3b84b"
                : "#8fa53d";
      if (j > 6 && j % 7 === 0 && n < 12) c = "#687e30";
      rect(ctx, x + i, y + j, 1, 1, c);
    }
}

function fence(ctx: CanvasRenderingContext2D, x: number, y: number, n: number) {
  rect(ctx, x, y + 4, n * 5, 2, "#6f9b86");
  rect(ctx, x, y + 8, n * 5, 2, "#5e8779");
  for (let i = 0; i < n; i++) {
    rect(ctx, x + i * 5, y + 1, 3, 12, "#698b86");
    rect(ctx, x + i * 5, y, 2, 10, "#e0e5d0");
    rect(ctx, x + i * 5 + 2, y + 2, 1, 8, "#a4c2b3");
  }
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 2, y + 3, 1, 4, "#5d9969");
  rect(ctx, x, y + 3, 2, 1, "#4d9869");
  rect(ctx, x + 3, y + 4, 2, 1, "#7ab079");
  rect(ctx, x + 1, y, 3, 5, "#f7e4bd");
  rect(ctx, x, y + 1, 5, 3, "#f6ddbc");
  rect(ctx, x + 1, y + 1, 3, 3, "#e9957c");
  rect(ctx, x + 2, y + 2, 1, 1, "#ffeeaa");
}

function sign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 4, y + 7, 2, 7, "#605f43");
  rect(ctx, x, y, 11, 9, "#455b43");
  rect(ctx, x + 1, y + 1, 9, 6, "#c8bb84");
  rect(ctx, x + 2, y + 3, 6, 1, "#847653");
}

function win(ctx: CanvasRenderingContext2D, x: number, y: number, w = 16) {
  rect(ctx, x, y, w, 10, "#3d4d56");
  rect(ctx, x + 1, y + 1, w - 2, 7, "#727d9b");
  rect(ctx, x + 2, y + 2, 4, 3, "#a2aed0");
  rect(ctx, x + 7, y + 1, 1, 8, "#464c6a");
  rect(ctx, x, y + 9, w, 2, "#a8b2bc");
}

function house(ctx: CanvasRenderingContext2D, h: BuildingHitbox) {
  const { x, y, w } = h;
  const q = (pts: [number, number][], c: string) =>
    poly(
      ctx,
      pts.map(([a, b]) => [a + x, b + y] as [number, number]),
      c,
    );
  rect(ctx, x + 4, y + 45, w - 1, 35, "#6d9e7d");
  rect(ctx, x + 4, y + 44, w - 8, 33, "#3c4d4e");
  rect(ctx, x + 6, y + 46, w - 12, 29, "#9ca7ad");
  rect(ctx, x + 7, y + 62, w - 14, 2, "#76889a");
  rect(ctx, x + 7, y + 73, w - 14, 3, "#687889");
  q(
    [
      [0, 24],
      [31, 0],
      [66, 24],
      [66, 59],
      [34, 39],
      [0, 59],
    ],
    "#713e30",
  );
  q(
    [
      [2, 24],
      [31, 2],
      [31, 39],
      [2, 55],
    ],
    "#dd6943",
  );
  q(
    [
      [31, 2],
      [64, 25],
      [64, 55],
      [31, 39],
    ],
    "#b34f32",
  );
  q(
    [
      [13, 19],
      [31, 2],
      [50, 20],
      [50, 49],
      [31, 38],
      [13, 49],
    ],
    "#ec7c4d",
  );
  q([[31, 3], [50, 20], [50, 49], [31, 38]], "#d5603b");
  for (let i = 5; i < 64; i += 5) {
    const top = Math.max(5, 25 - Math.min(i, 66 - i) * 0.67);
    rect(ctx, x + i, y + top, 1, 29, "#ef8855");
    rect(ctx, x + i + 1, y + top + 2, 1, 28, "#bc5033");
  }
  q(
    [
      [5, 52],
      [31, 30],
      [62, 53],
      [62, 60],
      [31, 39],
      [5, 60],
    ],
    "#8a4731",
  );
  q(
    [
      [7, 52],
      [31, 33],
      [60, 53],
      [58, 56],
      [31, 37],
      [9, 56],
    ],
    "#e08951",
  );
  q(
    [
      [16, 57],
      [31, 43],
      [47, 57],
    ],
    "#d5d4c1",
  );
  q(
    [
      [24, 55],
      [31, 47],
      [39, 55],
    ],
    "#68718f",
  );
  rect(ctx, x + 31, y + 47, 1, 9, "#414963");
  rect(ctx, x + 14, y + 65, 15, 10, "#524b3d");
  rect(ctx, x + 15, y + 66, 13, 7, "#b97c43");
  rect(ctx, x + 17, y + 66, 10, 2, "#dfb574");
  win(ctx, x + 36, y + 64, 17);
  rect(ctx, x - 3, y + 65, 5, 12, "#3e5545");
  rect(ctx, x - 4, y + 65, 7, 6, "#973f2f");
  rect(ctx, x - 3, y + 64, 5, 3, "#d36140");
}

function cafe(ctx: CanvasRenderingContext2D, h: BuildingHitbox) {
  const { x, y, w } = h;
  rect(ctx, x + 3, y + 10, w, 50, "#709d7b");
  rect(ctx, x, y, w, 57, "#435655");
  rect(ctx, x + 2, y + 2, w - 4, 29, "#b9c0b5");
  rect(ctx, x + 5, y + 5, w - 10, 23, "#797f83");
  for (let yy = 0; yy < 4; yy++)
    for (let xx = 0; xx < 10; xx++) {
      rect(ctx, x + 7 + xx * 5, y + 7 + yy * 5, 4, 4, yy % 2 ? "#a0a7a3" : "#aab1ad");
    }
  rect(ctx, x + 2, y + 31, w - 4, 23, "#c9be83");
  rect(ctx, x + 2, y + 31, w - 4, 4, "#786f54");
  for (let i = 0; i < 5; i++) {
    rect(ctx, x + 4 + i * 13, y + 34, 11, 5, "#4b506e");
    rect(ctx, x + 5 + i * 13, y + 34, 9, 3, "#777c9a");
  }
  win(ctx, x + 7, y + 43, 18);
  win(ctx, x + 45, y + 43, 17);
  rect(ctx, x + 28, y + 42, 14, 14, "#465e53");
  rect(ctx, x + 30, y + 44, 10, 11, "#77a578");
  rect(ctx, x + 30, y + 45, 1, 9, "#b8cd9b");
  rect(ctx, x + 47, y + 3, 13, 19, "#674948");
  rect(ctx, x + 48, y + 4, 11, 15, "#ad6464");
  rect(ctx, x + 50, y + 4, 8, 6, "#e1a2a1");
  rect(ctx, x + 51, y + 5, 6, 3, "#86504f");
  rect(ctx, x + 46, y + 21, 15, 2, "#6c6060");
}

export function paintTerrain(
  ctx: CanvasRenderingContext2D,
  buildings: BuildingHitbox[],
) {
  rect(ctx, 0, 0, 320, 276, "#80caa1");
  for (let y = 1; y < 276; y += 4)
    for (let x = 1; x < 320; x += 4) {
      const n = (x * 11 + y * 17) % 31;
      if (n < 9) {
        rect(ctx, x, y, 1, 1, "#94d5ab");
        rect(ctx, x + 1, y + 1, 1, 1, "#8ace9e");
      } else if (n > 27) rect(ctx, x, y, 1, 1, "#73c097");
    }
  // Caminos menta conectados
  rect(ctx, 142, 18, 34, 258, "#95d8af");
  rect(ctx, 31, 108, 253, 27, "#95d8af");
  rect(ctx, 146, 207, 145, 23, "#95d8af");
  for (let y = 20; y < 276; y += 4)
    for (let x = 145; x < 174; x += 4)
      if ((x + y) % 12 === 0) rect(ctx, x, y, 1, 2, "#b0e3b8");
  for (const h of buildings) {
    rect(ctx, h.x - 5, h.y + 31, h.w + 10, h.h - 21, "#76c59c");
  }
  // Riachuelo con orilla de piedra
  rect(ctx, 79, 218, 48, 58, "#bca781");
  rect(ctx, 83, 221, 40, 55, "#ede0b8");
  rect(ctx, 86, 223, 34, 53, "#397eb9");
  for (let y = 224; y < 276; y += 6)
    for (let x = 86; x < 120; x += 7) {
      const off = (y * 7 + x) % 5;
      poly(
        ctx,
        [
          [x, y + off],
          [x + 4, y + off - 2],
          [x + 7, y + off + 2],
          [x + 3, y + off + 5],
        ],
        "#458ecc",
      );
      rect(ctx, x + 1, y + off, 3, 1, "#65aadb");
    }
  for (let y = 220; y < 276; y += 7) {
    rect(ctx, 79, y, 4, 3, "#8e8f71");
    rect(ctx, 122, y + 3, 4, 2, "#d4c49b");
  }
  fence(ctx, 53, 150, 10);
  sign(ctx, 106, 151);
  for (let y = 166; y < 188; y += 8)
    for (let x = 55; x < 103; x += 10) flower(ctx, x + (y % 3), y);
  fence(ctx, 183, 225, 13);
  sign(ctx, 226, 215);
  for (let y = 245; y < 266; y += 9)
    for (let x = 173; x < 268; x += 13) flower(ctx, x + (y % 2) * 4, y);

  house(ctx, buildings[0]);
  house(ctx, buildings[1]);
  cafe(ctx, buildings[2]);

  for (let x = -14; x < 322; x += 23) {
    if (x < 128 || x > 180) tree(ctx, x, -12);
  }
  for (let y = 13; y < 278; y += 24) {
    tree(ctx, -14, y);
    tree(ctx, 301, y);
  }
  for (let y = 221; y < 278; y += 24)
    for (let x = 9; x < 78; x += 22) tree(ctx, x, y);
  for (let x = 269; x < 325; x += 23) tree(ctx, x, 251);

  // Hierba alta: zonas de encuentro salvaje (skills)
  for (const g of GRASS_ZONES) {
    rect(ctx, g.x, g.y, g.w, g.h, "#5da86f");
    for (let y = g.y + 2; y < g.y + g.h; y += 6)
      for (let x = g.x + 2; x < g.x + g.w; x += 6) {
        const n = (x * 13 + y * 7) % 5;
        rect(ctx, x, y, 2, 5, n < 2 ? "#4c8f5c" : "#6fbf7f");
        rect(ctx, x + 2, y + 1, 1, 3, "#3f7d4f");
      }
  }
}

// --- capa gamificada: hierba alta, etiquetas, NPCs, "!" ---

export interface GrassZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Jardines a los lados del camino: no bloquean, sí disparan encuentros.
export const GRASS_ZONES: GrassZone[] = [
  { x: 36, y: 188, w: 70, h: 22 },
  { x: 180, y: 240, w: 80, h: 22 },
];

export function inGrass(px: number, py: number): boolean {
  return GRASS_ZONES.some(
    (g) => px >= g.x && px <= g.x + g.w && py >= g.y && py <= g.y + g.h,
  );
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  top: number,
) {
  ctx.font = "8px 'Courier New', monospace";
  const w = ctx.measureText(text).width + 8;
  const bx = Math.min(Math.max(cx - w / 2, 2), 320 - w - 2);
  const by = Math.max(top, 2);
  ctx.fillStyle = "#f4f1d9";
  ctx.fillRect(Math.round(bx), Math.round(by), Math.round(w), 12);
  ctx.strokeStyle = "#263e36";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(w) - 1, 11);
  ctx.fillStyle = "#263e36";
  ctx.fillText(text, Math.round(bx) + 4, Math.round(by) + 9);
}

export function drawExclaim(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t / 180) > 0 ? 0 : 1;
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = "#f4f1d9";
  ctx.fillRect(Math.round(x) - 5, Math.round(y) - 26 - bob, 11, 12);
  ctx.strokeStyle = "#263e36";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) - 5 + 0.5, Math.round(y) - 26 - bob + 0.5, 10, 11);
  ctx.fillStyle = "#c0392b";
  ctx.fillText("!", Math.round(x) - 2, Math.round(y) - 17 - bob);
}

export type NpcTint = "maya" | "beto" | "oak";

const NPC_TINTS: Record<NpcTint, Record<string, string>> = {
  maya: { ...PALETTE, S: "#f2b19b", G: "#7e3b4f", H: "#2e2e3a", Y: "#2e2e3a" },
  beto: { ...PALETTE, S: "#9bd2f2", G: "#2e4f9e", H: "#4a2e26", Y: "#6e4a26" },
  oak: { ...PALETTE, S: "#f2c19b", G: "#e8e8e8", H: "#8a8a8a", Y: "#b5b5b5" },
};

export function getNpcPalette(tint: NpcTint): Record<string, string> {
  return NPC_TINTS[tint];
}

export function drawNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  face: Face,
  tint: NpcTint,
  frame: number,
  sprite: Character = "generic",
) {
  rect(ctx, x - 8, y - 2, 16, 3, "#73b89a");
  const bob = frame % 2 ? 1 : 0;
  const rows = getCharacterRows(sprite, face);
  const pal = sprite === "generic" ? NPC_TINTS[tint] : PALETTE;
  drawSprite(ctx, rows, x - 8, y - 18 - bob, pal);
}

/** Pinta el retrato del personaje en un canvas pequeño (se escala por CSS). */
export function paintPortrait(
  canvas: HTMLCanvasElement,
  char: Character,
  face: Face = "down",
  palette?: Record<string, string>,
) {
  const rows = getCharacterRows(char, face);
  const pal = palette ?? PALETTE;
  const w = Math.max(...rows.map((r) => r.length));
  canvas.width = w;
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, rows.length);
  rows.forEach((row, j) =>
    [...row].forEach((v, i) => {
      if (pal[v]) {
        ctx.fillStyle = pal[v];
        ctx.fillRect(i, j, 1, 1);
      }
    }),
  );
}
