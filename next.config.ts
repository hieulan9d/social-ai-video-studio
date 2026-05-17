import type { NextConfig } from "next";
import dns from "node:dns";

// Force IPv4 to fix DNS resolution issues on Windows
dns.setDefaultResultOrder("ipv4first");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
