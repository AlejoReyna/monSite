"use client";

import { useEffect, useMemo, useState } from "react";
import { createTerminalIntro, terminalIntroFrame, type TerminalIntroCopy } from "@/lib/terminal/intro";

export function useTerminalIntro(copy: TerminalIntroCopy, visible: boolean, resetKey: string) {
  const { heading, prefix, portfolio, invitation } = copy;
  const intro = useMemo(() => createTerminalIntro({ heading, prefix, portfolio, invitation }), [heading, prefix, portfolio, invitation]);
  const initial = { intro, visible, resetKey, elapsed: 0, reduced: false };
  const [playback, setPlayback] = useState(initial);
  // Reset before painting when reopening, changing languages or using /clear.
  // Keeping this tied to the props prevents a frame of the previous sequence.
  const current = playback.intro === intro && playback.visible === visible && playback.resetKey === resetKey ? playback : initial;
  if (current !== playback) setPlayback(initial);

  useEffect(() => {
    if (!visible) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let timer: number | undefined;
    let disposed = false;
    let finished = false;
    const tick = () => {
      if (disposed) return;
      window.clearTimeout(timer);
      const reduced = media.matches || document.documentElement.classList.contains("mac-reduced-motion");
      const elapsed = reduced || finished ? intro.duration : Math.min(intro.duration, performance.now() - start);
      finished = elapsed >= intro.duration;
      setPlayback({ intro, visible, resetKey, elapsed, reduced });
      if (!finished) timer = window.setTimeout(tick, 40);
    };
    timer = window.setTimeout(tick, 0);
    media.addEventListener("change", tick);
    const observer = new MutationObserver(tick);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      media.removeEventListener("change", tick);
      observer.disconnect();
    };
  }, [intro, visible, resetKey]);

  return { ...terminalIntroFrame(intro, current.elapsed), reduced: current.reduced };
}
