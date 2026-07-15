"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { useLanguage, type Language } from "@/components/lang-context";
import { t } from "@/lib/translations";
import { PROJECTS, type V3Project } from "./data/projects";
import "@/components/v3/v3.css";

/* ─── helpers ───────────────────────────── */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const TOTAL = PROJECTS.length;
const PROJECT_FADE_MS = 240;

function useTypewriterText(text: string, activeKey: string, enabled = true, delay = 180, speed = 14) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    if (!enabled) {
      setVisibleText("");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleText(text);
      return;
    }

    const chars = Array.from(text);
    let index = 0;
    let intervalId: number | undefined;

    setVisibleText("");

    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setVisibleText(chars.slice(0, index).join(""));

        if (index >= chars.length && intervalId) {
          window.clearInterval(intervalId);
        }
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [activeKey, delay, enabled, speed, text]);

  return visibleText;
}

function TypewriterText({
  as: Component,
  text,
  activeKey,
  className,
  enabled = true,
  delay = 180,
  speed = 14,
}: {
  as: "h3" | "p" | "span";
  text: string;
  activeKey: string;
  className?: string;
  enabled?: boolean;
  delay?: number;
  speed?: number;
}) {
  const visibleText = useTypewriterText(text, activeKey, enabled, delay, speed);
  const isTyping = visibleText.length > 0 && visibleText.length < Array.from(text).length;

  return (
    <Component
      className={className}
      aria-label={text}
      data-typing={isTyping ? "true" : "false"}
    >
      {visibleText}
    </Component>
  );
}

/* ═══════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════ */
interface CardProps {
  project: V3Project;
  isActive: boolean;
  isVisible: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
}

