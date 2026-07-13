"use client"
import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollRevealOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.15 */
  threshold?: number;
  /** Root margin for early/late trigger. Default: '-40px' */
  rootMargin?: string;
  /** Only trigger once. Default: true */
  once?: boolean;
}

/**
 * Lightweight scroll-reveal hook.
 * Returns a ref to attach and an `isVisible` boolean that turns true
 * when the element enters the viewport.
 *
 * Usage:
 *   const [ref, isVisible] = useScrollReveal();
 *   <div ref={ref} className={isVisible ? 'animate-in' : 'animate-out'}>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.15, rootMargin = '-40px', once = true } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else if (!once) {
          setIsVisible(false);
        }
      });
    },
    [once]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    observer.observe(node);
    return () => observer.unobserve(node);
  }, [handleIntersect, threshold, rootMargin]);

  return [ref, isVisible];
}

/**
 * Multi-step sequential reveal.
 * Returns a ref, the current step (0 = hidden), and total steps.
 * Each step fires after `intervalMs` once the element is in view.
 */
export function useSequentialReveal<T extends HTMLElement = HTMLDivElement>(
  totalSteps: number,
  intervalMs: number = 250,
  options: ScrollRevealOptions = {}
): [React.RefObject<T | null>, number] {
  const [ref, isVisible] = useScrollReveal<T>(options);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isVisible || step >= totalSteps) return;

    const timer = setTimeout(() => {
      setStep((s) => s + 1);
    }, step === 0 ? 100 : intervalMs);

    return () => clearTimeout(timer);
  }, [isVisible, step, totalSteps, intervalMs]);

  return [ref, step];
}
