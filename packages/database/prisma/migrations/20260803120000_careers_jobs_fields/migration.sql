-- Job listing: placement type (Internal / External for Client)
ALTER TABLE "JobListing" ADD COLUMN IF NOT EXISTS "listingType" TEXT NOT NULL DEFAULT 'Internal';

-- Career application: expanded salary, country, visa, multiple documents
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "visaStatus" TEXT;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "salaryCurrency" TEXT;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "salaryRate" INTEGER;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "salaryMode" TEXT;
ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "documentUrls" JSONB;
