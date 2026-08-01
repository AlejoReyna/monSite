import type { Block, Inline } from "./types";

const WORDS_PER_MINUTE = 225;

function inlineText(content: Inline[]): string {
  return content
    .map((node) => (typeof node === "string" ? node : node.text))
    .join(" ");
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "heading":
    case "subheading":
      return block.text;
    case "paragraph":
    case "lede":
    case "neuralNetworkOverview":
      return inlineText(block.content);
    case "list":
      return block.items.map(inlineText).join(" ");
    case "callout":
      return [block.title ?? "", inlineText(block.content)].join(" ");
    case "sideBySide":
      return inlineText(block.content);
    case "textAndCode":
      return block.paragraphs.map(inlineText).join(" ");
    case "esTrainingDiagram":
      return block.content ? inlineText(block.content) : "";
    case "generationShowcase":
      return [
        block.title ?? "",
        ...block.items.flatMap((item) => [
          item.checkpoint,
          item.reward,
          item.description,
        ]),
      ].join(" ");
    default:
      // Code, terminal output, tables and media labels are scanned rather than
      // read as continuous prose, so they do not inflate the estimate.
      return "";
  }
}

export function countReadableWords(blocks: Block[]): number {
  const text = blocks.map(blockText).join(" ").trim();
  return text ? text.split(/\s+/u).filter(Boolean).length : 0;
}

export function getReadingMinutes(blocks: Block[]): number {
  return Math.max(1, Math.ceil(countReadableWords(blocks) / WORDS_PER_MINUTE));
}
