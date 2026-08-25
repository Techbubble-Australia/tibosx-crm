-- CreateTable
CREATE TABLE "JobLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobLevel_name_key" ON "JobLevel"("name");

-- CreateIndex
CREATE INDEX "JobLevel_order_idx" ON "JobLevel"("order");

-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN "budget" TEXT NOT NULL DEFAULT '';

-- Backfill published dates for existing jobs
UPDATE "JobListing" SET "publishedDate" = "createdAt" WHERE "publishedDate" IS NULL;

-- Seed default levels
INSERT INTO "JobLevel" ("id", "name", "order", "createdAt", "updatedAt") VALUES
  ('level-manager', 'Manager', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('level-architect', 'Architect', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('level-developer', 'Developer', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('level-tester', 'Tester', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
