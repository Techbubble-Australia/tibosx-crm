-- Comments on debug tickets (deleted with the ticket).
CREATE TABLE "DebugCaptureTicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebugCaptureTicketComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DebugCaptureTicketComment_ticketId_createdAt_idx" ON "DebugCaptureTicketComment"("ticketId", "createdAt");

ALTER TABLE "DebugCaptureTicketComment" ADD CONSTRAINT "DebugCaptureTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DebugCaptureTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
