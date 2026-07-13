"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./wedding-service-gateway.module.css";
import DisabledRsvpButton from "@/weddings/shared/disabled-rsvp-button";
import AndreaInlineInvitation from "@/components/weddings/inline-andrea";
import CindyInlineInvitation from "@/components/weddings/inline-cindy";

const previewProjects = [
  {
    id: "andrea" as const,
    label: "View invitation",
    story: {
      title: "Andrea & Aldo",
      spec: "Production SPA — 2025",
      description: "Single Page Application de alto rendimiento optimizada para dispositivos móviles. Enfoque crítico en la velocidad de carga de recursos multimedia de alta resolución, animaciones fluidas y renderizado del lado del cliente sin bloqueos."
    }
  },
  {
    id: "cindy" as const,
    label: "View invitation",
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
    <div className={`${styles.heroFull} ${styles.andreaFull}`}>
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
          <DisabledRsvpButton className={styles.andreaButton}>
            CONFIRMAR ASISTENCIA
          </DisabledRsvpButton>
        </div>

        <div className={styles.andreaTimer}>
          <Countdown targetDate="2025-10-18T00:00:00" variant="andrea" />
        </div>
      </div>
    </div>
  );
}

function CindyHeroPreview() {
  const cindy = "Cindy".split("");
  const jorge = "Jorge".split("");

  return (
    <div className={`${styles.heroFull} ${styles.cindyFull}`}>
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
            <DisabledRsvpButton className={styles.cindyButton}>
              <span className={styles.cindyButtonBorder} />
              <span className={styles.cindyButtonBg} />
              <span className={styles.cindyButtonLabel}>Confirma Tu Asistencia</span>
            </DisabledRsvpButton>
            <div className={styles.cindyTimer}>
              <Countdown targetDate="2026-08-22T00:00:00" variant="cindy" />
            </div>
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

  // Ocultamos la navbar principal del portfolio mientras una invitación está expandida.
  useEffect(() => {
    document.body.classList.toggle("is-wedding-preview-active", expanded !== null);
    return () => document.body.classList.remove("is-wedding-preview-active");
  }, [expanded]);

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
    setExpanded(id);
  };

  const columnGrow = (id: "andrea" | "cindy") =>
    expanded === null ? 1 : expanded === id ? 1 : 0;

  // Escribe una línea del título letra a letra cuando el panel se activa.
  const renderTypedLine = (text: string, baseDelayMs: number) =>
    text.split("").map((char, index) => (
      <span
        key={index}
        aria-hidden="true"
        className={`${styles.typeChar}${isActive ? ` ${styles.typeCharOn}` : ""}`}
        style={{ animationDelay: `${baseDelayMs + index * 45}ms` }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));

  const renderColumn = (
    id: "andrea" | "cindy",
    colClass: string,
    project: (typeof previewProjects)[number],
    Preview: () => ReactElement,
    Invitation: () => ReactElement,
    wideHint = false
  ) => {
    const open = expanded === id;
    const canFocus = expanded === null || open;
    return (
      <motion.div
        className={`${styles.previewCol} ${colClass}${open ? ` ${styles.previewColOpen}` : ""}`}
        style={{ flexBasis: 0, minWidth: 0 }}
        animate={{ flexGrow: columnGrow(id) }}
        transition={EXPAND_TRANSITION}
        role={open ? undefined : "button"}
        tabIndex={canFocus ? 0 : -1}
        aria-label={open ? undefined : `${project.story.title} — abrir invitación`}
        onClick={open ? undefined : () => handleColumnActivate(id)}
        onKeyDown={
          open
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleColumnActivate(id);
                }
              }
        }
      >
        <div className={styles.innerPreviewWrapper}>
          {open ? (
            <motion.div
              className={styles.invitationScroller}
              data-carousel-scrollable="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Invitation />
            </motion.div>
          ) : (
            <>
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
            </>
          )}
        </div>
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
          {renderColumn("andrea", styles.andreaCol, previewProjects[0], AndreaHeroPreview, AndreaInlineInvitation)}
          {renderColumn("cindy", styles.cindyCol, previewProjects[1], CindyHeroPreview, CindyInlineInvitation, true)}
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
            aria-label="Back to the two invitations"
          >
            <span aria-hidden="true">‹</span> Back
          </motion.button>
        )}
      </AnimatePresence>

      {/* Copy central — se oculta al expandir una columna */}
      <motion.div
        className={styles.foreground}
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive && !expanded ? 1 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: "none" }}
      >
        <div className={styles.foregroundInner} style={{ pointerEvents: expanded ? "none" : "auto" }}>
          <motion.div
            className={styles.copyBlock}
            animate={{ opacity: expanded ? 0 : 1, y: expanded ? -15 : 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <h2 id="wedding-service-title" className={styles.title}>
              <span className={styles.titleLine} aria-label="Two years in a row">
                {renderTypedLine("Two years in a row", 350)}
              </span>
              <span className={`${styles.titleScript}${isActive ? ` ${styles.titleScriptOn}` : ""}`}>
                taking part in
              </span>
              <span className={styles.titleLine} aria-label="unforgettable moments">
                {renderTypedLine("unforgettable moments", 1750)}
              </span>
            </h2>
            <p className={styles.swipeHint}>Swipe or tap to view each invitation</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
