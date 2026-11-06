-- Debug tickets can have several screenshots.
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "screenshotUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "DebugCaptureTicket"
SET "screenshotUrls" = ARRAY["screenshotUrl"]
WHERE "screenshotUrl" IS NOT NULL AND "screenshotUrl" <> '';
