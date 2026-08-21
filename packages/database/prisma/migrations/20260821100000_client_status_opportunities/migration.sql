-- Client status replaces active boolean
ALTER TABLE "Client" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
UPDATE "Client" SET "status" = CASE WHEN "active" = true THEN 'ACTIVE' ELSE 'INACTIVE' END;
DROP INDEX IF EXISTS "Client_active_idx";
ALTER TABLE "Client" DROP COLUMN "active";
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- Opportunities
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "comments" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_clientId_idx" ON "Opportunity"("clientId");
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");
CREATE INDEX "Opportunity_order_idx" ON "Opportunity"("order");

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
