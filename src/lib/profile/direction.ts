import type { Language } from "@/lib/language";
import { buildCvBrief, IDENTITY, type BriefDetail } from "./cv";

/**
 * Server-owned conversation direction. The browser sends a plain message and a language;
 * it never sends a system prompt, so a visitor cannot rewrite the persona from the composer.
 */

export type Topic =
  | "hiring"
  | "experience"
  | "projects"
  | "tech"
  | "contact"
  | "personal"
  | "general";

/** Checked in this order; the first topic with a keyword hit wins. */
const TOPIC_ORDER: Array<Exclude<Topic, "general">> = ["hiring", "experience", "projects", "tech", "contact", "personal"];

const KEYWORDS: Record<Language, Record<Exclude<Topic, "general">, string[]>> = {
  en: {
    hiring: [
      "hiring", "hire", "recruit", "recruiter", "candidate", "vacancy", "opening", "position", "role",
      "salary", "compensation", "pay", "rate", "budget", "offer", "package", "equity", "benefits",
      "available", "availability", "notice period", "start date", "relocate", "relocation", "visa",
      "work permit", "remote", "hybrid", "onsite", "on-site", "seniority", "senior", "junior", "mid-level",
      "years of experience", "how long have you", "resume", "cv", "interview", "references", "why did you leave",
      "looking for", "job", "full-time", "contract", "freelance", "notice", "timezone", "overlap",
    ],
    experience: [
      "inverater", "inverpay", "plebes", "dfinity", "icp", "swapzone", "icpswap", "ckbtc",
      "stripe", "stp", "spei", "clabe", "pci", "pci dss", "compliance", "kyc", "truora", "webhook",
      "payment", "payments", "checkout", "transaction", "fintech", "banking", "financial",
      "stored procedure", "sql server", "microservice", "microservices", "migration", "migrated",
      "contextmanagement", "multi-tenant", "white label", "experience", "worked on", "responsibilities",
      "achievement", "impact", "metrics", "team size", "devops", "let's encrypt", "codedeploy",
    ],
    projects: [
      "project", "projects", "portfolio", "github", "repository", "repo", "built", "side project",
      "artisanal", "artisanalbrew", "cafe", "coffee shop app", "parkar", "monetta", "wedding",
      "solidity", "erc-20", "erc20", "erc-4626", "vault", "smart contract", "testflight", "app store",
    ],
    tech: [
      "stack", "technology", "technologies", "language", "framework", "architecture", "database",
      "c#", ".net", "asp.net", "blazor", "entity framework", "golang", " go ", "ruby", "rails",
      "typescript", "javascript", "vue", "react", "next.js", "nextjs", "tailwind", "flutter", "dart",
      "postgres", "postgresql", "docker", "nginx", "linux", "aws", "azure", "kubernetes", "ci/cd",
      "github actions", "testing", "how would you build", "how do you handle",
    ],
    contact: ["contact", "email", "reach you", "get in touch", "linkedin", "phone", "talk to you", "message you"],
    personal: [
      "music", "beatles", "song", "band", "album", "guitar", "play an instrument", "listen",
      "travel", "trip", "vacation", "hobby", "hobbies", "free time", "martial arts", "lima lama",
      "coffee", "outside of work", "who are you", "about you", "joke", "funny", "roast", "fun fact",
    ],
  },
  es: {
    hiring: [
      "contratar", "contratación", "reclutador", "reclutadora", "reclutamiento", "vacante", "puesto",
      "posición", "candidato", "sueldo", "salario", "compensación", "tarifa", "presupuesto", "oferta",
      "prestaciones", "disponible", "disponibilidad", "aviso", "fecha de inicio", "reubicar",
      "reubicación", "mudarte", "visa", "permiso de trabajo", "remoto", "híbrido", "presencial",
      "seniority", "senior", "junior", "años de experiencia", "cuánto tiempo llevas", "cv",
      "curriculum", "currículum", "entrevista", "referencias", "por qué dejaste", "buscando",
      "tiempo completo", "contrato", "freelance", "zona horaria", "trabajas actualmente", "empleo",
    ],
    experience: [
      "inverater", "inverpay", "plebes", "dfinity", "icp", "swapzone", "icpswap", "ckbtc",
      "stripe", "stp", "spei", "clabe", "pci", "pci dss", "cumplimiento", "kyc", "truora", "webhook",
      "pago", "pagos", "checkout", "transacción", "transaccional", "fintech", "bancario", "financiero",
      "procedimiento almacenado", "sql server", "microservicio", "microservicios", "migración", "migraste",
      "contextmanagement", "multimarca", "marca blanca", "experiencia", "responsabilidades",
      "logro", "logros", "impacto", "métricas", "equipo", "devops", "let's encrypt", "codedeploy",
    ],
    projects: [
      "proyecto", "proyectos", "portafolio", "portfolio", "github", "repositorio", "repo",
      "artisanal", "artisanalbrew", "cafetería", "cafeteria", "parkar", "monetta", "boda",
      "solidity", "erc-20", "erc20", "erc-4626", "vault", "contrato inteligente", "testflight", "app store",
    ],
    tech: [
      "stack", "tecnología", "tecnologias", "tecnologías", "lenguaje", "framework", "arquitectura",
      "base de datos", "c#", ".net", "asp.net", "blazor", "entity framework", "golang", "ruby",
      "rails", "typescript", "javascript", "vue", "react", "next.js", "nextjs", "tailwind", "flutter",
      "dart", "postgres", "postgresql", "docker", "nginx", "linux", "aws", "azure", "ci/cd",
      "github actions", "pruebas", "cómo construirías", "cómo manejas",
    ],
    contact: ["contacto", "contactar", "correo", "email", "linkedin", "teléfono", "telefono", "escribirte", "hablar contigo"],
    personal: [
      "música", "musica", "beatles", "canción", "cancion", "banda", "álbum", "album", "guitarra",
      "instrumento", "escuchas", "viaje", "viajar", "vacaciones", "hobby", "pasatiempo",
      "tiempo libre", "artes marciales", "lima lama", "café", "fuera del trabajo", "quién eres",
      "sobre ti", "chiste", "gracioso", "dato curioso",
    ],
  },
};

