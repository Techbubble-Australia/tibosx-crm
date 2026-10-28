-- CreateEnum
CREATE TYPE "DebugCaptureTicketStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FOR_REVIEW', 'COMPLETED');

-- AlterTable
ALTER TABLE "DebugCaptureTicket" ADD COLUMN "status" "DebugCaptureTicketStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "DebugCaptureTicket_status_idx" ON "DebugCaptureTicket"("status");
