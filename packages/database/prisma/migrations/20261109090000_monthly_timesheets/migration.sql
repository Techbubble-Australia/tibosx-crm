-- Project-level timesheet period (WEEKLY | MONTHLY); existing projects stay weekly.
ALTER TABLE "Project" ADD COLUMN "timesheetPeriod" TEXT NOT NULL DEFAULT 'WEEKLY';

-- Per-timesheet period so existing weekly timesheets keep their layout if a project switches to monthly.
ALTER TABLE "Timesheet" ADD COLUMN "period" TEXT NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE "Timesheet" ADD COLUMN "daysOff" JSONB;
