import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/demo',
  assetPrefix: '/demo',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
