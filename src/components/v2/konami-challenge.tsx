"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { advanceKonami, KONAMI_SEQUENCE } from "@/lib/terminal/konami";
import { preloadGameBoy } from "@/lib/gameboy/preload";
import styles from "./konami-challenge.module.css";

const COPY = {
  es: {
    title: "A ver si te sabes esta.",
    hint: "Sigue la secuencia con tu teclado o toca las teclas.",
    wrong: "Esa no. Prueba la siguiente tecla de la secuencia.",
    complete: "Código desbloqueado.",
    back: "Volver",
    replay: "Otra vez",
    accepted: "correcta",
    next: "siguiente",
    step: "Paso",
    keys: { ArrowUp: "Arriba", ArrowDown: "Abajo", ArrowLeft: "Izquierda", ArrowRight: "Derecha", b: "B", a: "A" },
  },
  en: {
    title: "Let's see if you know this one.",
    hint: "Follow the sequence on your keyboard or tap the keys.",
    wrong: "Not that one. Try the next key in the sequence.",
    complete: "Code unlocked.",
    back: "Go back",
    replay: "Again",
    accepted: "correct",
    next: "next",
    step: "Step",
    keys: { ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right", b: "B", a: "A" },
  },
};

export default function KonamiChallenge({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [progress, setProgress] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const complete = progress === KONAMI_SEQUENCE.length;

  useEffect(() => {
    const controller = new AbortController();
    void preloadGameBoy(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!complete) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("mac-reduced-motion");
    const hold = window.setTimeout(() => setLeaving(true), 600);
    const finish = window.setTimeout(onComplete, reduced ? 600 : 1000);
    return () => { window.clearTimeout(hold); window.clearTimeout(finish); };
  }, [complete, onComplete]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    // The carousel listens to native wheel events; keep this interaction in place.
    const stopWheel = (event: WheelEvent) => event.stopPropagation();
    dialog.addEventListener("wheel", stopWheel);
    return () => {
      dialog.removeEventListener("wheel", stopWheel);
      dialog.close();
    };
  }, []);

  function press(key: string) {
    if (complete) return;
    const next = advanceKonami(progress, key);
    setMistake(next === progress);
    setProgress(next);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      tabIndex={-1}
      aria-labelledby="konami-title"
      aria-describedby="konami-hint"
      onCancel={event => { event.preventDefault(); onBack(); }}
      onTouchStart={event => event.stopPropagation()}
      onTouchEnd={event => event.stopPropagation()}
      onKeyDown={event => {
        event.stopPropagation();
        if (event.metaKey || event.ctrlKey || event.altKey || event.nativeEvent.isComposing) return;
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        if (event.key === " " && event.target instanceof HTMLButtonElement) return;
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key) && key.length !== 1) return;
        event.preventDefault();
        if (!event.repeat) press(event.key);
      }}
      onKeyUp={event => event.stopPropagation()}
    >
      <div className={styles.content} data-leaving={leaving}>
        <p className={styles.eyebrow}>KONAMI CODE</p>
        <h2 id="konami-title" className={styles.title}>{complete ? copy.complete : copy.title}</h2>
        <p id="konami-hint" className={styles.hint}>{copy.hint}</p>
        <div className={styles.sequence} aria-label="↑ ↑ ↓ ↓ ← → ← → B A">
          {KONAMI_SEQUENCE.map(({ key, label }, index) => (
            <button
              key={index}
              type="button"
              className={styles.key}
              data-complete={index < progress}
              data-next={index === progress}
              data-error={mistake && index === progress}
              aria-label={`${copy.step} ${index + 1}: ${copy.keys[key]}${index < progress ? `, ${copy.accepted}` : index === progress ? `, ${copy.next}` : ""}`}
              aria-disabled={complete}
              onClick={() => press(key)}
            >
              {key.startsWith("Arrow") ? (
                <svg className={styles.arrow} data-direction={key} viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M50 10 82 54H65V90H35V54H18Z" fill="currentColor" />
                </svg>
              ) : <span aria-hidden="true">{label}</span>}
            </button>
          ))}
        </div>
        <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {complete ? copy.complete : mistake ? copy.wrong : `${progress} / ${KONAMI_SEQUENCE.length}`}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onBack}>{copy.back}</button>
        </div>
      </div>
    </dialog>
  );
}
