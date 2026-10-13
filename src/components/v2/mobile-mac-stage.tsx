"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ChatInterface from "@/components/chat-interface";
import { useLanguage } from "@/components/lang-context";
import MobileCoffeeAnimation from "./mobile-coffee-animation";
import styles from "./mobile-mac-stage.module.css";
import appearance from "./terminal-appearance.module.css";

type MobileMacStageProps = {
  view?: "assistant" | "folders";
  open?: boolean;
  theme?: "mac" | "default";
  terminalIds: number[];
  activeTerminalId: number | null;
  minimizedTerminalIds: number[];
  onFocusTerminal: (id: number) => void;
  onCloseTerminal: (id: number) => void;
  onMinimizeTerminal: (id: number) => void;
};

/** Mobile composition: character backdrop, readable terminal, separate dock. */
export default function MobileMacStage({
  view = "assistant",
  open = true,
  theme = "mac",
  terminalIds,
  activeTerminalId,
  minimizedTerminalIds,
  onFocusTerminal,
  onCloseTerminal,
  onMinimizeTerminal,
}: MobileMacStageProps) {
  const { language } = useLanguage();
  const [active, setActive] = useState(false);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [viewport, setViewport] = useState({ height: 0, bottom: 0 });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setActive(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!active) return;
    const vv = window.visualViewport;
    const sync = () => setViewport({
      height: vv?.height ?? window.innerHeight,
      bottom: Math.max(0, window.innerHeight - (vv?.height ?? window.innerHeight) - (vv?.offsetTop ?? 0)),
    });
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [active]);

  const terminalHeader = <div className={styles.tabs} role="tablist" aria-label={language === "es" ? "Terminales" : "Terminals"} onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    {terminalIds.map(id => <button key={id} type="button" role="tab" aria-selected={id === activeTerminalId} aria-controls={`mobile-terminal-${id}`} data-minimized={minimizedTerminalIds.includes(id)} onClick={() => onFocusTerminal(id)}>Terminal {id}</button>)}
  </div>;

  return (
    <div className={styles.stage} data-view={view} inert={view === "folders"} style={{
      "--visible-height": viewport.height ? `${viewport.height}px` : "100svh",
      "--keyboard-bottom": `${viewport.bottom}px`,
    } as CSSProperties}>
      <div className={styles.character} aria-hidden="true">
        {active && <MobileCoffeeAnimation active={view === "assistant"} />}
      </div>
      <div
        className={styles.terminal}
        hidden={!open}
        data-expanded={activeTerminalId !== null && expandedIds.includes(activeTerminalId)}
        data-keyboard={viewport.bottom > 100}
      >
        {active && <>
          {activeTerminalId === null && terminalHeader}
          {terminalIds.map(id => <div key={id} id={`mobile-terminal-${id}`} role="tabpanel" className={`${styles.session} ${appearance.window}`} hidden={id !== activeTerminalId} data-visible={open && view === "assistant" && id === activeTerminalId}>
            <ChatInterface
              introVisible={open && view === "assistant" && id === activeTerminalId}
              compact
              theme={theme}
              variant="panel"
              titlebarContent={terminalHeader}
              className="!w-full !h-full max-w-none"
              onClose={() => {
                setExpandedIds(current => current.filter(expandedId => expandedId !== id));
                onCloseTerminal(id);
                if (terminalIds.length === 1) requestAnimationFrame(() => document.getElementById("mac-terminal-launcher")?.focus({ preventScroll: true }));
              }}
              onMinimize={() => onMinimizeTerminal(id)}
              onToggleMaximize={() => setExpandedIds(current => current.includes(id) ? current.filter(expandedId => expandedId !== id) : [...current, id])}
              maximized={expandedIds.includes(id)}
            />
          </div>)}
          {activeTerminalId === null && <div className={styles.empty} role="status">{language === "es" ? "Elige una terminal para restaurarla." : "Choose a terminal to restore it."}</div>}
        </>}
      </div>
    </div>
  );
}
