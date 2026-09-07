"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FRAME_SOURCES = Array.from(
  { length: 15 },
  (_, index) => `/alice/frames/frame-${String(index).padStart(3, "0")}.png`
);

const FRAME_INTERVAL_MS = 180;

export default function AliceFrameAnimation() {
  const [frame, setFrame] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setMotionAllowed(!mediaQuery.matches);
    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (!motionAllowed) return;

    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAME_SOURCES.length);
    }, FRAME_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [motionAllowed]);

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-[-5vw] z-[5] block w-[58vw] max-w-[27rem] sm:left-[-2vw] sm:w-[43vw] md:left-[1vw] md:w-[min(39vw,31rem)]"
      aria-hidden="true"
    >
      <Image
        src={FRAME_SOURCES[frame]}
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 1024px) 39vw, 58vw"
        className="object-contain object-left-bottom"
      />
    </div>
  );
}
