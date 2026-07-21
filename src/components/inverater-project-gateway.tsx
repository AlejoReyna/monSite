"use client";

import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./inverater-project-gateway.module.css";

const WEBSITE_URL = "https://www.inverater.com";

const simpleIcon = (slug: string, color = "ffffff") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const PRESS_LOGOS = [
  { label: "Inc.", src: "/inverater/carousel/inc-white.png", kind: "inc" },
  { label: "Inmobiliare", src: "/inverater/carousel/white-inmobiliare.svg", kind: "inmobiliare" },
  { label: "Radio UDEM", src: "/inverater/carousel/white-radio.png", kind: "radio" },
  { label: "El Financiero", src: "/inverater/carousel/white-financiero.png", kind: "financiero" },
] as const;

const TECH_STACK = [
  { label: "Vue.js", logo: simpleIcon("vuedotjs") },
  { label: "TypeScript", logo: simpleIcon("typescript") },
  { label: "Vite", logo: simpleIcon("vite") },
  { label: "Tailwind CSS", logo: simpleIcon("tailwindcss") },
  { label: "Pinia", logo: simpleIcon("pinia") },
  { label: "TanStack Query", logo: simpleIcon("reactquery"), spin: true },
  { label: "Axios", logo: simpleIcon("axios") },
  { label: "Vitest", logo: simpleIcon("vitest") },
] as const;

type GatewayCopy = {
  employmentLabel: string;
  heroEyebrow: string;
  heroLineOneAccent: string;
  heroLineOne: string;
  heroLineTwo: string;
  heroLineTwoAccent: string;
  heroDescription: string;
  visionariesStart: string;
  visionariesMiddle: string;
  visionariesEnd: string;
  accountCta: string;
  seenOn: string;
  infoEyebrow: string;
  infoTitleStart: string;
  infoTitleAccent: string;
  infoDescription: string;
  contribution: string;
  contributionBody: string;
  stackLabel: string;
  websiteCta: string;
  scrollHint: string;
  roleEyebrow: string;
  roleTitleStart: string;
  roleTitleAccent: string;
  roleIntro: string;
  commitLabel: string;
  currentWorkLabel: string;
  pastWorkLabel: string;
};

