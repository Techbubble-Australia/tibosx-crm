-- Expand issue types and add hierarchy + lateral links for debug portal tickets.

-- 1) Replace enum: BUG|ENHANCEMENT -> INITIATIVE|EPIC|STORY|TASK|BUG|SUBTASK
CREATE TYPE "DebugCaptureTicketType_new" AS ENUM ('INITIATIVE', 'EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK');

ALTER TABLE "DebugCaptureTicket" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "DebugCaptureTicket" ALTER COLUMN "type" TYPE TEXT USING ("type"::text);
UPDATE "DebugCaptureTicket" SET "type" = 'STORY' WHERE "type" = 'ENHANCEMENT';
ALTER TABLE "DebugCaptureTicket"
  ALTER COLUMN "type" TYPE "DebugCaptureTicketType_new"
  USING ("type"::"DebugCaptureTicketType_new");

DROP TYPE "DebugCaptureTicketType";
ALTER TYPE "DebugCaptureTicketType_new" RENAME TO "DebugCaptureTicketType";

-- 2) Hierarchy columns
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "hierarchyLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "parentId" TEXT;
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "rankOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "DebugCaptureTicket" SET "hierarchyLevel" = CASE
  WHEN "type" = 'INITIATIVE' THEN 2
  WHEN "type" = 'EPIC' THEN 1
  WHEN "type" = 'SUBTASK' THEN -1
  ELSE 0
END;

-- 3) Parent FK (RESTRICT — cannot delete parent while children exist)
ALTER TABLE "DebugCaptureTicket"
  ADD CONSTRAINT "DebugCaptureTicket_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "DebugCaptureTicket"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "DebugCaptureTicket_parentId_idx" ON "DebugCaptureTicket"("parentId");
CREATE INDEX "DebugCaptureTicket_hierarchyLevel_idx" ON "DebugCaptureTicket"("hierarchyLevel");
CREATE INDEX "DebugCaptureTicket_status_hierarchyLevel_idx" ON "DebugCaptureTicket"("status", "hierarchyLevel");

-- 4) Lateral links
CREATE TYPE "DebugCaptureTicketLinkType" AS ENUM ('BLOCKS', 'BLOCKED_BY', 'RELATES_TO');

CREATE TABLE "DebugCaptureTicketLink" (
  "id" TEXT NOT NULL,
  "sourceTicketId" TEXT NOT NULL,
  "targetTicketId" TEXT NOT NULL,
  "linkType" "DebugCaptureTicketLinkType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DebugCaptureTicketLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DebugCaptureTicketLink_sourceTicketId_targetTicketId_linkType_key"
  ON "DebugCaptureTicketLink"("sourceTicketId", "targetTicketId", "linkType");
CREATE INDEX "DebugCaptureTicketLink_sourceTicketId_idx" ON "DebugCaptureTicketLink"("sourceTicketId");
CREATE INDEX "DebugCaptureTicketLink_targetTicketId_idx" ON "DebugCaptureTicketLink"("targetTicketId");

ALTER TABLE "DebugCaptureTicketLink"
  ADD CONSTRAINT "DebugCaptureTicketLink_sourceTicketId_fkey"
  FOREIGN KEY ("sourceTicketId") REFERENCES "DebugCaptureTicket"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DebugCaptureTicketLink"
  ADD CONSTRAINT "DebugCaptureTicketLink_targetTicketId_fkey"
  FOREIGN KEY ("targetTicketId") REFERENCES "DebugCaptureTicket"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
