-- Multiple line items and attached documents (e.g. the issued invoice PDF) per invoice.
ALTER TABLE "ContractInvoice" ADD COLUMN "lineItems" JSONB;
ALTER TABLE "ContractInvoice" ADD COLUMN "fileUrls" JSONB;
