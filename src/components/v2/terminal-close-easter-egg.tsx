"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useLanguage, type Language } from "@/components/lang-context";
import { TERMINAL_CLOSE_COPY, TERMINAL_CLOSE_DELAY } from "@/lib/terminal/close-copy";
import styles from "./terminal-close-easter-egg.module.css";
import KonamiChallenge from "./konami-challenge";

const GameBoyPlayer = dynamic(() => import("./gameboy-player"), { ssr: false });

/** Mounted only after the last session closes; reopening cancels the reveal. */
export default function TerminalCloseEasterEgg({ onReopen }: { onReopen: () => void }) {
  const { language } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [wantsFun, setWantsFun] = useState(false);
  const [playing, setPlaying] = useState(false);
  const unlock = useCallback(() => setPlaying(true), []);
  useEffect(() => {
    const timeout = window.setTimeout(() => setRevealed(true), TERMINAL_CLOSE_DELAY);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!revealed) return null;

  return <>
    {!playing && <TerminalCloseMessage language={language} onReopen={onReopen} onShowKonami={() => setWantsFun(true)} />}
    {wantsFun && !playing && <KonamiChallenge onBack={() => setWantsFun(false)} onComplete={unlock} />}
    {playing && <GameBoyPlayer onExit={onReopen} />}
  </>;
}

function TerminalCloseMessage({ language, onReopen, onShowKonami }: {
  language: Language;
  onReopen: () => void;
  onShowKonami: () => void;
}) {
  const copy = TERMINAL_CLOSE_COPY[language];
  const message = copy.message;
  const words = message.split(" ");

  return (
    <section className={styles.scene} aria-label={copy.label}>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.aside} aria-hidden="true">{copy.aside}</p>
        <p className={styles.announcement} role="status" aria-live="polite" aria-atomic="true">
          {copy.aside} {message}
        </p>
        <h2 key={language} className={styles.message} aria-label={message}>
          {words.map((word, index) => (
            <span key={index} aria-hidden="true">
              <span className={styles.word} style={{ "--word-delay": `${0.18 + index * 0.065}s` } as CSSProperties}>{word}</span>{" "}
            </span>
          ))}
        </h2>
        <div
          key={`${language}-actions`}
          className={styles.actions}
          style={{ "--actions-delay": `${0.18 + (words.length - 1) * 0.065 + 0.45}s` } as CSSProperties}
        >
          <button className={styles.reopen} type="button" onClick={onReopen}>
            <span aria-hidden="true" className={styles.prompt}>&gt;_</span>
            {copy.reopen}
            <span aria-hidden="true">↗</span>
          </button>
          <button className={styles.alternative} type="button" onClick={onShowKonami}>
            {copy.fun}
          </button>
        </div>
      </div>
    </section>
  );
}
