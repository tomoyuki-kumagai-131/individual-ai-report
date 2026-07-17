import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure server-only packages are handled correctly on the server.
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
