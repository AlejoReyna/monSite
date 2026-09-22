"use client";

import { useCopy } from "@/components/use-copy";
import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./plebes-project-gateway.module.css";

const BADGE_COPY: Record<Language, { label: string; aria: string }> = {
  en: { label: "as seen on", aria: "As seen on ICP" },
  es: { label: "lanzado en", aria: "Lanzado en ICP" },
};

const contributions = [
  {
    key: "homepage",
    title: {
      en: "Homepage Redesign",
      es: "Rediseño de Homepage",
    },
    body: {
      en: "Replaced a bloated info-heavy site with a single-page minimal design plus a public DAO treasury view for full ownership transparency.",
      es: "Reemplacé un sitio cargado de información con un diseño minimalista de una sola página y una vista pública del tesoro DAO para transparencia total.",
    },
  },
  {
    key: "deposit",
    title: {
      en: "Deposit Flow UX",
      es: "UX del Flujo de Depósito",
    },
    body: {
      en: "Owned the /deposit path redesign — built a 4-step guided process that walked users through the funding flow end to end.",
      es: "Lideré el rediseño de /deposit — construí un flujo guiado de 4 pasos que lleva al usuario de principio a fin en el proceso de fondeo.",
    },
  },
  {
    key: "multichain",
    title: {
      en: "Multichain Integration",
      es: "Integración Multicadena",
    },
    body: {
      en: "Worked on ckBTC conversion to solve the minimum-deposit friction — making $5 NFT purchases viable without requiring $80 in SOL.",
      es: "Trabajé en la conversión ckBTC para resolver la fricción de depósito mínimo — haciendo viable comprar NFTs de $5 sin necesitar $80 en SOL.",
    },
  },
  {
    key: "dao",
    title: {
      en: "DAO on ICP",
      es: "DAO en ICP",
    },
    body: {
      en: "Built and shipped features for a live Web3 DAO on Internet Computer Protocol, working directly with the Senior Dev and Founder.",
      es: "Desarrollé y entregué features para una DAO Web3 en vivo sobre Internet Computer Protocol, trabajando directo con el Senior Dev y el Founder.",
    },
  },
] as const;

function localizedText(
  record: { en: string; es: string; },
  lang: Language
) {
  return record[lang];
}

