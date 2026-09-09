export type CuratedProject = {
  id: string;
  title: string;
  category: string;
  summary: { en: string; es: string; zh: string };
  tags: string[];
  href: string;
};

export const CURATED_PROJECTS: CuratedProject[] = [
  {
    id: "inverater",
    title: "Inverater",
    category: "Proptech",
    tags: ["Infrastructure", "Product engineering"],
    href: "https://www.inverater.com",
    summary: {
      en: "Real-estate investing made accessible. Infrastructure, hosting and product engineering.",
      es: "Inversión inmobiliaria accesible. Infraestructura, hosting e ingeniería de producto.",
      zh: "让房地产投资更易参与。基础设施、托管与产品工程。",
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
      zh: "基于 Internet Computer 的社区 DAO。从零完成设计与 UX。",
    },
  },
  {
    id: "cafeteria",
    title: "Artisanal Brew",
    category: "Coffee / Web3",
    tags: ["Blazor", ".NET", "Solidity", "PostgreSQL"],
    href: "https://cafe.alexisrs.dev",
    summary: {
      en: "Pixel-art coffee experience with multichain integrations on Ethereum, BNB Chain and Solana.",
      es: "Experiencia de café con pixel art e integraciones en Ethereum, BNB Chain y Solana.",
      zh: "像素艺术咖啡体验，集成 Ethereum、BNB Chain 与 Solana。",
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
      zh: "互动婚礼邀请函，含 RSVP、日程与地图。",
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
      zh: "为 BNB Hack 构建的自主 BNB Chain 交易代理。",
    },
  },
];

export const ABOUT_PORTFOLIO = {
  en: "Alexis Reyna is a Mexican full-stack developer from Montemorelos, Nuevo León. Stack: React, Next.js, TypeScript, Node, PostgreSQL, Rails, AWS, Docker, Linux. Contact: alexis.reynasz@hotmail.com · https://www.alexisrs.dev",
  es: "Alexis Reyna es un desarrollador full-stack mexicano de Montemorelos, Nuevo León. Stack: React, Next.js, TypeScript, Node, PostgreSQL, Rails, AWS, Docker, Linux. Contacto: alexis.reynasz@hotmail.com · https://www.alexisrs.dev",
  zh: "Alexis Reyna 是来自墨西哥 Nuevo León 州 Montemorelos 的全栈开发者。技术栈：React、Next.js、TypeScript、Node、PostgreSQL、Rails、AWS、Docker、Linux。联系：alexis.reynasz@hotmail.com · https://www.alexisrs.dev",
} as const;

export function findProject(idOrTitle: string): CuratedProject | undefined {
  const q = idOrTitle.trim().toLowerCase();
  return CURATED_PROJECTS.find(
    (p) => p.id === q || p.title.toLowerCase() === q || p.title.toLowerCase().includes(q),
  );
}

export function buildAssistantSystemPrompt(lang: "en" | "es" | "zh"): string {
  const list = CURATED_PROJECTS.map(
    (p) => `- ${p.id}: ${p.title} (${p.category}) — ${p.summary[lang]}`,
  ).join("\n");
  return [
    "You are Orbit, the voice assistant for Alexis Reyna's portfolio website.",
    "You are NOT Apple Siri. Never claim to be Siri or an Apple product.",
    "Keep answers brief and friendly. Prefer the visitor's language.",
    "You may only use the provided tools for side effects. Never invent credentials or private data.",
    "About: " + ABOUT_PORTFOLIO[lang],
    "Projects:\n" + list,
  ].join("\n");
}
