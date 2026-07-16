"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Terminal,
  LayoutDashboard,
  CalendarDays,
  LineChart,
  Send,
} from "lucide-react";
import Link from "next/link";

type PageLocale = "es" | "en";

function FlagSpainCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3 2"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="3" height="0.67" fill="#c60b1e" />
      <rect y="0.67" width="3" height="0.67" fill="#ffc400" />
      <rect y="1.34" width="3" height="0.66" fill="#c60b1e" />
    </svg>
  );
}

function FlagUkCircle({ className }: { className?: string }) {
  const clipId = React.useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 z h30 z" />
        </clipPath>
      </defs>
      <path fill="#012169" d="M0,0 h60 v30 H0 z" />
      <path
        stroke="#ffffff"
        strokeWidth="6"
        d="M0,0 L60,30 M60,0 L0,30"
      />
      <path
        clipPath={`url(#${clipId})`}
        stroke="#C8102E"
        strokeWidth="4"
        d="M0,0 L60,30 M60,0 L0,30"
      />
      <path stroke="#ffffff" strokeWidth="10" d="M30,0 v30 M0,15 h60" />
      <path stroke="#C8102E" strokeWidth="6" d="M30,0 v30 M0,15 h60" />
    </svg>
  );
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  extraFeatures: string[];
}

function timelineEs(): TimelineEvent[] {
  return [
    {
      id: "step-1",
      date: "27 de abril, 2026",
      title: "La evolución del dashboard",
      description:
        "El primer paso fue romper el cascarón de los frames heredados. Se diseñó un dashboard moderno, inyectado directamente en el portal existente. Organizamos la información académica, habilitamos temas personalizados y creamos una navegación lateral limpia que respeta los colores institucionales.",
      icon: LayoutDashboard,
      extraFeatures: [
        "Reskin moderno para los frames 'top', 'left' y 'center'.",
        "Barra lateral categorizada con búsqueda y anclaje.",
        "Landing experience para eselcarrera.htm.",
        "Navegación persistente en todo el ecosistema.",
      ],
    },
    {
      id: "step-2",
      date: "5 de mayo, 2026",
      title: "Sincronizando el tiempo: Nexus",
      description:
        "Conectamos los hilos invisibles entre SIASE y Nexus. Resolviendo bloqueos de sesión y expiración de tokens, construimos un widget nativo para las actividades próximas. Ahora, con un clic, las fechas límite se exportan a Google Calendar o Outlook.",
      icon: CalendarDays,
      extraFeatures: [
        "Widget de 'Próximas a vencer' integrado.",
        "Deep links para Outlook y Microsoft 365.",
        "Exportación nativa de archivos .ics.",
        "Gestión de tokens en segundo plano.",
      ],
    },
    {
      id: "step-3",
      date: "6 de mayo, 2026",
      title: "El conocimiento es poder: kardex automático",
      description:
        "La extensión comenzó a leer el kardex en segundo plano. Analizando créditos, calculando porcentajes de progreso y determinando el promedio aritmético sin la intervención del estudiante. Todo resumido en una sola tira de métricas visuales.",
      icon: LineChart,
      extraFeatures: [
        "Scraping asíncrono sin alertas intrusivas.",
        "Cálculo de promedio y progreso de créditos.",
        "Notificaciones de cambios en notas vía Worker.",
        "Popup de acceso rápido con caché inteligente.",
      ],
    },
  ];
}

function timelineEn(): TimelineEvent[] {
  return [
    {
      id: "step-1",
      date: "April 27, 2026",
      title: "The dashboard evolution",
      description:
        "The first step was breaking out of inherited frames. We designed a modern dashboard injected directly into the existing portal. We structured academic information, enabled custom themes, and built a clean side navigation that respects institutional colors.",
      icon: LayoutDashboard,
      extraFeatures: [
        "Modern reskin for the top, left, and center frames.",
        "Categorized sidebar with search and anchor links.",
        "Landing experience for eselcarrera.htm.",
        "Persistent navigation across the ecosystem.",
      ],
    },
    {
      id: "step-2",
      date: "May 5, 2026",
      title: "Syncing time: Nexus",
      description:
        "We connected the invisible threads between SIASE and Nexus. By fixing session blocks and token expiry, we built a native widget for upcoming activities. Now, with one click, deadlines export to Google Calendar or Outlook.",
      icon: CalendarDays,
      extraFeatures: [
        "Integrated “due soon” widget.",
        "Deep links for Outlook and Microsoft 365.",
        "Native .ics file export.",
        "Background token handling.",
      ],
    },
    {
      id: "step-3",
      date: "May 6, 2026",
      title: "Knowledge is power: automatic kardex",
      description:
        "The extension began reading the kardex in the background. It analyzes credits, calculates progress percentages, and derives the arithmetic average without student intervention. Everything summarized in a single strip of visual metrics.",
      icon: LineChart,
      extraFeatures: [
        "Async scraping without intrusive alerts.",
        "Average and credit-progress calculation.",
        "Grade-change notifications via Worker.",
        "Quick-access popup with smart cache.",
      ],
    },
  ];
}

