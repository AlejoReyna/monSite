"use client";

import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useDragControls, type MotionValue } from "framer-motion";
import ChatInterface from "@/components/chat-interface";
import { useWindowFrame } from "@/lib/desktop/use-window-frame";
import WindowResizeHandles from "./window-resize-handles";
import appearance from "./terminal-appearance.module.css";

type Props = {
  id: number;
  active: boolean;
  count: number;
  visible: boolean;
  isDesktop: boolean;
  noBgImage: boolean;
  opacity: MotionValue<number>;
  heroRef: RefObject<HTMLElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
};

export default function DesktopTerminalWindow({ id, active, count, visible, isDesktop, noBgImage, opacity, heroRef, onFocus, onClose, onMinimize }: Props) {
  const [expanded, setExpanded] = useState(false);
  const drag = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  const frame = useWindowFrame(windowRef, {
    enabled: isDesktop && !noBgImage && !expanded && visible,
    minWidth: 380,
    minHeight: 280,
    insets: () => ({ top: 30, bottom: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mac-dock-gutter")) || 88 }),
  });
  const windowed = !noBgImage && frame.resizable && !expanded;

  return <>
    <motion.div
      ref={windowRef}
      hidden={!visible}
      data-expanded={expanded}
      data-framed={windowed && frame.framed ? "" : undefined}
      drag={noBgImage && !expanded}
      dragControls={noBgImage ? drag : undefined}
      dragListener={false}
      {...(windowed ? frame.tracking : {})}
      onPointerDownCapture={onFocus}
      onPointerDown={event => {
        if (expanded || event.button !== 0 || !(event.target as HTMLElement).closest("[data-drag-handle]") || (event.target as HTMLElement).closest("button, a, input, select, textarea, [role='button']")) return;
        if (windowed) frame.startMove(event);
        else if (noBgImage) drag.start(event);
      }}
      dragMomentum={false}
      dragConstraints={noBgImage ? heroRef : undefined}
      dragElastic={0}
      className="absolute cursor-grab active:cursor-grabbing comic-terminal bottom-[7vh] lg:bottom-auto lg:top-[22%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[8%] w-[96vw] lg:w-[min(546px,44.1vw)]"
      style={{
        opacity,
        zIndex: active ? 39 : 38,
        fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
        "--terminal-offset": `${((id - 1) % 5) * 32}px`,
        ...(windowed ? frame.style : undefined),
      } as CSSProperties}
      role="region"
      aria-label={`Terminal ${id}`}
    >
      {windowed && <WindowResizeHandles handleProps={frame.handleProps} />}
      <div className={`${appearance.window} w-full h-[min(425.25px,40.5vh)] lg:h-[min(472.5px,52.5vh)]`} data-visible={visible && (isDesktop || noBgImage)}>
        {(isDesktop || noBgImage) && <ChatInterface
          introVisible={visible && (isDesktop || noBgImage)}
          onClose={noBgImage && count === 1 ? undefined : onClose}
          onMinimize={noBgImage ? undefined : onMinimize}
          onToggleMaximize={() => setExpanded(value => !value)}
          maximized={expanded}
          theme={noBgImage ? "default" : "mac"}
          variant="panel"
          titlebarContent={<div className="flex min-w-0 flex-1 items-center gap-1 py-[3px] font-mono">
            <span className="rounded-[5px] bg-[#55505b] px-[9px] py-[6px] text-xs leading-[1.2] text-white">Terminal {id}</span>
          </div>}
          className="!w-full !h-full max-w-none"
        />}
      </div>
    </motion.div>
  </>;
}
