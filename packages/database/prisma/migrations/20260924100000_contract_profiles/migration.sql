-- CreateTable
CREATE TABLE "ContractProfile" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractProfile_contractId_idx" ON "ContractProfile"("contractId");

-- CreateIndex
CREATE INDEX "ContractProfile_profileId_idx" ON "ContractProfile"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractProfile_contractId_profileId_key" ON "ContractProfile"("contractId", "profileId");

-- AddForeignKey
ALTER TABLE "ContractProfile" ADD CONSTRAINT "ContractProfile_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractProfile" ADD CONSTRAINT "ContractProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
