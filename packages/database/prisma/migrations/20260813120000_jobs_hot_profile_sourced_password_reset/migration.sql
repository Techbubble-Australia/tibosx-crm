-- Job listing hot flag and primary city for list display
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "isHot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- Admin: force password change on next login
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordNeedsReset" BOOLEAN NOT NULL DEFAULT false;

-- CandidateProfile.sourcedById is applied in 20260814145000 (after CandidateProfile is created).
