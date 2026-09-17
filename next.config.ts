import type { NextConfig } from "next";

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
  async headers() {
    const cacheForAWeek = [
      {
        key: "Cache-Control",
        value:
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
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
