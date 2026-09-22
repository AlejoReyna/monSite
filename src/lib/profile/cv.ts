import type { Language } from "@/lib/language";

/**
 * Server-owned dossier built from Alexis's CV (theFinal.docx, September 2026).
 * Every experience answer the chatbot gives must come from here: the model is told
 * not to invent anything this file does not state. Update this file when the CV changes.
 */

type Copy = Record<Language, string>;
type Lines = Record<Language, string[]>;

const copy = (en: string, es: string): Copy => ({ en, es });
const lines = (en: string[], es: string[]): Lines => ({ en, es });

export const IDENTITY = {
  fullName: "Alexis Alberto Reyna Sánchez",
  shortName: "Alexis Reyna",
  base: copy("the Monterrey metropolitan area, Nuevo León, Mexico", "el área metropolitana de Monterrey, Nuevo León, México"),
  hometown: "Montemorelos, Nuevo León",
  timezone: "GMT-6 (America/Monterrey)",
  email: "alexis.rs@proton.me",
  website: "https://www.alexisrs.dev",
  github: "https://github.com/AlejoReyna",
  linkedin: "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4",
} as const;

export const HEADLINE: Copy = copy(
  "Full-stack developer specialised in payment platforms.",
  "Desarrollador full-stack especializado en plataformas de pago.",
);

export const SUMMARY: Copy = copy(
  "Full-stack developer specialised in payment platforms, with two years of experience in financial systems and participation in a PCI DSS review. He has built Stripe and STP/SPEI integrations, webhooks and transactional flows. His experience spans front-end, back-end, databases, crypto payments, infrastructure and deployments, with technical leadership responsibilities and development in C#/.NET, Go, Ruby on Rails and TypeScript.",
  "Desarrollador full-stack especializado en plataformas de pago, con dos años de experiencia en sistemas financieros y participación en una revisión PCI DSS. Ha desarrollado integraciones con Stripe y STP/SPEI, webhooks y flujos transaccionales. Su experiencia abarca front-end, back-end, bases de datos, pagos con crypto, infraestructura y despliegues, con responsabilidades de liderazgo técnico y desarrollo en C#/.NET, Go, Ruby on Rails y TypeScript.",
);

export type Role = {
  id: string;
  company: string;
  title: Copy;
  place: Copy;
  period: Copy;
  bullets: Lines;
};

