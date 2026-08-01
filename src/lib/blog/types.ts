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
      variant?: "sonic-shoes";
    }
  /** A separated preview of the background, crew, and readable hero content. */
  | { kind: "heroLayerStack" }
  /** The robot policy explained as prose beside its 13 → 16 → 2 topology. */
  | { kind: "neuralNetworkOverview"; content: Inline[] }
  /**
   * The two Evolution Strategies figures: one generation as a cycle, and the
   * rank transform that turns raw returns into evenly spaced weights.
   */
  | {
      kind: "esTrainingDiagram";
      variant: "generation-loop" | "rank-normalise";
      caption?: string;
      /** When present, the figure and this text share a two-column row. */
      content?: Inline[];
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
  /** Animated before/after proof of the fixed route being replaced by simulation. */
  | { kind: "choreographyComparison" }
  /** Graphical evidence for the simulator's coordinate and object lifecycles. */
  | {
      kind: "simulationEvidence";
      variant: "normalized-world" | "coin-lifecycle" | "mug-lifecycle";
    }
  /**
   * The two deploy figures: the trained policy's path from the offline
   * trainer into the Docker image and the browser, and the health gate that
   * decides whether `latest` moves or the previous image comes back.
   */
  | {
      kind: "deployPipeline";
      variant: "pipeline" | "release-gate";
      caption?: string;
    }
  /** Interactive visual showcase of training generation checkpoints & behaviors. */
  | {
      kind: "generationShowcase";
      /** Rendered as the section's h3, on the same row as the view controls. */
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
        imageStyle?: "pixelated" | "smooth";
      };
      reverse?: boolean;
    }
  /** A two-column row pairing prose with a code sample. */
  | {
      kind: "textAndCode";
      paragraphs: Inline[][];
      code: {
        language: string;
        source: string;
        caption?: string;
      };
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
  /** Search-result title when the visible editorial title is intentionally longer. */
  seoTitle?: string;
  /** One sentence. Shown on the index and as the meta description. */
  summary: string;
  /** ISO date. */
  date: string;
  /** ISO date of the latest substantial revision. */
  updated?: string;
  /** BCP 47 locale used for visible article metadata. */
  locale?: string;
  /** Natural-language search phrases used by metadata and structured data. */
  keywords?: string[];
  /** Route-specific 1200×630 social preview. */
  ogImage?: string;
  /** Minutes. Derived from readable blocks when the registry is built. */
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

export interface Post extends Omit<PostMeta, "readingMinutes"> {
  /** Manual override for reading time in minutes, if specified. */
  readingMinutes?: number;
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
