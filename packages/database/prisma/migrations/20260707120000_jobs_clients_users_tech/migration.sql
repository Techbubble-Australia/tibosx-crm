-- CreateTable
CREATE TABLE "JobTechnology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLike" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobTechnology_name_key" ON "JobTechnology"("name");
CREATE INDEX "JobTechnology_order_idx" ON "JobTechnology"("order");
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");
CREATE INDEX "Client_order_idx" ON "Client"("order");
CREATE INDEX "Client_active_idx" ON "Client"("active");
CREATE INDEX "JobLike_jobId_idx" ON "JobLike"("jobId");
CREATE UNIQUE INDEX "JobLike_jobId_visitorKey_key" ON "JobLike"("jobId", "visitorKey");

-- Seed default client for existing jobs
INSERT INTO "Client" ("id", "name", "order", "active", "createdAt", "updatedAt")
VALUES ('default-client-internal', 'Internal', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Add new columns to JobListing (nullable first for backfill)
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "technology" TEXT;
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill technology from category or default
UPDATE "JobListing"
SET "technology" = CASE
    WHEN "category" ILIKE '%servicenow%' THEN 'ServiceNow'
    WHEN "category" ILIKE '%salesforce%' THEN 'Salesforce'
    WHEN "category" ILIKE '%microsoft%' THEN 'Microsoft'
    WHEN "category" != '' THEN "category"
    ELSE 'ServiceNow'
END
WHERE "technology" IS NULL OR "technology" = '';

UPDATE "JobListing"
SET "clientId" = 'default-client-internal'
WHERE "clientId" IS NULL;

UPDATE "JobListing"
SET "category" = 'Engineering'
WHERE "category" IS NULL OR "category" = '';

UPDATE "JobListing"
SET "department" = 'Engineering'
WHERE "department" IS NULL OR "department" = '';

-- Make columns required
ALTER TABLE "JobListing" ALTER COLUMN "technology" SET NOT NULL;
ALTER TABLE "JobListing" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "JobListing" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "JobListing" ALTER COLUMN "department" SET NOT NULL;

-- Add FK
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JobLike" ADD CONSTRAINT "JobLike_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "JobListing_technology_idx" ON "JobListing"("technology");
CREATE INDEX IF NOT EXISTS "JobListing_clientId_idx" ON "JobListing"("clientId");

-- AdminUser extensions
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Seed default taxonomies
INSERT INTO "JobCategory" ("id", "name", "order", "createdAt", "updatedAt")
VALUES
    ('seed-cat-servicenow', 'ServiceNow', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-cat-salesforce', 'Salesforce', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-cat-microsoft', 'Microsoft', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-cat-engineering', 'Engineering', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "JobTechnology" ("id", "name", "order", "createdAt", "updatedAt")
VALUES
    ('seed-tech-servicenow', 'ServiceNow', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-tech-salesforce', 'Salesforce', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-tech-microsoft', 'Microsoft', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-tech-azure', 'Azure', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('seed-tech-aiml', 'AI/ML', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- MuleSoft -> Microsoft in SiteContent marketing_home payload
UPDATE "SiteContent"
SET "payload" = replace(
    replace(
        replace("payload"::text, '"mulesoft"', '"microsoft"'),
        '"MuleSoft"', '"Microsoft"'
    ),
    'MuleSoft', 'Microsoft'
)::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'marketing_home'
  AND "payload"::text ILIKE '%mulesoft%';

UPDATE "CaseStudyCategory"
SET "name" = 'Microsoft', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'MuleSoft';
