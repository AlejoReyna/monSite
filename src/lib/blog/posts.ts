import type { Post, PostMeta } from "./types";
import { artisanalBrewPixelHero } from "./post-content/artisanal-brew-pixel-hero";
import { getReadingMinutes } from "./reading-time";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import englishPost from "./post-content/artisanal-brew-pixel-hero.en.json";

function localizePost(post: Post, language: Language): Post {
  if (language === "es") return post;
  const dictionary: Record<string, string> = englishPost;
  function translate(value: unknown, key = ""): unknown {
    if (["code", "src", "href", "slug", "kind", "variant", "poster"].includes(key)) return value;
    if (typeof value === "string") return dictionary[value] ?? value;
    if (Array.isArray(value)) return value.map(item => translate(item));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, translate(item, name)]));
    return value;
  }
  return { ...translate(post) as Post, locale: "en-US" };
}

/**
 * Post registry.
 *
 * Posts are data, not files. That keeps the block vocabulary enforced by the
 * type checker: an invalid block is a build error, not a page that renders
 * slightly wrong in production.
 */

export const posts: Post[] = [
  artisanalBrewPixelHero,
];

/** Newest first. */
export function getAllPosts(language: Language = DEFAULT_LANGUAGE): PostMeta[] {
  return [...posts]
    .map(post => localizePost(post, language))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({
      slug,
      title,
      seoTitle,
      summary,
      date,
      updated,
      locale,
      keywords,
      ogImage,
      readingMinutes,
      tags,
      blocks,
    }) => ({
      slug,
      title,
      seoTitle,
      summary,
      date,
      updated,
      locale,
      keywords,
      ogImage,
      readingMinutes: readingMinutes ?? getReadingMinutes(blocks),
      tags,
    }));
}

export function getPost(slug: string, language: Language = DEFAULT_LANGUAGE): Post | undefined {
  const post = posts.find((p) => p.slug === slug);
  return post ? localizePost(post, language) : undefined;
}

export function formatDate(iso: string, locale = "en-US"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
