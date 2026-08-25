ALTER TABLE "JobListing" ADD COLUMN "positionsCount" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "CareerApplication" ADD COLUMN "profileId" TEXT;

CREATE INDEX "CareerApplication_profileId_idx" ON "CareerApplication"("profileId");

ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "CareerApplication" AS ca
SET "profileId" = cp.id
FROM "CandidateProfile" AS cp
WHERE cp."careerApplicationId" = ca.id AND ca."profileId" IS NULL;
