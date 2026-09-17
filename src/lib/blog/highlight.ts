import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

/**
 * Import only the grammars used by posts, rather than the full bundle's
 * language/theme registry. Grammar dependencies (e.g. Razor's HTML) are
 * included by each language module. Share one highlighter per server process.
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

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("shiki/themes/monokai.mjs")],
      langs: [
        import("shiki/langs/csharp.mjs"),
        import("shiki/langs/css.mjs"),
        import("shiki/langs/javascript.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/razor.mjs"),
        import("shiki/langs/typescript.mjs"),
        import("shiki/langs/yaml.mjs"),
      ],
      engine: createOnigurumaEngine(import("shiki/wasm")),
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
