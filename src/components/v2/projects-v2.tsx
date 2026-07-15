"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, MotionConfig, useScroll, useTransform, useSpring } from "framer-motion";
import { useLanguage } from "@/components/lang-context";

/* ─────────────────────────────────────────
   Language helper
───────────────────────────────────────── */
function pick<T>(en: T, es: T, zh: T, language: string): T {
  if (language === "zh") return zh;
  if (language === "es") return es;
  return en;
}

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface Project {
  kind: "video" | "image" | "blue-card";
  media?: string;
  badge?: string;
  date?: string;
  kicker?: string;
  title: string;
  desc: string;
  links?: { href: string; label: string }[];
  span?: "full" | "half" | "wide" | "narrow";
  featured?: boolean;
}

/* ─────────────────────────────────────────
   Elevated Content Card (GIC spec)
  background #fefffc · 12px radius
  shadow: rgba(0,0,0,0.08) 0 1 1, rgba(0,0,0,0.08) 0 4 5
───────────────────────────────────────── */
const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

function ElevatedCard({ project }: { project: Project }) {
  const hasMedia = project.kind !== "blue-card" && project.media;

  return (
    <motion.article
      variants={cardVariant}
      className="group relative overflow-hidden flex flex-col"
      style={{
        background: "var(--gic-off-white)",
        borderRadius: "var(--gic-radius-cards-small)",
        boxShadow: "var(--gic-shadow-subtle-2)",
        minHeight: "260px",
      }}
    >
      {/* Media */}
      {hasMedia && (
        <div className="relative w-full overflow-hidden" style={{ height: "200px" }}>
          {project.kind === "video" ? (
            <video
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={project.media} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={project.media!}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>
      )}

      {/* Content */}
      <div
        className="flex flex-col gap-2 flex-1"
        style={{ padding: "var(--gic-card-padding)" }}
      >
        {/* Badge + date row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {project.badge && (
            <span
              style={{
                fontFamily: "var(--gic-font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "var(--gic-medium-gray)",
                textTransform: "uppercase",
              }}
            >
              {project.badge}
            </span>
          )}
          {project.date && (
            <span
              style={{
                fontFamily: "var(--gic-font-sans)",
                fontSize: "var(--gic-text-caption)",
                color: "var(--gic-light-gray)",
                letterSpacing: "var(--gic-tracking-caption)",
              }}
            >
              {project.date}
            </span>
          )}
        </div>

        {/* Kicker */}
        {project.kicker && (
          <p
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "var(--gic-text-caption)",
              color: "var(--gic-medium-gray)",
              letterSpacing: "var(--gic-tracking-caption)",
            }}
          >
            {project.kicker}
          </p>
        )}

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--gic-font-sans)",
            fontSize: "var(--gic-text-subheading)",
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "var(--gic-tracking-subheading)",
            color: "var(--gic-charcoal)",
          }}
        >
          {project.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--gic-font-sans)",
            fontSize: "15px",
            lineHeight: 1.5,
            color: "var(--gic-medium-gray)",
            letterSpacing: "-0.012em",
            flex: 1,
          }}
        >
          {project.desc}
        </p>

        {/* Links — Ghost Buttons */}
        {project.links && project.links.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {project.links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--gic-font-sans)",
                  fontSize: "var(--gic-text-caption)",
                  fontWeight: 500,
                  color: "var(--gic-cofounder-blue)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  letterSpacing: "var(--gic-tracking-caption)",
                }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────
   Cofounder Featured Card (GIC spec)
  background #0081c0 · 24px radius
  complex shadow
