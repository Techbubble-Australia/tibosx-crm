-- JobListing: optional end client name
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "endClient" TEXT;

-- CandidateProfile: citizen + visa
ALTER TABLE "CandidateProfile" ADD COLUMN IF NOT EXISTS "isCitizen" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CandidateProfile" ADD COLUMN IF NOT EXISTS "visaStatus" TEXT;

-- CareerApplication: citizen + pipeline status
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "isCitizen" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'CLIENT_REVIEW';