const COPY: Record<Language, GatewayCopy> = {
  en: {
    employmentLabel: "Current employment",
    heroEyebrow: "Inverater landing page",
    heroLineOneAccent: "Real-estate",
    heroLineOne: " investments",
    heroLineTwo: "with ",
    heroLineTwoAccent: "purpose",
    heroDescription:
      "Welcome to the app that lets you co-own real estate starting at MXN $1,000.",
    visionariesStart: "From ",
    visionariesMiddle: "visionaries",
    visionariesEnd: "for visionaries.",
    accountCta: "Open an account",
    seenOn: "As seen on",
    infoEyebrow: "What is Inverater?",
    infoTitleStart: "Real-estate investing, made ",
    infoTitleAccent: "accessible.",
    infoDescription:
      "Inverater is a Mexican proptech platform that turns real-estate opportunities into accessible digital investments. People can explore properties, review the numbers, invest from MXN $1,000 and follow their portfolio from one product.",
    contribution: "The product",
    contributionBody:
      "A production platform with public campaigns, investor onboarding, identity verification, checkout and payments, portfolio dashboards, referrals, reporting, and white-label experiences for master brokers.",
    stackLabel: "Inverater technology stack",
    websiteCta: "Visit Inverater",
    scrollHint: "Scroll to learn about the platform",
    roleEyebrow: "My work on Inverater",
    roleTitleStart: "Keeping the whole platform ",
    roleTitleAccent: "running and evolving.",
    roleIntro:
      "My current scope spans infrastructure, hosting and hands-on product engineering. I maintain the systems already in production while designing and shipping the next layer of the platform.",
    commitLabel: "Repository evidence",
    currentWorkLabel: "Current work",
    pastWorkLabel: "Past work",
  },
  es: {
    employmentLabel: "Empleo actual",
    heroEyebrow: "Landing page de Inverater",
    heroLineOneAccent: "Inversiones",
    heroLineOne: " inmobiliarias",
    heroLineTwo: "con ",
    heroLineTwoAccent: "propósito",
    heroDescription:
      "Te damos la bienvenida a la app que te permite ser co-propietario de inmuebles desde $1,000.",
    visionariesStart: "De ",
    visionariesMiddle: "visionarios",
    visionariesEnd: "para visionarios.",
    accountCta: "Abrir una cuenta",
    seenOn: "Como nos viste en",
    infoEyebrow: "¿Qué es Inverater?",
    infoTitleStart: "Inversión inmobiliaria, ahora más ",
    infoTitleAccent: "accesible.",
    infoDescription:
      "Inverater es una plataforma proptech mexicana que convierte oportunidades inmobiliarias en inversiones digitales accesibles. Las personas pueden explorar propiedades, revisar sus números, invertir desde $1,000 y seguir su portafolio desde un solo producto.",
    contribution: "El producto",
    contributionBody:
      "Una plataforma en producción con campañas públicas, onboarding de inversionistas, validación de identidad, checkout y pagos, dashboards de portafolio, referidos, reportes y experiencias white-label para master brokers.",
    stackLabel: "Stack tecnológico de Inverater",
    websiteCta: "Visitar Inverater",
    scrollHint: "Desliza para conocer la plataforma",
    roleEyebrow: "Mi trabajo en Inverater",
    roleTitleStart: "Manteniendo toda la plataforma ",
    roleTitleAccent: "activa y en evolución.",
    roleIntro:
      "Mi responsabilidad actual abarca infraestructura, hosting e ingeniería de producto. Mantengo los sistemas que ya están en producción mientras diseño y desarrollo la siguiente etapa de la plataforma.",
    commitLabel: "Evidencia en el repositorio",
    currentWorkLabel: "Trabajo actual",
    pastWorkLabel: "Trabajo realizado",
  },
  zh: {
    employmentLabel: "当前任职",
    heroEyebrow: "Inverater 落地页",
    heroLineOneAccent: "房地产",
    heroLineOne: "投资",
    heroLineTwo: "带着",
    heroLineTwoAccent: "使命",
    heroDescription: "欢迎使用这款让你从 1,000 墨西哥比索起成为房产共有人的应用。",
    visionariesStart: "由",
    visionariesMiddle: "远见者",
    visionariesEnd: "为远见者打造。",
    accountCta: "开设账户",
    seenOn: "媒体报道",
    infoEyebrow: "什么是 Inverater？",
    infoTitleStart: "让房地产投资更加",
    infoTitleAccent: "触手可及。",
    infoDescription:
      "Inverater 是一个墨西哥房地产科技平台，将房地产机会转化为易于参与的数字投资。用户可以浏览物业、查看数据、从 1,000 墨西哥比索起投资，并在一个产品中跟踪投资组合。",
    contribution: "产品平台",
    contributionBody:
      "一个投入生产的平台，涵盖公开项目、投资者注册、身份验证、结账与支付、投资组合仪表板、推荐、报告，以及面向主经纪商的白标体验。",
    stackLabel: "Inverater 技术栈",
    websiteCta: "访问 Inverater",
    scrollHint: "向下滚动了解平台",
    roleEyebrow: "我在 Inverater 的工作",
    roleTitleStart: "让整个平台持续",
    roleTitleAccent: "运行与演进。",
    roleIntro:
      "我目前负责基础设施、托管和产品工程，在维护生产系统的同时设计并交付平台的下一阶段。",
    commitLabel: "代码库记录",
    currentWorkLabel: "当前工作",
    pastWorkLabel: "已交付工作",
  },
};

