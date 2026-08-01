"use client";

import Image from "next/image";
import { useState } from "react";
import type { AssetGalleryItem } from "@/lib/blog/types";

interface AssetCardProps {
  asset: AssetGalleryItem;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const [viewMode, setViewMode] = useState<"asset" | "code">("asset");
  const [copied, setCopied] = useState(false);

  const hasCode = Boolean(asset.code);

  const handleCopy = async () => {
    if (!asset.code) return;
    try {
      await navigator.clipboard.writeText(asset.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  return (
    <figure className="blog-asset-card" data-mode={viewMode}>
      <figcaption className="blog-asset-card-header">
        <div className="blog-asset-card-info">
          <span className="blog-asset-card-title">{asset.title}</span>
          {asset.format && (
            <span className="blog-asset-card-format">{asset.format}</span>
          )}
        </div>

        {hasCode && (
          <div className="blog-asset-switcher" role="tablist" aria-label="Vista de asset o código">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "asset"}
              className={`blog-asset-tab ${viewMode === "asset" ? "is-active" : ""}`}
              onClick={() => setViewMode("asset")}
              title="Ver imagen / asset"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Asset</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "code"}
              className={`blog-asset-tab ${viewMode === "code" ? "is-active" : ""}`}
              onClick={() => setViewMode("code")}
              title="Ver código del editor"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Código</span>
            </button>
          </div>
        )}
      </figcaption>

      <div className="blog-asset-card-viewport">
        {viewMode === "asset" ? (
          <div className="blog-asset-media">
            <Image
              src={asset.src}
              alt={asset.alt}
              width={asset.width}
              height={asset.height}
              loading="lazy"
              unoptimized
            />
          </div>
        ) : (
          <div className="blog-asset-code-view">
            <div className="blog-asset-code-bar">
              <span className="blog-asset-code-lang">
                {asset.codeLanguage ?? "code"}
              </span>
              <button
                type="button"
                className="blog-asset-code-copy"
                onClick={handleCopy}
                data-copied={copied}
              >
                {copied ? "copiado" : "copiar"}
              </button>
            </div>
            {asset.usage && (
              <p className="blog-asset-code-usage">{asset.usage}</p>
            )}
            <pre className="blog-asset-code-content">
              <code>{asset.code}</code>
            </pre>
          </div>
        )}
      </div>
    </figure>
  );
}
