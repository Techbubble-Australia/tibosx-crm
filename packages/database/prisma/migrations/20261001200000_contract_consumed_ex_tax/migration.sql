-- Consumed on contracts is the sum of invoice amounts (ex tax), not total amounts.
UPDATE "Contract" AS c
SET "consumed" = COALESCE(
  (
    SELECT SUM(i."amount")
    FROM "ContractInvoice" AS i
    WHERE i."contractId" = c."id"
  ),
  0
);
