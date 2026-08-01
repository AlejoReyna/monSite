"use client";

import { useEffect, useRef } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

const ENCODES = {
  mobile: "/article_bg-mobile.mp4",
  desktop: "/article_bg.mp4",
} as const;

const MOBILE_QUERY = "(max-width: 720px)";

/**
 * Keeps the cinematic cover inexpensive: the poster is the initial visual and
 * the file is attached only after the page has had an idle moment. Phones get
 * the small encode and desktops the full one, while reduced-motion and
 * Save-Data visitors never download a clip.
 */
export default function BlogFeatureVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const connection = (navigator as NavigatorWithConnection).connection;
    let isVisible = true;
    let isIdle = false;

    /**
     * The encode is chosen here rather than through `<source media>`: that
     * attribute only does anything inside a `<picture>`, and a media element
     * takes the first source it can decode. Listed mobile-first, that handed
     * every desktop the 720-wide file; listed the other way, phones pull the
     * 1440-wide one. Neither ordering can be right, so nothing is listed.
     */
    const applyEncode = () => {
      const encode = mobileQuery.matches ? "mobile" : "desktop";
      if (video.dataset.encode === encode) return;

      video.dataset.encode = encode;
      video.src = ENCODES[encode];
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

      applyEncode();
      void video.play().catch(() => {
        // The poster remains visible when a device refuses autoplay.
      });
    };

    // A resize across the breakpoint (or a rotated phone) swaps the file only
    // once one is already loaded — crossing it while the poster is still up
    // costs nothing, since the choice is made when playback starts.
    const onBreakpointChange = () => {
      if (!video.dataset.encode) return;
      applyEncode();
      syncPlayback();
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
    mobileQuery.addEventListener("change", onBreakpointChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motionQuery.removeEventListener("change", syncPlayback);
      mobileQuery.removeEventListener("change", onBreakpointChange);
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
    />
  );
}
