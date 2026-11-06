-- Sprints for the debug ticket board.
CREATE TABLE "DebugSprint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebugSprint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DebugSprint_status_idx" ON "DebugSprint"("status");

ALTER TABLE "DebugCaptureTicket" ADD COLUMN "sprintId" TEXT;
CREATE INDEX "DebugCaptureTicket_sprintId_idx" ON "DebugCaptureTicket"("sprintId");
ALTER TABLE "DebugCaptureTicket" ADD CONSTRAINT "DebugCaptureTicket_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "DebugSprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
