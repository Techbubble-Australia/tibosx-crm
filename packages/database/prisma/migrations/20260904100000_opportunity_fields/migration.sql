-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Opportunity" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'FIXED_PRICE';
ALTER TABLE "Opportunity" ADD COLUMN "contactId" TEXT;

-- CreateIndex
CREATE INDEX "Opportunity_contactId_idx" ON "Opportunity"("contactId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ClientContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
