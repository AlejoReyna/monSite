import { localizeMetadata } from "@/lib/request-language";
import type { Metadata } from "next";
import "@/weddings/andrea/globals.css";
import BackToPortfolio from "@/components/weddings/back-to-portfolio";

const baseMetadata: Metadata = {
  title: "Andrea & Aldo — Nuestra boda",
  description: "Celebra con nosotros nuestra boda el 18 de Octubre",
  icons: {
    icon: "/weddings/andrea/assets/logos/IMG_0340.PNG",
    apple: "/weddings/andrea/assets/logos/IMG_0340.PNG",
  },
};

export default function AndreaWeddingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="wa-scope">
      {children}
      <BackToPortfolio />
    </div>
  );
}

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
