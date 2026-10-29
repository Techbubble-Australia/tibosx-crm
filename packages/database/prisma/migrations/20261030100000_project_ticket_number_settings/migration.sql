-- Project-level ticket prefix / digit settings
ALTER TABLE "Project" ADD COLUMN "ticketPrefix" TEXT NOT NULL DEFAULT 'TKT';
ALTER TABLE "Project" ADD COLUMN "ticketNumberDigits" INTEGER NOT NULL DEFAULT 5;

-- Ticket numbers unique per project (same prefix+digits can repeat across projects)
DROP INDEX IF EXISTS "Ticket_ticketNumber_key";
CREATE UNIQUE INDEX "Ticket_projectId_ticketNumber_key" ON "Ticket"("projectId", "ticketNumber");
