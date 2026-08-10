CREATE TABLE IF NOT EXISTS "CandidateProfile" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "technology" TEXT NOT NULL,
  "expectedRate" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "documentUrls" JSONB NOT NULL,
  "previousSalary" INTEGER,
  "comments" TEXT,
  "careerApplicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateProfile_careerApplicationId_key" ON "CandidateProfile"("careerApplicationId");
CREATE INDEX IF NOT EXISTS "CandidateProfile_email_idx" ON "CandidateProfile"("email");
CREATE INDEX IF NOT EXISTS "CandidateProfile_category_idx" ON "CandidateProfile"("category");
CREATE INDEX IF NOT EXISTS "CandidateProfile_technology_idx" ON "CandidateProfile"("technology");
CREATE INDEX IF NOT EXISTS "CandidateProfile_createdAt_idx" ON "CandidateProfile"("createdAt");

ALTER TABLE "CandidateProfile"
  ADD CONSTRAINT "CandidateProfile_careerApplicationId_fkey"
  FOREIGN KEY ("careerApplicationId") REFERENCES "CareerApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
