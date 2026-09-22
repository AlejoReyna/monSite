import { localizeMetadata } from "@/lib/request-language";
import { Bebas_Neue, Cormorant_Garamond, Space_Mono } from "next/font/google";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const baseMetadata = {
  title: "V3 Preview — Alexis Reyna",
  description: "Preview aislado de secciones v3: carousel de proyectos y contacto editorial.",
  robots: { index: false },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${bebas.variable} ${cormorant.variable} ${spaceMono.variable}`}
      style={{ background: "#08080a", minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
