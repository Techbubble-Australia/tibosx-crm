-- Comment attachments (images / files) and edit tracking.
ALTER TABLE "DebugCaptureTicketComment" ADD COLUMN "attachments" JSONB;
ALTER TABLE "DebugCaptureTicketComment" ADD COLUMN "editedAt" TIMESTAMP(3);
