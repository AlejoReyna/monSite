import { Fragment } from "react";
import { getPostHeadings } from "@/lib/blog/chapters";
import { highlightCode } from "@/lib/blog/highlight";
import type { Block, Inline } from "@/lib/blog/types";
import AssetCard from "./asset-card";
import GenerationShowcase from "./generation-showcase";
import LoopingVideo from "./looping-video";
import PixelScene from "./pixel-scene";
import SanicEasterEggWrapper from "./sanic-easter-egg";
import Terminal from "./terminal";

/**
 * Renders the inline vocabulary. Deliberately non-recursive: a `strong` can't
 * contain a `link`, a `link` can't contain `code`. Nested emphasis is almost
 * always a sign the sentence should be rewritten instead.
 */
function renderInline(content: Inline[]) {
  return content.map((node, i) => {
    if (typeof node === "string") return <Fragment key={i}>{node}</Fragment>;

    switch (node.kind) {
      case "em":
        return <em key={i}>{node.text}</em>;
      case "strong":
        return <strong key={i}>{node.text}</strong>;
      case "code":
        return <code key={i}>{node.text}</code>;
      case "link": {
        const external = /^https?:\/\//.test(node.href);
        return (
          <a
            key={i}
            href={node.href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {node.text}
          </a>
        );
      }
    }
  });
}

async function BlockView({
  block,
  headingId,
}: {
  block: Block;
  headingId?: string;
}) {
  switch (block.kind) {
    case "heading":
      return <h2 id={headingId}>{block.text}</h2>;

    case "subheading":
      return <h3 id={headingId}>{block.text}</h3>;

    case "paragraph":
      return <p>{renderInline(block.content)}</p>;

    case "lede":
      return <p className="blog-lede">{renderInline(block.content)}</p>;

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>{renderInline(item)}</li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }

    case "code": {
      const html = await highlightCode(block.code, block.language);
      const codeNode = (
        <div className="blog-code blog-bleed">
          <div className="blog-code-bar">
            <div className="blog-code-dots" aria-hidden="true">
              <span className="blog-code-dot" />
              <span className="blog-code-dot" />
              <span className="blog-code-dot" />
            </div>
            <span className="blog-code-caption">
              {block.caption ?? block.language}
            </span>
          </div>
          <div
            className="blog-code-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );

      if (block.easterEgg === "sanic") {
        return <SanicEasterEggWrapper>{codeNode}</SanicEasterEggWrapper>;
      }

      return codeNode;
    }

    case "terminal": {
      const termNode = (
        <div className="blog-bleed">
          <Terminal lines={block.lines} label={block.caption ?? "bash"} />
        </div>
      );

      if (block.easterEgg === "sanic") {
        return <SanicEasterEggWrapper>{termNode}</SanicEasterEggWrapper>;
      }

      return termNode;
    }

    case "callout":
      return (
        <aside className="blog-callout" data-tone={block.tone}>
          {block.title && (
            <span className="blog-callout-title">{block.title}</span>
          )}
          <p>{renderInline(block.content)}</p>
        </aside>
      );

    case "table":
      return (
        <div className="blog-table-wrap blog-bleed">
          <table className="blog-table">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "assetGallery":
      return (
        <div className="blog-asset-gallery blog-bleed">
          {block.assets.map((asset) => (
            <AssetCard key={asset.src} asset={asset} />
          ))}
        </div>
      );

    case "sideBySide":
      return (
        <div
          className={`blog-side-by-side blog-bleed${
            block.reverse ? " blog-side-by-side--reverse" : ""
          }`}
        >
          <div className="blog-side-by-side-text">
            <p>{renderInline(block.content)}</p>
          </div>
          <figure className="blog-asset-card blog-side-by-side-asset">
            <figcaption>{block.asset.title}</figcaption>
            <div className="blog-asset-media">
              <img
                src={block.asset.src}
                alt={block.asset.alt}
                width={block.asset.width}
                height={block.asset.height}
                loading="lazy"
              />
            </div>
          </figure>
        </div>
      );

    case "photo":
      return (
        <figure className="blog-photo blog-bleed">
          <div className="blog-photo-media">
            <img
              src={block.src}
              alt={block.alt}
              width={block.width}
              height={block.height}
              loading="lazy"
            />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );

    case "video":
      return (
        <figure className="blog-photo blog-bleed">
          <div className="blog-photo-media">
            <LoopingVideo
              src={block.src}
              poster={block.poster}
              alt={block.alt}
              width={block.width}
              height={block.height}
            />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );

    case "scenePreview":
      return (
        <figure className="blog-scene-preview blog-bleed">
          <figcaption>{block.label}</figcaption>
          <PixelScene />
        </figure>
      );

    case "generationShowcase":
      return (
        <GenerationShowcase
          items={block.items}
          title={block.title}
        />
      );

    case "divider":
      return <hr className="blog-divider" />;
  }
}

/**
 * The prose container owns vertical rhythm (see `.blog-prose > * + *`), so
 * blocks never carry their own outer margins. Full-width blocks step outside
 * the measure via `.blog-bleed` rather than by restyling the container.
 */
export default function Blocks({ blocks }: { blocks: Block[] }) {
  const headingIds = new Map(
    getPostHeadings(blocks).map((heading) => [
      heading.blockIndex,
      heading.id,
    ]),
  );

  return (
    <div className="blog-prose">
      {blocks.map((block, i) => (
        <BlockView block={block} headingId={headingIds.get(i)} key={i} />
      ))}
    </div>
  );
}

export { renderInline };
