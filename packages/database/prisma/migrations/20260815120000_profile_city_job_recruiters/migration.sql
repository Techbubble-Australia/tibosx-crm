-- City on applications; country/city on profiles; job recruiters; link applications to jobs
ALTER TABLE "CareerApplication" ADD COLUMN "city" TEXT;
ALTER TABLE "CareerApplication" ADD COLUMN "jobListingId" TEXT;

ALTER TABLE "CandidateProfile" ADD COLUMN "country" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CandidateProfile" ADD COLUMN "city" TEXT;

ALTER TABLE "JobListing" ADD COLUMN "recruiterIds" JSONB;

ALTER TABLE "CareerApplication"
  ADD CONSTRAINT "CareerApplication_jobListingId_fkey"
  FOREIGN KEY ("jobListingId") REFERENCES "JobListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CareerApplication_jobListingId_idx" ON "CareerApplication"("jobListingId");
CREATE INDEX "CandidateProfile_country_idx" ON "CandidateProfile"("country");
