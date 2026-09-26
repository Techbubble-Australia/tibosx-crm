-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN "resumeText" TEXT;

-- AlterTable
ALTER TABLE "CareerApplication" ADD COLUMN "contractId" TEXT;

-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN "metaTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "contractVariationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_contractId_key" ON "CareerApplication"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_contractVariationId_key" ON "Project"("contractVariationId");

-- AddForeignKey
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_contractVariationId_fkey" FOREIGN KEY ("contractVariationId") REFERENCES "ContractVariation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
