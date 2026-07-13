"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isNightMode: boolean;
  setIsNightMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    // Detectar la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Aplicar la preferencia inicial
    setIsNightMode(mediaQuery.matches);
    
    // Escuchar cambios en la preferencia del sistema
    const handleChange = (e: MediaQueryListEvent) => {
      setIsNightMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ isNightMode, setIsNightMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 