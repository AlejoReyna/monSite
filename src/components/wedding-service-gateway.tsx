"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./wedding-service-gateway.module.css";

const previewProjects = [
  {
    id: "andrea" as const,
    href: "https://aldoyandrea.com",
    label: "View deploy",
    story: {
      title: "Andrea & Aldo",
      spec: "Production SPA — 2025",
      description: "Single Page Application de alto rendimiento optimizada para dispositivos móviles. Enfoque crítico en la velocidad de carga de recursos multimedia de alta resolución, animaciones fluidas y renderizado del lado del cliente sin bloqueos."
    }
  },
  {
    id: "cindy" as const,
    href: "https://cindyjorge.com",
    label: "REVEALING IN AUGUST",
    story: {
      title: "Cindy & Jorge",
      spec: "Interactive Core — 2026",
      description: "Arquitectura UI basada en maquetación fluida y adaptabilidad rigurosa de viewports. Implementación de carga diferida avanzada (Lazy Loading) y mitigación sistemática de errores de hidratación en ambientes SSR."
    }
  },
] as const;

const timerLabels = ["Días", "Horas", "Minutos", "Segundos"];

const getTimeLeft = (targetDate: string) => {
  const difference = new Date(targetDate).getTime() - Date.now();

  if (difference <= 0) {
    return [0, 0, 0, 0];
  }

  return [
    Math.floor(difference / (1000 * 60 * 60 * 24)),
    Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    Math.floor((difference % (1000 * 60)) / 1000),
  ];
};

const formatNumber = (value: number) => value.toString().padStart(2, "0");

function AndreaHeroPreview() {
  return (
    <div className={styles.heroShell}>
      <div className={styles.andreaOverlay} />
      <div className={styles.andreaTopOverlay} />

      <div className={styles.andreaContent}>
        <div className={styles.andreaDate}>SÁBADO 18 DE OCTUBRE</div>
        <div className={styles.andreaNames}>
          <h3>ANDREA</h3>
          <span>&amp;</span>
          <h3>ALDO</h3>
        </div>
        <p className={styles.andreaKicker}>ACOMPÁÑANOS A CELEBRAR</p>
        <span className={styles.andreaButton}>CONFIRMAR ASISTENCIA</span>
      </div>

      <div className={styles.andreaTimer}>
        <Countdown targetDate="2025-10-18T00:00:00" variant="andrea" />
      </div>
    </div>
  );
}