export const EXPERIENCE: Role[] = [
  {
    id: "inverater",
    company: "Inverater",
    title: copy("Full-Stack Software Engineer", "Ingeniero de Software Full-Stack"),
    place: copy("Monterrey, Mexico", "Monterrey, México"),
    period: copy("October 2024 – September 2026", "Octubre 2024 – Septiembre 2026"),
    bullets: lines(
      [
        "Grew from front-end developer into the person responsible for full-stack development and DevOps work. With two other developers, turned an MVP inherited from an external team into Inverater's production platform.",
        "Built referral purchase links paid either with Stripe or by transfer to an STP CLABE, and migrated checkout and deposit flows to the STP REST API.",
        "Took part in a PCI DSS review of the platform, contributing technical evidence.",
        "Built the contextManagement module in Vue 3 and TypeScript so partners could operate the platform under their own brand: themes, content and navigation resolved per domain, route and session through a state machine, cache and API synchronisation, including selective context cleanup on sign-in and sign-out.",
        "Took part in migrating the back end from Ruby on Rails to Go microservices, and in integrating Inverater users with Inverpay.",
        "Optimised the Inverpay integration with SQL Server stored procedures, moving complex queries into the database and cutting response times by more than 50% against Ruby.",
        "Administered AWS services (EC2, RDS, S3, ElastiCache and CodeDeploy), Docker containers and NGINX with TLS. Contributed to CI/CD flows, managed DNS and automated certificate renewal with Let's Encrypt.",
        "Migrated the infrastructure from AWS to an Atlantic.net VPS and cut monthly hosting cost by 57.5%, from $800 to $340 MXN.",
      ],
      [
        "Evolucionó de desarrollador front-end a responsable del desarrollo full-stack y de las labores de DevOps. Junto con dos desarrolladores, transformó el MVP recibido de un equipo externo en la plataforma de producción de Inverater.",
        "Desarrolló enlaces de compra para referidos con pagos mediante Stripe o transferencias a una CLABE de STP, así como la migración del checkout y los flujos de depósito a la API REST de STP.",
        "Participó en una revisión PCI DSS de la plataforma, colaborando en la entrega de evidencias técnicas.",
        "Desarrolló el módulo contextManagement en Vue 3 y TypeScript para que socios operaran la plataforma con su propia marca: temas visuales, contenido y navegación según dominio, ruta y sesión, mediante una máquina de estados, caché y sincronización con APIs, incluyendo la limpieza selectiva del contexto al iniciar o cerrar sesión.",
        "Participó en la migración del back-end de Ruby on Rails a microservicios en Go y en la integración de los usuarios de Inverater con Inverpay.",
        "Optimizó la integración con Inverpay mediante procedimientos almacenados en SQL Server, trasladando consultas complejas a la base de datos y reduciendo los tiempos de respuesta en más de un 50% frente a Ruby.",
        "Administró servicios de AWS (EC2, RDS, S3, ElastiCache y CodeDeploy), contenedores Docker y NGINX con TLS. Colaboró en los flujos de CI/CD, gestionó DNS y automatizó la renovación de certificados con Let's Encrypt.",
        "Migró la infraestructura de AWS a un VPS de Atlantic.net y redujo los costos mensuales de alojamiento un 57.5%, de $800 a $340 MXN.",
      ],
    ),
  },
  {
    id: "plebes-dao",
    company: "Plebes DAO — Internet Computer Protocol (ICP)",
    title: copy("Frontend Developer", "Desarrollador Frontend"),
    place: copy("Remote, Mexico", "Remoto, México"),
    period: copy("December 2024 – June 2025", "Diciembre 2024 – Junio 2025"),
    bullets: lines(
      [
        "Redesigned the home page, the navigation and the guided deposit flow in React, with mobile adaptation and a public view of the DAO's funds.",
        "Integrated the Swapzone API to receive assets from more than 30 blockchains and convert them to ICP, with minimum-amount lookups and transaction tracking. The integration brought the deposit minimum down from $80 to $5 USD.",
        "Built the ICP to ckBTC conversion interface with ICPSwap: balance lookups, stage-by-stage tracking, error handling and recovery of unused tokens.",
        "The project received a $5,000 USD developer grant from the DFINITY Foundation.",
      ],
      [
        "Rediseñó en React la página de inicio, la navegación y el flujo guiado de depósitos, con adaptación a móviles y visualización pública de los fondos de la DAO.",
        "Integró la API de Swapzone para recibir activos de más de 30 blockchains y convertirlos a ICP, con consulta de mínimos y seguimiento de transacciones. Esta integración permitió depósitos desde $5 USD; antes el mínimo era $80.",
        "Desarrolló la interfaz de conversión de ICP a ckBTC con ICPSwap, con consulta de saldos, seguimiento por etapas, manejo de errores y recuperación de tokens no utilizados.",
        "El proyecto recibió una beca de $5,000 USD para desarrolladores de la Fundación DFINITY.",
      ],
    ),
  },
];

export type SideProject = {
  id: string;
  name: string;
  kind: Copy;
  period: Copy;
  bullets: Lines;
};

