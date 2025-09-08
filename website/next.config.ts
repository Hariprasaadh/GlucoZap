import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❌ Skip ESLint checks during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ Skip TypeScript errors during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
