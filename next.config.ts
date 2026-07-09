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
      {
        protocol: "https",
        hostname: "api-efresh-698528526600.australia-southeast2.run.app",
      },
      {
        protocol: "https",
        hostname: "egency.com.au",
      },
    ],
  },
};

export default nextConfig;