function CindyHeroPreview() {
  const cindy = "Cindy".split("");
  const jorge = "Jorge".split("");

  return (
    <div className={styles.heroShell}>
      <div className={styles.cindyVisualShell}>
        <div className={styles.cindyOverlay} />
      </div>

      <div className={styles.cindyContent}>
        <div className={styles.cindyTopSpacer} />
        <div className={styles.cindyCenterGroup}>
          <div>
            <h3 className={styles.cindyNamesText}>
              {cindy.map((char, index) => (
                <span key={`cindy-${index}`}>{char}</span>
              ))}
            </h3>
            <p className={styles.cindyAmpersand}>&amp;</p>
            <h3 className={styles.cindyNamesText}>
              {jorge.map((char, index) => (
                <span key={`jorge-${index}`}>{char}</span>
              ))}
            </h3>
          </div>
          <div className={styles.cindyDate}>22 de agosto de 2026</div>
        </div>

        <div className={styles.cindyBottomGroup}>
          <span className={styles.cindyButton}>
            <span className={styles.cindyButtonBorder} />
            <span className={styles.cindyButtonBg} />
            <span className={styles.cindyButtonLabel}>Confirma Tu Asistencia</span>
          </span>
          <div className={styles.cindyTimer}>
            <Countdown targetDate="2026-08-22T00:00:00" variant="cindy" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Countdown({ targetDate, variant }: { targetDate: string; variant: "andrea" | "cindy" }) {
  const [values, setValues] = useState([0, 0, 0, 0]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setValues(getTimeLeft(targetDate));
    const timer = window.setInterval(() => {
      setValues(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const currentValues = isMounted ? values : [0, 0, 0, 0];

  return (
    <div className={`${styles.countdown} ${styles[`${variant}Countdown`]}`}>
      {currentValues.map((value, index) => (
        <div className={styles.countdownItem} key={timerLabels[index]}>
          <div className={styles.countdownCard}>
            <div className={styles.countdownNumber}>{formatNumber(value)}</div>
            <div className={styles.countdownLabel}>{timerLabels[index]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type ExpandedId = "andrea" | "cindy" | null;
const SWIPE_DISTANCE = 45;
const EXPAND_TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

export default function WeddingServiceGateway({ isActive = false }: { isActive?: boolean }) {
  const [expanded, setExpanded] = useState<ExpandedId>(null);

  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const draggedRef = useRef(false);

  // Al abandonar el panel, restauramos la rejilla de 2 columnas.
  useEffect(() => {
    if (!isActive) setExpanded(null);
  }, [isActive]);

  // ── Swipe / drag horizontal (Pointer Events: cubre touch y ratón) ──────
  const applySwipe = (dir: "left" | "right") => {
    setExpanded((prev) => {
      if (prev === null) return dir === "left" ? "andrea" : "cindy";
      if (prev === "andrea" && dir === "right") return null;
      if (prev === "cindy" && dir === "left") return null;
      return prev;
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
    draggedRef.current = false;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const startX = pointerStartX.current;
    const startY = pointerStartY.current;
    pointerStartX.current = null;
    pointerStartY.current = null;
    if (startX === null || startY === null) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      draggedRef.current = true;
      applySwipe(dx < 0 ? "left" : "right");
    }
  };

  // Clic/tap en una columna (cuando no fue un arrastre): la expande.
  const handleColumnActivate = (id: "andrea" | "cindy") => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setExpanded((prev) => (prev === null ? id : prev));
  };

  const columnGrow = (id: "andrea" | "cindy") =>
    expanded === null ? 1 : expanded === id ? 1 : 0;

  const renderColumn = (
    id: "andrea" | "cindy",
    colClass: string,
    project: (typeof previewProjects)[number],
    Preview: () => ReactElement,
    wideHint = false
  ) => {
    const open = expanded === id;
    return (
      <motion.div
        className={`${styles.previewCol} ${colClass}${open ? ` ${styles.previewColOpen}` : ""}`}
        style={{ flexBasis: 0, minWidth: 0 }}
        animate={{ flexGrow: columnGrow(id) }}
        transition={EXPAND_TRANSITION}
        role="button"
        tabIndex={expanded === null || open ? 0 : -1}
        aria-label={`${project.story.title} — abrir invitación`}
        onClick={() => handleColumnActivate(id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleColumnActivate(id);
          }
        }}
      >
        <div className={styles.innerPreviewWrapper}>
          <Preview />
          <motion.div
            className={styles.colFooter}
            animate={{ opacity: expanded ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: "none" }}
          >
            <span
              className={`${styles.colHint} ${styles.colHintAction}${
                wideHint ? ` ${styles.colHintActionWide}` : ""
              }`}
            >
              {project.label}
            </span>
          </motion.div>
        </div>

        {/* CTA visible solo cuando la columna está expandida */}
        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.expandOverlay}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <span className={styles.expandSpec}>{project.story.spec}</span>
              <a
                className={styles.expandCta}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver invitación <span aria-hidden="true">→</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <section
      className={styles.screen}
      aria-labelledby="wedding-service-title"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <motion.div
        className={styles.previewLayer}
        aria-label="Wedding invitation mobile hero previews"
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.1 }}
      >
        <div className={styles.previewGrid}>
          {renderColumn("andrea", styles.andreaCol, previewProjects[0], AndreaHeroPreview)}
          {renderColumn("cindy", styles.cindyCol, previewProjects[1], CindyHeroPreview, true)}
        </div>
      </motion.div>

      {/* Control para volver a la rejilla de 2 columnas */}
      <AnimatePresence>
        {expanded && (
          <motion.button
            type="button"
            className={styles.backControl}
            onClick={() => setExpanded(null)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.35 }}
            aria-label="Volver a las dos invitaciones"
          >
            <span aria-hidden="true">‹</span> Volver
          </motion.button>
        )}
      </AnimatePresence>

      {/* FOREGROUND CENTRAL: se oculta al expandir una columna */}
      <motion.div
        className={styles.foreground}
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={isActive ? { clipPath: "circle(150% at 50% 50%)" } : { clipPath: "circle(0% at 50% 50%)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: "none" }}
      >
        <div className={styles.foregroundInner} style={{ pointerEvents: expanded ? "none" : "auto" }}>
          <motion.div
            className={styles.copyBlock}
            animate={{ opacity: expanded ? 0 : 1, y: expanded ? -15 : 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <h2 id="wedding-service-title" className={styles.title}>
              Wedding websites, beautifully made.
            </h2>
            <p className={styles.engineeringSubtitle}>
              Fluidly animated Single Page Applications featuring high-performance image optimization & strict mobile-first UI architecture.
            </p>

            <p className={styles.swipeHint}>Swipe or tap to view each invitation</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
