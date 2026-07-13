import type { Metadata } from "next";
import "@/weddings/cindy/globals.css";
import BackToPortfolio from "@/components/weddings/back-to-portfolio";

export const metadata: Metadata = {
  title: "Cindy & Jorge — Nuestra boda",
  description: "Celebra con nosotros nuestra boda el 22 de agosto de 2026",
  icons: {
    icon: "/weddings/cindy/assets/logos/IMG_0340.PNG",
    apple: "/weddings/cindy/assets/logos/IMG_0340.PNG",
  },
};

export default function CindyWeddingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="wc-scope">
      {children}
      <BackToPortfolio />
    </div>
  );
}
