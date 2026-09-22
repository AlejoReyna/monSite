"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./desktop-picker.module.css";

const CAPTION: Record<Language, string> = {
  en: "A more handsome representation of me",
  es: "Una representación más guapa de mí",
};

export default function MacCoffeeDrawing() {
  const { language } = useLanguage();
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
      {/* Clips the artwork's 1.4x scale; hovering it is what reveals the caption below. */}
      <div className={styles.macGifArt}>
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
          <image href="/coffee-desktop.webp" width="1268" height="2000" />
        </svg>
      </div>
      {/* Easter egg, positioned to the right of the artwork. Not clipped by macGifArt's overflow. */}
      <p className={styles.macCoffeeCaption}>{CAPTION[language]}</p>
    </>
  );
}
