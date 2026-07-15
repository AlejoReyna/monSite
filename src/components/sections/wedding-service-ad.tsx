"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";
import type { Language } from "@/components/lang-context";

type LocalizedCase = {
  id: string;
  couple: string;
  slug: string;
  href: string;
  video: string | null;
  features: Record<Language, string[]>;
  palette: string[];
  description: Record<Language, string>;
};

const CASES: LocalizedCase[] = [
  {
    id: "01",
    couple: "Andrea & Aldo",
    slug: "aldoyandrea.com",
    href: "https://aldoyandrea.com",
    video: "/wedding_preview.mp4",
    features: {
      en: ["Full RSVP flow", "Google Maps integration", "Schedule timeline", "171 commits"],
      es: ["Flujo RSVP completo", "Integración con Google Maps", "Línea de tiempo", "171 commits"],
      zh: ["完整 RSVP 流程", "Google 地图集成", "日程时间线", "171 次提交"],
    },
    palette: ["#e8dcc8", "#c4a96f", "#8b7355"],
    description: {
      en: "An immersive digital invitation that guided every guest from the first scroll to the ceremony seat — no paper, no confusion.",
      es: "Una invitación digital inmersiva que guió a cada invitado desde el primer scroll hasta su asiento — sin papel, sin confusión.",
      zh: "一个沉浸式的数字邀请函，引导每位宾客从第一次滑动到典礼座位——无纸化，无混乱。",
    },
  },
  {
    id: "02",
    couple: "Cindy & Jorge",
    slug: "cindy-s-wedding.vercel.app",
    href: "https://cindy-s-wedding.vercel.app",
    video: null,
    features: {
      en: ["3D photo gallery", "Custom color system", "TypeScript 95%", "265 commits"],
      es: ["Galería fotográfica 3D", "Sistema de color personalizado", "TypeScript 95%", "265 commits"],
      zh: ["3D 照片画廊", "自定义色彩系统", "TypeScript 95%", "265 次提交"],
    },
    palette: ["#d4c5e2", "#9b7fb5", "#6b4f8a"],
    description: {
      en: "A three-dimensional gallery experience that let guests relive every moment — from the engagement ring to the last dance.",
      es: "Una experiencia de galería tridimensional que permitió a los invitados revivir cada momento — desde el anillo de compromiso hasta el último baile.",
      zh: "一个三维画廊体验，让宾客重温每一个瞬间——从订婚戒指到最后一支舞。",
    },
  },
];

const SECTION_COPY: Record<Language, {
  eyebrow: string;
  title: string;
  intro: string;
  marquee: string;
  ctaEyebrow: string;
  ctaLead: string;
}> = {
  en: {
    eyebrow: "section 05 / services",
    title: "Wedding\nInvitations",
    intro: "Digital wedding invitations that live on the web — not on a shelf. Every couple gets a custom build, from RSVP to gallery.",
    marquee: "custom build · RSVP flow · live URL · 3D gallery · timeline · maps · fully responsive · no templates",
    ctaEyebrow: "Your day. Your URL. Your story.",
    ctaLead: "Let's build something your guests will remember.",
  },
  es: {
    eyebrow: "sección 05 / servicios",
    title: "Invitaciones\nde Boda",
    intro: "Invitaciones de boda digitales que viven en la web — no en un estante. Cada pareja recibe una construcción a medida, desde RSVP hasta galería.",
    marquee: "construcción a medida · flujo RSVP · URL en vivo · galería 3D · línea de tiempo · mapas · totalmente responsive · sin plantillas",
    ctaEyebrow: "Tu día. Tu URL. Tu historia.",
    ctaLead: "Construyamos algo que tus invitados recuerden.",
  },
  zh: {
    eyebrow: "第 05 部分 / 服务",
    title: "婚礼\n邀请函",
    intro: "活在网上的数字婚礼邀请函——不是摆在架子上。每对新人都能获得从 RSVP 到画廊的定制构建。",
    marquee: "定制构建 · RSVP 流程 · 实时网址 · 3D 画廊 · 时间线 · 地图 · 完全响应式 · 无模板",
    ctaEyebrow: "你的日子。你的网址。你的故事。",
    ctaLead: "让我们打造一些让你的宾客铭记的东西。",
  },
};

/* ── palette ─── */
const W = {
  bg:      "#f8f5ea",    /* warm cream */
  bgDeep:  "#f0ece0",    /* slightly deeper cream */
  ink:     "#0a0a0c",    /* near-black text */
  inkMid:  "rgba(10,10,12,0.55)",
  inkDim:  "rgba(10,10,12,0.3)",
  gold:    "#b8912a",    /* muted gold readable on cream */
  goldDim: "rgba(184,145,42,0.15)",
  border:  "rgba(10,10,12,0.1)",
  borderStrong: "rgba(10,10,12,0.18)",
};

/* ── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Case card ─── */
function CaseCard({ c, index, lang }: { c: (typeof CASES)[number]; index: number; lang: Language }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{
        flex: "1 1 clamp(300px, 45%, 520px)",
        border: `1px solid ${W.borderStrong}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      {/* video / media */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "clamp(180px, 26vh, 280px)",
        overflow: "hidden",
        flexShrink: 0,
        background: W.bgDeep,
      }}>
        {c.video ? (
          <video
            autoPlay muted loop playsInline preload="metadata"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src={c.video} type="video/mp4" />
          </video>
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, ${c.palette[2]} 0%, ${c.palette[1]} 50%, ${c.palette[0]} 100%)`,
            opacity: 0.5,
          }} />
        )}

        {/* light gradient at bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.85) 100%)",
        }} />

        {/* case badge */}
        <span style={{
          position: "absolute", top: 14, left: 16,
          fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
          fontSize: "0.5rem", letterSpacing: "0.28em", textTransform: "uppercase",
          color: W.gold,
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(8px)",
          padding: "3px 8px",
          borderRadius: 2,
          border: `1px solid ${W.goldDim}`,
        }}>
          case {c.id}
        </span>

        {/* palette dots */}
        <div style={{ position: "absolute", bottom: 14, left: 16, display: "flex", gap: 5 }}>
          {c.palette.map((col) => (
            <span key={col} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: col, border: "1px solid rgba(0,0,0,0.12)",
            }} />
          ))}
        </div>
      </div>

      {/* text */}
      <div style={{
        padding: "clamp(20px, 2.5vw, 32px)",
        display: "flex", flexDirection: "column", flex: 1,
      }}>
        <h3 style={{
          fontFamily: "var(--font-bebas, sans-serif)",
          fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
          lineHeight: 0.9, letterSpacing: "-0.01em",
          color: W.ink, margin: "0 0 14px",
        }}>
          {c.couple}
        </h3>

        <p style={{
          fontFamily: "var(--font-cormorant, serif)",
          fontStyle: "italic",
          fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)",
          lineHeight: 1.65, color: W.inkMid,
          margin: "0 0 24px",
        }}>
          {c.description[lang]}
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "7px 16px", marginBottom: 28,
        }}>
          {c.features[lang].map((f) => (
            <span key={f} style={{
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.55rem", letterSpacing: "0.08em",
              textTransform: "uppercase", color: W.inkDim,
              borderBottom: `1px solid ${W.border}`,
              paddingBottom: 7,
            }}>
              ↳ {f}
            </span>
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.56rem", letterSpacing: "0.2em",
              textTransform: "uppercase", color: W.gold,
              textDecoration: "none",
              borderBottom: `1px solid ${W.goldDim}`,
              paddingBottom: "2px",
            }}
          >
            {c.slug} →
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main ─── */
export default function WeddingServiceAd() {
  const { language } = useLanguage();
  const copy = SECTION_COPY[language];

  return (
    <section style={{ background: W.bg, overflow: "hidden" }}>
      <style>{`
        @media (max-width: 720px) { .wedding-cases { flex-direction: column !important; } }
      `}</style>

      {/* header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: "clamp(32px, 6vw, 56px) clamp(24px, 6vw, 80px)",
        borderBottom: `1px solid ${W.borderStrong}`,
        flexWrap: "wrap", gap: "1rem",
      }}>
        <Reveal>
          <div>
            <p style={{
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.6rem", letterSpacing: "0.3em",
              textTransform: "uppercase", color: W.gold,
              margin: "0 0 10px",
            }}>
              {copy.eyebrow}
            </p>
            <h2 style={{
              fontFamily: "var(--font-bebas, sans-serif)",
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              lineHeight: 0.92, letterSpacing: "-0.01em",
              color: W.ink, margin: 0,
              whiteSpace: "pre-line",
            }}>
              {copy.title}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{
            fontFamily: "var(--font-cormorant, serif)",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
            color: W.inkMid, maxWidth: 340,
            lineHeight: 1.65, margin: 0,
          }}>
            {copy.intro}
          </p>
        </Reveal>
      </div>

      {/* marquee */}
      <Reveal>
        <div style={{
          overflow: "hidden",
          padding: "clamp(18px, 2.5vw, 30px) clamp(24px, 6vw, 80px)",
          borderBottom: `1px solid ${W.border}`,
          background: W.bgDeep,
        }}>
          <p style={{
            fontFamily: "var(--font-bebas, sans-serif)",
            fontSize: "clamp(1.1rem, 2.5vw, 2rem)",
            letterSpacing: "0.1em", color: `${W.ink}22`,
            textTransform: "uppercase", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {copy.marquee}
          </p>
        </div>
      </Reveal>

      {/* cards */}
      <div style={{
        padding: "clamp(32px, 5vw, 56px) clamp(24px, 6vw, 80px)",
        borderBottom: `1px solid ${W.borderStrong}`,
      }}>
        <div
          className="wedding-cases"
          style={{ display: "flex", flexWrap: "wrap", gap: "clamp(20px, 3vw, 36px)" }}
        >
          {CASES.map((c, i) => (
            <CaseCard key={c.id} c={c} index={i} lang={language} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <Reveal delay={0.05}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "clamp(28px, 4vw, 48px) clamp(24px, 6vw, 80px)",
          flexWrap: "wrap", gap: "1.5rem",
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.58rem", letterSpacing: "0.25em",
              textTransform: "uppercase", color: W.inkDim,
              margin: "0 0 8px",
            }}>
              {copy.ctaEyebrow}
            </p>
            <p style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontStyle: "italic",
              fontSize: "clamp(1.4rem, 2.5vw, 2.1rem)",
              color: W.ink, margin: 0, lineHeight: 1.2,
            }}>
              {copy.ctaLead}
            </p>
          </div>

          <a
            href="mailto:alexis.rs@inverater.com?subject=Wedding%20Invitation%20Inquiry"
            style={{
              display: "inline-block",
              fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
              fontSize: "0.62rem", letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#fff",
              background: W.ink,
              padding: "14px 28px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = W.gold)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = W.ink)}
          >
            {t("getInTouch", language)}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
