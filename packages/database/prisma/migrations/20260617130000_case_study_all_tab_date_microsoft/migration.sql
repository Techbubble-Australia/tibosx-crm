-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN "showInAllTab" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CaseStudy" ADD COLUMN "publishedDate" TIMESTAMP(3);

-- Rename category
UPDATE "CaseStudy" SET "category" = 'Microsoft' WHERE "category" = 'MuleSoft';
