ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "timesheetApproverUserId" TEXT;

UPDATE "Project" SET "timesheetApproverUserId" = "projectManagerId" WHERE "timesheetApproverUserId" IS NULL;

ALTER TABLE "Project" ALTER COLUMN "timesheetApproverUserId" SET NOT NULL;

ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_timesheetApproverUserId_fkey";
ALTER TABLE "Project" ADD CONSTRAINT "Project_timesheetApproverUserId_fkey"
  FOREIGN KEY ("timesheetApproverUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Project_timesheetApproverUserId_idx" ON "Project"("timesheetApproverUserId");