export const SIDE_PROJECTS: SideProject[] = [
  {
    id: "artisanal-brew",
    name: "ArtisanalBrew",
    kind: copy("Online store with test payments on Ethereum", "Tienda con pagos de prueba en Ethereum"),
    period: copy("April 2026 – present", "Abril 2026 – presente"),
    bullets: lines(
      [
        "Designed and deployed an online store with C#/.NET, ASP.NET Core and Blazor, with test payments on Ethereum Sepolia.",
        "Built REST APIs with ASP.NET Core, modelled data in PostgreSQL with Entity Framework Core, and implemented authentication and identity management with ASP.NET Core Identity.",
        "Implemented the payment flow from the wallet connected in Blazor through to transaction verification in the .NET back end, before the order is processed.",
        "Wrote Solidity contracts with OpenZeppelin: two ERC-20 tokens (CAFE and COFFEE) and an ERC-4626 vault that issues stCAFE and distributes per-user rewards.",
        "Deployed on Azure with Container Apps, Azure Database for PostgreSQL, Blob Storage, Service Bus and Key Vault, then migrated it to an Atlantic.net Linux VPS.",
      ],
      [
        "Diseñó y desplegó una tienda en línea con C#/.NET, ASP.NET Core y Blazor, con pagos de prueba en Ethereum Sepolia.",
        "Desarrolló APIs REST con ASP.NET Core, modeló datos en PostgreSQL con Entity Framework Core e implementó autenticación y gestión de identidades con ASP.NET Core Identity.",
        "Implementó el flujo de pago desde la billetera conectada en Blazor hasta la verificación de la transacción en el back-end de .NET, antes de procesar el pedido.",
        "Desarrolló contratos en Solidity con OpenZeppelin: dos tokens ERC-20 (CAFE y COFFEE) y un vault ERC-4626 que emite stCAFE y distribuye recompensas por usuario.",
        "Desplegó la aplicación en Azure con Container Apps, Azure Database for PostgreSQL, Blob Storage, Service Bus y Key Vault; después la migró a un VPS Linux de Atlantic.net.",
      ],
    ),
  },
  {
    id: "parkar",
    name: "Parkar",
    kind: copy("Parking mobile app — iOS / Flutter", "Aplicación móvil de estacionamiento — iOS / Flutter"),
    period: copy("2026", "2026"),
    bullets: lines(
      [
        "Handled Parkar's iOS preparation and distribution through App Store Connect and TestFlight, including signing, Bundle ID and build generation.",
        "Resolved integration problems between Flutter and the native iOS environment, adjusting Xcode, Info.plist, privacy permissions and app versions.",
        "Resolved distribution issues tied to the organisational Apple Developer account and validated the app's compatibility requirements.",
      ],
      [
        "Gestionó la preparación y distribución de Parkar para iOS mediante App Store Connect y TestFlight, incluyendo firma, Bundle ID y generación de compilaciones.",
        "Resolvió problemas de integración entre Flutter y el entorno nativo de iOS, ajustando Xcode, Info.plist, permisos de privacidad y versiones de la aplicación.",
        "Resolvió incidencias de distribución relacionadas con la cuenta organizacional de Apple Developer y validó los requisitos de compatibilidad de la aplicación.",
      ],
    ),
  },
  {
    id: "monetta",
    name: "Monetta",
    kind: copy("E-commerce mobile app — Flutter Developer", "Aplicación móvil de comercio electrónico — Flutter Developer"),
    period: copy("In development", "En desarrollo"),
    bullets: lines(
      [
        "Building an e-commerce app for iOS and Android with Flutter and Dart, connected to the product catalogue of Monetta's web platform.",
        "Building the mobile interface from sector design references, and the purchase flow with Shopify and the payment methods configured in the store.",
      ],
      [
        "Desarrolla una aplicación de comercio electrónico para iOS y Android con Flutter y Dart, conectada al catálogo de productos de la plataforma web de Monetta.",
        "Construye la interfaz móvil siguiendo referencias de diseño del sector y el flujo de compra con Shopify y los métodos de pago configurados en la tienda.",
      ],
    ),
  },
];

