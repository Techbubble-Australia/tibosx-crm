ALTER TABLE "Ticket" ADD COLUMN "updatedById" TEXT;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "TicketingUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Ticket_updatedById_idx" ON "Ticket"("updatedById");
