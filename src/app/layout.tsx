import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Cormorant_Garamond, Space_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/app-chrome";

import { LanguageProvider } from "@/components/lang-context";
import { NavigationProvider } from "@/contexts/navigation-context";

// Function to generate iOS meta tags for status bar styling
function generateiOSMetaTags() {
  return {
    // iOS status bar appearance
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Alexis\' desktop',
    // Additional iOS meta tags
    'format-detection': 'telephone=no',
    'viewport': 'width=device-width, initial-scale=1, viewport-fit=cover',
  };
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ── V3 editorial fonts — available app-wide ── */
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

/* ── Pixel font — Get in touch panel ── */
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

const SITE_URL = "https://www.alexisreyna.dev";
const OG_IMAGE = "/og-image.png";

export const metadata: Metadata = {
  title: "Alexis Reyna — Fullstack Developer",
  description:
    "Fullstack Developer building modern, fast, and accessible web experiences with React, Next.js, TypeScript, Node.js and AI.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Alexis Reyna",
    title: "Alexis Reyna — Fullstack Developer",
    description:
      "Fullstack Developer building modern, fast, and accessible web experiences with React, Next.js, TypeScript, Node.js and AI.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Alexis Reyna — Fullstack Developer portfolio preview",
      },
    ],
  },
  other: generateiOSMetaTags(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional iOS specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alexis' desktop" />
        {/* One stable tag prevents competing theme-color declarations. */}
        <meta id="site-theme-color" name="theme-color" content="#f9faf7" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Favicon */}
        <link rel="icon" href="/tags.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${cormorant.variable} ${spaceMono.variable} ${pressStart.variable} antialiased`}
        style={{
          backgroundColor: "var(--gic-off-white)",
          color: "var(--gic-dark-charcoal)",
          fontFamily: `var(--font-geist-sans), "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`,
        }}
      >
        <LanguageProvider>
          <NavigationProvider>
            <a id="top" />
            <AppChrome>{children}</AppChrome>
          </NavigationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
