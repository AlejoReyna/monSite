"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "es" | "zh";

const PAGE_TITLES: Record<Language, string> = {
  en: "Alexis Reyna — Full-stack Developer",
  es: "Alexis Reyna — Desarrollador Full-stack",
  zh: "Alexis Reyna — 全栈开发者",
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isValidLanguage(value: string | null): value is Language {
  return value === "en" || value === "es" || value === "zh";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Initialize from localStorage once mounted; default to English.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("app_lang");
      if (isValidLanguage(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("app_lang", language);
    } catch {}
  }, [language]);

  // Keep <html lang="..."> and document.title in sync without making layout.tsx a client component.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.title = PAGE_TITLES[language];
    }
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

