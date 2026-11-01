import type { NextConfig } from "next";
import { DOOM_ROM_SHA256 } from "./src/lib/gameboy/library";
import { GAMEBOY_HOST } from "./src/lib/gameboy/site";

const nextConfig: NextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
  },
  webpack(config, { dev }) {
    if (dev) {
      // Trade compilation speed for lower peak memory on the 8 GB local Mac.
      config.parallelism = 2;
      if (config.cache && typeof config.cache === "object" && config.cache.type === "filesystem") {
        config.cache.maxMemoryGenerations = 0;
      }
    }
    return config;
  },
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [{
        source: "/",
        has: [{ type: "host", value: GAMEBOY_HOST.replaceAll(".", "\\.") }],
        destination: "/gba",
      }, {
        // RetroArch derives save filenames from the ROM URL. Match the local
        // content identity without shipping another copy of the ROM.
        source: `/games/rom-${DOOM_ROM_SHA256}.gba`,
        destination: "/games/doom.gba",
      }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    const cacheForAWeek = [
      {
        key: "Cache-Control",
        value:
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    ];
    // What Next.js sends for /_next/static: browsers reuse it without asking.
    const cacheForever = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      {
        source: "/blog/artisanal-brew-assets/:path*",
        headers: cacheForAWeek,
      },
      {
        source: "/blog/red-neuronal-javascript-og.png",
        headers: cacheForAWeek,
      },
      {
        source: "/claude_conv.png",
        headers: cacheForAWeek,
      },
      {
        source: "/article_bg.mp4",
        headers: cacheForAWeek,
      },
      {
        source: "/article_bg-mobile.mp4",
        headers: cacheForAWeek,
      },
      {
        source: "/article_bg-poster.jpg",
        headers: cacheForAWeek,
      },
      // Home desktop: wallpaper, character art and icons are on screen at first paint.
      {
        source: "/macos-wallpaper-purple.webp",
        headers: cacheForAWeek,
      },
      {
        source: "/coffee-desktop.webp",
        headers: cacheForAWeek,
      },
      {
        source: "/coffee-desktop-still.webp",
        headers: cacheForAWeek,
      },
      {
        source: "/desktop-icons/:path*",
        headers: cacheForAWeek,
      },
      // Game Boy engine and ROMs never change under the same URL: EmulatorJS is
      // pinned per version folder (see its manifest.json) and the ROMs by SHA-256
      // in library.ts. Ship changes under a new path. /gameboy/* keeps revalidating.
      {
        source: "/emulatorjs/:version/data/:path*",
        headers: cacheForever,
      },
      {
        source: "/games/:path*",
        headers: cacheForever,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blog/hero-pixel-artisanal-brew",
        destination: "/blog/red-neuronal-javascript-robots-pixel-art",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Iconos remotos usados por la invitación de Cindy (DressCodeSection)
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
    ],
  },
};

export default nextConfig;
