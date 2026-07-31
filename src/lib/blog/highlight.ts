import { createHighlighter, type Highlighter } from "shiki";

/**
 * Keep the bundled grammar set to exactly what the posts use — shiki loads
 * every listed language eagerly, and this runs once per build/server start.
 */
const SUPPORTED_LANGUAGES = [
  "csharp",
  "css",
  "javascript",
  "json",
  "razor",
  "typescript",
  "yaml",
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["monokai"],
      langs: [...SUPPORTED_LANGUAGES],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, language: string) {
  const highlighter = await getHighlighter();
  const lang = (SUPPORTED_LANGUAGES as readonly string[]).includes(language)
    ? language
    : "plaintext";
  return highlighter.codeToHtml(code, { lang, theme: "monokai" });
}