───────────────────────────────────────── */
function CofounderCard({ project }: { project: Project }) {
  return (
    <motion.article
      variants={cardVariant}
      className="relative overflow-hidden flex flex-col justify-between"
      style={{
        background: "var(--gic-cofounder-blue)",
        borderRadius: "var(--gic-radius-cards-large)",
        boxShadow: "var(--gic-shadow-subtle-3)",
        padding: "clamp(32px, 5vw, 64px) clamp(24px, 4vw, 48px)",
        minHeight: "280px",
      }}
    >
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {project.badge && (
          <span
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
            }}
          >
            {project.badge}
          </span>
        )}

        <h3
          style={{
            fontFamily: "var(--gic-font-serif)",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.6px",
            color: "var(--gic-canvas-white)",
          }}
        >
          {project.title}
        </h3>

        <p
          style={{
            fontFamily: "var(--gic-font-sans)",
            fontSize: "15px",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.72)",
            maxWidth: "460px",
          }}
        >
          {project.desc}
        </p>

        {project.links && project.links.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {project.links.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--gic-font-sans)",
                  fontSize: "var(--gic-text-button-label)",
                  fontWeight: 500,
                  letterSpacing: "var(--gic-tracking-button-label)",
                  color: "var(--gic-canvas-white)",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "var(--gic-radius-buttons)",
                  padding: "7px 16px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────
   Section: Open Source
───────────────────────────────────────── */
function OpenSourceCard({ language }: { language: string }) {
  return (
    <motion.div
      variants={cardVariant}
      className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6"
    >
      {/* Text card */}
      <article
        className="flex flex-col gap-4"
        style={{
          background: "var(--gic-off-white)",
          borderRadius: "var(--gic-radius-cards-small)",
          boxShadow: "var(--gic-shadow-subtle-2)",
          padding: "24px",
        }}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--gic-medium-gray)",
              textTransform: "uppercase",
            }}
          >
            Open Source
          </span>
          <span
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "var(--gic-text-caption)",
              color: "var(--gic-action-azure)",
              background: "rgba(65,161,207,0.08)",
              border: "1px solid rgba(65,161,207,0.2)",
              borderRadius: "var(--gic-radius-buttons)",
              padding: "2px 8px",
            }}
          >
            {pick("In progress", "En desarrollo", "开发中", language)}
          </span>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "var(--gic-text-caption)",
              color: "var(--gic-medium-gray)",
              marginBottom: "4px",
            }}
          >
            {pick(
              "Chrome/Firefox Extension (MV3) · Vite + TypeScript",
              "Extensión Chrome/Firefox (MV3) · Vite + TypeScript",
              "Chrome/Firefox 扩展（MV3）· Vite + TypeScript",
              language
            )}
          </p>
          <h3
            style={{
              fontFamily: "var(--gic-font-sans)",
              fontSize: "var(--gic-text-subheading)",
              fontWeight: 600,
              letterSpacing: "var(--gic-tracking-subheading)",
              color: "var(--gic-charcoal)",
              lineHeight: 1.25,
            }}
          >
            UANL Interface+
          </h3>
        </div>

        <p
          style={{
            fontFamily: "var(--gic-font-sans)",
            fontSize: "15px",
            lineHeight: 1.5,
            color: "var(--gic-medium-gray)",
          }}
        >
          {pick(
            "Injects a custom UI layer, reorganizes menus and improves UX on frame-based university pages. Content scripts + Shadow DOM.",
            "Inyecta UI propia, reorganiza menús y mejora la UX en páginas universitarias con frames. Content scripts + Shadow DOM.",
            "在基于 frame 的大学页面注入自定义 UI 层、重组菜单并改善用户体验。Content scripts + Shadow DOM。",
            language
          )}
        </p>

        <pre
          style={{
            background: "var(--gic-ash-gray)",
            borderRadius: "var(--gic-radius-nav-items-small)",
            border: "1px solid var(--gic-cool-gray)",
            padding: "12px 14px",
            fontSize: "12px",
            fontFamily: "var(--font-geist-mono, monospace)",
            color: "var(--gic-slate-gray)",
            overflowX: "auto",
            lineHeight: 1.6,
          }}
        >
          {`git clone https://github.com/AlejoReyna/UANLInterface.git
npm install && npm run build`}
        </pre>

        <div className="flex flex-wrap gap-4">
          {[
            { href: "https://github.com/AlejoReyna/UANLInterface", label: "GitHub" },
            { href: "https://uanl-interface.vercel.app", label: pick("Live demo", "Demo en vivo", "在线演示", language) },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--gic-font-sans)",
                fontSize: "var(--gic-text-caption)",
                fontWeight: 500,
                color: "var(--gic-cofounder-blue)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </article>

      {/* Video preview */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: "var(--gic-radius-cards-small)",
          boxShadow: "var(--gic-shadow-subtle-2)",
          minHeight: "220px",
        }}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/preview-siase.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top right, rgba(0,0,0,0.25), transparent)",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Section divider
