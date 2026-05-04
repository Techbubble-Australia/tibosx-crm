const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@techbubble/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
    ],
  },
  // /api/* and /uploads/* are proxied at request time (see app/api and app/uploads routes)
  // so production works when API_URL is only set at container runtime, not at `next build`.
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      include: [
        path.resolve(__dirname, "src/icons"),
        path.resolve(__dirname, "src/image"),
      ],
      type: "asset/resource",
      generator: {
        filename: "static/icons/[name].[hash][ext]",
      },
    });
    return config;
  },
};

module.exports = nextConfig;
