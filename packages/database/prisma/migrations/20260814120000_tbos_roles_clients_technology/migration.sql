-- Migrate legacy roles to TBOS module roles
UPDATE "AdminUser" SET role = 'website' WHERE role = 'editor';
UPDATE "AdminUser" SET role = 'recruiter' WHERE role = 'viewer';

-- Client: website + country
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "website" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT '';

-- Technology: mandatory category relationship
ALTER TABLE "JobTechnology" DROP CONSTRAINT IF EXISTS "JobTechnology_name_key";

ALTER TABLE "JobTechnology" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

UPDATE "JobTechnology" t
SET "categoryId" = c.id
FROM "JobCategory" c
WHERE t."categoryId" IS NULL AND c.name = t.name;

UPDATE "JobTechnology" t
SET "categoryId" = (
  SELECT id FROM "JobCategory" ORDER BY "order" ASC, name ASC LIMIT 1
)
WHERE t."categoryId" IS NULL;

ALTER TABLE "JobTechnology" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "JobTechnology"
  ADD CONSTRAINT "JobTechnology_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "JobTechnology_categoryId_name_key" ON "JobTechnology"("categoryId", "name");
CREATE INDEX IF NOT EXISTS "JobTechnology_categoryId_idx" ON "JobTechnology"("categoryId");

-- Client contacts
CREATE TABLE IF NOT EXISTS "ClientContact" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phoneCountryCode" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientContact_clientId_idx" ON "ClientContact"("clientId");

ALTER TABLE "ClientContact"
  ADD CONSTRAINT "ClientContact_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
