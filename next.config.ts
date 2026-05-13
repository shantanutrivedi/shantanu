import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling these Node-native packages; require at runtime instead
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
};

export default nextConfig;
