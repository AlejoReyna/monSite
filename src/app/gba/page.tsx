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

// No theme-color: iOS Safari keeps the first one it reads for the status bar
// and ignores later changes, so a fixed color pins the classic case. Without
// it Safari samples the page edges, which follow the selected case.
export const viewport: Viewport = { themeColor: null };

export default function GameBoyPage() {
  return <GameBoySite />;
}
