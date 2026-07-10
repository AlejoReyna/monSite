import type { Metadata } from "next";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./pokefolio-globals.css";
import { MusicProvider } from "@/components/legacy/pokefolio/MusicContext";

export const metadata: Metadata = {
  title: "Alejo's Portfolio (legacy)",
};

export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MusicProvider>
      <div className="pokefolio-root">{children}</div>
    </MusicProvider>
  );
}
