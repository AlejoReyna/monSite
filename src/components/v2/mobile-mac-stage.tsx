"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ChatInterface from "@/components/chat-interface";
import MobileCoffeeAnimation from "./mobile-coffee-animation";
import styles from "./mobile-mac-stage.module.css";

type MobileMacStageProps = {
  view?: "assistant" | "folders";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  theme?: "mac" | "default";
};

/** Mobile composition from 916cb21: one GIF, lower terminal, separate dock. */
export default function MobileMacStage({
  view = "assistant",
  open = true,
  onOpenChange,
  theme = "mac",
}: MobileMacStageProps) {
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

  const close = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    setExpanded(false);
    onOpenChange?.(false);
    requestAnimationFrame(() => document.getElementById("mac-terminal-launcher")?.focus({ preventScroll: true }));
  };

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
        data-expanded={expanded}
        data-keyboard={viewport.bottom > 100}
      >
        <a className={styles.credit} href="https://www.instagram.com/jayivee._/" target="_blank" rel="noopener noreferrer">
          Artist: @jayivee._
        </a>
        {active && (
          <ChatInterface
            theme={theme}
            variant="panel"
            className="!w-full !h-full max-w-none"
            onClose={close}
            onMinimize={close}
            onToggleMaximize={() => setExpanded(value => !value)}
            maximized={expanded}
          />
        )}
      </div>
    </div>
  );
}
