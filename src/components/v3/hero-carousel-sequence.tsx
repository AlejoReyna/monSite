"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import HeroV2 from "@/components/v2/hero-v2";
// import ProjectsCarousel from "@/components/v3/projects-carousel";
import ThisCafeteriaGateway from "@/components/this-cafeteria-gateway";
import NoNamedBotGateway from "@/components/nonamedbot-gateway";
import WeddingServiceGateway from "@/components/wedding-service-gateway";
import PlebesProjectGateway from "@/components/plebes-project-gateway";
import ContactGateway from "@/components/contact-gateway";
import "@/components/v3/v3.css";

/* ═══════════════════════════════════════════════════════════════════════════
   HeroCarouselSequence — Hero-to-projects curtain reveal
   ═══════════════════════════════════════════════════════════════════════════ */

const PHASE = {
  heroOnlyUntil: 0.08,
  revealCompleteBy: 0.82,
  cardsEnterAt: 0.58,
} as const;

// Delta a acumular antes de disparar UN salto de panel.
const WHEEL_THRESHOLD = 30;
// Tras un gesto, la rueda debe quedar en silencio este tiempo (ms) antes de
// permitir el siguiente salto. Esto "absorbe" la inercia del trackpad que, de
// otro modo, encadenaba 2 secciones con un solo swipe.
const WHEEL_IDLE_MS = 240;
const SWIPE_THRESHOLD = 44;
const PANEL_TRANSITION = {
  duration: 0.62,
  ease: [0.16, 1, 0.3, 1] as const, // expo-out: arranque firme, asentado suave
};
type SequencePanel = 0 | 1 | 2 | 3 | 4 | 5;

const PANELS: { id: SequencePanel; label: string }[] = [
  { id: 0, label: "Inicio" },
  { id: 1, label: "This Cafetería" },
  { id: 2, label: "Plebes" },
  { id: 3, label: "NoNamedBot" },
  { id: 4, label: "Wedding Service" },
  { id: 5, label: "Get in touch" },
];
const LAST_PANEL = (PANELS.length - 1) as SequencePanel;
const PANEL_SCROLLABLE_SELECTOR = "[data-carousel-scrollable='true']";

// Color de la barra superior del navegador por panel. Se aplica por dos vías
// porque Safari cambió de mecanismo: hasta Safari 18 se lee el
// <meta name="theme-color"> (el primero válido gana, según la doc de WebKit);
// Safari 26 ignora el meta y muestrea el background-color CSS del body.
const PANEL_THEME_COLORS: Record<SequencePanel, string> = {
  0: "#2f1e2f", // Hero
  1: "#16110d", // Artisanal Brew (This Cafetería) — matches the panel's own background
  2: "hsl(319, 43%, 28%)", // Plebes
  3: "#000000", // NoNamedBot
  4: "#3f3a35", // Wedding invitations
  5: "#222634", // Get in touch
};

// Valores del layout raíz a restaurar cuando la secuencia se desmonta.
const DEFAULT_THEME_COLOR = "#f9faf7";
const DEFAULT_BODY_BG = "var(--gic-off-white)";

const applyThemeColor = (color: string) => {
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  } else {
    metas.forEach((meta) => {
      // Sin media queries: el color del panel manda en claro y oscuro.
      meta.removeAttribute("media");
      meta.content = color;
    });
  }
  document.body.style.backgroundColor = color;
};

const clampPanel = (value: number): SequencePanel =>
  Math.max(0, Math.min(LAST_PANEL, value)) as SequencePanel;

const getScrollablePanel = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(PANEL_SCROLLABLE_SELECTOR);
};

const canScrollPanel = (element: HTMLElement, deltaY: number) => {
  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }

  if (deltaY < 0) {
    return element.scrollTop > 1;
  }

  return false;
};

