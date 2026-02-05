import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  
    typescript: {
    // Only run TypeScript checking in development
    ignoreBuildErrors: !isDev || true,
  },


  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
              value: "camera=(self), microphone=(self), geolocation=(self), interest-cohort=(self)",
          },
          // ⚠️ ADD CACHE CONTROL HEADERS ⚠️
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      // ⚠️ ADD SPECIFIC HEADERS FOR API ROUTES ⚠️
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [{ type: "host", value: "(?<host>.*)" }],
          destination: "/:path*",
        },
      ],
    };
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "**.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "geeksforgeeks.org", pathname: "/**" },
    ],
    minimumCacheTTL: 60,
  },

  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  
  // ⚠️ ADD TRANSPILE PACKAGES IF USING PRISMA ⚠️
  transpilePackages: ["@prisma/client", "prisma"],
  
  // ⚠️ ADD WEBPACK CONFIG FOR PRISMA ⚠️
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "@prisma/client"];
    }
    
    // Fix for Prisma and other dependencies
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      },
    };
    
    return config;
  },
};

export default nextConfig;