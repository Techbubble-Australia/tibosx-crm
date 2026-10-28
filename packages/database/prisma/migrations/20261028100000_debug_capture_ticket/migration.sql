-- CreateEnum
CREATE TYPE "DebugCaptureTicketType" AS ENUM ('BUG', 'ENHANCEMENT');

-- CreateEnum
CREATE TYPE "DebugReportedEnvironment" AS ENUM ('development', 'staging', 'production');

-- CreateTable
CREATE TABLE "DebugCaptureTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "DebugCaptureTicketType" NOT NULL,
    "reportedEnvironment" "DebugReportedEnvironment" NOT NULL DEFAULT 'development',
    "userDescription" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "reporterRole" TEXT NOT NULL,
    "currentUrl" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "elementDiagnostics" JSONB NOT NULL,
    "apiPrerequisite" JSONB,
    "screenshotUrl" TEXT,
    "fullPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebugCaptureTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebugCaptureTicket_ticketId_key" ON "DebugCaptureTicket"("ticketId");

-- CreateIndex
CREATE INDEX "DebugCaptureTicket_createdAt_idx" ON "DebugCaptureTicket"("createdAt");

-- CreateIndex
CREATE INDEX "DebugCaptureTicket_reporterUserId_idx" ON "DebugCaptureTicket"("reporterUserId");
