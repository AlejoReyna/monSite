import { localizeMetadata } from "@/lib/request-language";
import type { Metadata } from "next";
import "./pokefolio-globals.css";
import { MusicProvider } from "@/components/legacy/pokefolio/MusicContext";

const baseMetadata: Metadata = {
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

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
