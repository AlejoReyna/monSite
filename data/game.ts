import type { Character, Face, NpcTint } from "@/components/forest/forest-render";

export interface Npc {
  id: string;
  name: string;
  x: number;
  y: number;
  face: Face;
  tint: NpcTint;
  sprite: Character;
  lines: string[];
}

export interface SignPost {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

export const BADGE_KEY = "pokefolio-badges-v1";
export const SEEN_INTRO_KEY = "pokefolio-seen-intro-v1";

export const INTRO_LINES: string[] = [
  "¡Hola! ¡Bienvenido al mundo de POKEFOLIO!",
  "Me llamo ROBLE, soy el PROF. de este pueblo. Este es PUEBLO MONTERREY.",
  "ALEXIS, mi ayudante, es desarrollador Full-stack: interfaces, APIs y nube.",
  "Tu misión de reclutador: visita las 3 casas, habla con todos y consigue 3 MEDALLAS.",
  "Muévete con WASD / flechas o toca el D-pad. Pulsa E o toca para hablar y entrar.",
];

export const TUTORIAL_LINES: string[] = [
  "Llegaste por el camino del sur. ¡Buen aterrizaje, reclutador!",
  "Los carteles SEÑAL se leen con E. Los vecinos con “!” tienen chisme profesional.",
  "La HIERBA ALTA esconde skills salvajes: TypeScript, Go, AWS… ¡atrévete!",
  "Entra a INVERATER, MONETTA y ARTISANALBREW para ganar sus MEDALLAS. ¡Nos vemos!",
];

export const NPCS: Npc[] = [
  {
    id: "maya",
    name: "RECLUTADORA MAYA",
    x: 132,
    y: 124,
    face: "right",
    tint: "maya",
    sprite: "generic",
    lines: [
      "¿Vienes a evaluar a ALEXIS? Buena elección.",
      "En INVERATER sostuvo backend real: Go, Redis, AWS y migración a Atlantic.net.",
      "Tip: entra a la casa del oeste y reclama su MEDALLA BACKEND.",
    ],
  },
  {
    id: "beto",
    name: "DEV BETO",
    x: 200,
    y: 168,
    face: "left",
    tint: "beto",
    sprite: "generic",
    lines: [
      "Yo vi el código de MONETTA. ¡Limpio!",
      "Flutter en la app, React en el dashboard y Shopify sincronizando catálogos.",
      "La casa del noreste es puro COMMERCE de punta a punta.",
    ],
  },
  {
    id: "oak",
    name: "PROF. ROBLE",
    x: 160,
    y: 100,
    face: "down",
    tint: "oak",
    sprite: "oak",
    lines: [
      "El café del sureste es mi favorito: ARTISANALBREW.",
      ".NET con Blazor, PostgreSQL y validación de órdenes. ¡Y robots pixel!",
      "Completa las 3 MEDALLAS y abre la TARJETA ENTRENADOR con T.",
    ],
  },
];

export const SIGNS: SignPost[] = [
  {
    x: 106,
    y: 151,
    title: "SEÑAL DEL OESTE",
    lines: [
      "PUEBLO MONTERREY: ¡donde el código se vuelve aventura!",
      "OESTE: CASA INVERATER (backend). NORESTE: MART MONETTA (commerce). SURESTE: CAFÉ ARTISANALBREW.",
    ],
  },
  {
    x: 226,
    y: 215,
    title: "SEÑAL DEL ESTE",
    lines: [
      "Consejo del PROF. ROBLE: la HIERBA ALTA de abajo esconde skills salvajes.",
      "Camina por ella para descubrir el STACK de ALEXIS. ¡Sin repelente!",
    ],
  },
];

export interface WildSkill {
  name: string;
  text: string;
}

export const WILD_SKILLS: WildSkill[] = [
  { name: "TYPESCRIPT", text: "usa TIPADO SEGURO. ¡Es súper eficaz en frontends grandes!" },
  { name: "GO", text: "usa CONCURRENCIA. ¡Servicio tras servicio sin despeinarse!" },
  { name: "REACT", text: "usa COMPONENTES. ¡ Dashboards que sí se entienden!" },
  { name: "FLUTTER", text: "usa UNA BASE. ¡App de compras en iOS y Android!" },
  { name: "AWS", text: "usa DESPLIEGUE. ¡Infra que aguanta producción!" },
  { name: ".NET", text: "usa BLAZOR. ¡El café abre su tienda sin caerse!" },
  { name: "POSTGRESQL", text: "usa CONSULTA. ¡Órdenes validadas, cero caos!" },
  { name: "REDIS", text: "usa CACHÉ. ¡Velocidad crítica en ventas!" },
];

export function loadBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BADGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function saveBadge(slug: string): string[] {
  const cur = loadBadges();
  if (cur.includes(slug)) return cur;
  const next = [...cur, slug];
  try {
    localStorage.setItem(BADGE_KEY, JSON.stringify(next));
  } catch {
    // almacenamiento no disponible, no pasa nada
  }
  return next;
}
