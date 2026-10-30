-- Ticket estimated effort (summary + phase breakdown)
ALTER TABLE "Ticket" ADD COLUMN "estimatedEffortHours" DECIMAL(8,2);
ALTER TABLE "Ticket" ADD COLUMN "effortAnalysis" DECIMAL(8,2);
ALTER TABLE "Ticket" ADD COLUMN "effortBuild" DECIMAL(8,2);
ALTER TABLE "Ticket" ADD COLUMN "effortTest" DECIMAL(8,2);
ALTER TABLE "Ticket" ADD COLUMN "effortDocument" DECIMAL(8,2);
ALTER TABLE "Ticket" ADD COLUMN "effortSupport" DECIMAL(8,2);
