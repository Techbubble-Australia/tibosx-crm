-- Activity log for debug tickets.
CREATE TABLE "DebugCaptureTicketLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebugCaptureTicketLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DebugCaptureTicketLog_ticketId_createdAt_idx" ON "DebugCaptureTicketLog"("ticketId", "createdAt");

ALTER TABLE "DebugCaptureTicketLog" ADD CONSTRAINT "DebugCaptureTicketLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DebugCaptureTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill a "created" entry for existing tickets so every log starts with the reporter.
INSERT INTO "DebugCaptureTicketLog" ("id", "ticketId", "action", "actorUserId", "actorEmail", "createdAt")
SELECT 'log_' || "id", "id", 'CREATED', "reporterUserId", "reporterEmail", "createdAt"
FROM "DebugCaptureTicket";
