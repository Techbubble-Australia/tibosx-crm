-- Weekly timesheets are retired: every project logs monthly, so the per-project choice goes away.
ALTER TABLE "Project" DROP COLUMN "timesheetPeriod";

-- New timesheets are monthly. Remaining WEEKLY rows are merged into monthly sheets by the API on start.
ALTER TABLE "Timesheet" ALTER COLUMN "period" SET DEFAULT 'MONTHLY';
