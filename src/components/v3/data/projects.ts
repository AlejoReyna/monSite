/* ══════════════════════════════════════════
   V3 — Projects data
   Source of truth for ProjectsCarousel.
   Adapted from src/components/v2/projects-v2.tsx
   ══════════════════════════════════════════ */

export interface V3Link {
  href: string;
  label: { es: string; en: string; };
}

export interface V3Project {
  id: string;
  media: string | null;
  mediaType: "video" | "image" | "none";
  badge: string;
  title: string;
  tagline: { es: string; en: string; };
  description: { es: string; en: string; };
  tags: string[];
  links: V3Link[];
  ghost: string; // roman numeral, e.g. "I", "II" …
  accent?: string; // optional per-card accent override
}

export const PROJECTS: V3Project[] = [
  {
    id: "plebes-dao",
    media: "/plebes_video.mp4",
    mediaType: "video",
    badge: "DAO · ICP",
    title: "Plebes DAO",
    tagline: {
      es: "Gobernanza comunal con estética internet-native.",
      en: "Community governance meets internet-native aesthetics.",
    },
    description: {
      es: "DAO impulsada por la comunidad en Internet Computer. Diseño completo, branding y experiencia de usuario desde cero.",
      en: "Community-driven DAO on Internet Computer. Full design, branding and UX built from scratch.",
    },
    tags: ["ICP", "Motoko", "Figma", "Branding", "UI/UX"],
    links: [
      { href: "https://plebes.xyz", label: { es: "Demo en vivo", en: "Live demo" } },
    ],
    ghost: "I",
  },
  {
    id: "andrea-aldo",
    media: "/wedding_preview.mp4",
    mediaType: "video",
    badge: "Wedding · 2024",
    title: "Andrea & Aldo",
    tagline: {
      es: "Cada scroll, un momento conservado para siempre.",
      en: "Every scroll, a moment preserved forever.",
    },
    description: {
      es: "Invitación de boda interactiva con flujo RSVP completo, cronograma e integración de mapas.",
      en: "Interactive wedding invitation with full RSVP flow, schedule and maps integration.",
    },
    tags: ["Next.js", "Google Maps", "Nodemailer", "Framer Motion"],
    links: [
      { href: "https://aldoyandrea.com", label: { es: "Demo en vivo", en: "Live demo" } },
      { href: "https://github.com/AlejoReyna/wedding_invitation", label: { es: "GitHub", en: "GitHub" } },
    ],
    ghost: "II",
  },
  {
    id: "mk1-presale",
    media: "/mk-banner.png",
    mediaType: "image",
    badge: "Landing · Case study",
    title: "MK1 Presale",
    tagline: {
      es: "Landing inmersiva con más de 2,000 pre-registros.",
      en: "Immersive presale landing with 2,000+ pre-registrations.",
    },
    description: {
      es: "Next.js con backend de correos y pre-registros en PostgreSQL. Confirmación automática vía Nodemailer.",
      en: "Next.js with email backend and pre-registrations in PostgreSQL. Auto-confirmation via Nodemailer.",
    },
    tags: ["Next.js", "PostgreSQL", "Nodemailer", "Tailwind"],
    links: [
      { href: "https://github.com/AlejoReyna/MortalKombat", label: { es: "GitHub", en: "GitHub" } },
      { href: "https://next-mk.vercel.app", label: { es: "Demo en vivo", en: "Live demo" } },
    ],
    ghost: "III",
  },
  {
    id: "pokefolio",
    media: "/preview_pokefolio.mp4",
    mediaType: "video",
    badge: "Portfolio",
    title: "PokeFolio",
    tagline: {
      es: "Un portfolio que juega el juego contigo.",
      en: "A portfolio that plays the game with you.",
    },
    description: {
      es: "Portfolio estilo Pokémon con typewriter, diálogos del juego y reproductor de música. Next.js + Tailwind.",
      en: "Pokémon-style portfolio with typewriter effect, game dialogs and music player. Next.js + Tailwind.",
    },
    tags: ["Next.js", "Tailwind", "Framer Motion", "Web Audio"],
    links: [
      { href: "https://github.com/AlejoReyna/PokeFolio", label: { es: "GitHub", en: "GitHub" } },
      { href: "https://poke-folio.vercel.app", label: { es: "Demo en vivo", en: "Live demo" } },
    ],
    ghost: "IV",
  },
  {
    id: "uanl-interface",
    media: "/preview-siase.mp4",
    mediaType: "video",
    badge: "Open Source · MV3",
    title: "UANL Interface+",
    tagline: {
      es: "UI universitaria liberada de frames heredados.",
      en: "University UI liberated from legacy frames.",
    },
    description: {
      es: "Extensión Chrome/Firefox que inyecta UI propia y reorganiza menús en páginas universitarias con frames. Content scripts + Shadow DOM.",
      en: "Chrome/Firefox extension that injects a custom UI layer and reorganizes menus on frame-based university pages. Content scripts + Shadow DOM.",
    },
    tags: ["Vite", "TypeScript", "Shadow DOM", "MV3"],
    links: [
      { href: "https://github.com/AlejoReyna/UANLInterface", label: { es: "GitHub", en: "GitHub" } },
      { href: "https://uanl-interface.vercel.app", label: { es: "Demo", en: "Demo" } },
    ],
    ghost: "V",
  },
  {
    id: "mpbot",
    media: "/avocado.PNG",
    mediaType: "image",
    badge: "ETH Mérida · Bronze",
    title: "mpBot",
    tagline: {
      es: "DeFi en lenguaje conversacional, en 48 horas.",
      en: "DeFi made conversational, built in 48 hours.",
    },
    description: {
      es: "Bot de Telegram para staking con Meta Pool y Q&A sobre DeFi. Construido en 48 h con Next.js + Telegraf + OpenAI.",
      en: "Telegram bot for Meta Pool staking and DeFi Q&A. Built in 48 h with Next.js + Telegraf + OpenAI.",
    },
    tags: ["Next.js", "Telegraf", "OpenAI", "Meta Pool"],
    links: [
      { href: "https://github.com/AlejoReyna/mpBOT", label: { es: "GitHub", en: "GitHub" } },
      { href: "https://t.me/PoolitoAssistantBot", label: { es: "Probar en Telegram", en: "Try on Telegram" } },
    ],
    ghost: "VI",
  },
  {
    id: "birdlypay",
    media: "https://raw.githubusercontent.com/AlejoReyna/Birdlypay/main/BIRDLY_PAY_BANNER.jpg",
    mediaType: "image",
    badge: "Base · Onchain Summer",
    title: "Birdlypay",
    tagline: {
      es: "Paga a cualquiera on-chain con un solo enlace.",
      en: "Pay anyone on-chain with a single link.",
    },
    description: {
      es: "dApp para crear enlaces de pago compartibles on-chain. Contratos en Solidity sobre Base blockchain.",
      en: "dApp to create shareable on-chain payment links. Solidity contracts on Base blockchain.",
    },
    tags: ["Solidity", "Base", "Viem", "Next.js"],
    links: [
      { href: "https://github.com/AlejoReyna/Birdlypay", label: { es: "GitHub", en: "GitHub" } },
      { href: "https://birdlypay.vercel.app", label: { es: "Demo en vivo", en: "Live demo" } },
    ],
    ghost: "VII",
  },
];

export function getProjectById(id: string): V3Project | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export function getProjectNeighbors(id: string): {
  previous?: V3Project;
  next?: V3Project;
} {
  const index = PROJECTS.findIndex((project) => project.id === id);

  if (index === -1) {
    return {};
  }

  return {
    previous: PROJECTS[index - 1],
    next: PROJECTS[index + 1],
  };
}
