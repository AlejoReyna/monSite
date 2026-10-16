import type { Metadata, Viewport } from "next";
import GameBoySite from "@/components/v2/gameboy-site";
import { GAMEBOY_SITE_URL } from "@/lib/gameboy/site";
import { getRequestLanguage } from "@/lib/request-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const title = "Game Boy · Alexis Reyna";
  const description = language === "es"
    ? "Juega en una consola Game Boy, Color y Advance desde tu navegador."
    : "Play Game Boy, Color and Advance games in your browser.";
  return {
    title: { absolute: title },
    description,
    metadataBase: new URL(GAMEBOY_SITE_URL),
    alternates: { canonical: GAMEBOY_SITE_URL },
    openGraph: {
      type: "website", title, description, url: GAMEBOY_SITE_URL,
      siteName: "Game Boy · Alexis Reyna", locale: language === "es" ? "es_MX" : "en_US",
      images: [],
    },
    other: { "apple-mobile-web-app-title": "Game Boy" },
  };
}

// Android and older Safari use this metadata; the player updates it on mobile.
// Safari 26 uses the player's fixed edge elements instead (see the diagnostic).
export const viewport: Viewport = { themeColor: "#d5d3c6" };

export default function GameBoyPage() {
  return <GameBoySite />;
}
