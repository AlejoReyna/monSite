"use client";

import { useCopy } from "@/components/use-copy";
import Image from "next/image";
import type { AssetGalleryItem } from "@/lib/blog/types";

export default function SonicShoesGallery({
  assets,
}: {
  assets: AssetGalleryItem[];
}) {
  const copyText = useCopy();
  return (
    <div className="blog-sonic-shoes-visual">
      <div className="blog-sonic-shoes-stage" aria-label={copyText("Tenis sónicos")}>
        {assets.map((asset, index) => (
          <Image
            key={asset.src}
            className={`blog-sonic-shoes-sprite${
              index === 0 ? " blog-sonic-shoes-sprite--first" : ""
            }`}
            src={asset.src}
            alt={copyText(asset.alt)}
            width={asset.width}
            height={asset.height}
            loading={index === 0 ? "eager" : "lazy"}
            unoptimized
          />
        ))}
        <span className="blog-sonic-shoes-timer" aria-hidden="true">
          SWAP // 2.5s
        </span>
      </div>
    </div>
  );
}
