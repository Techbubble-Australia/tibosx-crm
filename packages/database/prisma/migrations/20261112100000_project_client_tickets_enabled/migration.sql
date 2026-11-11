-- Support projects can give clients timesheet access only (no support tickets).
ALTER TABLE "Project" ADD COLUMN "clientTicketsEnabled" BOOLEAN NOT NULL DEFAULT true;
