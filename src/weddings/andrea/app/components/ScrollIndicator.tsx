"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ScrollIndicator() {
  const { isNightMode } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const updateScrollProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Calculate total scrollable distance
    const totalScrollableDistance = documentHeight - windowHeight;
    
    // Calculate progress (0 to 1)
    const progress = totalScrollableDistance > 0 ? scrollTop / totalScrollableDistance : 0;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    setScrollProgress(clampedProgress);
    
    // Show indicator after scrolling a bit (after hero section)
    setIsVisible(scrollTop > windowHeight * 0.3);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      updateScrollProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollProgress]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Calculate the position along the timeline
  const timelineHeight = window.innerHeight * 0.6; // 60% of viewport height
  const activePosition = scrollProgress * timelineHeight;

  return (
    <div className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 pointer-events-none hidden md:block">
      <div className="relative">
        {/* Background line */}
        <div 
          className={`w-1 rounded-full transition-colors duration-500 ${
            isNightMode ? 'bg-white/20' : 'bg-[#d4c4b0]/40'
          }`}
          style={{ height: `${timelineHeight}px` }}
        />
        
        {/* Active point that moves with scroll */}
        <div 
          className={`absolute w-4 h-4 rounded-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 border-2 ${
            isNightMode 
              ? 'bg-white border-white/50 shadow-lg shadow-white/20' 
              : 'bg-[#8b7355] border-[#8b7355]/50 shadow-lg shadow-[#8b7355]/20'
          }`}
          style={{ 
            top: `${activePosition}px`,
            transition: 'top 0.1s ease-out, background-color 0.5s ease, border-color 0.5s ease'
          }}
        />
        
        {/* Start point */}
        <div 
          className={`absolute w-2 h-2 rounded-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${
            isNightMode ? 'bg-white/60' : 'bg-[#8b7355]/60'
          }`}
          style={{ top: '0px' }}
        />
        
        {/* End point */}
        <div 
          className={`absolute w-2 h-2 rounded-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${
            isNightMode ? 'bg-white/60' : 'bg-[#8b7355]/60'
          }`}
          style={{ top: `${timelineHeight}px` }}
        />
        
        {/* Progress percentage (optional) */}
        <div 
          className={`absolute right-6 transform -translate-y-1/2 transition-colors duration-500 text-xs font-light tracking-wider ${
            isNightMode ? 'text-white/70' : 'text-[#8b7355]/70'
          }`}
          style={{ 
            top: `${activePosition}px`,
            transition: 'top 0.1s ease-out, color 0.5s ease'
          }}
        >
          {Math.round(scrollProgress * 100)}%
        </div>
      </div>
    </div>
  );
}
