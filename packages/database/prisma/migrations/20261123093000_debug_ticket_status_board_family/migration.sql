-- Scope board columns to WORK (L0/L-1) vs STRATEGY (L2/L1) families.

CREATE TYPE "DebugTicketBoardFamily" AS ENUM ('WORK', 'STRATEGY');

ALTER TABLE "DebugTicketStatus" ADD COLUMN "boardFamily" "DebugTicketBoardFamily" NOT NULL DEFAULT 'WORK';

DROP INDEX IF EXISTS "DebugTicketStatus_key_key";
DROP INDEX IF EXISTS "DebugTicketStatus_position_idx";

CREATE UNIQUE INDEX "DebugTicketStatus_boardFamily_key_key" ON "DebugTicketStatus"("boardFamily", "key");
CREATE INDEX "DebugTicketStatus_boardFamily_position_idx" ON "DebugTicketStatus"("boardFamily", "position");

INSERT INTO "DebugTicketStatus" ("id", "boardFamily", "key", "label", "color", "position", "isSystem", "updatedAt") VALUES
  ('dts_planned', 'STRATEGY', 'PLANNED', 'Planned', 'amber', 0, true, CURRENT_TIMESTAMP),
  ('dts_active', 'STRATEGY', 'ACTIVE', 'Active', 'sky', 1, true, CURRENT_TIMESTAMP),
  ('dts_done', 'STRATEGY', 'DONE', 'Done', 'emerald', 2, true, CURRENT_TIMESTAMP);

-- Remap existing initiative/epic tickets onto strategy statuses.
UPDATE "DebugCaptureTicket"
SET "status" = CASE
  WHEN "status" = 'COMPLETED' THEN 'DONE'
  WHEN "status" = 'PENDING' THEN 'PLANNED'
  ELSE 'ACTIVE'
END
WHERE "hierarchyLevel" IN (1, 2);
