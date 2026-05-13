import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agora/ui", "@agora/db", "@agora/config"],
};

export default nextConfig;
