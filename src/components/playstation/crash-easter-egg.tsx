"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { advanceKonami, isTypingTarget, KONAMI_KEYS, KONAMI_TIMEOUT_MS } from "@/lib/playstation/konami";
import styles from "./crash-easter-egg.module.css";

const CrashPlayer = dynamic(() => import("./crash-player"), {
  ssr: false,
  loading: () => <p role="status">Loading…</p>,
});

export default function CrashEasterEgg() {
  const { language } = useLanguage();
  const es = language === "es";
  const dialog = useRef<HTMLDialogElement>(null);
  const progress = useRef(0);
  const lastKey = useRef(0);
  const visibleRef = useRef(false);
  const [unlocked, setUnlocked] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [steps, setSteps] = useState(0);
  const visible = unlocked || keypad;

  const close = useCallback(() => {
    progress.current = 0; setSteps(0); setUnlocked(false); setKeypad(false);
  }, []);
  const unlock = useCallback(() => {
    visibleRef.current = true;
    document.documentElement.dataset.crashOpen = "true";
    setUnlocked(true); setKeypad(false); progress.current = 0; setSteps(0);
  }, []);

  useEffect(() => {
    visibleRef.current = visible;
    if (!visible) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    document.documentElement.dataset.crashOpen = "true";
    element?.showModal();
    return () => {
      element?.close();
      delete document.documentElement.dataset.crashOpen;
      visibleRef.current = false;
      previous?.focus({ preventScroll: true });
    };
  }, [visible]);

  useEffect(() => {
    const reset = () => { progress.current = 0; lastKey.current = 0; };
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (visibleRef.current || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) { reset(); return; }
      const now = performance.now();
      if (now - lastKey.current > KONAMI_TIMEOUT_MS) reset();
      const previous = progress.current;
      progress.current = advanceKonami(previous, event.key);
      lastKey.current = now;
      // Normal single-arrow navigation remains available. After ↑ ↑, reserve
      // matching code keys so the sequence does not move the carousel/icons.
      if (progress.current >= 2 && progress.current > previous) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
      if (progress.current === KONAMI_KEYS.length) unlock();
    };
    window.addEventListener("keydown", handleKey, true);
    window.addEventListener("blur", reset);
    return () => { window.removeEventListener("keydown", handleKey, true); window.removeEventListener("blur", reset); };
  }, [unlock]);

  const tap = (key: string, now: number) => {
    if (now - lastKey.current > KONAMI_TIMEOUT_MS) progress.current = 0;
    lastKey.current = now;
    progress.current = advanceKonami(progress.current, key);
    setSteps(progress.current);
    if (progress.current === KONAMI_KEYS.length) unlock();
  };

  return <>
    <button className={styles.secret} type="button" aria-label={es ? "Introducir código secreto" : "Enter secret code"} onClick={() => { progress.current = 0; lastKey.current = 0; setSteps(0); setKeypad(true); }}>↑↑</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={unlocked ? "crash-title" : "secret-title"} onCancel={event => {
      event.preventDefault();
      if (unlocked) window.dispatchEvent(new Event("crash:escape"));
      else close();
    }}>
      {unlocked ? <CrashPlayer onExit={close} /> : keypad ? <section className={styles.keypad}>
        <button type="button" className={styles.dismiss} onClick={close} aria-label={es ? "Cerrar" : "Close"}>×</button>
        <h2 id="secret-title">{es ? "¿Recuerdas el código?" : "Remember the code?"}</h2>
        <p aria-live="polite">{steps} / 10</p>
        <div>{[["ArrowUp", "↑"], ["ArrowDown", "↓"], ["ArrowLeft", "←"], ["ArrowRight", "→"], ["b", "B"], ["a", "A"]].map(([key, label]) => <button type="button" key={key} aria-label={key} onClick={event => tap(key, event.timeStamp)}>{label}</button>)}</div>
      </section> : null}
    </dialog>
  </>;
}
