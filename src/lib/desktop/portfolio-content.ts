import { buildCvBrief, CV_ONE_LINER, HIRING, IDENTITY } from "@/lib/profile/cv";
import { briefDetailFor, detectTopic } from "@/lib/profile/direction";

export type CuratedProject = {
  id: string;
  title: string;
  category: string;
  summary: { en: string; es: string; };
  tags: string[];
  href: string;
};

export const CURATED_PROJECTS: CuratedProject[] = [
  {
    id: "inverater",
    title: "Inverater",
    category: "Fintech / Proptech",
    tags: ["Stripe", "STP/SPEI", "Go", "Vue 3", "AWS"],
    href: "https://www.inverater.com",
    summary: {
      en: "Real-estate investing platform. Stripe and STP/SPEI payment flows, Rails to Go migration, white-label context and the infrastructure behind it.",
      es: "Plataforma de inversión inmobiliaria. Flujos de pago con Stripe y STP/SPEI, migración de Rails a Go, contexto multimarca y la infraestructura que lo sostiene.",
    },
  },
  {
    id: "plebes",
    title: "Plebes DAO",
    category: "Community / Web3",
    tags: ["ICP", "Motoko", "Figma", "UI/UX"],
    href: "https://plebes.xyz",
    summary: {
      en: "Community-driven DAO on Internet Computer. Design, branding and UX from scratch.",
      es: "DAO en Internet Computer. Diseño, branding y UX desde cero.",
    },
  },
  {
    id: "cafeteria",
    title: "Artisanal Brew",
    category: "Coffee / Web3",
    tags: ["Blazor", ".NET", "Solidity", "PostgreSQL"],
    href: "https://cafe.alexisrs.dev",
    summary: {
      en: "Pixel-art coffee store on ASP.NET Core and Blazor, with test payments on Ethereum Sepolia and ERC-20 / ERC-4626 contracts.",
      es: "Tienda de café con pixel art en ASP.NET Core y Blazor, con pagos de prueba en Ethereum Sepolia y contratos ERC-20 / ERC-4626.",
    },
  },
  {
    id: "wedding",
    title: "Andrea & Aldo",
    category: "Wedding / Interactive",
    tags: ["Next.js", "Google Maps", "Framer Motion"],
    href: "/weddings/andrea",
    summary: {
      en: "Interactive wedding invitation with RSVP, schedule and maps.",
      es: "Invitación de boda interactiva con RSVP, itinerario y mapas.",
    },
  },
  {
    id: "wedding-cindy",
    title: "Cindy & Jorge",
    category: "Wedding / Interactive",
    tags: ["Next.js", "3D Gallery", "Google Maps", "Framer Motion"],
    href: "/weddings/cindy",
    summary: {
      en: "Immersive wedding invitation with animated storytelling, a 3D gallery, itinerary, maps and RSVP.",
      es: "Invitación de boda inmersiva con narrativa animada, galería 3D, itinerario, mapas y RSVP.",
    },
  },
  {
    id: "nonamedbot",
    title: "NoNamedBot",
    category: "AI / Trading agent",
    tags: ["Python", "pandas", "TWAK", "Next.js"],
    href: "https://github.com/AlejoReyna/no-named-yet-bot",
    summary: {
      en: "Autonomous BNB Chain trading agent built for BNB Hack.",
      es: "Agente autónomo de trading en BNB Chain para BNB Hack.",
    },
  },
  {
    id: "monetta",
    title: "Monetta",
    category: "E-commerce / Mobile app",
    tags: ["Flutter", "Riverpod", "Shopify", "Firebase"],
    href: "https://monetta.mx",
    summary: {
      en: "Native iOS and Android shopping app for monetta.mx, with a live Shopify catalog and on-device recommendations.",
      es: "App nativa de compras para iOS y Android de monetta.mx, con catálogo en vivo de Shopify y recomendaciones en el dispositivo.",
    },
  },
];

export const ABOUT_PORTFOLIO = CV_ONE_LINER;

export function findProject(idOrTitle: string): CuratedProject | undefined {
  const q = idOrTitle.trim().toLowerCase();
  return CURATED_PROJECTS.find(
    (p) => p.id === q || p.title.toLowerCase() === q || p.title.toLowerCase().includes(q),
  );
}

/** Questions a recruiter asks by voice, answered from the dossier when no project matches. */
export function hiringAnswer(lang: "en" | "es"): string {
  return HIRING[lang].join(" ");
}

/**
 * Orbit replays this prompt on the tool follow-up, so it pays for the dossier twice per
 * question. Passing the visitor's message scales the dossier to what the question needs.
 */
export function buildAssistantSystemPrompt(lang: "en" | "es", message = ""): string {
  const list = CURATED_PROJECTS.map(
    (p) => `- ${p.id}: ${p.title} (${p.category}) — ${p.summary[lang]}`,
  ).join("\n");
  return [
    "You are Orbit, the voice assistant for Alexis Reyna's portfolio website.",
    "You are NOT Apple Siri. Never claim to be Siri or an Apple product.",
    "Keep answers brief, professional and friendly, in plain speech. Prefer the visitor's language.",
    "Recruiters use this assistant. Every fact about Alexis's experience, employers, dates, numbers, studies or certifications must come from the dossier below; say a fact is not in his CV rather than guessing.",
    `Never quote a salary or rate, never accept an interview and never commit to a start date. Send those to ${IDENTITY.email}.`,
    "You may only use the provided tools for side effects. Never invent credentials or private data.",
    "Projects:\n" + list,
    buildCvBrief(lang, message ? briefDetailFor(detectTopic(message, lang)) : "full"),
  ].join("\n");
}
