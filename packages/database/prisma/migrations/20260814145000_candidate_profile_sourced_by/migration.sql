-- Profile: optional sourcer (recruiter/admin) — must run after CandidateProfile table exists (20260814140000).
ALTER TABLE "CandidateProfile" ADD COLUMN IF NOT EXISTS "sourcedById" TEXT;
ALTER TABLE "CandidateProfile" DROP CONSTRAINT IF EXISTS "CandidateProfile_sourcedById_fkey";
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_sourcedById_fkey"
  FOREIGN KEY ("sourcedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CandidateProfile_sourcedById_idx" ON "CandidateProfile"("sourcedById");
