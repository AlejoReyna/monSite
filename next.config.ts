import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
