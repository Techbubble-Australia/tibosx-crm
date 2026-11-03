-- Project budget (from contract value or variation value)
ALTER TABLE "Project" ADD COLUMN "budget" DECIMAL(14,2);
ALTER TABLE "Project" ADD COLUMN "budgetCurrency" TEXT;

-- Project member rates
ALTER TABLE "ProjectMember" ADD COLUMN "rateCurrency" TEXT NOT NULL DEFAULT 'AUD';
ALTER TABLE "ProjectMember" ADD COLUMN "rate" DECIMAL(14,2);
ALTER TABLE "ProjectMember" ADD COLUMN "rateFrequency" TEXT NOT NULL DEFAULT 'DAILY';

-- Distinguish manual actuals from timesheet-derived actuals
ALTER TABLE "ProjectActual" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';

-- Backfill budget for existing contract projects
UPDATE "Project" p
SET "budget" = c."contractValue", "budgetCurrency" = c."currency"
FROM "Contract" c
WHERE p."contractId" = c."id" AND p."contractVariationId" IS NULL AND p."budget" IS NULL;

UPDATE "Project" p
SET "budget" = v."variationValue", "budgetCurrency" = c."currency"
FROM "ContractVariation" v
JOIN "Contract" c ON c."id" = v."contractId"
WHERE p."contractVariationId" = v."id" AND p."budget" IS NULL;
