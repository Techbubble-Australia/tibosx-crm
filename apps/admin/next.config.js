/** @type {import('next').NextConfig} */
const TBOS_ADMIN_ORIGIN = "https://tibosx.ai.techbubble.net.au";
const TBOS_ADMIN_LEGACY_HOST = "tibosx.ai.techbubble.com.au";

const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@techbubble/ui", "@techbubble/database"],
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
