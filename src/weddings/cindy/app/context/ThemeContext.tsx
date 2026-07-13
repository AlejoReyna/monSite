"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  isNightMode: boolean;
  setIsNightMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isNightMode, setIsNightMode] = useState(false);

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