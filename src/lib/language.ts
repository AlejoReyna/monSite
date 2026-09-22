export const LANGUAGES = ["en", "es"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Spanish unless the visitor picked English with a language switcher. */
export const DEFAULT_LANGUAGE: Language = "es";

/** The cookie that remembers a visitor's explicit choice; server renders read it, so there is no flash. */
export const LANGUAGE_COOKIE = "app_lang";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "es";
}

export function resolveLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}
