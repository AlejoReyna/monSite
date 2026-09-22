import type { Language } from "./language";
import pairs from "./locale-copy.json";

// Exact source text is the key. Keep leading/trailing spaces for inline prose.
const translations = new Map<string, { en: string; es: string }>();
for (const [en, es] of pairs) {
  const value = { en, es };
  translations.set(en.trim(), value);
  translations.set(es.trim(), value);
}

export function translateText(text: string, language: Language): string {
  const translated = translations.get(text.trim())?.[language];
  if (translated === undefined) return text;
  return text.replace(text.trim(), translated);
}

/** Translate prose in data-driven content; identifiers and executable examples stay intact. */
export function translateContent<T>(content: T, language: Language): T {
  function visit(value: unknown, key = ""): unknown {
    if (["id", "kind", "name", "code", "src", "href", "url", "slug", "variant", "language", "poster"].includes(key)) return value;
    if (typeof value === "string") return translateText(value, language);
    if (Array.isArray(value)) return value.map(item => visit(item));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, visit(item, name)]));
    return value;
  }
  return visit(content) as T;
}
