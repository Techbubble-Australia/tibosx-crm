-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "numberOfUnits" INTEGER;

-- AlterTable
ALTER TABLE "ContractActivityLog" ADD COLUMN "fieldName" TEXT;
ALTER TABLE "ContractActivityLog" ADD COLUMN "oldValue" TEXT;
ALTER TABLE "ContractActivityLog" ADD COLUMN "newValue" TEXT;
