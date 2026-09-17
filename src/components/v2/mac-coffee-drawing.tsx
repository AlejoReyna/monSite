"use client";

import { useEffect, useId, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./desktop-picker.module.css";

const CAPTION: Record<Language, string> = {
  en: "A more handsome representation of me",
  es: "Una representación más guapa de mí",
  zh: "比本人更帅的我",
};

export default function MacCoffeeDrawing() {
  const { language } = useLanguage();
  const id = useId();
  const artworkId = `${id}-artwork`;
  const silhouetteId = `${id}-silhouette`;
  const revealId = `${id}-reveal`;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // SVG <image> load events can be missed during hydration or inside <defs>.
    // Register on a regular image before setting src, including cached loads.
    const image = new window.Image();
    image.onload = () => setLoaded(true);
    image.src = "/coffee-desktop.webp";
    return () => { image.onload = null; };
  }, []);

  return (
    <>
      <svg
        className={styles.macGifImage}
        viewBox="0 0 1268 2000"
        preserveAspectRatio="xMidYMin meet"
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
        data-loaded={loaded}
      >
        <defs>
          <image
            id={artworkId}
            href="/coffee-desktop.webp"
            width="1268"
            height="2000"
          />
          {/* Preserve the artwork's transparency while turning every opaque pixel white. */}
          <filter id={silhouetteId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
          </filter>
          <clipPath id={revealId} clipPathUnits="userSpaceOnUse">
            <rect className={styles.macCoffeeReveal} width="1268" height="2000" />
          </clipPath>
        </defs>
        <use
          className={styles.macCoffeeSilhouette}
          href={`#${artworkId}`}
          filter={`url(#${silhouetteId})`}
        />
        <use href={`#${artworkId}`} clipPath={`url(#${revealId})`} />
      </svg>
      {/* Easter egg. Lives outside the SVG so the artwork's 1.4x scale can't push it offscreen. */}
      <p className={styles.macCoffeeCaption}>{CAPTION[language]}</p>
    </>
  );
}
