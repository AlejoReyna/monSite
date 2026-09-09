"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, useDragControls, type MotionValue } from "framer-motion";
import DesktopPicker, { type DesktopTheme } from "./desktop-picker";
import MobileMacStage from "./mobile-mac-stage";
import ChatInterface from "@/components/chat-interface";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";

/* ═══════════════════════════════════════════
   Hero V2 — Windows 95 desktop
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
};

export default function HeroV2({
  embedInScrollSequence,
  embedContentOpacity,
  noBgImage = false,
}: HeroV2Props) {
  const { language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  // macOS is the public/default experience. The alternate desktop renderers
  // remain available in DesktopPicker for future use, but are no longer part
  // of the visitor flow.
  const [desktopTheme, setDesktopTheme] = useState<DesktopTheme>("mac");
  const [macTerminalOpen, setMacTerminalOpen] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const terminalDrag = useDragControls();
  const hideTerminal = () => {
    setMacTerminalOpen(false);
    requestAnimationFrame(() => document.getElementById("mac-terminal-launcher")?.focus({ preventScroll: true }));
  };
  // Remonta la terminal al cruzar el breakpoint lg: el offset de drag de
  // framer-motion vive como transform inline y sobrevive al cambio de CSS
  // (bottom/center móvil ↔ top/right desktop), dejando el panel descuadrado.
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"assistant" | "folders">("assistant");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setIsDesktop(mq.matches);
      setIsMobile(!mq.matches);
    };
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
      data-desktop={noBgImage ? undefined : desktopTheme}
      ref={heroRef}
      className="relative min-h-[100svh] overflow-hidden flex"
      style={{ backgroundColor: noBgImage ? "#08080a" : "#008080" }}
    >
      {/* Page heading for screen readers */}
      <h1 className="sr-only">{HERO_TITLE[language]}</h1>

      {!noBgImage && (
        <DesktopPicker
          theme={desktopTheme}
          onChange={setDesktopTheme}
          onTerminal={() => setMacTerminalOpen((value) => !value)}
          terminalOpen={macTerminalOpen}
          onTerminalOpenChange={(open) => {
            setMacTerminalOpen(open);
            if (open && isMobile) setMobileView("assistant");
          }}
          mobileView={isMobile ? mobileView : undefined}
          onMobileViewChange={(view) => {
            setMobileView(view);
            if (view === "assistant") setMacTerminalOpen(true);
          }}
          macMobileStage={desktopTheme === "mac"}
        />
      )}

      {/* ── Main content ── */}
      <motion.div
        className={`relative z-10 pointer-events-none w-full h-[100svh] px-6 md:px-10 lg:px-16 flex flex-col ${!noBgImage && (desktopTheme === "mac" || desktopTheme === "ubuntu") ? "invisible" : ""}`}
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
            {(isDesktop || noBgImage || desktopTheme !== "mac") && (
            <Image
              src="/16.gif"
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 1400px) min(540px, 46vw), 0px"
              className="object-contain object-center"
            />
            )}
          </motion.div>

          {/* ── Right column: layout placeholder (terminal floats here) ── */}
          <div className="hidden lg:block relative w-full h-full min-h-[min(70vh,520px)] lg:min-h-[min(88vh,780px)]" />
        </div>

        {/* ── Credly badge ── */}
        <motion.div
          className="absolute z-20 pointer-events-auto right-3 top-[14%] w-[72px] md:right-6 md:w-[80px] lg:left-2 lg:right-auto lg:top-[38%] lg:w-[90px] origin-top-right lg:origin-top-left"
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
        #work[data-active-panel="0"]:has(#home[data-desktop="mac"]) { touch-action: pan-y !important; }
        body:has(#work[data-active-panel="0"] #home[data-desktop="mac"]) .nav-v2-shell,
        body:has(#work[data-active-panel="0"] #home[data-desktop="ubuntu"]) .nav-v2-shell { visibility: hidden; }
        #home[data-desktop="mac"] .comic-terminal { left: auto; right: 6%; top: 20%; bottom: auto; translate: none; transform: none; width: min(580px, 88vw); }
        #home[data-desktop="mac"] .comic-terminal[data-expanded="true"] { inset: 40px 12px 90px; width: auto; transform: none !important; }
        #home[data-desktop="mac"] .comic-terminal[data-expanded="true"] > div { height: 100%; }
        #home[data-desktop="mac"] .comic-terminal[hidden] { display: none; }
        @media (max-width: 1023px) {
          #home[data-desktop="mac"] .comic-terminal { display: none !important; }
        }
        #home[data-desktop="ubuntu"] .comic-terminal { left: 6%; right: auto; top: 20%; bottom: auto; translate: none; transform: none; width: min(500px, 88vw); }
        #home[data-desktop="mac"] .hero-artist-credit, #home[data-desktop="ubuntu"] .hero-artist-credit { display: none; }
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
      {/* Mobile mac: character stage + mind-sheet (desktop floating terminal stays lg+) */}
      {/* MobileMacStage self-hides at lg+ via CSS; keep mounted for SSR parity */}
      {!noBgImage && desktopTheme === "mac" && (
        <MobileMacStage
          view={mobileView}
          theme="mac"
          open={macTerminalOpen}
          onOpenChange={(open) => {
            setMacTerminalOpen(open);
            if (!open) setTerminalExpanded(false);
          }}
        />
      )}

      {/* Floating comic-terminal — hidden on mobile mac via CSS; remount key still resets drag on breakpoint */}
      <motion.div
        key={isDesktop ? "terminal-lg" : "terminal-sm"}
        hidden={!noBgImage && desktopTheme === "mac" && !macTerminalOpen}
        data-expanded={terminalExpanded && desktopTheme === "mac"}
        drag={!terminalExpanded}
        dragControls={terminalDrag}
        dragListener={false}
        onPointerDown={event => {
          if ((event.target as HTMLElement).closest("[data-drag-handle]") && !(event.target as HTMLElement).closest("button")) terminalDrag.start(event);
        }}
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
          {/* On mobile mac the mind-sheet owns chat — skip a second useChat instance */}
          {/* Default-on for SSR/desktop; unmount only after we know we are mobile mac */}
          {(!(isMobile && desktopTheme === "mac") || noBgImage) && (
            <ChatInterface onClose={() => { setTerminalExpanded(false); hideTerminal(); }} onMinimize={hideTerminal} onToggleMaximize={() => setTerminalExpanded(value => !value)} maximized={terminalExpanded} theme={noBgImage ? "default" : desktopTheme} variant="panel" className="!w-full !h-full max-w-none" />
          )}
        </div>
      </motion.div>

      {/* ── Instagram credit ── */}
      <a
        href="https://www.instagram.com/jayivee._/"
        target="_blank"
        rel="noopener noreferrer"
        className="hero-artist-credit hidden md:block absolute bottom-11 right-3 z-50 text-[0.65rem] tracking-wider text-white/40 hover:text-white/80 transition-colors pointer-events-auto"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        Artist: @jayivee._
      </a>
    </section>
  );
}
