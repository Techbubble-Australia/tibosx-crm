-- CreateTable
CREATE TABLE "ContractInvoiceActivityLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractInvoiceActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractInvoiceActivityLog_invoiceId_idx" ON "ContractInvoiceActivityLog"("invoiceId");

-- CreateIndex
CREATE INDEX "ContractInvoiceActivityLog_createdAt_idx" ON "ContractInvoiceActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ContractInvoiceActivityLog" ADD CONSTRAINT "ContractInvoiceActivityLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ContractInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInvoiceActivityLog" ADD CONSTRAINT "ContractInvoiceActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
