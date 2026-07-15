"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "es" | "zh";

const LANGUAGE_ORDER: Language[] = ["en", "es", "zh"];

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  cycleLanguage: () => void;
  /** @deprecated Use setLanguage or cycleLanguage instead. */
  toggleLanguage: () => void;
  isFading: boolean;
  toggleWithFade: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isValidLanguage(value: string | null): value is Language {
  return value === "en" || value === "es" || value === "zh";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [isFading, setIsFading] = useState(false);

  // Initialize from localStorage once mounted; default to English.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("app_lang");
      if (isValidLanguage(stored)) {
        setLanguage(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("app_lang", language);
    } catch {}
  }, [language]);

  // Keep <html lang="..."> in sync without making layout.tsx a client component.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const cycleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const idx = LANGUAGE_ORDER.indexOf(prev);
      return LANGUAGE_ORDER[(idx + 1) % LANGUAGE_ORDER.length];
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    cycleLanguage();
  }, [cycleLanguage]);

  const toggleWithFade = useCallback(() => {
    // Fade out, switch language, fade in
    setIsFading(true);
    window.setTimeout(() => {
      cycleLanguage();
      window.setTimeout(() => setIsFading(false), 180);
    }, 180);
  }, [cycleLanguage]);

  const value = useMemo(
    () => ({ language, setLanguage, cycleLanguage, toggleLanguage, isFading, toggleWithFade }),
    [language, setLanguage, cycleLanguage, toggleLanguage, isFading, toggleWithFade]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// Helper wrapper that applies an opacity transition across content during language switch
export function LanguageFade({ children }: { children: React.ReactNode }) {
  const { isFading } = useLanguage();
  return (
    <div
      className={`transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}
      aria-busy={isFading}
    >
      {children}
    </div>
  );
}


