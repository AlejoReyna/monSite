/**
 * The block vocabulary.
 *
 * Posts are arrays of typed blocks, not freeform markup. The constraint is the
 * point: a fixed vocabulary means every post inherits the same rhythm, and no
 * post can invent a one-off heading size that quietly breaks the scale.
 *
 * Adding a block type is a deliberate act — see /blog/guidelines for the rule
 * each one has to earn.
 */

/** Inline emphasis inside prose. Deliberately minimal — no nesting, no colors. */
export type Inline =
  | string
  | { kind: "em"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string };

export type AssetGalleryItem = {
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  format?: string;
  usage?: string;
  code?: string;
  codeLanguage?: string;
};

export type Block =
  /** Section boundary. One per section; never two in a row. */
  | { kind: "heading"; text: string }
  /** Sub-boundary inside a section. Only legal after a heading. */
  | { kind: "subheading"; text: string }
  /** The default. Everything that isn't one of the others is this. */
  | { kind: "paragraph"; content: Inline[] }
  /** The single most important sentence in a section. Max one per section. */
  | { kind: "lede"; content: Inline[] }
  /** Sequential steps. Use `ordered` only when order is load-bearing. */
  | { kind: "list"; ordered?: boolean; items: Inline[][] }
  /** Code. `caption` labels what the reader is looking at. */
  | { kind: "code"; language: string; code: string; caption?: string; easterEgg?: "sanic" | string }
  /** A shell command the reader is meant to run. Renders as a terminal. */
  | { kind: "terminal"; lines: TerminalLine[]; caption?: string; easterEgg?: "sanic" | string }
  /** Quoted rule or principle. Not for attribution — for emphasis of a law. */
  | { kind: "callout"; tone: "note" | "warn"; title?: string; content: Inline[] }
  /** Comparison data. Keep to 3 columns; wider tables don't survive mobile. */
  | { kind: "table"; head: string[]; rows: string[][] }
  /** Real project assets. Title first, visual second; one column on mobile. */
  | {
      kind: "assetGallery";
      assets: AssetGalleryItem[];
    }
  /** A full-color photo or screenshot — no pixelation, unlike assetGallery. */
  | {
      kind: "photo";
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    }
  /**
   * A silent looping clip — showing something that moved, not a media player.
   * Always muted and autoplaying, so no controls and no audio track: the
   * moment it needs a play button it wants to be a `photo` plus a link.
   */
  | {
      kind: "video";
      src: string;
      /** Still frame shown until the first video frame decodes. */
      poster: string;
      /** Describes the clip — it carries no captions and no sound. */
      alt: string;
      width: number;
      height: number;
      caption?: string;
    }
  /** Live miniature of the pixel-space background using the real assets. */
  | { kind: "scenePreview"; label: string }
  /** Interactive visual showcase of training generation checkpoints & behaviors. */
  | {
      kind: "generationShowcase";
      title?: string;
      items: {
        checkpoint: string;
        tag?: string;
        reward: string;
        description: string;
        behaviorType: "untrained" | "early" | "trained";
      }[];
    }
  /** Side-by-side layout: 60% text content and 40% asset card. */
  | {
      kind: "sideBySide";
      content: Inline[];
      asset: {
        title: string;
        src: string;
        alt: string;
        width: number;
        height: number;
      };
      reverse?: boolean;
    }
  /** Breathing room between movements of an argument. Never decorative. */
  | { kind: "divider" };

export type TerminalLine =
  /** A command the reader runs. Gets a `$` and is included in "copy all". */
  | { kind: "cmd"; text: string }
  /** Output. Dimmed, not copyable — it's what they should see, not type. */
  | { kind: "out"; text: string }
  /** A `#` comment line explaining the next command. */
  | { kind: "comment"; text: string };

export interface PostMeta {
  slug: string;
  title: string;
  /** One sentence. Shown on the index and as the meta description. */
  summary: string;
  /** ISO date. */
  date: string;
  /** Minutes. Computed at authoring time — honest, not word-count theater. */
  readingMinutes: number;
  /** Max 3. More than that and the taxonomy stops meaning anything. */
  tags: string[];
}

export interface PostTitleAsset {
  src: string;
  alt: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
}

export interface Post extends PostMeta {
  /** Optional animated visual displayed alongside the article title. */
  titleAsset?: PostTitleAsset;
  blocks: Block[];
}

/** A downloadable Claude Code skill. */
export interface Skill {
  /** Directory name — also the install path under .claude/skills/. */
  id: string;
  name: string;
  /** One line, imperative. What it does for you. */
  tagline: string;
  /** 2-3 sentences. The problem it solves and why it's not obvious. */
  description: string;
  /** What a reader learns even if they never install it. */
  takeaway: string;
  /** Bytes — read from the real file, not estimated. */
  bytes: number;
  lines: number;
  /** Where it came from, for honesty about provenance. */
  origin: string;
  tags: string[];
}