function getTimeline(locale: PageLocale): TimelineEvent[] {
  return locale === "es" ? timelineEs() : timelineEn();
}

const copy = {
  es: {
    home: "← Inicio",
    heroTitleLine1: "El sistema heredado.",
    heroTitleLine2: "Una nueva realidad.",
    heroQuote:
      "\u201cSIASE es un laberinto de frames y CGI de otra época. Pero debajo de ese código hay una experiencia esperando ser liberada. Esto no es solo un reskin: es una reconstrucción total.\u201d",
    ctaTitleLine1: "Este proyecto sigue en desarrollo,",
    ctaTitleLine2: "¿hay alguna feature que te gustaría ver?",
    ack: "Sugerencia recibida. Gracias por construir el futuro de la UANL.",
    processView: "Vista de proceso",
    langLabel: "Idioma",
    langAriaEs: "Español",
    langAriaEn: "Inglés (Reino Unido)",
  },
  en: {
    home: "← Home",
    heroTitleLine1: "The legacy system.",
    heroTitleLine2: "A new reality.",
    heroQuote:
      "\u201cSIASE is a maze of frames and CGI from another era. But beneath that code is an experience waiting to be freed. This is not just a reskin: it is a full rebuild.\u201d",
    ctaTitleLine1: "This project is still in development.",
    ctaTitleLine2: "Is there a feature you would like to see?",
    ack: "Suggestion received. Thanks for helping shape the future at UANL.",
    processView: "Process view",
    langLabel: "Language",
    langAriaEs: "Español",
    langAriaEn: "English (United Kingdom)",
  },
} as const;

