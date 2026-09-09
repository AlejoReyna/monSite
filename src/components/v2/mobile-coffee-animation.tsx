"use client";

import { useEffect, useRef, useState } from "react";

/** A single native decoder, without the desktop SVG filters or duplicate uses. */
export default function MobileCoffeeAnimation({ active }: { active: boolean }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inViewport = false;
    const sync = () => setPlaying(inViewport && !document.hidden && !reducedMotion.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      sync();
    });
    observer.observe(image);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [active]);

  // The asset is already resized and encoded, and must remain animated.
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    ref={imageRef}
    src={active && playing && !failed ? "/mobile/coffee.webp" : "/mobile/coffee-still.webp"}
    width={888}
    height={1383}
    alt=""
    decoding="async"
    draggable={false}
    onError={() => setFailed(true)}
  />;
}