const CONTRIBUTIONS: Record<Language, Array<{
  index: string;
  phase: "current" | "past";
  title: string;
  body: string;
  commits: string[];
}>> = {
  en: [
    {
      index: "01",
      phase: "current",
      title: "Infrastructure & hosting",
      body: "I own the platform's ongoing infrastructure: hosting, deployment workflows, environment configuration, CI health and the production code that keeps Inverater online.",
      commits: ["c2e03b8", "49ae2b2", "bb2860a"],
    },
    {
      index: "02",
      phase: "past",
      title: "Context management",
      body: "I built the multi-phase masterbroker context architecture—central store, URL analysis, data services, navigation facade and route/auth helpers—then migrated dozens of consumers across the app.",
      commits: ["d7f201d", "8bdd3d9", "10b0729", "7026f14"],
    },
    {
      index: "03",
      phase: "past",
      title: "/venta-manual",
      body: "I engineered the manual-sale integration end to end—not just its UI: stored-procedure-backed creation and finalization, campaign/CETE reservation, Stripe and STP payment flows, webhook processing, short-link validation, transaction state, and completed-sale integration with the commission pipeline.",
      commits: ["6aaf06a", "9ba2407", "1a66f85", "5983866"],
    },
    {
      index: "04",
      phase: "past",
      title: "Core product delivery",
      body: "My work also spans the STP checkout migration, payment and deposit experiences, onboarding data synchronization, referral flows, admin tooling and continued landing-page evolution.",
      commits: ["365e73b", "cc5a864", "10ede1b", "3935c73"],
    },
  ],
  es: [
    {
      index: "01",
      phase: "current",
      title: "Infraestructura y hosting",
      body: "Mantengo la infraestructura completa de la plataforma: hosting, flujos de despliegue, configuración de ambientes, salud de CI y el código de producción que mantiene Inverater en línea.",
      commits: ["c2e03b8", "49ae2b2", "bb2860a"],
    },
    {
      index: "02",
      phase: "past",
      title: "Context management",
      body: "Construí la arquitectura de contexto masterbroker por fases—store central, análisis de URL, servicios de datos, fachada de navegación y helpers de rutas/auth—y migré decenas de consumidores de la app.",
      commits: ["d7f201d", "8bdd3d9", "10b0729", "7026f14"],
    },
    {
      index: "03",
      phase: "past",
      title: "/venta-manual",
      body: "Diseñé e integré venta manual de punta a punta—no solo su UI: creación y finalización mediante stored procedures, reserva de campañas/CETEs, pagos con Stripe y STP, procesamiento de webhooks, validación de short links, estado transaccional y conexión de ventas completadas con el pipeline de comisiones.",
      commits: ["6aaf06a", "9ba2407", "1a66f85", "5983866"],
    },
    {
      index: "04",
      phase: "past",
      title: "Entrega de producto",
      body: "Mi trabajo también incluye la migración de checkout a STP, pagos y depósitos, sincronización de onboarding, referidos, herramientas administrativas y la evolución continua de la landing.",
      commits: ["365e73b", "cc5a864", "10ede1b", "3935c73"],
    },
  ],
  zh: [
    {
      index: "01",
      phase: "current",
      title: "基础设施与托管",
      body: "我负责平台持续运行所需的托管、部署流程、环境配置、CI 稳定性以及生产代码。",
      commits: ["c2e03b8", "49ae2b2", "bb2860a"],
    },
    {
      index: "02",
      phase: "past",
      title: "上下文管理",
      body: "我分阶段构建了 masterbroker 上下文架构，包括中央 store、URL 分析、数据服务、导航门面和路由/认证工具，并迁移了数十个使用方。",
      commits: ["d7f201d", "8bdd3d9", "10b0729", "7026f14"],
    },
    {
      index: "03",
      phase: "past",
      title: "/venta-manual",
      body: "我完成了手动销售的端到端集成，而不只是界面：基于存储过程的创建与结算、项目与 CETE 预留、Stripe/STP 支付、Webhook 处理、短链接验证、交易状态，以及已完成销售与佣金流程的衔接。",
      commits: ["6aaf06a", "9ba2407", "1a66f85", "5983866"],
    },
    {
      index: "04",
      phase: "past",
      title: "核心产品交付",
      body: "我的工作还涵盖 STP 结账迁移、支付与入金体验、注册数据同步、推荐流程、管理工具和落地页的持续迭代。",
      commits: ["365e73b", "cc5a864", "10ede1b", "3935c73"],
    },
  ],
};

