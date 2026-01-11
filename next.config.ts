import type { NextConfig } from "next";

const backendURL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactCompiler: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendURL}/api/:path*` },
    ];
  },
};

export default nextConfig;
