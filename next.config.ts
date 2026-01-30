import type { NextConfig } from "next";

const backendURL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactCompiler: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendURL}/api/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'snow-mantis-616662.hostingersite.com',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**.hostinger.com',
        pathname: '/storage/**',
      },
    ],
    unoptimized: true, // Disable image optimization to avoid Vercel issues with external domains
  },
};

export default nextConfig;
