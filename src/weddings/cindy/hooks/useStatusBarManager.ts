"use client";
import { useEffect, useRef } from 'react';
import { useInlineWedding } from '@/weddings/shared/inline-context';

interface StatusBarSection {
  id: string;
  color: string;
  isVisible: boolean;
}

class StatusBarManager {
  private sections: Map<string, StatusBarSection> = new Map();
  private defaultColor: string = '#ffffff';

  setDefaultColor(color: string) {
    this.defaultColor = color;
    this.updateStatusBar();
  }

  registerSection(id: string, color: string) {
    this.sections.set(id, { id, color, isVisible: false });
  }

  unregisterSection(id: string) {
    this.sections.delete(id);
    this.updateStatusBar();
  }

  setSectionVisibility(id: string, isVisible: boolean) {
    const section = this.sections.get(id);
    if (section) {
      section.isVisible = isVisible;
      this.updateStatusBar();
    }
  }

  private updateStatusBar() {
    const visibleSections = Array.from(this.sections.values()).filter(s => s.isVisible);
    const colorToApply = visibleSections.length > 0
      ? visibleSections[0].color
      : this.defaultColor;

    this.applyStatusBarColor(colorToApply);
  }

  private applyStatusBarColor(color: string) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);

    let metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatusBar) {
      metaAppleStatusBar = document.createElement('meta');
      metaAppleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.getElementsByTagName('head')[0].appendChild(metaAppleStatusBar);
    }
    metaAppleStatusBar.setAttribute('content', this.isColorLight(color) ? 'default' : 'black-translucent');

    // Garantizar viewport-fit=cover para soporte de notch
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      const content = metaViewport.getAttribute('content') || '';
      if (!content.includes('viewport-fit=cover')) {
        metaViewport.setAttribute('content', content + ', viewport-fit=cover');
      }
    }
  }

  private isColorLight(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  }
}

// Singleton
const statusBarManager = new StatusBarManager();

interface UseStatusBarSectionProps {
  sectionId: string;
  color: string;
  defaultColor?: string;
}

export const useStatusBarSection = ({
  sectionId,
  color,
  defaultColor = '#ffffff',
}: UseStatusBarSectionProps) => {
  const inline = useInlineWedding();
  const sectionRef = useRef<HTMLElement>(null);
  if (inline) return sectionRef;

  useEffect(() => {
    statusBarManager.setDefaultColor(defaultColor);
    statusBarManager.registerSection(sectionId, color);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          statusBarManager.setSectionVisibility(sectionId, entry.isIntersecting);
        });
      },
      { threshold: 0.3, rootMargin: '-50px 0px -50px 0px' }
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);

    // iOS: forzar repaint inicial
    if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setTimeout(() => statusBarManager.setDefaultColor(defaultColor), 100);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
      statusBarManager.unregisterSection(sectionId);
    };
  }, [sectionId, color, defaultColor]);

  return sectionRef;
};