export default function HistoriaPage() {
  const [locale, setLocale] = useState<PageLocale>("es");
  const [localeSwitchCount, setLocaleSwitchCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [ack, setAck] = useState(false);
  const timelineData = getTimeline(locale);
  const t = copy[locale];

  const setLocaleWithTracking = (code: PageLocale) => {
    if (code !== locale) {
      setLocale(code);
      setLocaleSwitchCount((n) => n + 1);
    }
  };

  const suppressHeroIntro = localeSwitchCount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setInputValue("");
      setAck(true);
      window.setTimeout(() => setAck(false), 3200);
    }
  };

  return (
    <div
      className="w-full selection:bg-[var(--gic-action-azure)] selection:text-[var(--gic-canvas-white)]"
      style={{
        backgroundColor: "var(--gic-canvas-white)",
        color: "var(--gic-pitch-black)",
        fontFamily: "var(--gic-font-serif)",
      }}
    >
      <div
        className="fixed right-4 top-4 z-[60] flex items-center gap-1 rounded-full border border-[var(--gic-cool-gray)] bg-[var(--gic-canvas-white)]/90 p-1 shadow-sm backdrop-blur-sm sm:right-6 sm:top-6"
        role="group"
        aria-label={t.langLabel}
      >
        {(
          [
            { code: "es" as const, Flag: FlagSpainCircle, label: t.langAriaEs },
            { code: "en" as const, Flag: FlagUkCircle, label: t.langAriaEn },
          ] as const
        ).map(({ code, Flag, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocaleWithTracking(code)}
            className="relative flex size-10 items-center justify-center rounded-full transition-opacity duration-200"
            style={{ opacity: locale === code ? 1 : 0.55 }}
            aria-pressed={locale === code}
            aria-label={label}
          >
            {locale === code && (
              <motion.span
                layoutId="historia-lang-pill"
                className="absolute inset-0 -z-10 rounded-full bg-[var(--gic-action-azure)]/15 ring-2 ring-[var(--gic-action-azure)] ring-offset-2 ring-offset-[var(--gic-canvas-white)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative size-7 overflow-hidden rounded-full shadow-sm ring-1 ring-black/10">
              <Flag className="size-full" />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={locale}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/"
            className="fixed left-4 top-4 z-50 transition-opacity hover:opacity-80 sm:left-6 sm:top-6"
            style={{
              fontFamily: "var(--gic-font-serif)",
              fontSize: "var(--gic-text-caption)",
              letterSpacing: "var(--gic-tracking-caption)",
              color: "var(--gic-slate-gray)",
            }}
          >
            {t.home}
          </Link>

          {/* 1. Hero: Mind-breaking Reveal */}
          <section className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
            <motion.div
              initial={
                suppressHeroIntro
                  ? { clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)", y: 0 }
                  : { clipPath: "inset(100% 0% 0% 0%)", filter: "blur(20px)", y: 100 }
              }
              animate={{ clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)", y: 0 }}
              transition={{ duration: suppressHeroIntro ? 0.35 : 2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl text-center"
            >
              <Terminal
                className="mx-auto mb-8 text-[var(--gic-slate-gray)]"
                size={48}
                strokeWidth={1}
              />
              <h1
                className="mb-12 leading-tight"
                style={{
                  fontFamily: "var(--gic-font-serif)",
                  fontSize: "clamp(2.25rem, 7vw, var(--gic-text-display))",
                  lineHeight: "var(--gic-leading-display)",
                  letterSpacing: "var(--gic-tracking-display)",
                  color: "var(--gic-pitch-black)",
                }}
              >
                {t.heroTitleLine1}
                <br />
                {t.heroTitleLine2}
              </h1>
              <motion.p
                initial={{ opacity: suppressHeroIntro ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: suppressHeroIntro ? 0 : 1.2, duration: 1 }}
                className="mx-auto max-w-2xl italic"
                style={{
                  fontFamily: "var(--gic-font-serif)",
                  fontSize: "var(--gic-text-button-label)",
                  lineHeight: 1.65,
                  color: "var(--gic-charcoal)",
                }}
              >
                {t.heroQuote}
              </motion.p>
            </motion.div>

            <motion.div
              className="absolute right-10 top-0 w-px h-full bg-gradient-to-b from-transparent via-[var(--gic-steel-gray)] to-transparent"
              initial={{ scaleY: suppressHeroIntro ? 1 : 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: suppressHeroIntro ? 0.35 : 2 }}
            />
          </section>

          {timelineData.map((step, index) => (
            <TimelineSection key={step.id} step={step} index={index} locale={locale} />
          ))}

          {/* 3. Footer: Minimalist CTA */}
          <section className="flex min-h-screen flex-col items-center justify-center px-6 border-t border-[var(--gic-off-white)]">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="mb-16 max-w-4xl text-center leading-tight"
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "clamp(2rem, 5vw, var(--gic-text-display))",
                lineHeight: "var(--gic-leading-display)",
                color: "var(--gic-pitch-black)",
              }}
            >
              {t.ctaTitleLine1}
              <br />
              {t.ctaTitleLine2}
            </motion.h2>

            <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="# SIASE Plus"
                className="w-full bg-transparent py-6 text-left transition-all focus:outline-none"
                style={{
                  fontFamily: "var(--gic-font-serif)",
                  fontSize: "var(--gic-text-button-label)",
                  color: "var(--gic-pitch-black)",
                  borderBottom: "2px solid var(--gic-steel-gray)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = "var(--gic-action-azure)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = "var(--gic-steel-gray)";
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[var(--gic-medium-gray)] transition-colors hover:text-[var(--gic-action-azure)] disabled:opacity-30"
              >
                <Send size={28} />
              </button>
            </form>
            {ack && (
              <p
                className="mt-8 font-bold text-[var(--gic-action-azure)]"
                style={{
                  fontFamily: "var(--gic-font-serif)",
                  fontSize: "var(--gic-text-caption)",
                }}
              >
                {t.ack}
              </p>
            )}
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TimelineSection({
  step,
  index,
  locale,
}: {
  step: TimelineEvent;
  index: number;
  locale: PageLocale;
}) {
  const container = useRef(null);
  const Icon = step.icon;
  const processLabel = copy[locale].processView;
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);
  const isEven = index % 2 === 0;

  return (
    <motion.section
      ref={container}
      style={{ opacity }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-32 lg:px-24"
    >
      <div className={`flex w-full max-w-7xl flex-col items-center gap-20 lg:flex-row ${isEven ? "" : "lg:flex-row-reverse"}`}>
        
        {/* Contenido Narrativo */}
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ x: isEven ? -100 : 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="mb-4 block uppercase tracking-widest opacity-70"
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "var(--gic-text-button-label)",
                color: "var(--gic-slate-gray)",
              }}
            >
              {step.date}
            </span>
            <h2
              className="mb-8"
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "var(--gic-text-display)",
                lineHeight: "var(--gic-leading-display)",
                color: "var(--gic-pitch-black)",
              }}
            >
              {step.title}
            </h2>
            <p
              className="text-balance"
              style={{
                fontFamily: "var(--gic-font-serif)",
                fontSize: "var(--gic-text-button-label)",
                lineHeight: 1.65,
                color: "var(--gic-charcoal)",
              }}
            >
              {step.description}
            </p>
          </motion.div>

          <motion.div 
            className="pt-8 space-y-4 border-t border-[var(--gic-off-white)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {step.extraFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-px w-8 bg-[var(--gic-pitch-black)] transition-all group-hover:w-12" />
                <span
                  style={{
                    fontFamily: "var(--gic-font-serif)",
                    fontSize: "var(--gic-text-caption)",
                    lineHeight: 1.5,
                    color: "var(--gic-dark-charcoal)",
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Visual Parallax Wrapper */}
        <motion.div 
          style={{ y, scale }}
          className="flex-1 w-full"
        >
          <div className="relative aspect-[4/5] bg-[var(--gic-off-white)] rounded-[var(--gic-radius-cards-large)] border border-[var(--gic-cool-gray)] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[var(--gic-slate-gray)] opacity-30">
              <Icon size={64} strokeWidth={0.5} />
              <p
                className="italic"
                style={{
                  fontFamily: "var(--gic-font-serif)",
                  fontSize: "var(--gic-text-caption)",
                }}
              >
                {processLabel}: {step.title}
              </p>
            </div>
            {/* Efecto de ruido/textura sutil */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}