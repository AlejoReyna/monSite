"use client";

import { useCopy } from "@/components/use-copy";
import { useLanguage, type Language } from "@/components/lang-context";

type LanguageOption = {
  code: Language;
  label: string;
  title: string;
};

const OPTIONS: LanguageOption[] = [
  { code: "es", label: "ES", title: "Español" },
  { code: "en", label: "EN", title: "English" },
];

const TOGGLE_LABELS: Record<Language, string> = {
  es: "Idioma: español. Cambiar a inglés",
  en: "Language: English. Switch to Spanish",
};

/**
 * One-tap language control for tight rows (the phone Dock, the menu bar, the phone navbar).
 * It shows the current language, like the macOS input menu, and a tap switches to the other one.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const label = TOGGLE_LABELS[language];
  return (
    <button
      type="button"
      className={className}
      lang={language}
      aria-label={label}
      title={label}
      onClick={() => setLanguage(language === "es" ? "en" : "es")}
    >
      {language.toUpperCase()}
    </button>
  );
}

type LanguageSwitcherProps = {
  className?: string;
  size?: "sm" | "md";
};

export default function LanguageSwitcher({ className = "", size = "md" }: LanguageSwitcherProps) {
  const copyText = useCopy();
  const { language, setLanguage } = useLanguage();

  const sizeClasses =
    size === "sm"
      ? "text-[0.65rem] tracking-[0.1em] gap-3"
      : "text-[0.85rem] tracking-[0.12em] gap-4";

  return (
    <div
      className={`inline-flex items-center ${sizeClasses} ${className}`}
      role="group"
      aria-label={copyText("Language switcher")}
    >
      <span style={{
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontFamily: "var(--font-space-mono, ui-monospace, monospace)"
      }}>
        {copyText("Language ")}</span>
      {OPTIONS.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            title={copyText(option.title)}
            aria-pressed={isActive}
            className={`transition-colors duration-200 uppercase font-mono ${
              isActive
                ? "text-white font-bold"
                : "text-white/50 hover:text-white"
            }`}
          >
            {copyText(option.label)}
          </button>
        );
      })}
    </div>
  );
}
