-- Debug ticket statuses become configurable board columns.
ALTER TABLE "DebugCaptureTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DebugCaptureTicket" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "DebugCaptureTicket" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE IF EXISTS "DebugCaptureTicketStatus";

CREATE TABLE "DebugTicketStatus" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "position" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebugTicketStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DebugTicketStatus_key_key" ON "DebugTicketStatus"("key");
CREATE INDEX "DebugTicketStatus_position_idx" ON "DebugTicketStatus"("position");

INSERT INTO "DebugTicketStatus" ("id", "key", "label", "color", "position", "isSystem", "updatedAt") VALUES
  ('dts_pending', 'PENDING', 'Pending', 'amber', 0, true, CURRENT_TIMESTAMP),
  ('dts_in_progress', 'IN_PROGRESS', 'In progress', 'sky', 1, true, CURRENT_TIMESTAMP),
  ('dts_for_review', 'FOR_REVIEW', 'For review', 'violet', 2, true, CURRENT_TIMESTAMP),
  ('dts_completed', 'COMPLETED', 'Completed', 'emerald', 3, true, CURRENT_TIMESTAMP);
