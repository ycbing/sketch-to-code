import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // 将默认的 1MB 增加到更大，例如 5MB 或 10MB
      bodySizeLimit: '5mb', 
    },
  },
};

export default nextConfig;