export const SKILLS: Array<{ id: string; label: Copy; value: Copy }> = [
  {
    id: "payments",
    label: copy("Payments and fintech", "Pagos y fintech"),
    value: copy(
      "Stripe, STP/SPEI, Inverpay, checkout, webhooks, transactional state, fees, and identity verification with Truora (KYC).",
      "Stripe, STP/SPEI, Inverpay, checkout, webhooks, estado transaccional, comisiones y verificación de identidad con Truora (KYC).",
    ),
  },
  {
    id: "security",
    label: copy("Security and compliance", "Seguridad y cumplimiento"),
    value: copy(
      "Participation in a PCI DSS review; tokenisation delegated to the payment provider with no card data stored in the application; TLS, Azure Key Vault and ASP.NET Core Identity.",
      "Participación en una revisión PCI DSS; tokenización delegada al proveedor de pagos sin almacenar datos de tarjeta en la aplicación; TLS, Azure Key Vault y ASP.NET Core Identity.",
    ),
  },
  {
    id: "languages",
    label: copy("Languages and frameworks", "Lenguajes y frameworks"),
    value: copy(
      "C#, .NET, ASP.NET Core, Blazor, Entity Framework Core, Go, Ruby on Rails, TypeScript, JavaScript, Vue 3, React, Next.js, Tailwind CSS, Flutter, Dart and Solidity.",
      "C#, .NET, ASP.NET Core, Blazor, Entity Framework Core, Go, Ruby on Rails, TypeScript, JavaScript, Vue 3, React, Next.js, Tailwind CSS, Flutter, Dart y Solidity.",
    ),
  },
  {
    id: "cloud",
    label: copy("Cloud and DevOps", "Cloud y DevOps"),
    value: copy(
      "AWS, Microsoft Azure, VPS, Docker, NGINX, Linux, Git, GitHub Actions and AWS CodeDeploy.",
      "AWS, Microsoft Azure, VPS, Docker, NGINX, Linux, Git, GitHub Actions y AWS CodeDeploy.",
    ),
  },
  {
    id: "databases",
    label: copy("Databases", "Bases de datos"),
    value: copy(
      "PostgreSQL and SQL Server (including stored procedures), with Entity Framework Core as ORM and ElastiCache for caching.",
      "PostgreSQL y SQL Server (incluidos procedimientos almacenados), con Entity Framework Core como ORM y ElastiCache para caché.",
    ),
  },
  {
    id: "idioms",
    label: copy("Spoken languages", "Idiomas"),
    value: copy("Native Spanish, conversational English.", "Español nativo e inglés conversacional."),
  },
];

export const EDUCATION: Lines = lines(
  [
    "Universidad Autónoma de Nuevo León (UANL), San Nicolás de los Garza, Mexico — studies in Software Engineering at the Faculty of Mechanical and Electrical Engineering (FIME). The CV states studies, not a completed degree.",
    "AWS Certified AI Practitioner — Amazon Web Services.",
  ],
  [
    "Universidad Autónoma de Nuevo León (UANL), San Nicolás de los Garza, México — estudios en Ingeniería de Software en la Facultad de Ingeniería Mecánica y Eléctrica (FIME). El CV indica estudios, no un título concluido.",
    "AWS Certified AI Practitioner — Amazon Web Services.",
  ],
);

export const EXTRACURRICULAR: Lines = lines(
  [
    "UANL LIMA-LAMA martial arts, Monterrey, Mexico — competitor, 2023–2024. Purple belt in Imua Lima Lama at FIME; one second place and two third places at UANL inter-university tournaments.",
  ],
  [
    "Artes marciales LIMA-LAMA de la UANL, Monterrey, México — competidor, 2023–2024. Cinta morada en Imua Lima Lama de FIME; una medalla de segundo lugar y dos de tercer lugar en torneos interuniversitarios de la UANL.",
  ],
);

/** Answers to the questions a recruiter opens with. Alexis confirmed these on 2026-09-22. */
export const HIRING: Lines = lines(
  [
    "Current status: Alexis no longer works at Inverater; the role ran October 2024 – September 2026. Inverater is still operating as a company — never say it shut down or failed.",
    "He is actively looking for his next role and is available to start conversations now.",
    "Experience level: two years of professional experience, concentrated in payment platforms and financial systems.",
    "Based in the Monterrey metropolitan area, Nuevo León, Mexico (GMT-6). Open to remote work; he has already worked remotely on Plebes DAO.",
    "Spoken languages: native Spanish, conversational English.",
    "Best first step: email alexis.rs@proton.me, or use the contact section of this site.",
  ],
  [
    "Situación actual: Alexis ya no trabaja en Inverater; el puesto fue de octubre 2024 a septiembre 2026. Inverater sigue operando como empresa — nunca digas que cerró o que fracasó.",
    "Está buscando activamente su siguiente puesto y disponible para conversar desde ahora.",
    "Nivel de experiencia: dos años de experiencia profesional, concentrados en plataformas de pago y sistemas financieros.",
    "Radica en el área metropolitana de Monterrey, Nuevo León, México (GMT-6). Abierto a trabajo remoto; ya trabajó en remoto en Plebes DAO.",
    "Idiomas: español nativo e inglés conversacional.",
    "Mejor primer paso: escribir a alexis.rs@proton.me o usar la sección de contacto de este sitio.",
  ],
);

