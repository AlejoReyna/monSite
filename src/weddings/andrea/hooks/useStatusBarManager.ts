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
  private isNightMode: boolean = false;

  setDefaultColor(color: string) {
    this.defaultColor = color;
    this.updateStatusBar();
  }

  setNightMode(isNightMode: boolean) {
    this.isNightMode = isNightMode;
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
    // Encontrar la sección visible con mayor prioridad
    const visibleSections = Array.from(this.sections.values()).filter(s => s.isVisible);
    
    let colorToApply = this.defaultColor;
    
    if (visibleSections.length > 0) {
      // Usar el color de la primera sección visible (se puede modificar la lógica de prioridad)
      colorToApply = visibleSections[0].color;
    }

    // Aplicar el color
    this.applyStatusBarColor(colorToApply);
  }

  private applyStatusBarColor(color: string) {
    // Buscar meta tag existente o crear uno nuevo
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
    }
    
    // En modo nocturno, forzar color negro para el status bar
    const finalColor = this.isNightMode ? '#000000' : color;
    metaThemeColor.setAttribute('content', finalColor);
    
    // También actualizar para dispositivos Apple específicamente
    let metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    if (!metaAppleStatusBar) {
      metaAppleStatusBar = document.createElement('meta');
      metaAppleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.getElementsByTagName('head')[0].appendChild(metaAppleStatusBar);
    }
    
    // Determinar el estilo del status bar basado en el color de fondo
    let statusBarStyle: string;
    
    if (this.isNightMode) {
      // En modo nocturno, usar texto blanco sobre fondo oscuro
      statusBarStyle = 'black-translucent';
    } else {
      // En modo normal, usar lógica basada en el color
      const isLightColor = this.isColorLight(color);
      // Si el fondo es claro, usar texto oscuro (default)
      // Si el fondo es oscuro, usar texto claro (black-translucent)
      statusBarStyle = isLightColor ? 'default' : 'black-translucent';
    }
    
    metaAppleStatusBar.setAttribute('content', statusBarStyle);
    
    // Asegurar que existe el meta tag de viewport para PWA
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
      document.getElementsByTagName('head')[0].appendChild(metaViewport);
    } else {
      // Asegurar que viewport-fit=cover está incluido
      const currentContent = metaViewport.getAttribute('content') || '';
      if (!currentContent.includes('viewport-fit=cover')) {
        metaViewport.setAttribute('content', currentContent + ', viewport-fit=cover');
      }
    }

    // DEBUG: Log what's happening
    console.log('🎨 Status Bar Update:', {
      appliedColor: finalColor,
      statusBarStyle,
      isNightMode: this.isNightMode,
      visibleSections: Array.from(this.sections.values()).filter(s => s.isVisible).map(s => s.id)
    });
  }

  private isColorLight(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Usar la fórmula de luminancia relativa más precisa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
}

// Singleton instance
const statusBarManager = new StatusBarManager();

interface UseStatusBarSectionProps {
  sectionId: string;
  color: string;
  defaultColor?: string;
  isNightMode?: boolean;
}

export const useStatusBarSection = ({ 
  sectionId,
  color,
  defaultColor = '#ffffff',
  isNightMode = false
}: UseStatusBarSectionProps) => {
  const inline = useInlineWedding();
  const sectionRef = useRef<HTMLElement>(null);
  if (inline) return sectionRef;

  useEffect(() => {
    // Configurar el manager
    statusBarManager.setDefaultColor(defaultColor);
    statusBarManager.setNightMode(isNightMode);
    
    // Registrar esta sección
    statusBarManager.registerSection(sectionId, color);

    // Configurar Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          statusBarManager.setSectionVisibility(sectionId, entry.isIntersecting);
        });
      },
      {
        // Configuración del observer
        threshold: 0.3, // Se activa cuando el 30% de la sección está visible
        rootMargin: '-50px 0px -50px 0px' // Margen para activación más precisa
      }
    );

    // Observar la sección si existe
    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Para iOS, forzar un repaint inicial
    if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setTimeout(() => {
        statusBarManager.setDefaultColor(defaultColor);
      }, 100);
    }

    // Cleanup
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
      statusBarManager.unregisterSection(sectionId);
    };
  }, [sectionId, color, defaultColor, isNightMode]);

  return sectionRef;
};
