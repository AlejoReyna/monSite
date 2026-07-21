"use client";

import { useLanguage, type Language } from "@/components/lang-context";

type LanguageOption = {
  code: Language;
  label: string;
  title: string;
};

const OPTIONS: LanguageOption[] = [
  { code: "en", label: "EN", title: "English" },
  { code: "es", label: "ES", title: "Español" },
  { code: "zh", label: "中", title: "中文" },
];

type LanguageSwitcherProps = {
  className?: string;
  size?: "sm" | "md";
};

export default function LanguageSwitcher({ className = "", size = "md" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const sizeClasses =
    size === "sm"
      ? "text-[0.65rem] tracking-[0.1em] gap-3"
      : "text-[0.85rem] tracking-[0.12em] gap-4";

  return (
    <div
      className={`inline-flex items-center ${sizeClasses} ${className}`}
      role="group"
      aria-label="Language switcher"
    >
      <span style={{ 
        color: "rgba(255,255,255,0.4)", 
        letterSpacing: "0.2em", 
        textTransform: "uppercase", 
        fontFamily: "var(--font-space-mono, ui-monospace, monospace)" 
      }}>
        Language
      </span>
      {OPTIONS.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            title={option.title}
            aria-pressed={isActive}
            className={`transition-colors duration-200 uppercase font-mono ${
              isActive
                ? "text-white font-bold"
                : "text-white/50 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
