"use client";

import { useEffect } from "react";
import { BADGE_KEY, loadBadges } from "@/data/game";

export default function BadgeClaim({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    const cur = loadBadges();
    if (!cur.includes(slug)) {
      try {
        localStorage.setItem(BADGE_KEY, JSON.stringify([...cur, slug]));
      } catch {
        // sin almacenamiento
      }
    }
  }, [slug]);

  return (
    <p
      role="status"
      style={{
        marginTop: 12,
        border: "3px solid currentColor",
        padding: "8px 10px",
        fontSize: 13,
      }}
    >
      ◆ ¡MEDALLA {title} CONSEGUIDA! Vuelve al pueblo: ya tienes tu insignia
      guardada.
    </p>
  );
}
