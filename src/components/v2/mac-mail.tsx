"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { ContactEmailForm } from "@/components/contact-gateway";
import { useLanguage } from "@/components/lang-context";
import { animateGenie } from "@/lib/desktop/genie";
import styles from "./mac-mail.module.css";

export default function MacMail({ open, onClose }: { open: boolean; onClose: () => void }) {
  const minimizedRef = useRef(false);
  return open ? <MacMailWindow onClose={onClose} minimizedRef={minimizedRef} /> : null;
}

function MacMailWindow({ onClose, minimizedRef }: { onClose: () => void; minimizedRef: RefObject<boolean> }) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const [enterPressed, setEnterPressed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const windowRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cancelGenie = useRef<(() => void) | null>(null);
  const copy = language === "es"
    ? { title: "alexis — correo — zsh — 80×24", command: "mail --compose", close: "Cerrar", minimize: "Minimizar al Dock", maximize: "Maximizar", restore: "Restaurar tamaño" }
    : language === "zh"
      ? { title: "alexis — 邮件 — zsh — 80×24", command: "mail --compose", close: "关闭", minimize: "最小化到程序坞", maximize: "最大化", restore: "恢复大小" }
      : { title: "alexis — mail — zsh — 80×24", command: "mail --compose", close: "Close", minimize: "Minimize to Dock", maximize: "Maximize", restore: "Restore window size" };

  useLayoutEffect(() => {
    if (!windowRef.current) return;
    cancelGenie.current?.();
    if (minimizedRef.current) {
      cancelGenie.current = animateGenie(windowRef.current, document.getElementById("mac-mail-launcher"), true, () => closeRef.current?.focus({ preventScroll: true }));
      minimizedRef.current = false;
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [minimizedRef]);

  useEffect(() => () => cancelGenie.current?.(), []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const revealImmediately = window.setTimeout(() => {
        setTypedCommand(copy.command);
        setEnterPressed(true);
        setShowForm(true);
      }, 0);
      return () => window.clearTimeout(revealImmediately);
    }

    let index = 0;
    let typingTimer: number | undefined;
    let enterTimer: number | undefined;
    let revealTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      typingTimer = window.setInterval(() => {
        index += 1;
        setTypedCommand(copy.command.slice(0, index));
        if (index < copy.command.length) return;
        window.clearInterval(typingTimer);
        enterTimer = window.setTimeout(() => setEnterPressed(true), 180);
        revealTimer = window.setTimeout(() => setShowForm(true), 430);
      }, 68);
    }, 280);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) window.clearInterval(typingTimer);
      if (enterTimer) window.clearTimeout(enterTimer);
      if (revealTimer) window.clearTimeout(revealTimer);
    };
  }, [copy.command]);

  const dismiss = () => {
    cancelGenie.current?.();
    minimizedRef.current = false;
    setExpanded(false);
    onClose();
    requestAnimationFrame(() => document.getElementById("mac-mail-launcher")?.focus({ preventScroll: true }));
  };

  const minimize = () => {
    if (!windowRef.current) return;
    cancelGenie.current?.();
    minimizedRef.current = true;
    cancelGenie.current = animateGenie(windowRef.current, document.getElementById("mac-mail-launcher"));
    onClose();
    document.getElementById("mac-mail-launcher")?.focus({ preventScroll: true });
  };

  return (
    <div className={`${styles.surface} ${expanded ? styles.surfaceFullScreen : ""}`} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); dismiss(); } }}>
      <section ref={windowRef} className={`${styles.window} ${expanded ? styles.expanded : ""}`} role="dialog" aria-modal="false" aria-labelledby="mac-mail-title">
        <header className={styles.toolbar}>
          <div className={styles.traffic}>
            <button ref={closeRef} className={styles.close} onClick={dismiss} aria-label={copy.close}><X size={10} /></button>
            <button className={styles.minimize} onClick={minimize} aria-label={copy.minimize}><Minus size={10} /></button>
            <button className={styles.maximize} onClick={() => setExpanded((value) => !value)} aria-label={expanded ? copy.restore : copy.maximize} aria-pressed={expanded}>{expanded ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button>
          </div>
          <strong id="mac-mail-title">{copy.title}</strong>
        </header>
        <div className={styles.body}>
          <p className={styles.command} aria-live="polite">
            <span>alexis@portfolio</span> <b>~</b> % {typedCommand}
            {!enterPressed && <i aria-hidden="true" />}
          </p>
          {showForm && <ContactEmailForm onSent={dismiss} />}
        </div>
      </section>
    </div>
  );
}
