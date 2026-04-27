-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN "bannerImage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CaseStudy" ADD COLUMN "contentImage" TEXT NOT NULL DEFAULT '';

-- Prefer existing featured image as banner when banner not set (legacy rows)
UPDATE "CaseStudy" SET "bannerImage" = "featuredImage" WHERE "bannerImage" = '';
