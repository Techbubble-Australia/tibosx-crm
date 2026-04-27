/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@techbubble/ui", "@techbubble/database"],
  // /api/* proxied at request time by app/api/[...path]/route.ts (runtime API_URL).
};

module.exports = nextConfig;
