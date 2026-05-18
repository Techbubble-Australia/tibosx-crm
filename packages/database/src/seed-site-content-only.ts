/**
 * Upserts only `SiteContent` rows from `seed/site-content.ts` defaults.
 * Use when the DB is missing keys (e.g. contact_page, site_footer) without re-running the full seed.
 *
 * Run: `pnpm --filter @techbubble/database db:seed:site-content`
 * Requires `DATABASE_URL` (see packages/database/.env or your deployment env).
 *
 * Existing rows keep their JSON `payload` (upload URLs, copy). Set `FORCE_SITE_CONTENT=1` to overwrite
 * every `site_content` payload with repo defaults.
 */
import { prisma } from "./client";
import { seedSiteContent } from "./seed/site-content";

async function main() {
  await seedSiteContent();
  console.log("✅ Site content upserted (marketing_home, announcement_bar, services, pricing, about, careers, contact, legal, case_studies_page, site_footer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
