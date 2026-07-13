"use client";
import { useEffect, useRef } from 'react';
import { useInlineWedding } from '@/weddings/shared/inline-context';

interface UseNotchColorProps {
  heroColor?: string;
  defaultColor?: string;
  isNightMode?: boolean;
}

export const useNotchColor = ({ 
  heroColor = '#878074', 
  defaultColor = '#ffffff',
  isNightMode = false
}: UseNotchColorProps = {}) => {
  const inline = useInlineWedding();
  const heroSectionRef = useRef<HTMLElement>(null);
  if (inline) return heroSectionRef;

  useEffect(() => {
    // Función para actualizar el color del notch
    const updateThemeColor = (color: string) => {
      // Buscar meta tag existente o crear uno nuevo
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
      }
      
      // En modo nocturno, forzar color negro para el status bar
      const finalColor = isNightMode ? '#000000' : color;
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
      
      if (isNightMode) {
        // En modo nocturno, usar texto blanco sobre fondo oscuro
        statusBarStyle = 'black-translucent';
      } else {
        // En modo normal, usar lógica basada en el color
        const isLightColor = isColorLight(color);
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
    };

    // Función auxiliar para determinar si un color es claro u oscuro
    const isColorLight = (color: string): boolean => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Usar la fórmula de luminancia relativa más precisa
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    };

    // Configurar Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Hero está visible - aplicar color personalizado
            updateThemeColor(heroColor);
          } else {
            // Hero no está visible - restaurar color por defecto
            updateThemeColor(defaultColor);
          }
        });
      },
      {
        // Configuración del observer
        threshold: 0.3, // Se activa cuando el 30% de la sección está visible
        rootMargin: '-50px 0px -50px 0px' // Margen para activación más precisa
      }
    );

    // Forzar la aplicación inicial del color
    updateThemeColor(defaultColor);
    
    // Observar la sección Hero si existe
    const currentRef = heroSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    // Para iOS, forzar un repaint del status bar
    if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Pequeño delay para asegurar que los meta tags se apliquen
      setTimeout(() => {
        updateThemeColor(defaultColor);
      }, 100);
    }

    // Cleanup
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
      // Restaurar color por defecto al desmontar
      updateThemeColor(defaultColor);
    };
  }, [heroColor, defaultColor, isNightMode]);

  return heroSectionRef;
};
