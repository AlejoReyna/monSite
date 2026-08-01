"use client";

import { useEffect, useRef } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

/**
 * Keeps the cinematic cover inexpensive: the poster is the initial visual and
 * video sources are attached only after the page has had an idle moment. The
 * browser still selects a smaller mobile encode, while reduced-motion and
 * Save-Data visitors never download a clip.
 */
export default function BlogFeatureVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    let isVisible = true;
    let isIdle = false;
    let sourcesAttached = false;

    const attachSources = () => {
      if (sourcesAttached) return;

      video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach((source) => {
        const src = source.dataset.src;
        if (src) source.src = src;
      });
      sourcesAttached = true;
      video.load();
    };

    const syncPlayback = () => {
      const shouldPlay =
        isVisible &&
        isIdle &&
        !document.hidden &&
        !motionQuery.matches &&
        !connection?.saveData;

      if (!shouldPlay) {
        video.pause();
        return;
      }

      attachSources();
      void video.play().catch(() => {
        // The poster remains visible when a device refuses autoplay.
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.05 },
    );

    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleHandle = idleWindow.requestIdleCallback?.(
      () => {
        isIdle = true;
        syncPlayback();
      },
      { timeout: 1500 },
    );
    const fallbackHandle =
      idleHandle === undefined
        ? window.setTimeout(() => {
            isIdle = true;
            syncPlayback();
          }, 800)
        : undefined;

    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    motionQuery.addEventListener("change", syncPlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motionQuery.removeEventListener("change", syncPlayback);
      if (idleHandle !== undefined) {
        idleWindow.cancelIdleCallback?.(idleHandle);
      }
      if (fallbackHandle !== undefined) {
        window.clearTimeout(fallbackHandle);
      }
    };
  }, []);

  return (
    <video
      ref={ref}
      className="blog-feature-video"
      loop
      muted
      playsInline
      preload="none"
      poster="/article_bg-poster.jpg"
    >
      <source
        data-src="/article_bg-mobile.mp4"
        type="video/mp4"
        media="(max-width: 720px)"
      />
      <source data-src="/article_bg.mp4" type="video/mp4" />
    </video>
  );
}
