-- Backfill if 20261008160000 was applied before emergencyContacts was added to that migration.
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "emergencyContacts" JSONB;
