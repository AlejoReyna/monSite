// Sistema de colisiones del pueblo.
// Cada sólido es un rectángulo en coordenadas del mapa 320x276.
// El jugador se trata como un punto (sus pies) con radio pequeño.
// El movimiento libre resuelve por ejes (X luego Y) para poder
// deslizarse por las paredes en vez de quedarse pegado.

import type { BuildingHitbox } from "./forest-render";

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PLAYER_RADIUS = 2;

export function buildSolids(buildings: BuildingHitbox[]): Solid[] {
  const solids: Solid[] = [];

  // Casas + café: bloquean el cuerpo del edificio.
  // La puerta queda fuera (dest está ~13-15px debajo de y+h), así que
  // el jugador sí puede pararse frente a la puerta y entrar.
  for (const h of buildings) {
    solids.push({ x: h.x - 5, y: h.y + 10, w: h.w + 10, h: h.h - 10 });
  }

  // Cercas: fence(x,y,n) mide n*5 de ancho y ~13 de alto.
  solids.push({ x: 53, y: 150, w: 10 * 5, h: 13 });
  solids.push({ x: 183, y: 225, w: 13 * 5, h: 13 });

  // Señales: poste + tablero (caja ajustada para no bloquear la puerta vecina).
  solids.push({ x: 107, y: 154, w: 9, h: 11 });
  solids.push({ x: 227, y: 218, w: 9, h: 11 });

  // Riachuelo + orilla: bloquea cruzar el agua (sin surf no hay paso).
  solids.push({ x: 79, y: 218, w: 48, h: 58 });

  // Árboles: replican los mismos loops que paintTerrain.
  // Caja por árbol (x+5..x+22, y+12..y+31): bloquea tronco y copa,
  // deja ~6px de hueco entre árboles contiguos para senderos.
  const treeSolid = (x: number, y: number) => {
    solids.push({ x: x + 5, y: y + 12, w: 17, h: 19 });
  };
  for (let x = -14; x < 322; x += 23) {
    if (x < 128 || x > 180) treeSolid(x, -12);
  }
  for (let y = 13; y < 278; y += 24) {
    treeSolid(-14, y);
    treeSolid(301, y);
  }
  for (let y = 221; y < 278; y += 24)
    for (let x = 9; x < 78; x += 22) treeSolid(x, y);
  for (let x = 269; x < 325; x += 23) treeSolid(x, 251);

  return solids;
}

export function hitsSolid(px: number, py: number, solids: Solid[]): boolean {
  const r = PLAYER_RADIUS;
  for (const s of solids) {
    if (px + r > s.x && px - r < s.x + s.w && py + r > s.y && py - r < s.y + s.h) {
      return true;
    }
  }
  return false;
}

/** Intenta mover el punto: primero X, luego Y. Devuelve la posición resuelta. */
export function moveWithCollision(
  px: number,
  py: number,
  dx: number,
  dy: number,
  solids: Solid[],
): { x: number; y: number; blockedX: boolean; blockedY: boolean } {
  let x = px;
  let y = py;
  let blockedX = false;
  let blockedY = false;
  if (dx !== 0) {
    const nx = x + dx;
    if (hitsSolid(nx, y, solids)) blockedX = true;
    else x = nx;
  }
  if (dy !== 0) {
    const ny = y + dy;
    if (hitsSolid(x, ny, solids)) blockedY = true;
    else y = ny;
  }
  return { x, y, blockedX, blockedY };
}