export function detectTopic(text: string, lang: Language): Topic {
  const haystack = ` ${text.toLowerCase()} `;
  const table = KEYWORDS[lang];
  for (const topic of TOPIC_ORDER) {
    if (table[topic].some(word => haystack.includes(word.toLowerCase()))) return topic;
  }
  return "general";
}

/** Extra direction layered on top of the base persona for the detected topic. */
const TOPIC_FOCUS: Record<Topic, string> = {
  hiring: `FOCUS — a recruiter or hiring manager is asking. Lead with the concrete answer, then at most two supporting facts from the dossier. Be exact about dates, scope and numbers. State plainly that Alexis no longer works at Inverater, that the role ran October 2024 to September 2026, and that he is actively looking; never suggest Inverater shut down. Never give a salary figure, never accept an interview slot, and never commit to a start date, notice period, visa or relocation — send those to Alexis at ${IDENTITY.email}. Up to 120 words here; a recruiter needs substance more than brevity.`,
  experience: `FOCUS — a question about what Alexis actually did. Name the system, the technology and the outcome, in that order, using only the dossier. Quote a figure only if the dossier lists it. If asked about PCI DSS, say he took part in a review and contributed technical evidence; he is not certified. Up to 120 words.`,
  projects: `FOCUS — a question about the work itself. Describe what the project is, what Alexis built and which technologies it used. Offer the Projects view or the repository if it helps. Up to 100 words.`,
  tech: `FOCUS — a technical question. Answer it directly and say where Alexis used that technology in production or in a side project. Do not claim depth in a technology the dossier does not list; say it is not in his CV instead. Up to 110 words.`,
  contact: `FOCUS — the visitor wants to reach Alexis. Give ${IDENTITY.email} and the contact section of this site, and mention LinkedIn and GitHub if useful. Keep it to about 40 words.`,
  personal: `FOCUS — a personal question. Answer warmly and briefly, in a way that would read fine to a recruiter. Anything the dossier does not cover is something for the real Alexis to answer. About 40–70 words.`,
  general: `FOCUS — open conversation. Answer the actual question in about 40–80 words and offer one concrete next step when it fits.`,
};

/**
 * How deep the dossier goes for each topic. The spine (identity, contact, hiring status,
 * profile, every role and project by name, skills, education) travels at every level, so a
 * turn never loses a fact category — only the bullet detail is traded for tokens.
 */
const TOPIC_DETAIL: Record<Topic, BriefDetail> = {
  hiring: "experience",
  experience: "experience",
  tech: "experience",
  projects: "projects",
  contact: "none",
  personal: "none",
  general: "none",
};

export function briefDetailFor(topic: Topic): BriefDetail {
  return TOPIC_DETAIL[topic];
}

const REPLY_LANGUAGE: Record<Language, string> = {
  en: "Reply in English, unless the visitor clearly wrote in Spanish, in which case reply in Spanish. If the visitor writes in any other language, reply in English and say your vocabulary only covers Spanish and English.",
  es: "Responde en español, salvo que el visitante escriba claramente en inglés, en cuyo caso responde en inglés. Si el visitante escribe en otro idioma, responde en inglés y aclara que tu vocabulario solo cubre español e inglés.",
};

/**
 * The complete instruction block for one turn: persona, tone, topic focus, the CV dossier
 * and the reply language. `base` is the caller's persona so each surface keeps its own voice.
 */
export function buildDirection(base: string, lang: Language, topic: Topic): string {
  return [
    base.trim(),
    TOPIC_FOCUS[topic],
    REPLY_LANGUAGE[lang],
    buildCvBrief(lang, TOPIC_DETAIL[topic]),
  ].join("\n\n");
}
