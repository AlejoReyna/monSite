"use client";

import { useCopy } from "@/components/use-copy";
import { useRef, useState, useEffect, useReducer } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import DesktopPicker from "./desktop-picker";
import MobileMacStage from "./mobile-mac-stage";
import DesktopTerminalWindow from "./desktop-terminal-window";
import TerminalCloseEasterEgg from "./terminal-close-easter-egg";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import { ICON_COLUMN_STRIP } from "@/lib/desktop/icon-layout";
import { initialTerminalSessions, terminalSessionsReducer } from "@/lib/terminal/sessions";

/* The terminal opens beside the desktop icons, never on top of them: the icon
   strip plus a gutter that grows a little on wide screens. Dragging is still
   free, so the window can be moved over the icons on purpose. */
const TERMINAL_GUTTER = "max(18px, 2vw)";
const TERMINAL_RIGHT = `calc(${ICON_COLUMN_STRIP}px + ${TERMINAL_GUTTER})`;

const SCROLL_PROMPT: Record<Language, string> = {
  en: "scroll down to see my projects!",
  es: "Desliza hacia abajo para ver mis proyectos!",
};

const HERO_TITLE: Record<Language, string> = {
  en: "Alexis Reyna — Full-stack Developer & UI Engineer",
  es: "Alexis Reyna — Desarrollador Full-stack & UI Engineer",
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
  const copyText = useCopy();
  const { language } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const [terminals, dispatchTerminals] = useReducer(terminalSessionsReducer, initialTerminalSessions);
  const macTerminalOpen = terminals.visible && terminals.ids.some(id => !terminals.minimizedIds.includes(id));
  const mobileTerminalOpen = terminals.visible && terminals.ids.length > 0;
  const activeTerminalId = terminals.activeId;
  const openTerminal = () => {
    dispatchTerminals({ type: "new" });
    if (isMobile) setMobileView("assistant");
  };
  // The mobile stage owns chat below lg; desktop windows stay mounted so their frames survive.
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"assistant" | "folders">("assistant");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsMobile(!mq.matches);
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
      data-desktop={noBgImage ? undefined : "mac"}
      ref={heroRef}
      className="relative min-h-[100svh] overflow-hidden flex"
      style={{ backgroundColor: noBgImage ? "#08080a" : "#008080" }}
    >
      {/* Page heading for screen readers */}
      <h1 className="sr-only">{HERO_TITLE[language]}</h1>

      {!noBgImage && (
        <DesktopPicker
          terminalOpen={macTerminalOpen}
          terminalCount={terminals.ids.length}
          onTerminalLaunch={openTerminal}
          onTerminalClose={() => { if (activeTerminalId !== null) dispatchTerminals({ type: "close", id: activeTerminalId }); }}
          onTerminalFocus={() => { const id = activeTerminalId ?? terminals.ids.at(-1); if (id !== undefined && id !== null) dispatchTerminals({ type: "focus", id }); }}
          onTerminalOpenChange={(open) => {
            dispatchTerminals({ type: "visible", visible: open });
            if (open && isMobile) setMobileView("assistant");
          }}
          mobileView={isMobile ? mobileView : undefined}
          onMobileViewChange={(view) => {
            setMobileView(view);
            if (view === "assistant") dispatchTerminals({ type: "visible", visible: true });
          }}
          macMobileStage
        />
      )}

      {/* ── Main content ── */}
      <motion.div
        className={`relative z-10 pointer-events-none w-full h-[100svh] px-6 md:px-10 lg:px-16 flex flex-col ${!noBgImage ? "invisible" : ""}`}
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
            {noBgImage && (
            <Image
              src="/coffee-desktop.webp"
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
            aria-label={copyText("AWS Certified AI Practitioner badge")}
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
        body:has(#work[data-active-panel="0"] #home[data-desktop="mac"]) .nav-v2-shell { visibility: hidden; }
        #home[data-desktop="mac"] .comic-terminal { left: auto; right: calc(${TERMINAL_RIGHT} - var(--terminal-offset, 0px)); top: calc(20% + var(--terminal-offset, 0px)); bottom: auto; translate: none; transform: none; width: min(740px, calc(100% - ${ICON_COLUMN_STRIP}px - ${TERMINAL_GUTTER} - 24px)); }
        #home[data-desktop="mac"] .comic-terminal > [data-visible] { height: min(500px, calc(80svh - var(--mac-dock-gutter, 90px) - 16px)); }
        #home[data-desktop="mac"] .comic-terminal[data-expanded="true"] { inset: 40px 12px var(--mac-dock-gutter, 90px); width: auto; transform: none !important; }
        #home[data-desktop="mac"] .comic-terminal[data-expanded="true"] > div { height: 100%; }
        #home[data-desktop="mac"] .comic-terminal[hidden] { display: none; }
        #home[data-desktop="mac"] .comic-terminal[data-framed] > div { height: 100%; }
        #home[data-desktop="mac"] .terminal-switcher { position: absolute; z-index: 40; right: 18px; bottom: calc(var(--mac-dock-gutter, 90px) + 10px); display: flex; gap: 4px; max-width: min(70vw, 680px); overflow-x: auto; padding: 5px; border: 1px solid #ffffff30; border-radius: 9px; background: #25262bef; box-shadow: 0 10px 28px #0007; scrollbar-width: thin; }
        #home[data-desktop="mac"] .terminal-switcher button { flex: 0 0 auto; padding: 6px 9px; border: 0; border-radius: 5px; color: #ddd; background: transparent; font: 12px/1 Menlo, Monaco, monospace; cursor: pointer; }
        #home[data-desktop="mac"] .terminal-switcher button[aria-pressed="true"] { color: #fff; background: #2866d8; }
        #home[data-desktop="mac"] .terminal-switcher button[data-minimized="true"] { opacity: .6; }
        #home[data-desktop="mac"] .terminal-switcher button:focus-visible { outline: 2px solid #8ad69b; outline-offset: -2px; }
        @media (min-width: 1024px) {
          #home:not([data-desktop="mac"]) .comic-terminal { top: calc(22% + var(--terminal-offset, 0px)); right: calc(8% - var(--terminal-offset, 0px)); }
        }
        @media (max-width: 1023px) {
          #home[data-desktop="mac"] .comic-terminal { display: none !important; }
          #home[data-desktop="mac"] .terminal-switcher { display: none; }
        }
        #home[data-desktop="mac"] .hero-artist-credit { display: none; }
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
      {!noBgImage && (
        <MobileMacStage
          view={mobileView}
          theme="mac"
          open={mobileTerminalOpen}
          terminalIds={terminals.ids}
          activeTerminalId={activeTerminalId}
          minimizedTerminalIds={terminals.minimizedIds}
          onFocusTerminal={id => dispatchTerminals({ type: "focus", id })}
          onCloseTerminal={id => dispatchTerminals({ type: "close", id })}
          onMinimizeTerminal={id => dispatchTerminals({ type: "minimize", id })}
        />
      )}

      {terminals.ids.map(id => <DesktopTerminalWindow
        key={id}
        id={id}
        active={id === activeTerminalId}
        count={terminals.ids.length}
        visible={terminals.visible && !terminals.minimizedIds.includes(id)}
        isDesktop={!isMobile}
        noBgImage={noBgImage}
        opacity={contentOpacity}
        heroRef={heroRef}
        onFocus={() => dispatchTerminals({ type: "focus", id })}
        onClose={() => dispatchTerminals({ type: "close", id })}
        onMinimize={() => dispatchTerminals({ type: "minimize", id })}
      />)}
      {!noBgImage && terminals.visible && (terminals.ids.length > 1 || terminals.minimizedIds.length > 0) && <nav className="terminal-switcher" aria-label={language === "es" ? "Ventanas de Terminal" : "Terminal windows"}>
        {terminals.ids.map(id => <button key={id} type="button" aria-pressed={id === activeTerminalId && !terminals.minimizedIds.includes(id)} data-minimized={terminals.minimizedIds.includes(id)} onClick={() => dispatchTerminals({ type: "focus", id })}>Terminal {id}</button>)}
      </nav>}

      {!noBgImage && terminals.ids.length === 0 && <TerminalCloseEasterEgg onReopen={openTerminal} />}

      {/* ── Instagram credit ── */}
      <a
        href="https://www.instagram.com/jayivee._/"
        target="_blank"
        rel="noopener noreferrer"
        className="hero-artist-credit hidden md:block absolute bottom-11 right-3 z-50 text-[0.65rem] tracking-wider text-white/40 hover:text-white/80 transition-colors pointer-events-auto"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {copyText("Artist: @jayivee._ ")}</a>
    </section>
  );
}
