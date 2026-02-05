import type { NextConfig } from "next";

// Use static production URL for rewrites - don't rely on env vars at config time
const backendURL = "https://snow-mantis-616662.hostingersite.com/backend/public";

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
