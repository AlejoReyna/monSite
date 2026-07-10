import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Cormorant_Garamond, Space_Mono } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/app-chrome";

import { LanguageProvider, LanguageFade } from "@/components/lang-context";
import { NavigationProvider } from "@/contexts/navigation-context";

// Function to generate iOS meta tags for status bar styling
function generateiOSMetaTags() {
  return {
    // iOS status bar appearance
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Alexis\' desktop',
    // Theme color for mobile browsers (GIC light surfaces)
    'theme-color': '#f9faf7',
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

export const metadata: Metadata = {
  title: "Alexis' desktop",
  description: "Fullstack Developer | Building modern, fast, and accessible web experiences.",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alexis' desktop" />
        {/* theme-color se declara una sola vez (metadata.other); en el home
            la secuencia de paneles lo actualiza dinámicamente por panel */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* iOS splash screen color */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Favicon */}
        <link rel="icon" href="/tags.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${cormorant.variable} ${spaceMono.variable} antialiased`}
        style={{ backgroundColor: "var(--gic-off-white)", color: "var(--gic-dark-charcoal)" }}
      >
        <LanguageProvider>
          <NavigationProvider>
            <LanguageFade>
              <a id="top" />
              <AppChrome>{children}</AppChrome>
              {/* <Footer /> */}
            </LanguageFade>
          </NavigationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
