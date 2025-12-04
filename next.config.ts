import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to enable Turbopack (Next.js 16 default)
  turbopack: {},
  
  // Add caching headers for static assets
  async headers() {
    return [
      {
        // Cache images for 1 year (immutable static assets)
        source: "/:path*.(png|jpg|jpeg|gif|webp|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Specifically for hero.png used in embeds
        source: "/hero.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
