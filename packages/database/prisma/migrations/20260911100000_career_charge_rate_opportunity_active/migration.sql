-- Drop unique constraint so multiple jobs can link to the same opportunity
DROP INDEX IF EXISTS "JobListing_opportunityId_key";

-- Allow querying jobs by opportunity
CREATE INDEX IF NOT EXISTS "JobListing_opportunityId_idx" ON "JobListing"("opportunityId");

-- Charge rate on career applications
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "chargeRate" TEXT NOT NULL DEFAULT '';

-- Active flag on opportunities
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "Opportunity_active_idx" ON "Opportunity"("active");
