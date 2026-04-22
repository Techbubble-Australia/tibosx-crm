const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@techbubble/ui"],
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
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
