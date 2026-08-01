"use client";

import { useEffect, useRef } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

interface LoopingVideoProps {
  src: string;
  poster: string;
  /** Describes the clip — <video> has no alt, so this rides on aria-label. */
  alt: string;
  width: number;
  height: number;
}

/**
 * A silent decorative loop that obeys `prefers-reduced-motion`.
 *
 * The source is not attached until the figure approaches the viewport. With no
 * JavaScript, reduced motion, or Save-Data, the poster remains a complete and
 * inexpensive fallback.
 */
export default function LoopingVideo({
  src,
  poster,
  alt,
  width,
  height,
}: LoopingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    let isNearViewport = false;
    let sourceAttached = false;

    const sync = () => {
      const shouldPlay =
        isNearViewport &&
        !document.hidden &&
        !query.matches &&
        !connection?.saveData;

      if (!shouldPlay) {
        video.pause();
        return;
      }

      if (!sourceAttached) {
        const src = video.dataset.src;
        if (!src) return;
        video.src = src;
        sourceAttached = true;
        video.load();
      }

      // Autoplay can still be refused (low power mode, tab policy). The poster
      // stays up in that case, which is an acceptable resting state.
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting;
        sync();
      },
      {
        rootMargin: "400px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    query.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      query.removeEventListener("change", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      data-src={src}
      poster={poster}
      width={width}
      height={height}
      aria-label={alt}
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
