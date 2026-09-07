import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokefolio Remastered — Alexis | Interactive Pokémon Portfolio",
  description:
    "Interactive Pokémon-style portfolio town: explore Inverater, Monetta and ArtisanalBrew. Full-stack developer in Monterrey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
