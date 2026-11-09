-- Short headline for debug tickets. Required for new tickets; older tickets have none.
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "title" TEXT;
