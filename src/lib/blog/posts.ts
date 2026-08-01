import type { Post, PostMeta } from "./types";
import { artisanalBrewPixelHero } from "./post-content/artisanal-brew-pixel-hero";
import { getReadingMinutes } from "./reading-time";

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
export function getAllPosts(): PostMeta[] {
  return [...posts]
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

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(iso: string, locale = "en-US"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