function ProjectCard({ project, isActive, isVisible, videoRef }: CardProps) {
  return (
    <motion.article
      className="v3-carousel-card"
      aria-label={project.title}
      style={{ transform: "scale(1)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {/* ② Media */}
      {project.media && (
        <div key={`${project.id}-${project.media}`} className="v3-carousel-media">
          {project.mediaType === "video" ? (
            <video
              key={project.media}
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              className="v3-carousel-media-inner"
              style={{
                filter: isActive ? "none" : "grayscale(0.6)",
                transition: "filter 0.35s ease",
              }}
            >
              <source src={project.media} type="video/mp4" />
            </video>
          ) : (
            <Image
              key={project.media}
              src={project.media}
              alt={project.title}
              fill
              sizes="(max-width: 720px) 90vw, 620px"
              className="v3-carousel-media-inner"
              style={{
                filter: isActive ? "none" : "grayscale(0.6)",
                transition: "filter 0.35s ease",
              }}
              unoptimized={project.media.startsWith("http")}
            />
          )}
          {/* Bottom gradient overlay */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(8,8,10,0.22) 0%, transparent 55%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </motion.article>
  );
}

const BUILD_NOTES: Record<string, { es: string; en: string; zh: string }> = {
  "plebes-dao": {
    es: "Construí esto como una mezcla rara entre gobernanza, cultura de internet y producto cripto que tenía que sentirse vivo, no corporativo.",
    en: "I built this as a weird mix of governance, internet culture and crypto product work that had to feel alive, not corporate.",
    zh: "我把它建构成治理、互联网文化与加密产品工作的奇特混合体，必须让人感觉鲜活，而非企业化。",
  },
  "andrea-aldo": {
    es: "Este fue más delicado: la interfaz tenía que sentirse íntima, útil y emocional sin romper el flujo de una boda real.",
    en: "This one was delicate: the interface had to feel intimate, useful and emotional without getting in the way of a real wedding.",
    zh: "这个更细腻：界面必须让人感觉亲密、实用且富有情感，同时不打扰真实婚礼的流程。",
  },
  "mk1-presale": {
    es: "Aquí me fui por impacto rápido: una landing que se entendiera en segundos, capturara leads y sostuviera el hype.",
    en: "Here I chased fast impact: a landing that made sense in seconds, captured leads and carried the hype.",
    zh: "这里我追求快速冲击：一个几秒钟内就能理解、能捕获潜在客户并能维持热度的落地页。",
  },
  pokefolio: {
    es: "Lo armé como si el portfolio fuera un juego: diálogo, ritmo y pequeñas recompensas en vez de una página estática.",
    en: "I built it like the portfolio was a game: dialogue, rhythm and small rewards instead of a static page.",
    zh: "我把它建构成一个游戏：对话、节奏和小奖励，而不是静态页面。",
  },
  "uanl-interface": {
    es: "Este fue puro rescate de UX: tomar pantallas heredadas, pelearme con frames viejos y devolverles algo usable.",
    en: "This was straight UX rescue work: taking legacy screens, fighting old frames and giving them something usable back.",
    zh: "这是纯粹的 UX 救援工作：接管遗留屏幕，与旧框架搏斗，还给它们一些可用的东西。",
  },
  mpbot: {
    es: "Fue un sprint de hackathon: convertir DeFi en conversación, recortar lo innecesario y hacer que funcionara rápido.",
    en: "This was a hackathon sprint: turning DeFi into conversation, cutting the noise and making it work fast.",
    zh: "这是一个黑客马拉松冲刺：把 DeFi 变成对话，剔除噪音，让它快速运转。",
  },
  birdlypay: {
    es: "La idea era simple y difícil: pagos on-chain que se sintieran tan naturales como compartir un enlace.",
    en: "The idea was simple and hard: on-chain payments that felt as natural as sharing a link.",
    zh: "这个想法简单却很难：链上支付要像分享链接一样自然。",
  },
};

function ProjectStickerPanel({
  project,
  language,
  isVisible,
  typingReady,
}: {
  project: V3Project;
  language: Language;
  isVisible: boolean;
  typingReady: boolean;
}) {
  const buildNote = BUILD_NOTES[project.id] ?? {
    es: "Construí esto iterando entre lo visual, lo técnico y lo raro hasta que empezó a sentirse propio.",
    en: "I built this by pushing between visuals, engineering and weird little details until it started feeling like its own thing.",
    zh: "我通过在视觉、工程和奇怪的小细节之间不断推进来构建它，直到它开始感觉像自己的东西。",
  };
  const tagline = project.tagline[language];
  const description = project.description[language];
  const note = buildNote[language];
  const typingKey = `${project.id}-${language}`;

  return (
    <aside className="v3-carousel-sticker-panel" aria-label={`${project.title} build note`}>
      <div className="v3-carousel-sticker-orbit">
        <motion.div
          className="v3-carousel-build-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <TypewriterText
            as="span"
            text={language === "zh" ? "构建日志" : language === "es" ? "bitacora" : "build log"}
            activeKey={typingKey}
            className="v3-carousel-build-kicker"
            enabled={typingReady}
            delay={60}
            speed={20}
          />
          <TypewriterText
            as="h3"
            text={project.title}
            activeKey={typingKey}
            enabled={typingReady}
            delay={180}
            speed={26}
          />
          <TypewriterText
            as="p"
            text={tagline}
            activeKey={typingKey}
            className="v3-carousel-build-dek"
            enabled={typingReady}
            delay={360}
            speed={16}
          />
          <div className="v3-carousel-build-body">
            <TypewriterText
              as="p"
              text={description}
              activeKey={typingKey}
              enabled={typingReady}
              delay={620}
              speed={10}
            />
            <TypewriterText
              as="p"
              text={note}
              activeKey={typingKey}
              enabled={typingReady}
              delay={880}
              speed={10}
            />
          </div>
          <div className="v3-carousel-build-tags" aria-label="Stack">
            {project.tags.map((tag) => (
              <span key={tag}>
                <Github aria-hidden="true" size={12} strokeWidth={1.8} />
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
type ProjectsCarouselProps = {
  /** Hero scroll sequence: keep solid v3 panels off so the hero night-sky reads through. */
  transparentBackdrop?: boolean;
  /** Hero sequence intro: cards appear sequentially after the curtain opens. */
  introActive?: boolean;
};

export default function ProjectsCarousel({ transparentBackdrop, introActive = true }: ProjectsCarouselProps = {}) {
  const { language } = useLanguage();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isProjectVisible, setIsProjectVisible] = useState(true);
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const [isTypingReady, setIsTypingReady] = useState(true);
  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];
  const canScrollPrev = activeIndex > 0;
  const canScrollNext = activeIndex < TOTAL - 1;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const switchTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.load();
    vid.currentTime = 0;
    vid.play().catch(() => {});
  }, [activeProject.id]);

  const switchProject = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.min(TOTAL - 1, Math.max(0, nextIndex));
      if (clampedIndex === activeIndex || isProjectSwitching) return;

      setIsProjectSwitching(true);
      setIsTypingReady(false);
      setIsProjectVisible(false);

      switchTimeoutRef.current = window.setTimeout(() => {
        setActiveIndex(clampedIndex);
        setIsProjectVisible(true);
        switchTimeoutRef.current = null;

        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTypingReady(true);
          setIsProjectSwitching(false);
          typingTimeoutRef.current = null;
        }, PROJECT_FADE_MS);
      }, PROJECT_FADE_MS);
    },
    [activeIndex, isProjectSwitching]
  );

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current !== null) {
        window.clearTimeout(switchTimeoutRef.current);
      }
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollPrev = useCallback(() => {
    switchProject(activeIndex - 1);
  }, [activeIndex, switchProject]);

  const scrollNext = useCallback(() => {
    switchProject(activeIndex + 1);
  }, [activeIndex, switchProject]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [scrollNext, scrollPrev]);

  /* Progress as 0–1 */
  const progress = TOTAL > 1 ? activeIndex / (TOTAL - 1) : 0;

  return (
    <section
      className={transparentBackdrop ? "v3-carousel-sequence-frame" : undefined}
      style={{
        background: transparentBackdrop ? "transparent" : "var(--v3-bg)",
        position: "relative",
        minHeight: "100svh",
        marginTop: "5rem",
      }}
      aria-label={t("projects", language)}
    >
      {/* ── Static project frame: only the content swaps. ── */}
      <div
        className="v3-carousel-static-viewport"
        style={{
          overflow: "hidden",
          padding: transparentBackdrop
            ? "calc(10svh + clamp(0.75rem, 2vh, 1.25rem)) 0 clamp(0.75rem, 2vh, 1.25rem)"
            : "clamp(1rem, 2.6vh, 2rem) 0 clamp(1rem, 2.6vh, 2rem)",
        }}
      >
        <div
          role="list"
          className="v3-carousel-static-stage"
          style={{
            paddingLeft: "clamp(1.5rem, 8vw, 5rem)",
            paddingRight: "clamp(1.5rem, 8vw, 5rem)",
          }}
        >
          <div
            className="v3-carousel-slide v3-carousel-slide--feature"
            role="listitem"
            aria-label={`${activeProject.title}, ${pad(activeIndex + 1)} de ${pad(TOTAL)}`}
            style={{
              transform: introActive ? "translate3d(0,0,0) scale(1)" : "translate3d(0,42px,0) scale(0.96)",
              transitionProperty: "transform",
              transitionDuration: "900ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: introActive ? "140ms" : "0ms",
              willChange: "transform",
            }}
          >
            <div className="v3-carousel-feature-grid">
              <ProjectCard
                key={activeProject.id}
                project={activeProject}
                isActive
                isVisible={isProjectVisible}
                videoRef={(el) => {
                  videoRef.current = el;
                }}
              />
              <ProjectStickerPanel
                key={`${activeProject.id}-${language}`}
                project={activeProject}
                language={language}
                isVisible={isProjectVisible}
                typingReady={isTypingReady}
              />
            </div>
          </div>
        </div>
      </div>

      <motion.button
        initial={false}
        animate={{}}
        transition={{ duration: 0.3 }}
        onClick={scrollPrev}
        disabled={!canScrollPrev || isProjectSwitching}
        aria-label={t("previousProject", language)}
        className="v3-carousel-arrow v3-carousel-arrow--prev"
        style={{
          pointerEvents: introActive ? "auto" : "none",
          cursor: canScrollPrev && !isProjectSwitching ? "pointer" : "not-allowed",
        }}
      >
        ←
      </motion.button>
      <motion.button
        initial={false}
        animate={{}}
        transition={{ duration: 0.3 }}
        onClick={scrollNext}
        disabled={!canScrollNext || isProjectSwitching}
        aria-label={t("nextProject", language)}
        className="v3-carousel-arrow v3-carousel-arrow--next"
        style={{
          pointerEvents: introActive ? "auto" : "none",
          cursor: canScrollNext && !isProjectSwitching ? "pointer" : "not-allowed",
        }}
      >
        →
      </motion.button>

      {/* ── Controls bar ── */}
      <motion.div
        initial={false}
        animate={{
          y: introActive ? 0 : 16,
        }}
        transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1], delay: introActive ? 0.42 : 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(1rem, 3vw, 2rem)",
          padding: transparentBackdrop
            ? "0 clamp(1.5rem, 6vw, 5rem)"
            : "1.25rem clamp(1.5rem, 6vw, 5rem) 2.5rem",
          borderTop: transparentBackdrop ? "none" : "1px solid var(--v3-line)",
          flexWrap: "wrap",
          position: transparentBackdrop ? "absolute" : "relative",
          left: transparentBackdrop ? 0 : undefined,
          right: transparentBackdrop ? 0 : undefined,
          bottom: transparentBackdrop ? "clamp(4rem, 7svh, 5.5rem)" : undefined,
          zIndex: transparentBackdrop ? 7 : undefined,
        }}
      >
        {/* Progress bar (thin line, not dots) */}
        <div
          className="v3-carousel-progress-wrap"
          aria-hidden="true"
          role="presentation"
        >
          <motion.div
            className="v3-carousel-progress-fill"
            animate={{ scaleX: progress }}
            initial={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ transformOrigin: "left center" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