───────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div style={{ height: "1px", width: "32px", backgroundColor: "var(--gic-steel-gray)" }} />
      <span
        style={{
          fontFamily: "var(--gic-font-sans)",
          fontSize: "var(--gic-text-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--gic-light-gray)",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════
   Projects V2 — GIC light sections
   ═══════════════════════════════════ */
export default function ProjectsV2() {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);

  /* subtle background parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 20 });
  const sectionY = useTransform(smooth, [0, 1], ["0%", "3%"]);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  /* ── Featured projects ── */
  const featured: Project[] = [
    {
      kind: "video",
      media: "/plebes_video.mp4",
      badge: pick("UX/UI Design", "Diseño UX/UI", "UX/UI 设计", language),
      title: "Plebes DAO",
      desc: pick(
        "Community-driven DAO on ICP (Internet Computer). Full design, branding and UX.",
        "DAO impulsada por la comunidad en ICP (Internet Computer). Diseño completo, branding y UX.",
        "基于 ICP（Internet Computer）的社区驱动型 DAO。完整设计、品牌与用户体验。",
        language
      ),
      links: [{ href: "https://plebes.xyz", label: pick("Live demo", "Demo en vivo", "在线演示", language) }],
    },
    {
      kind: "video",
      media: "/wedding_preview.mp4",
      badge: "Wedding · 2024",
      title: "Andrea & Aldo",
      desc: pick(
        "Interactive wedding invitation with RSVP flow, schedule and maps integration.",
        "Invitación de boda interactiva con flujo RSVP, cronograma e integración de mapas.",
        "带有 RSVP 流程、时间表和地图集成的互动婚礼邀请函。",
        language
      ),
      links: [
        { href: "https://aldoyandrea.com", label: pick("Live demo", "Demo en vivo", "在线演示", language) },
        { href: "https://github.com/AlejoReyna/wedding_invitation", label: "GitHub" },
      ],
    },
    {
      kind: "image",
      media: "/mk-banner.png",
      badge: "Landing",
      kicker: pick("Case study", "Caso de estudio", "案例研究", language),
      title: pick("MK1 Presale — Immersive landing", "MK1 Presale — Landing inmersiva", "MK1 Presale — 沉浸式落地页", language),
      desc: pick(
        "Next.js + email backend and pre-registrations in PostgreSQL. Confirmation via Nodemailer.",
        "Next.js + backend de correos y pre-registros en PostgreSQL. Confirmación vía Nodemailer.",
        "Next.js + 邮件后端与 PostgreSQL 预注册。通过 Nodemailer 确认。",
        language
      ),
      links: [
        { href: "https://github.com/AlejoReyna/MortalKombat", label: "GitHub" },
        { href: "https://next-mk.vercel.app", label: pick("Live demo", "Demo en vivo", "在线演示", language) },
      ],
    },
    {
      kind: "video",
      media: "/preview_pokefolio.mp4",
      badge: "Portfolio",
      title: "PokeFolio",
      desc: pick(
        "Pokémon-style portfolio with typewriter, game dialogs and music player. Next.js + Tailwind.",
        "Portfolio estilo Pokémon con typewriter, diálogos del juego y reproductor de música. Next.js + Tailwind.",
        "宝可梦风格的作品集，带有打字机、游戏对话和音乐播放器。Next.js + Tailwind。",
        language
      ),
      links: [
        { href: "https://github.com/AlejoReyna/PokeFolio", label: "GitHub" },
        { href: "https://poke-folio.vercel.app", label: pick("Live demo", "Demo en vivo", "在线演示", language) },
      ],
    },
  ];

  /* ── Hackathon projects ── */
  const hackathon: Project[] = [
    {
      kind: "blue-card",
      badge: "🥉 ETH Mérida · Sep 2024",
      title: pick("mpBot — DeFi in a chatbot", "mpBot — DeFi en un chatbot", "mpBot — 聊天机器人里的 DeFi", language),
      desc: pick(
        "Telegram bot for Meta Pool staking & DeFi Q&A. Built in 48 h with Next.js + Telegraf + OpenAI.",
        "Bot de Telegram para staking con Meta Pool y Q&A sobre DeFi. Construido en 48 h con Next.js + Telegraf + OpenAI.",
        "用于 Meta Pool 质押与 DeFi 问答的 Telegram 机器人。48 小时内用 Next.js + Telegraf + OpenAI 构建。",
        language
      ),
      links: [
        { href: "https://github.com/AlejoReyna/mpBOT", label: "GitHub" },
        { href: "https://t.me/PoolitoAssistantBot", label: pick("Try on Telegram", "Probar en Telegram", "在 Telegram 上试用", language) },
      ],
    },
    {
      kind: "image",
      media: "https://raw.githubusercontent.com/AlejoReyna/Birdlypay/main/BIRDLY_PAY_BANNER.jpg",
      badge: "BASE · ONCHAIN SUMMER",
      title: pick("Birdlypay — On-chain payment links", "Birdlypay — Links de pago on-chain", "Birdlypay — 链上支付链接", language),
      desc: pick(
        "dApp to create shareable on-chain payment links. Solidity contracts on Base blockchain.",
        "dApp para crear enlaces de pago compartibles on-chain. Contratos en Solidity sobre Base blockchain.",
        "用于创建可共享链上支付链接的 dApp。基于 Base 区块链的 Solidity 合约。",
        language
      ),
      links: [
        { href: "https://github.com/AlejoReyna/Birdlypay", label: "GitHub" },
        { href: "https://birdlypay.vercel.app", label: pick("Live demo", "Demo en vivo", "在线演示", language) },
      ],
    },
    {
      kind: "image",
      media: "/avocado.PNG",
      badge: "🥉 Jun 2023 · Side project",
      title: pick("NiftyRewards — Loyalty with NFTs", "NiftyRewards — Lealtad con NFTs", "NiftyRewards — 用 NFT 做忠诚计划", language),
      desc: pick(
        "Loyalty rewards system with fungible tokens & NFTs. TS frontend with Rust logic/contracts.",
        "Sistema de recompensas con tokens fungibles y NFTs. Frontend TS con lógica y contratos en Rust.",
        "带有同质化代币与 NFT 的奖励系统。TS 前端，Rust 逻辑/合约。",
        language
      ),
      links: [{ href: "https://github.com/eliasg24/NiftyRewards", label: "GitHub" }],
    },
  ];

  return (
    <MotionConfig transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}>
      <div
        id="projects"
        ref={sectionRef}
        style={{ backgroundColor: "var(--gic-canvas-white)" }}
      >
        {/* ── Light transition from services into work ── */}
        <div
          style={{
            height: "48px",
            background:
              "linear-gradient(to bottom, var(--gic-off-white), var(--gic-canvas-white))",
          }}
        />

        {/* ── Main content wrapper ── */}
        <motion.div
          className="w-full px-6 md:px-10 lg:px-16 pb-24"
          style={{
            y: sectionY,
            maxWidth: "var(--gic-max-width)",
            margin: "0 auto",
            paddingLeft: "clamp(24px, 5vw, 64px)",
            paddingRight: "clamp(24px, 5vw, 64px)",
            paddingBottom: "80px",
          }}
        >
          {/* ── Section header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7 }}
            className="mb-12 pt-4"
          >
            <SectionLabel>{pick("Selected work", "Trabajo selecto", "精选作品", language)}</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "clamp(32px, 4vw, var(--gic-text-heading))",
                fontWeight: 400,
                lineHeight: "var(--gic-leading-heading)",
                letterSpacing: "var(--gic-tracking-heading)",
                color: "var(--gic-dark-charcoal)",
                maxWidth: "560px",
              }}
            >
              {pick(
                "Projects that blend design and technology.",
                "Proyectos que combinan diseño y tecnología.",
                "融合设计与技术的项目。",
                language
              )}
            </h2>
          </motion.div>

          {/* ── Featured grid ── */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
          >
            {featured.map((p, i) => (
              <ElevatedCard key={i} project={p} />
            ))}
          </motion.div>

          {/* ── Open Source ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="mt-16 mb-6"
          >
            <SectionLabel>Open Source</SectionLabel>
            <OpenSourceCard language={language} />
          </motion.div>

          {/* ── Hackathon section ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="mt-16"
          >
            <SectionLabel>{pick("Hackathon projects", "Hackathons", "黑客马拉松项目", language)}</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "clamp(28px, 3.5vw, var(--gic-text-heading))",
                fontWeight: 400,
                lineHeight: "var(--gic-leading-heading)",
                letterSpacing: "var(--gic-tracking-heading)",
                color: "var(--gic-dark-charcoal)",
                marginBottom: "32px",
                maxWidth: "460px",
              }}
            >
              {pick(
                "Built under pressure, shipped with pride.",
                "Construido bajo presión, entregado con orgullo.",
                "在压力下构建，带着自豪交付。",
                language
              )}
            </h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {hackathon.map((p, i) =>
              p.kind === "blue-card" ? (
                <CofounderCard key={i} project={p} />
              ) : (
                <ElevatedCard key={i} project={p} />
              )
            )}
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
