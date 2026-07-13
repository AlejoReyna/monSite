"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import ChatInterface from "@/components/chat-interface";

/* ═══════════════════════════════════════════
   Hero V2 — Night Sky / GIC style
   ═══════════════════════════════════════════ */

const COMIC_MESSAGES = [
  "i build ai slop 24/7",
  "slurp",
  "ships at 2am",
  "powered by caffeine",
  "git push --force",
  "it works on my machine",
  "todo: fix later",
  "console.log everything",
];

const SCROLL_PROMPT = "SCROLL DOWN TO SEE MY PROJECTS!";
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
  const heroRef = useRef<HTMLElement>(null);
  const [devBorder, setDevBorder] = useState(false);

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
  // Comic speech-bubble rotation — disabled for now, kept in case it comes back.
  // const [msgIndex, setMsgIndex] = useState(0);
  // const [msgVisible, setMsgVisible] = useState(true);
  // useEffect(() => {
  //   const t = setInterval(() => {
  //     setMsgVisible(v => {
  //       if (v) return false; // visible → start standby
  //       setMsgIndex(i => (i + 1) % COMIC_MESSAGES.length); // advance on hidden → visible
  //       return true;
  //     });
  //   }, 2000);
  //   return () => clearInterval(t);
  // }, []);

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
      ? useTransform(
          [baseContentOpacity, embedContentOpacity],
          ([a, b]) => Number(a) * Number(b)
        )
      : baseContentOpacity;
  const gifOpacity =
    embed && embedContentOpacity
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
      {/* ── Background image + parallax ── */}
      {!noBgImage && (
        <motion.div
          className="absolute inset-0 z-0 scale-[1.02] md:scale-110"
          style={{ y: bgY }}
        >
          <Image
            src="/racoons_linux.webp"
            alt="Architectural night backdrop"
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
            className={`relative lg:mr-[15%] w-full h-full min-h-[50vh] lg:min-h-[min(83.6vh,665px)] pt-0 lg:pt-16 mt-[-3vh] lg:mt-[60px] overflow-hidden pointer-events-none origin-top rounded-lg ${devBorder ? "border-2 border-rose-400" : ""}`}
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
            {/* ── Dev: head divider line ── */}
            {devBorder && (
              <div
                className="absolute inset-x-0 pointer-events-none"
                style={{ top: "23%", height: "1px", background: "rgba(255,0,0,0.6)" }}
              />
            )}
            {/* ── Dev: vertical line ── */}
            {devBorder && (
              <div
                className="absolute pointer-events-none"
                style={{ left: "61.5%", top: 0, width: "1px", height: "23%", background: "rgba(255,0,0,0.6)" }}
              />
            )}

            {/* ── Comic speech bubbles — disabled for now, kept in case it comes back ──
            <AnimatePresence mode="wait">
              {msgVisible && (
                <motion.svg
                  key={`pointer-${msgIndex}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <path
                    d="M 63 13 C 62.2 13.8, 60.8 15.1, 59 16.4"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                </motion.svg>
              )}
            </AnimatePresence>

            <div className="absolute pointer-events-none" style={{ top: "8.5%", left: "62.5%", zIndex: 10 }}>
              <AnimatePresence mode="wait">
                {msgVisible && (
                  <motion.span
                    key={`b-${msgIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      display: "block",
                      fontFamily: "var(--gic-font-comic)",
                      fontSize: "0.78rem",
                      color: "white",
                      transform: "rotate(-3deg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {COMIC_MESSAGES[msgIndex]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            ── */}

          </motion.div>

          {/* ── Right column: layout placeholder (terminal floats here) ── */}
          <div className={`hidden lg:block relative w-full h-full min-h-[min(70vh,520px)] lg:min-h-[min(88vh,780px)] ${devBorder ? "border-2 border-rose-400" : ""}`}>
            {/* ── Dev: horizontal line at 45% ── */}
            {devBorder && (
              <div
                className="absolute inset-x-0 pointer-events-none"
                style={{ top: "38%", height: "1px", background: "rgba(255,0,0,0.6)" }}
              />
            )}
          </div>
        </div>

        {/* ── Credly badge ── */}
        <motion.div
          className="absolute z-20 right-3 top-[22%] w-[90px] md:right-6 lg:left-2 lg:right-auto lg:top-[38%] origin-top-right lg:origin-top-left"
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
              className="rounded-lg shadow-lg badge-float"
              style={{ width: "100%", height: "auto" }}
            />
          </a>
        </motion.div>

        {/* ── Scroll hint — a scribbled comic aside beside the art ── */}
        <motion.div
          className="pointer-events-none select-none absolute z-20 flex flex-col items-end text-right right-3 top-[30%] w-[110px] md:right-6 lg:right-auto lg:left-2 lg:top-1/2 lg:w-[130px] lg:items-start lg:text-left"
          style={{ rotate: -4, color: "rgba(255,255,255,0.55)", gap: 4 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.75, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <span
            style={{
              fontFamily: "var(--gic-font-comic)",
              fontSize: "clamp(0.74rem, 1.1vw, 0.86rem)",
              lineHeight: 1.3,
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
          >
            {SCROLL_PROMPT.toLowerCase()}
          </span>
          <svg
            viewBox="0 0 54 78"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-[16px] h-[23px] mr-3 lg:mr-0 lg:ml-3"
          >
            <path
              d="M17 4 C17 36, 38 38, 38 68"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M29 60 L38 69 L47 60"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
        className="absolute z-30 cursor-grab active:cursor-grabbing comic-terminal bottom-0 lg:bottom-auto lg:top-[22%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[8%] w-[96vw] lg:w-[min(546px,44.1vw)]"
        style={{
          opacity: contentOpacity,
          fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
        }}
      >
        <div className="w-full h-[min(425.25px,40.5vh)] lg:h-[min(472.5px,52.5vh)]">
          <ChatInterface variant="panel" className="!w-full !h-full max-w-none" />
        </div>
      </motion.div>

      {/* ── DEV: border toggle ── */}
      <button
        onClick={() => setDevBorder(v => !v)}
        className="absolute bottom-3 right-3 z-50 pointer-events-auto"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.6rem",
          letterSpacing: "0.08em",
          color: devBorder ? "rgba(251,113,133,0.9)" : "rgba(255,255,255,0.2)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          userSelect: "none",
        }}
        title="Toggle dev border"
      >
        {devBorder ? "[border: on]" : "[border: off]"}
      </button>
    </section>
  );
}
