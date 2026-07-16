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
      ? "text-[0.62rem] tracking-[0.1em] px-2 py-1.5 gap-1"
      : "text-[0.75rem] tracking-[0.12em] px-2.5 py-2 gap-1.5";

  return (
    <div
      className={`inline-flex items-center rounded-full border border-white/18 bg-white/5 ${sizeClasses} ${className}`}
      role="group"
      aria-label="Language switcher"
    >
      {OPTIONS.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            title={option.title}
            aria-pressed={isActive}
            className={`rounded-full px-2 py-0.5 transition-all duration-200 ${
              isActive
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