/** Claims the model must never make, whatever the topic. This block always travels. */
export const GUARDRAILS_CORE: Copy = copy(
  [
    "Never state a salary, rate, day rate or budget figure, and never agree to one. Say compensation is a conversation for Alexis himself and point to the contact details.",
    "Do not invent employers, dates, team sizes, metrics, client names or technologies that are not in this dossier. If a fact is missing, say it is not in his CV and point to the contact details.",
    "Do not accept interviews, commit to start dates, notice periods, visa arrangements or relocation on Alexis's behalf. Those go to the real Alexis.",
  ].join("\n"),
  [
    "Nunca digas un sueldo, tarifa, monto por día o presupuesto, ni aceptes uno. Di que la compensación se habla directamente con Alexis e indica el contacto.",
    "No inventes empleadores, fechas, tamaños de equipo, métricas, nombres de clientes ni tecnologías que no estén en este dossier. Si falta un dato, di que no está en su CV e indica el contacto.",
    "No aceptes entrevistas ni comprometas fechas de inicio, tiempos de aviso, trámites de visa o reubicación por Alexis. Eso lo ve el Alexis real.",
  ].join("\n"),
);

/** Added when the turn is about credentials, experience or numbers, where these are the traps. */
export const GUARDRAILS_CREDENTIALS: Copy = copy(
  [
    "PCI DSS: Alexis took part in a review and contributed technical evidence. He is not PCI certified, not a QSA, and did not lead a certification. Never upgrade this.",
    "The only certification is AWS Certified AI Practitioner. Do not claim a finished university degree, other certifications, or an English level above conversational.",
    "The only figures on record are: response times cut by more than 50%, hosting cost cut 57.5% from $800 to $340 MXN, deposit minimum lowered from $80 to $5 USD, a $5,000 USD DFINITY grant, and more than 30 blockchains through Swapzone. Never round, inflate or invent others.",
  ].join("\n"),
  [
    "PCI DSS: Alexis participó en una revisión y colaboró entregando evidencias técnicas. No está certificado en PCI, no es QSA y no lideró una certificación. Nunca exageres esto.",
    "La única certificación es AWS Certified AI Practitioner. No afirmes un título universitario concluido, otras certificaciones ni un nivel de inglés superior a conversacional.",
    "Las únicas cifras registradas son: tiempos de respuesta reducidos más de 50%, costo de hosting reducido 57.5% de $800 a $340 MXN, mínimo de depósito bajado de $80 a $5 USD, una beca de $5,000 USD de DFINITY y más de 30 blockchains vía Swapzone. Nunca las redondees, infles ni inventes otras.",
  ].join("\n"),
);

const HEADINGS: Record<Language, Record<string, string>> = {
  en: {
    dossier: "VERIFIED DOSSIER — the only source for facts about Alexis",
    identity: "IDENTITY",
    contact: "CONTACT",
    hiring: "HIRING STATUS",
    profile: "PROFILE",
    experience: "PROFESSIONAL EXPERIENCE",
    projects: "EXTERNAL PROJECTS",
    skills: "TECHNICAL SKILLS",
    education: "EDUCATION AND CERTIFICATIONS",
    extra: "EXTRACURRICULAR",
    guardrails: "NEVER CLAIM",
    more: "Some lines above are summarised. The full detail exists in the CV: if the visitor wants it, invite the specific question instead of improvising the detail.",
  },
  es: {
    dossier: "DOSSIER VERIFICADO — la única fuente de datos sobre Alexis",
    identity: "IDENTIDAD",
    contact: "CONTACTO",
    hiring: "SITUACIÓN LABORAL",
    profile: "PERFIL",
    experience: "EXPERIENCIA PROFESIONAL",
    projects: "PROYECTOS EXTERNOS",
    skills: "HABILIDADES TÉCNICAS",
    education: "EDUCACIÓN Y CERTIFICACIONES",
    extra: "EXTRACURRICULAR",
    guardrails: "NUNCA AFIRMES",
    more: "Algunas líneas de arriba están resumidas. El detalle completo existe en el CV: si el visitante lo quiere, invítalo a preguntar en concreto en vez de improvisar el detalle.",
  },
};

