-- Job listing hot flag and primary city for list display
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "isHot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- Admin: force password change on next login
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordNeedsReset" BOOLEAN NOT NULL DEFAULT false;

-- Profile: optional sourcer (recruiter/admin)
ALTER TABLE "CandidateProfile" ADD COLUMN IF NOT EXISTS "sourcedById" TEXT;
ALTER TABLE "CandidateProfile" DROP CONSTRAINT IF EXISTS "CandidateProfile_sourcedById_fkey";
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_sourcedById_fkey"
  FOREIGN KEY ("sourcedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CandidateProfile_sourcedById_idx" ON "CandidateProfile"("sourcedById");
