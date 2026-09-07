"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import ChatInterface from "@/components/chat-interface";
import AliceFrameAnimation from "@/components/v2/alice-frame-animation";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";

/* ═══════════════════════════════════════════
   Hero V2 — Night Sky / GIC style
   ═══════════════════════════════════════════ */

const SCROLL_PROMPT: Record<Language, string> = {
  en: "scroll down to see my projects!",
  es: "Desliza hacia abajo para ver mis proyectos!",
  zh: "向下滚动查看我的项目！",
};

const HERO_TITLE: Record<Language, string> = {
  en: "Alexis Reyna — Full-stack Developer & UI Engineer",
  es: "Alexis Reyna — Desarrollador Full-stack & UI Engineer",
  zh: "Alexis Reyna — 全栈开发者与 UI 工程师",
};
type HeroV2Props = {
  /**
   * Inside `HeroCarouselSequence` the hero stays in a sticky frame; window-based
   * `useScroll` on this section mis-tracks, so inner fades/parallax hide content early.
   * Omit scroll-driven motion here — the parent sequence handles the reveal.
   */
  embedInScrollSequence?: boolean;
  /** When embedded, fades hero chrome (not the BG) during the carousel wipe. */
  embedContentOpacity?: MotionValue<number>;
  /**
   * When true, strips the background image and vignette so the
   * section inherits a flat `#08080a` base — used by the v3 page which wants
   * a uniform background throughout.
   */
  noBgImage?: boolean;
  /** Keeps the BG image, but removes the dark translucent vignette layer. */
  disableBgVignette?: boolean;
};

