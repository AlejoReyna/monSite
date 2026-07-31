"use client";

import { useEffect, useRef } from "react";

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
 * `autoPlay` stays in the markup rather than being applied by this effect, so
 * the clip still plays when JS never runs. The effect only ever takes motion
 * away — which is the direction that matters, since a reduced-motion user who
 * loses the animation is served correctly and one who loses JS is not harmed.
 *
 * Paused playback falls back to the poster frame, so the figure never collapses
 * to an empty box.
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
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      const video = ref.current;
      if (!video) return;

      if (query.matches) {
        video.pause();
        video.currentTime = 0;
      } else {
        // Autoplay can still be refused (low power mode, tab policy). The
        // poster stays up in that case, which is an acceptable resting state.
        void video.play().catch(() => {});
      }
    };

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      width={width}
      height={height}
      aria-label={alt}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
