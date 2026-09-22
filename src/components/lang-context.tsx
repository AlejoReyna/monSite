"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE, type Language } from "@/lib/language";

export type { Language } from "@/lib/language";

const PAGE_TITLES: Record<Language, string> = {
  en: "Alexis Reyna — Full-stack Developer",
  es: "Alexis Reyna — Desarrollador Full-stack",
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// The cookie is the only record of a choice. Earlier builds wrote English to localStorage on every
// first visit, whether or not anyone picked it, so that value is not read back as a preference.
export function LanguageProvider({ children, initialLanguage = DEFAULT_LANGUAGE }: { children: React.ReactNode; initialLanguage?: Language }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);
  const router = useRouter();
  const pathname = usePathname();
  const setLanguage = React.useCallback((next: Language) => {
    if (!isLanguage(next)) return;
    updateLanguage(next);
    document.cookie = `${LANGUAGE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    // Server-rendered pages (blog, metadata, <html lang>) read the cookie, so re-render them too.
    router.refresh();
  }, [router]);

  // Keep <html lang="..."> and document.title in sync without making layout.tsx a client component.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      if (pathname === "/") document.title = PAGE_TITLES[language];
    }
  }, [language, pathname]);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
