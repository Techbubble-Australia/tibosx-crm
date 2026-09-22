-- Opportunity owner
ALTER TABLE "Opportunity" ADD COLUMN "ownerId" TEXT;
CREATE INDEX "Opportunity_ownerId_idx" ON "Opportunity"("ownerId");
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Contract variation end date
ALTER TABLE "ContractVariation" ADD COLUMN "variationEndDate" TIMESTAMP(3);
ALTER TABLE "ContractVariation" ALTER COLUMN "comments" SET DEFAULT '';

-- Contract invoices
CREATE TABLE "ContractInvoice" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractInvoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContractInvoice_contractId_idx" ON "ContractInvoice"("contractId");
CREATE INDEX "ContractInvoice_status_idx" ON "ContractInvoice"("status");

ALTER TABLE "ContractInvoice" ADD CONSTRAINT "ContractInvoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