export default function HeroV2({
  embedInScrollSequence,
  embedContentOpacity,
  noBgImage = false,
  disableBgVignette = false,
}: HeroV2Props) {
  const { language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  // Remonta la terminal al cruzar el breakpoint lg: el offset de drag de
  // framer-motion vive como transform inline y sobrevive al cambio de CSS
  // (bottom/center móvil ↔ top/right desktop), dejando el panel descuadrado.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  /* parallax / fade */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.5 });
  const embed = !!embedInScrollSequence;
  const bgY = useTransform(smooth, [0, 1], embed ? ["0%", "0%"] : ["0%", "22%"]);
  const contentY = useTransform(smooth, [0, 1], embed ? ["0px", "0px"] : ["0px", "55px"]);
  const baseContentOpacity = useTransform(smooth, [0, 0.65], embed ? [1, 1] : [1, 0]);
  const baseGifOpacity = useTransform(smooth, [0, 0.55], embed ? [1, 1] : [1, 0]);

  const contentOpacity =
    embed && embedContentOpacity
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ? useTransform(
          [baseContentOpacity, embedContentOpacity],
          ([a, b]) => Number(a) * Number(b)
        )
      : baseContentOpacity;
  const gifOpacity =
    embed && embedContentOpacity
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ? useTransform(
          [baseGifOpacity, embedContentOpacity],
          ([a, b]) => Number(a) * Number(b)
        )
      : baseGifOpacity;
  const assetZoom = 1.4;
  const gifScale = useTransform(smooth, [0, 1], embed ? [assetZoom, assetZoom] : [assetZoom, 0.93 * assetZoom]);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen overflow-hidden flex"
      style={{ backgroundColor: noBgImage ? "#08080a" : "var(--gic-night-sky)" }}
    >
      <AliceFrameAnimation />

      {/* Page heading for screen readers */}
      <h1 className="sr-only">{HERO_TITLE[language]}</h1>

      {/* ── Background image + parallax ── */}
      {!noBgImage && (
        <motion.div
          className="absolute inset-0 z-0 scale-[1.02] md:scale-110"
          style={{ y: bgY }}
        >
          <Image
            src="/racoons_linux.webp"
            alt=""
            fill
            priority
            className="object-cover object-[center_18%] md:object-center"
            style={{ opacity: 0.28, mixBlendMode: "luminosity" }}
          />
          {/* Multi-layer vignette */}
          {!disableBgVignette && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(31,31,41,0.55) 0%, rgba(31,31,41,0.3) 40%, rgba(31,31,41,0.85) 100%)",
              }}
            />
          )}
        </motion.div>
      )}

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 w-full h-screen px-6 md:px-10 lg:px-16 flex flex-col"
        style={{
          y: contentY,
          opacity: contentOpacity,
          maxWidth: "var(--gic-max-width)",
          margin: "0 auto",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(380px,min(640px,52vw))_1fr] gap-10 lg:gap-12 items-start lg:items-stretch w-full flex-1">

          {/* ── Left column: GIF full height ── */}
          <motion.div
            initial={{ opacity: embed ? 1 : 0, y: embed ? 0 : 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative lg:mr-[15%] w-full h-full min-h-[50vh] lg:min-h-[min(83.6vh,665px)] pt-0 lg:pt-16 mt-[-14vh] lg:mt-[60px] overflow-hidden pointer-events-none origin-top rounded-lg"
            style={{ opacity: gifOpacity, scale: gifScale }}
            aria-hidden
          >
            <Image
              src="/16.gif"
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 1400px) min(540px, 46vw), 0px"
              className="object-contain object-center"
            />
          </motion.div>

          {/* ── Right column: layout placeholder (terminal floats here) ── */}
          <div className="hidden lg:block relative w-full h-full min-h-[min(70vh,520px)] lg:min-h-[min(88vh,780px)]" />
        </div>

        {/* ── Credly badge ── */}
        <motion.div
          className="absolute z-20 right-3 top-[14%] w-[72px] md:right-6 md:w-[80px] lg:left-2 lg:right-auto lg:top-[38%] lg:w-[90px] origin-top-right lg:origin-top-left"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <a
            href="https://www.credly.com/badges/a58ebe0a-da77-4ffe-8499-3d46b84b2059"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AWS Certified AI Practitioner badge"
          >
            <Image
              src="/credly-badge.png"
              alt="AWS Certified AI Practitioner"
              width={100}
              height={100}
              className="drop-shadow-md badge-float"
              style={{ width: "100%", height: "auto" }}
            />
          </a>
        </motion.div>

        {/* ── Scroll hint — a scribbled comic aside beside the art ── */}
        <motion.div
          className="pointer-events-none select-none absolute z-20 flex flex-col items-end text-right right-3 top-[27%] w-[110px] md:right-6 md:left-6 md:top-1/2 md:w-[195px] md:items-start md:text-left lg:right-auto lg:left-6 lg:top-1/2 lg:w-[195px] lg:items-start lg:text-left"
          style={{ rotate: -4, color: "rgba(255,255,255,0.9)", gap: 4 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.75, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.span
            className="text-[clamp(0.9rem,2.4vw,1.1rem)] md:text-[clamp(1.11rem,1.65vw,1.29rem)]"
            style={{
              fontFamily: "var(--gic-font-comic)",
              lineHeight: 1.3,
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              hidden: {},
            }}
          >
            {SCROLL_PROMPT[language].split(" ").map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.3em]"
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
          <svg
            viewBox="0 0 54 78"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-[16px] h-[23px] mr-3 md:w-[24px] md:h-[35px] md:mr-0 md:ml-3"
          >
            <motion.path
              d="M17 4 C17 36, 38 38, 38 68"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeInOut" }}
            />
            <motion.path
              d="M29 60 L38 69 L47 60"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 1.3, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </motion.div>


      {/* ── Draggable terminal ── */}
      <style>{`
        .comic-terminal, .comic-terminal * { font-family: var(--font-space-mono, ui-monospace, monospace) !important; }
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .badge-float {
          animation: badgeFloat 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .badge-float { animation: none; }
        }
      `}</style>
      <motion.div
        key={isDesktop ? "terminal-lg" : "terminal-sm"}
        drag
        dragMomentum={false}
        dragConstraints={heroRef}
        dragElastic={0}
        className="absolute z-30 cursor-grab active:cursor-grabbing comic-terminal bottom-[7vh] lg:bottom-auto lg:top-[22%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[8%] w-[96vw] lg:w-[min(546px,44.1vw)]"
        style={{
          opacity: contentOpacity,
          fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
        }}
      >
        <a
          href="https://www.instagram.com/jayivee._/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute -top-6 left-0 z-50 text-[0.55rem] lg:text-[0.6rem] text-white/40 hover:text-white/80 transition-colors font-mono tracking-wider pointer-events-auto md:hidden"
        >
          Artist: @jayivee._
        </a>
        <div className="w-full h-[min(425.25px,40.5vh)] lg:h-[min(472.5px,52.5vh)]">
          <ChatInterface variant="panel" className="!w-full !h-full max-w-none" />
        </div>
      </motion.div>

      {/* ── Instagram credit ── */}
      <a
        href="https://www.instagram.com/jayivee._/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:block absolute bottom-3 right-3 z-50 text-[0.65rem] tracking-wider text-white/40 hover:text-white/80 transition-colors pointer-events-auto"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        Artist: @jayivee._
      </a>
    </section>
  );
}