export default function HeroCarouselSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cafeteriaProgress = useMotionValue(0);
  const nonamedbotProgress = useMotionValue(0);
  const minecraftProgress = useMotionValue(0);
  const plebesProgress = useMotionValue(0);
  const contactProgress = useMotionValue(0);
  const revealProgress = useMotionValue(0);
  const isAnimatingRef = useRef(false);
  const isRevealedRef = useRef(false);
  const activePanelRef = useRef<SequencePanel>(0);
  const [activePanel, setActivePanelState] = useState<SequencePanel>(0);
  const touchStartYRef = useRef<number | null>(null);

  // ── Control de gesto de rueda (anti doble-salto por inercia) ──────────────
  const navLockedRef = useRef(false); // true mientras dura un gesto + enfriamiento
  const wheelAccumRef = useRef(0); // acumulador de deltaY hacia el umbral
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [carouselPointerEvents, setCarouselPointerEvents] = useState<"none" | "auto">("none");
  const [carouselIntroActive, setCarouselIntroActive] = useState(false);
  const [cafeteriaPointerEvents, setCafeteriaPointerEvents] = useState<"none" | "auto">("none");
  const [nonamedbotPointerEvents, setNonamedbotPointerEvents] = useState<"none" | "auto">("none");
  const [minecraftPointerEvents, setMinecraftPointerEvents] = useState<"none" | "auto">("none");
  const [plebesPointerEvents, setPlebesPointerEvents] = useState<"none" | "auto">("none");
  const [contactPointerEvents, setContactPointerEvents] = useState<"none" | "auto">("none");
  const touchScrollableRef = useRef<HTMLElement | null>(null);

  const setNavFontMode = useCallback(
    (mode: "default" | "cafeteria" | "wedding" | "invitation") => {
      document.body.classList.toggle("is-cafeteria-panel-active", mode === "cafeteria");
      document.body.classList.toggle("is-wedding-panel-active", mode === "wedding");
      document.body.classList.toggle("is-invitation-panel-active", mode === "invitation");
    },
    []
  );

  // Mientras la secuencia está montada, el documento no debe poder desplazarse:
  // los cambios de panel se hacen por gesto (swipe/rueda), no por scroll nativo.
  useEffect(() => {
    document.documentElement.classList.add("is-sequence-locked");
    return () => {
      document.documentElement.classList.remove("is-sequence-locked");
    };
  }, []);

  // La barra del navegador acompaña al panel visible (en ambos sentidos de
  // navegación). Se dispara al INICIO de la transición para que el tinte
  // cambie junto con el deslizamiento del panel.
  useEffect(() => {
    applyThemeColor(PANEL_THEME_COLORS[activePanel]);
  }, [activePanel]);

  useEffect(() => {
    return () => {
      applyThemeColor(DEFAULT_THEME_COLOR);
      document.body.style.backgroundColor = DEFAULT_BODY_BG;
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("is-cafeteria-panel-active");
    document.body.classList.remove("is-wedding-panel-active");
    document.body.classList.remove("is-invitation-panel-active");
    document.body.classList.remove("is-nav-font-transitioning");

    return () => {
      document.body.classList.remove("is-cafeteria-panel-active");
      document.body.classList.remove("is-wedding-panel-active");
      document.body.classList.remove("is-invitation-panel-active");
      document.body.classList.remove("is-nav-font-transitioning");
    };
  }, []);

  const setActivePanel = useCallback((panel: SequencePanel) => {
    activePanelRef.current = panel;
    setActivePanelState(panel);
  }, []);

  useMotionValueEvent(cafeteriaProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setCafeteriaPointerEvents((prev) => (prev === next ? prev : next));
  });

  useMotionValueEvent(nonamedbotProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setNonamedbotPointerEvents((prev) => (prev === next ? prev : next));
  });

  useMotionValueEvent(minecraftProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setMinecraftPointerEvents((prev) => (prev === next ? prev : next));
  });

  useMotionValueEvent(plebesProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setPlebesPointerEvents((prev) => (prev === next ? prev : next));
  });

  useMotionValueEvent(contactProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setContactPointerEvents((prev) => (prev === next ? prev : next));
  });

  useMotionValueEvent(revealProgress, "change", (latest) => {
    const next = latest >= 0.98 ? "auto" : "none";
    setCarouselPointerEvents((prev) => (prev === next ? prev : next));
    setCarouselIntroActive((prev) => {
      const shouldShow = latest >= PHASE.cardsEnterAt;
      return prev === shouldShow ? prev : shouldShow;
    });
  });

  const animateToPanel = useCallback(
    (nextPanel: SequencePanel) => {
      if (isAnimatingRef.current || activePanelRef.current === nextPanel) return;

      const currentPanel = activePanelRef.current;
      isAnimatingRef.current = true;
      setNavFontMode(
        nextPanel === 1 ? "cafeteria" : nextPanel === 4 ? "wedding" : "default"
      );
      setActivePanel(nextPanel);
      isRevealedRef.current = false;
      revealProgress.set(0);

      // Pila de paneles deslizantes (índice = panelId - 1).
      // 1: NoNamedBot · 2: plebes · 3: cafetería · 4: boda · 5: contacto
      const progresses = [
        nonamedbotProgress,
        plebesProgress,
        cafeteriaProgress,
        minecraftProgress,
        contactProgress,
      ];
      const pointerSetters = [
        setNonamedbotPointerEvents,
        setPlebesPointerEvents,
        setCafeteriaPointerEvents,
        setMinecraftPointerEvents,
        setContactPointerEvents,
      ];

      // Durante la transición ningún panel deslizante recibe eventos.
      pointerSetters.forEach((setter) => setter("none"));
      setCarouselPointerEvents("none");
      setCarouselIntroActive(false);

      const finishPanelTransition = () => {
        isAnimatingRef.current = false;
      };

      // Panel 0 (hero base): bajamos toda la pila y revelamos el hero.
      if (nextPanel === 0) {
        for (let i = 1; i < progresses.length; i++) progresses[i].set(0);
        animate(progresses[0], 0, {
          ...PANEL_TRANSITION,
          onComplete: finishPanelTransition,
        });
        return;
      }

      const onComplete = () => {
        pointerSetters[nextPanel - 1]("auto");
        finishPanelTransition();
      };

      if (nextPanel > currentPanel) {
        // Avance: los paneles inferiores quedan asentados (1), los superiores
        // ocultos (0), y el panel destino sube de 0 → 1.
        for (let p = 1; p <= LAST_PANEL; p++) {
          if (p === nextPanel) continue;
          progresses[p - 1].set(p < nextPanel ? 1 : 0);
        }
        animate(progresses[nextPanel - 1], 1, { ...PANEL_TRANSITION, onComplete });
      } else {
        // Retroceso: el panel inmediatamente superior al destino baja de 1 → 0,
        // revelando el destino. El resto se ajusta al instante.
        for (let p = 1; p <= LAST_PANEL; p++) {
          if (p === nextPanel + 1) continue;
          progresses[p - 1].set(p <= nextPanel ? 1 : 0);
        }
        animate(progresses[nextPanel], 0, { ...PANEL_TRANSITION, onComplete });
      }
    },
    [
      cafeteriaProgress,
      nonamedbotProgress,
      minecraftProgress,
      plebesProgress,
      contactProgress,
      revealProgress,
      setActivePanel,
      setNavFontMode,
    ]
  );

  // Salto a un panel concreto (rueda, teclado, swipe o clic en los puntos).
  const goToPanel = useCallback(
    (next: SequencePanel) => {
      animateToPanel(next);
    },
    [animateToPanel]
  );

  const stepPanel = useCallback(
    (dir: 1 | -1) => {
      goToPanel(clampPanel(activePanelRef.current + dir));
    },
    [goToPanel]
  );

  // Libera el bloqueo SOLO cuando la rueda lleva WHEEL_IDLE_MS en silencio y la
  // animación ya terminó. Mientras llega inercia, el temporizador se reinicia,
  // de modo que un único flick = un único salto por mucha inercia que arrastre.
  const scheduleUnlock = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(function unlock() {
      if (isAnimatingRef.current) {
        idleTimerRef.current = setTimeout(unlock, WHEEL_IDLE_MS);
        return;
      }
      navLockedRef.current = false;
      wheelAccumRef.current = 0;
      idleTimerRef.current = null;
    }, WHEEL_IDLE_MS);
  }, []);

  const handleWheel = useCallback(
    (event: globalThis.WheelEvent) => {
      const interactiveTarget = (event.target as HTMLElement | null)?.closest(
        "input, textarea, select"
      );
      if (interactiveTarget) return;

      const scrollablePanel = getScrollablePanel(event.target);
      if (scrollablePanel && canScrollPanel(scrollablePanel, event.deltaY)) {
        wheelAccumRef.current = 0;
        return;
      }

      // Sin esto, el navegador desplaza la página de verdad en paralelo a
      // nuestra animación por transform: doble movimiento, sensación de
      // lentitud y un hueco del fondo (blanco) asomando en el borde superior.
      event.preventDefault();

      // Bloqueado (gesto en curso, animando o enfriando): tragamos la inercia y
      // mantenemos vivo el temporizador hasta que la rueda quede en silencio.
      if (navLockedRef.current || isAnimatingRef.current) {
        scheduleUnlock();
        return;
      }

      wheelAccumRef.current += event.deltaY;
      if (Math.abs(wheelAccumRef.current) < WHEEL_THRESHOLD) {
        scheduleUnlock(); // si el usuario pausa, el acumulador se resetea
        return;
      }

      const dir: 1 | -1 = wheelAccumRef.current > 0 ? 1 : -1;
      navLockedRef.current = true;
      wheelAccumRef.current = 0;
      stepPanel(dir);
      scheduleUnlock();
    },
    [scheduleUnlock, stepPanel]
  );

  // Listener nativo y no-pasivo: solo así preventDefault() realmente bloquea
  // el scroll del documento (un onWheel de React es pasivo por defecto).
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    touchScrollableRef.current = getScrollablePanel(event.target);
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startY = touchStartYRef.current;
      touchStartYRef.current = null;
      const scrollablePanel = touchScrollableRef.current;
      touchScrollableRef.current = null;
      if (startY === null) return;

      const endY = event.changedTouches[0]?.clientY;
      if (endY === undefined) return;

      const deltaY = startY - endY;
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

      if (scrollablePanel && canScrollPanel(scrollablePanel, deltaY)) return;

      stepPanel(deltaY > 0 ? 1 : -1);
    },
    [stepPanel]
  );

  // Navegación externa (navbar): sin anclas reales en el home, el contexto de
  // navegación emite este evento y aquí lo mapeamos a un panel.
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const section = (event as CustomEvent<string>).detail;
      if (section === "contact") goToPanel(LAST_PANEL);
      else if (section === "home") goToPanel(0);
    };
    window.addEventListener("sequence:navigate", onNavigate);
    return () => window.removeEventListener("sequence:navigate", onNavigate);
  }, [goToPanel]);

  // ── Navegación por teclado (flechas, Página, Inicio/Fin, Espacio) ─────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowDown":
        case "PageDown":
          event.preventDefault();
          stepPanel(1);
          break;
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          stepPanel(-1);
          break;
        case " ": // barra espaciadora (Shift = hacia arriba)
          event.preventDefault();
          stepPanel(event.shiftKey ? -1 : 1);
          break;
        case "Home":
          event.preventDefault();
          goToPanel(0);
          break;
        case "End":
          event.preventDefault();
          goToPanel(LAST_PANEL);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepPanel, goToPanel]);

  // Limpieza del temporizador de inercia al desmontar.
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const heroForegroundOpacity = useTransform(
    nonamedbotProgress,
    [0.12, 0.72],
    [1, 0]
  );
  const heroScale = useTransform(nonamedbotProgress, [0, 1], [1, 0.985]);
  const nonamedbotY = useTransform(nonamedbotProgress, [0, 1], ["100%", "0%"]);
  const cafeteriaY = useTransform(cafeteriaProgress, [0, 1], ["100%", "0%"]);
  const minecraftY = useTransform(minecraftProgress, [0, 1], ["100%", "0%"]);
  const plebesY = useTransform(plebesProgress, [0, 1], ["100%", "0%"]);
  const contactY = useTransform(contactProgress, [0, 1], ["100%", "0%"]);
  const carouselY = useTransform(revealProgress, [0, 1], ["7%", "0%"]);

  const carouselClip = useTransform(
    revealProgress,
    [PHASE.heroOnlyUntil, PHASE.revealCompleteBy],
    ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]
  );

  return (
    <div
      ref={containerRef}
      id="work"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ height: "100svh", position: "relative", zIndex: 1, touchAction: activePanel === 2 || activePanel === 5 ? "pan-y" : "pan-x" }}
      className="bg-[var(--gic-night-sky)]"
    >
      <div
        style={{
          position: "relative",
          top: 0,
          height: "100svh",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            scale: heroScale,
          }}
        >
          <HeroV2
            embedInScrollSequence
            embedContentOpacity={heroForegroundOpacity}
            disableBgVignette
          />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            y: nonamedbotY,
            pointerEvents: nonamedbotPointerEvents,
            willChange: "transform",
          }}
        >
          <ThisCafeteriaGateway isActive={activePanel === 1} />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            y: plebesY,
            pointerEvents: plebesPointerEvents,
            willChange: "transform",
          }}
        >
          <PlebesProjectGateway isActive={activePanel === 2} />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            y: cafeteriaY,
            pointerEvents: cafeteriaPointerEvents,
            willChange: "transform",
          }}
        >
          <NoNamedBotGateway isActive={activePanel === 3} />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 7,
            y: minecraftY,
            pointerEvents: minecraftPointerEvents,
            willChange: "transform",
          }}
        >
          <WeddingServiceGateway isActive={activePanel === 4} />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            y: contactY,
            pointerEvents: contactPointerEvents,
            willChange: "transform",
          }}
        >
          <ContactGateway isActive={activePanel === 5} />
        </motion.div>

        {/* Projects carousel hidden — uncomment import + block to restore
        <motion.div
          className="v3-root"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9,
            clipPath: carouselClip,
            pointerEvents: carouselPointerEvents,
            y: carouselY,
            willChange: "clip-path",
            background: "transparent",
          }}
        >
          <div className="relative z-[1] flex flex-col justify-center h-full w-full overflow-hidden">
            <ProjectsCarousel introActive={carouselIntroActive} />
          </div>
        </motion.div>
        */}
      </div>
    </div>
  );
}
