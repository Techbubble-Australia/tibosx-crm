-- Allow fractional quantities in financial calculations (hours/days/units).

ALTER TABLE "Contract" ALTER COLUMN "numberOfUnits" TYPE DECIMAL(14, 4) USING "numberOfUnits"::decimal;

ALTER TABLE "ContractVariation" ALTER COLUMN "qty" TYPE DECIMAL(14, 4) USING "qty"::decimal;

ALTER TABLE "ContractWorkUnitMonth" ALTER COLUMN "workUnits" TYPE DECIMAL(14, 4) USING "workUnits"::decimal;

ALTER TABLE "ContractInvoice" ALTER COLUMN "qty" TYPE DECIMAL(14, 4) USING "qty"::decimal;

ALTER TABLE "ProjectEstimate" ALTER COLUMN "qty" TYPE DECIMAL(14, 4) USING "qty"::decimal;

ALTER TABLE "ProjectActual" ALTER COLUMN "qty" TYPE DECIMAL(14, 4) USING "qty"::decimal;
