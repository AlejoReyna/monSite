"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./desktop-picker.module.css";

const CAPTION: Record<Language, string> = {
  en: "A more handsome representation of me",
  es: "Una representación más guapa de mí",
};

/* The artwork is shown from lg up; below that the mobile stage draws its own. */
const ART_MEDIA = "(min-width: 1024px)";
const ANIMATION = "/coffee-desktop.webp";

export default function MacCoffeeDrawing() {
  const { language } = useLanguage();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // The still first frame (a CSS background, preloaded with the page) paints with the wallpaper.
    // The animation starts on that same frame, so it replaces the still only once fully downloaded
    // and never shows up half-decoded. Phones never fetch it, and a window widened later still does.
    const media = window.matchMedia(ART_MEDIA);
    const image = new window.Image();
    let requested = false;
    image.onload = () => setAnimated(true);
    const load = () => {
      if (requested || !media.matches) return;
      requested = true;
      image.src = ANIMATION;
    };
    load();
    media.addEventListener("change", load);
    return () => {
      media.removeEventListener("change", load);
      image.onload = null;
    };
  }, []);

  return (
    <>
      {/* Preloaded only where the art is shown; below lg its container is display:none, so it is never fetched. */}
      <link rel="preload" as="image" href="/coffee-desktop-still.webp" media={ART_MEDIA} />
      {/* Clips the artwork's 1.4x scale; hovering it is what reveals the caption below. */}
      <div className={styles.macGifArt}>
        <div className={styles.macGifImage} data-animated={animated} />
      </div>
      {/* Easter egg, positioned to the right of the artwork. Not clipped by macGifArt's overflow. */}
      <p className={styles.macCoffeeCaption}>{CAPTION[language]}</p>
    </>
  );
}
