/** @type {import('next').NextConfig} */
const path = require("path");
const { loadEnvConfig } = require("@next/env");

// Monorepo root `.env` + `apps/admin/.env.local` (admin wins on conflicts).
loadEnvConfig(path.join(__dirname, "..", ".."));
loadEnvConfig(__dirname);

const TBOS_ADMIN_ORIGIN = "https://tibosx.ai.techbubble.net.au";
const TBOS_ADMIN_LEGACY_HOST = "tibosx.ai.techbubble.com.au";

const appEnv =
  process.env.ENV || process.env.TBOS_ENV || process.env.NEXT_PUBLIC_TBOS_ENV || "production";

const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@techbubble/ui", "@techbubble/database"],
  env: {
    NEXT_PUBLIC_TBOS_ENV: appEnv,
  },
  // /api/* and /uploads/* proxied at request time (see app/api and app/uploads routes; runtime API_URL).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: TBOS_ADMIN_LEGACY_HOST }],
        destination: `${TBOS_ADMIN_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
