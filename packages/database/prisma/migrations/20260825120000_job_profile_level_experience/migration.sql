ALTER TABLE "JobListing" ADD COLUMN "publishedDate" TIMESTAMP(3);
ALTER TABLE "JobListing" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'Developer';

ALTER TABLE "CandidateProfile" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'Developer';
ALTER TABLE "CandidateProfile" ADD COLUMN "relevantExperience" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CareerApplication" ADD COLUMN "relevantExperience" INTEGER;

UPDATE "JobListing" SET "publishedDate" = "createdAt" WHERE "publishedDate" IS NULL;