function ArrowIcon() {
  return (
    <span className={styles.arrowCircle} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17 17 7M17 7H7m10 0v10" />
      </svg>
    </span>
  );
}


function ClassicHeroBackground() {
  return (
    <div className={styles.classicHeroBackground} aria-hidden="true">
      <div className={styles.classicWave} />
      <div className={styles.classicWave} />
      <div className={styles.classicWave} />
    </div>
  );
}

const CLASSIC_HERO_WORDS = [
  "tu futuro",
  "tu familia",
  "tu retiro",
  "visionarios",
] as const;

function ClassicInveraterHero({ isActive }: { isActive: boolean }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleWord, setVisibleWord] = useState<string>(CLASSIC_HERO_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const fullWord = CLASSIC_HERO_WORDS[wordIndex];

  useEffect(() => {
    if (!isActive) return;

    const isComplete = visibleWord === fullWord;
    const delay = !isDeleting && isComplete ? 2000 : 100;

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (isComplete) {
          setIsDeleting(true);
        } else {
          setVisibleWord(fullWord.slice(0, visibleWord.length + 1));
        }
        return;
      }

      if (visibleWord.length <= 1) {
        const nextIndex = (wordIndex + 1) % CLASSIC_HERO_WORDS.length;
        setIsDeleting(false);
        setWordIndex(nextIndex);
        setVisibleWord(CLASSIC_HERO_WORDS[nextIndex].slice(0, 1));
      } else {
        setVisibleWord(visibleWord.slice(0, -1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [fullWord, isActive, isDeleting, visibleWord, wordIndex]);

  return (
    <div className={styles.classicHeroContent}>
      <motion.h1
        id="inverater-hero-title"
        initial={{ opacity: 0, y: -50 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        Inversiones inmobiliarias
        <span>
          para <em>{visibleWord || "\u200b"}</em>
        </span>
      </motion.h1>

    </div>
  );
}

function PressBar({ label, isActive }: { label: string; isActive: boolean }) {
  const logoClass = {
    inc: styles.pressLogoInc,
    inmobiliare: styles.pressLogoInmobiliare,
    radio: styles.pressLogoRadio,
    financiero: styles.pressLogoFinanciero,
  };

  return (
    <div className={styles.pressBlock}>
      <p>
        <span key={label} className={isActive ? styles.typewriterActive : undefined}>
          {label}
        </span>
      </p>
      <div className={styles.pressViewport}>
        <div className={styles.pressTrack}>
          {[0, 1, 2].map((set) => (
            <div className={styles.pressSet} key={set} aria-hidden={set > 0}>
              {PRESS_LOGOS.map((logo) => (
                <span className={styles.pressLogoFrame} key={logo.label}>
                  {/* These are the original assets used by Inverater's NewHome hero. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={`${styles.pressLogo} ${logoClass[logo.kind]}`}
                    src={logo.src}
                    alt={logo.label}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InveraterProjectGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const contributions = CONTRIBUTIONS[language];
  const [activeView, setActiveView] = useState<"hero" | "work">("hero");
  const workViewRef = useRef<HTMLElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const transitionUntilRef = useRef(0);
  const exitReadyAtRef = useRef(0);

  useEffect(() => {
    if (isActive && activeView === "hero") {
      transitionUntilRef.current = performance.now() + 1000;
    }
  }, [isActive, activeView]);

  const transitionTo = (view: "hero" | "work") => {
    transitionUntilRef.current = performance.now() + 720;
    exitReadyAtRef.current = 0;
    setActiveView(view);

    if (view === "hero") {
      workViewRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const handleWheelCapture = (event: WheelEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const now = performance.now();

    if (now < transitionUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (activeView === "hero" && event.deltaY > 30) {
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

  const handleTouchStartCapture = (event: TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEndCapture = (event: TouchEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;

    if (startY == null || endY == null || performance.now() < transitionUntilRef.current) return;

    const upwardSwipe = startY - endY;

    if (activeView === "hero" && upwardSwipe > 55) {
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

  return (
    <div
      className={styles.screen}
      aria-labelledby="inverater-hero-title"
      data-view={activeView}
      onWheelCapture={handleWheelCapture}
      onTouchStartCapture={handleTouchStartCapture}
      onTouchEndCapture={handleTouchEndCapture}
    >
      <div className={styles.scrollBody}>
        <motion.section
          className={styles.hero}
          aria-label={copy.heroEyebrow}
          animate={activeView === "hero" ? { opacity: 1, y: "0%" } : { opacity: 0, y: "-10%" }}
          initial={false}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeView === "hero" ? "auto" : "none" }}
        >
          <ClassicHeroBackground />

          <ClassicInveraterHero isActive={isActive && activeView === "hero"} />

          <motion.div
            className={styles.heroEmploymentBadge}
            animate={isActive && activeView === "hero" ? { opacity: 1, x: 0 } : { opacity: 0, x: "-120vw" }}
            initial={{ opacity: 0, x: "-120vw" }}
            transition={{ duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.employmentBadge}>
              {copy.employmentLabel}
            </div>
          </motion.div>

          <motion.div
            className={styles.heroInformation}
            animate={isActive && activeView === "hero" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            initial={false}
            transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
          >
            <aside className={styles.heroPlatform} aria-labelledby="inverater-info-title">
              <p className={styles.eyebrow}>{copy.infoEyebrow}</p>
              <h2 id="inverater-info-title">
                {copy.infoTitleStart}<strong>{copy.infoTitleAccent}</strong>
              </h2>
              <p>{copy.infoDescription}</p>
              <p>{copy.contributionBody}</p>

              <div className={styles.heroPlatformActions}>
                <ul className={styles.techRow} aria-label={copy.stackLabel}>
                  {TECH_STACK.map((tech) => (
                    <li className={styles.techChip} key={tech.label}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={tech.logo} 
                        alt={tech.label} 
                        title={tech.label} 
                        loading="lazy" 
                        className={"spin" in tech && tech.spin ? styles.spinIcon : undefined}
                      />
                    </li>
                  ))}
                </ul>

                <a className={styles.secondaryCta} href={WEBSITE_URL} target="_blank" rel="noreferrer">
                  <span>{copy.websiteCta}</span>
                  <ArrowIcon />
                </a>
              </div>
            </aside>

            <div className={styles.heroPress}>
              <PressBar label={copy.seenOn} isActive={isActive && activeView === "hero"} />
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          ref={workViewRef}
          className={styles.role}
          aria-label={copy.currentWorkLabel}
          data-carousel-scrollable="true"
          animate={activeView === "work" ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
          initial={false}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeView === "work" ? "auto" : "none" }}
        >
          <ClassicHeroBackground />

          <div className={styles.roleInner}>
            <div className={styles.contributionGrid}>
              {contributions.map((contribution) => (
                <article className={styles.contributionCard} key={contribution.index}>
                  <div className={styles.contributionMeta}>
                    <span className={styles.contributionIndex}>{contribution.index}</span>
                    <span>{contribution.phase === "current" ? copy.currentWorkLabel : copy.pastWorkLabel}</span>
                  </div>
                  <h3>{contribution.title}</h3>
                  <p>{contribution.body}</p>
                  <div className={styles.commitRow} aria-label={copy.commitLabel}>
                    {contribution.commits.map((commit) => (
                      <code key={commit}>{commit}</code>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
