-- CreateTable
CREATE TABLE "ContractWorkUnitMonth" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "segmentKey" TEXT NOT NULL DEFAULT 'base',
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "workUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractWorkUnitMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractWorkUnitMonth_contractId_idx" ON "ContractWorkUnitMonth"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractWorkUnitMonth_contractId_segmentKey_year_month_key" ON "ContractWorkUnitMonth"("contractId", "segmentKey", "year", "month");

-- AddForeignKey
ALTER TABLE "ContractWorkUnitMonth" ADD CONSTRAINT "ContractWorkUnitMonth_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
