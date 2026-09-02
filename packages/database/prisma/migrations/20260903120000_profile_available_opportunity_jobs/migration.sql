-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN "available" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN "opportunityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobListing_opportunityId_key" ON "JobListing"("opportunityId");

-- AddForeignKey
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