/**
 * How much of the CV a turn needs. Every level keeps the spine — identity, contact, hiring
 * status, profile, every role and project by name, skills and education — so no fact category
 * ever disappears; the level only decides which bullets get expanded.
 */
export type BriefDetail = "none" | "experience" | "projects" | "full";

const bullet = (text: string) => `  - ${text}`;

function roleHeader(role: Role, lang: Language): string {
  return `${role.company} — ${role.title[lang]} · ${role.place[lang]} · ${role.period[lang]}`;
}

function projectHeader(project: SideProject, lang: Language): string {
  return `${project.name} — ${project.kind[lang]} · ${project.period[lang]}`;
}

/** Renders the CV as prompt text, at the depth the turn actually needs. */
export function buildCvBrief(lang: Language, detail: BriefDetail = "full"): string {
  const h = HEADINGS[lang];
  const deepExperience = detail === "experience" || detail === "full";
  const deepProjects = detail === "projects" || detail === "full";

  const experience = EXPERIENCE.map(role => deepExperience
    ? `${roleHeader(role, lang)}\n${role.bullets[lang].map(bullet).join("\n")}`
    : roleHeader(role, lang)).join("\n");

  const projects = SIDE_PROJECTS.map(project => deepProjects
    ? `${projectHeader(project, lang)}\n${project.bullets[lang].map(bullet).join("\n")}`
    : projectHeader(project, lang)).join("\n");

  const guardrails = deepExperience || deepProjects
    ? `${GUARDRAILS_CORE[lang]}\n${GUARDRAILS_CREDENTIALS[lang]}`
    : GUARDRAILS_CORE[lang];

  const sections = [
    `=== ${h.dossier} ===`,
    `${h.identity}: ${IDENTITY.fullName} ("${IDENTITY.shortName}"). ${lang === "es" ? "Radica en" : "Based in"} ${IDENTITY.base[lang]}. ${lang === "es" ? "Originario de" : "From"} ${IDENTITY.hometown}. ${IDENTITY.timezone}.`,
    `${h.contact}: ${IDENTITY.email} · ${IDENTITY.website} · ${IDENTITY.github} · LinkedIn.`,
    `${h.hiring}:\n${HIRING[lang].map(bullet).join("\n")}`,
    `${h.profile}: ${SUMMARY[lang]}`,
    `${h.experience}:\n${experience}`,
    `${h.projects}:\n${projects}`,
    `${h.skills}:\n${SKILLS.map(skill => bullet(`${skill.label[lang]}: ${skill.value[lang]}`)).join("\n")}`,
    `${h.education}:\n${EDUCATION[lang].map(bullet).join("\n")}`,
  ];
  sections.push(`${h.extra}:\n${EXTRACURRICULAR[lang].map(bullet).join("\n")}`);
  if (!deepExperience || !deepProjects) sections.push(h.more);
  sections.push(`${h.guardrails}:\n${guardrails}`);
  return sections.join("\n\n");
}

/** One-paragraph version for surfaces that cannot afford the full dossier. */
export const CV_ONE_LINER: Copy = copy(
  `${IDENTITY.shortName} is a full-stack developer based in ${IDENTITY.base.en}, with two years building payment platforms and financial systems: Stripe and STP/SPEI integrations, webhooks and transactional flows, plus back end, infrastructure and deployments in C#/.NET, Go, Ruby on Rails and TypeScript. Most recently Full-Stack Software Engineer at Inverater (October 2024 – September 2026); now looking for his next role. Software Engineering studies at UANL (FIME) · AWS Certified AI Practitioner · ${IDENTITY.email}`,
  `${IDENTITY.shortName} es un desarrollador full-stack radicado en el área metropolitana de Monterrey, Nuevo León, con dos años construyendo plataformas de pago y sistemas financieros: integraciones con Stripe y STP/SPEI, webhooks y flujos transaccionales, además de back-end, infraestructura y despliegues en C#/.NET, Go, Ruby on Rails y TypeScript. Su puesto más reciente fue Ingeniero de Software Full-Stack en Inverater (octubre 2024 – septiembre 2026); ahora busca su siguiente puesto. Estudios en Ingeniería de Software en la UANL (FIME) · AWS Certified AI Practitioner · ${IDENTITY.email}`,
);
