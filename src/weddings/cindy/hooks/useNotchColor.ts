"use client";
import { useLayoutEffect, RefObject } from 'react';

interface UseNotchColorProps {
  /** Ordered list of section refs. Priority is given to the first intersecting one. */
  refs: RefObject<HTMLElement | null>[];
  /** Color for each ref (same index order). */
  colors: string[];
  /** Color applied when no section is intersecting. */
  defaultColor?: string;
  isNightMode?: boolean;
}

export const useNotchColor = ({
  refs,
  colors,
  defaultColor = '#ffffff',
  isNightMode = false,
}: UseNotchColorProps): void => {
  useLayoutEffect(() => {
    // ── Helpers ─────────────────────────────────────────────────────────────

    const isColorLight = (hex: string): boolean => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
    };

    const updateThemeColor = (color: string) => {
      const finalColor = isNightMode ? '#000000' : color;

      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', finalColor);

      // Safari 26+ samples top fixed elements/backgrounds more reliably than
      // live theme-color updates, so keep a CSS-driven tint probe in sync too.
      document.documentElement.style.setProperty('--safari-tint-color', finalColor);
      document.documentElement.style.backgroundColor = finalColor;

      let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaApple) {
        metaApple = document.createElement('meta');
        metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaApple);
      }
      metaApple.setAttribute(
        'content',
        isNightMode
          ? 'black-translucent'
          : isColorLight(finalColor)
          ? 'default'
          : 'black-translucent',
      );
    };

    let lastAppliedColor = '';
    let frameId: number | null = null;

    const applyColor = (color: string) => {
      if (color === lastAppliedColor) {
        return;
      }
      lastAppliedColor = color;
      updateThemeColor(color);
    };

    const getActiveColor = () => {
      const mountedSections = refs
        .map((ref, index) => ({
          element: ref.current,
          color: colors[index] ?? defaultColor,
        }))
        .filter(
          (section): section is { element: HTMLElement; color: string } =>
            section.element instanceof HTMLElement,
        );

      if (mountedSections.length === 0) {
        return defaultColor;
      }

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const triggerY = Math.max(96, Math.min(viewportHeight * 0.2, 180));
      let activeIndex = 0;

      // A section becomes active once its top crosses a fixed line near the top
      // of the viewport. This is more predictable on iOS Safari than relying on
      // IntersectionObserver or waiting for the previous section to fully leave.
      for (let i = 0; i < mountedSections.length; i++) {
        const rect = mountedSections[i].element.getBoundingClientRect();

        if (rect.top <= triggerY) {
          activeIndex = i;
          continue;
        }

        break;
      }

      return mountedSections[activeIndex]?.color ?? defaultColor;
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        applyColor(getActiveColor());
      });
    };

    const visualViewport = window.visualViewport;

    // When embedded in the portfolio scroller, listen to that container instead
    // of the window, because the invitation scrolls inside a nested overflow
    // container rather than the document body.
    const scroller =
      refs[0]?.current?.closest<HTMLElement>('[data-carousel-scrollable="true"]') ??
      null;
    const scrollTarget = scroller ?? window;

    applyColor(defaultColor);
    scheduleUpdate();

    const settleTimers = [60, 180, 360].map((delay) =>
      window.setTimeout(scheduleUpdate, delay),
    );

    scrollTarget.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    window.addEventListener('touchstart', scheduleUpdate, { passive: true });
    window.addEventListener('touchmove', scheduleUpdate, { passive: true });
    window.addEventListener('touchend', scheduleUpdate, { passive: true });

    visualViewport?.addEventListener('resize', scheduleUpdate);
    visualViewport?.addEventListener('scroll', scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      settleTimers.forEach((timerId) => window.clearTimeout(timerId));
      scrollTarget.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      window.removeEventListener('pageshow', scheduleUpdate);
      window.removeEventListener('touchstart', scheduleUpdate);
      window.removeEventListener('touchmove', scheduleUpdate);
      window.removeEventListener('touchend', scheduleUpdate);
      visualViewport?.removeEventListener('resize', scheduleUpdate);
      visualViewport?.removeEventListener('scroll', scheduleUpdate);
      updateThemeColor(defaultColor);
    };
  }, [colors, defaultColor, isNightMode, refs]);
};
