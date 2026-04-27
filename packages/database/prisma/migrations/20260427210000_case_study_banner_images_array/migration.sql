-- AlterTable: multiple banner images (detail page gallery)
ALTER TABLE "CaseStudy" ADD COLUMN "bannerImages" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "CaseStudy"
SET "bannerImages" = ARRAY["bannerImage"]
WHERE "bannerImage" IS NOT NULL AND TRIM("bannerImage") <> '';

ALTER TABLE "CaseStudy" DROP COLUMN "bannerImage";