export default function PlebesProjectGateway({ isActive = false }: { isActive?: boolean }) {
  const copyText = useCopy();
  const { language } = useLanguage();

  const [activeView, setActiveView] = useState<"hero" | "work">("hero");
  const workViewRef = useRef<HTMLElement>(null);
  const heroViewRef = useRef<HTMLElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const transitionUntilRef = useRef(0);
  const exitReadyAtRef = useRef(0);

  useEffect(() => {
    if (isActive && activeView === "hero") {
      // The longest animation (media and details staggered items) takes ~1.4 seconds.
      // We lock scrolling to the second section until they fully appear.
      transitionUntilRef.current = performance.now() + 1500;
    }
  }, [isActive, activeView]);

  const transitionTo = (view: "hero" | "work") => {
    transitionUntilRef.current = performance.now() + 720;
    exitReadyAtRef.current = 0;
    setActiveView(view);

    if (view === "hero") {
      workViewRef.current?.scrollTo({ top: 0, behavior: "auto" });
      const heroView = heroViewRef.current;
      if (heroView) {
        heroView.scrollTo({ top: heroView.scrollHeight, behavior: "auto" });
      }
    }
  };

  const handleWheelCapture = (event: WheelEvent<HTMLElement>) => {
    if (!isActive) return;
    const now = performance.now();

    if (now < transitionUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (activeView === "hero" && event.deltaY > 30) {
      const heroView = heroViewRef.current;
      const isAtBottom = heroView
        ? heroView.scrollTop + heroView.clientHeight >= heroView.scrollHeight - 2
        : true;

      if (!isAtBottom) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      transitionTo("work");
      return;
    }

    if (activeView === "work" && event.deltaY > 30) {
      const workView = workViewRef.current;
      const isAtBottom = workView
        ? workView.scrollTop + workView.clientHeight >= workView.scrollHeight - 2
        : false;

      if (!isAtBottom) {
        exitReadyAtRef.current = 0;
      } else if (exitReadyAtRef.current === 0 || now < exitReadyAtRef.current) {
        if (exitReadyAtRef.current === 0) exitReadyAtRef.current = now + 900;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    if (
      activeView === "work" &&
      event.deltaY < -30 &&
      (workViewRef.current?.scrollTop ?? 0) <= 1
    ) {
      event.preventDefault();
      event.stopPropagation();
      transitionTo("hero");
    }
  };

  const handleTouchStartCapture = (event: TouchEvent<HTMLElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEndCapture = (event: TouchEvent<HTMLElement>) => {
    if (!isActive) return;
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;

    if (startY == null || endY == null || performance.now() < transitionUntilRef.current) return;

    const upwardSwipe = startY - endY;

    if (activeView === "hero" && upwardSwipe > 55) {
      const heroView = heroViewRef.current;
      const isAtBottom = heroView
        ? heroView.scrollTop + heroView.clientHeight >= heroView.scrollHeight - 2
        : true;

      if (!isAtBottom) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      transitionTo("work");
      return;
    }

    if (
      activeView === "work" &&
      upwardSwipe < -55 &&
      (workViewRef.current?.scrollTop ?? 0) <= 1
    ) {
      event.preventDefault();
      event.stopPropagation();
      transitionTo("hero");
      return;
    }

    if (activeView === "work" && upwardSwipe > 55) {
      const workView = workViewRef.current;
      const isAtBottom = workView
        ? workView.scrollTop + workView.clientHeight >= workView.scrollHeight - 2
        : false;

      if (isAtBottom) {
        const now = performance.now();
        if (exitReadyAtRef.current === 0) exitReadyAtRef.current = now + 900;

        if (now < exitReadyAtRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -60, y: 60 },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const grid = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.5 },
    },
  };

  const tile = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const badgeReveal = {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    show: {
      clipPath: "inset(0 0% 0 0)",
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const logoItem = {
    hidden: { opacity: 0, y: 12, scale: 0.85 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      className={styles.screen}
      aria-labelledby="plebes-project-title"
      data-view={activeView}
      onWheelCapture={handleWheelCapture}
      onTouchStartCapture={handleTouchStartCapture}
      onTouchEndCapture={handleTouchEndCapture}
    >
      <motion.div
        className={styles.deployBadge}
        variants={badgeReveal}
        initial="hidden"
        animate={isActive && activeView === "hero" ? "show" : "hidden"}
        style={{ transformOrigin: "left" }}
        aria-label={BADGE_COPY[language].aria}
      >
        <span className={styles.deployLabel}>{copyText(BADGE_COPY[language].label)}</span>
        <div className={styles.deployNetwork}>
          <img
            className={styles.deployLogo}
            src="/icp_logo.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <span className={styles.deployName}>ICP!</span>
        </div>
      </motion.div>

      <motion.h2
        className={styles.mobileTitle}
        variants={logoItem}
        initial="hidden"
        animate={isActive && activeView === "hero" ? "show" : "hidden"}
      >
        {language === "es" ? (
          <>
            <span>Desarrollador del Proyecto</span>
            <span>
              <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
            </span>
          </>
        ) : (
          <>
            <span>Developer for the</span>
            <span>
              <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
              Project
            </span>
          </>
        )}
      </motion.h2>

      <div className={styles.scrollBody} data-carousel-scrollable="true">
        <motion.section
          ref={heroViewRef}
          className={styles.heroView}
          animate={activeView === "hero" ? { opacity: 1, y: "0%" } : { opacity: 0, y: "-10%" }}
          initial={false}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeView === "hero" ? "auto" : "none" }}
        >
          <div className={styles.inner}>
          <motion.div
            className={styles.copy}
            variants={container}
            initial="hidden"
            animate={isActive && activeView === "hero" ? "show" : "hidden"}
          >
            <motion.h2 id="plebes-project-title" className={styles.title} variants={item}>
              {language === "es" ? (
                <>Desarrollador del Proyecto <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" /></>
              ) : (
                <>developer for the <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" /> project</>
              )}
            </motion.h2>
          </motion.div>

          <motion.div 
            className={styles.media} 
            variants={item} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isActive && activeView === "hero" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <img src="/mon_frame.png" alt={copyText("Mon frame artwork for the Plebes project")} />
          </motion.div>

          <motion.div
            className={styles.details}
            variants={container}
            initial="hidden"
            animate={isActive && activeView === "hero" ? "show" : "hidden"}
          >
            <motion.p className={styles.lead} variants={item}>
              {language === "es"
                ? "Como Desarrollador Frontend, rediseñé la homepage de Plebes, construí un flujo de depósito de 4 pasos e integré conversión ckBTC para esta DAO de NFTs en vivo sobre Internet Computer Protocol."
                : "As a Frontend Developer, I redesigned the Plebes homepage, built a 4-step deposit flow, and worked on ckBTC multichain integration for this live NFT DAO on Internet Computer Protocol."}
            </motion.p>
            <motion.div className={styles.ctaGroup} variants={item}>
              <a className={styles.cta} href="https://forum.dfinity.org/t/introducing-plebes-governance-beyond-capital/56418" target="_blank" rel="noreferrer">
                <span>
                  {language === "es"
                    ? "Ver en foro Dfinity"
                    : "View Dfinity Forum"}
                </span>
                <ExternalLink aria-hidden="true" size={16} strokeWidth={2.4} />
              </a>
              <a className={styles.ctaSecondary} href="https://github.com/PLEBES-DAO/Plebes" target="_blank" rel="noreferrer">
                <Github aria-hidden="true" size={16} strokeWidth={2.4} />
                <span>
                  {language === "es"
                    ? "Docs"
                    : "Docs"}
                </span>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.scrollDown}
            variants={item}
            initial={{ opacity: 0, y: 10 }}
            animate={isActive && activeView === "hero" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <p style={{
              fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
              fontSize: "clamp(1.1rem, 1.4vw, 1.3rem)",
              color: "var(--plebes-soft)",
              marginTop: "1.5rem",
              textAlign: "center",
              textShadow: "0 4px 12px rgba(34, 7, 60, 0.4)",
              maxWidth: "20rem"
            }}>
              {language === "es"
                ? "haz scroll hacia abajo para ver la evidencia legacy ↓"
                : "scroll down to see the legacy evidence ↓"}
            </p>
          </motion.div>

          </div>
        </motion.section>

        <motion.section
          ref={workViewRef}
          className={styles.workView}
          animate={activeView === "work" ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
          initial={false}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeView === "work" ? "auto" : "none" }}
        >
          <div className={styles.workInner}>
            <div className={styles.videoColumn}>
              <video
                className={styles.workVideo}
                src="/plebes_video.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>

            <motion.div
              className={styles.contributionGrid}
              variants={grid}
              initial="hidden"
              animate={isActive && activeView === "work" ? "show" : "hidden"}
              aria-label={
                language === "es"
                  ? "Contribuciones en Plebes"
                  : "Plebes contributions"
              }
            >
              {contributions.map((contribution, index) => (
                <motion.article className={styles.contributionTile} variants={tile} key={contribution.key}>
                  <span className={styles.tileIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{localizedText(contribution.title, language)}</h3>
                  <p>{localizedText(contribution.body, language)}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>
      </div>
    </section>
  );
}
