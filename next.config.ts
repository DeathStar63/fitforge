import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v2.exercisedb.io",
      },
      {
        protocol: "https",
        hostname: "static.exercisedb.dev",
      },
    ],
  },
};

export default nextConfig;
