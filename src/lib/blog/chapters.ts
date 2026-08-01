import type { Block } from "./types";

export interface BlogHeading {
  id: string;
  text: string;
  level: 2 | 3;
  blockIndex: number;
}

export interface BlogChapter {
  id: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
}

function slugifyHeading(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Produces the single source of truth for both the rendered heading IDs and
 * the table of contents. Repeated heading names receive stable numeric suffixes.
 */
export function getPostHeadings(blocks: Block[]): BlogHeading[] {
  const seen = new Map<string, number>();

  return blocks.flatMap((block, blockIndex) => {
    // The showcase carries its own title so the view controls can share the
    // heading's row — for the table of contents it counts as a subheading.
    const text =
      block.kind === "heading" || block.kind === "subheading"
        ? block.text
        : block.kind === "generationShowcase"
        ? block.title
        : undefined;
    if (!text) return [];

    const baseId = slugifyHeading(text) || `section-${blockIndex + 1}`;
    const occurrence = (seen.get(baseId) ?? 0) + 1;
    seen.set(baseId, occurrence);

    return [
      {
        id: occurrence === 1 ? baseId : `${baseId}-${occurrence}`,
        text,
        level: block.kind === "heading" ? 2 : 3,
        blockIndex,
      } satisfies BlogHeading,
    ];
  });
}

export function getPostChapters(blocks: Block[]): BlogChapter[] {
  const chapters: BlogChapter[] = [];

  for (const heading of getPostHeadings(blocks)) {
    if (heading.level === 2) {
      chapters.push({
        id: heading.id,
        title: heading.text,
        sections: [],
      });
      continue;
    }

    const currentChapter = chapters.at(-1);
    if (currentChapter) {
      currentChapter.sections.push({
        id: heading.id,
        title: heading.text,
      });
    }
  }

  return chapters;
}
