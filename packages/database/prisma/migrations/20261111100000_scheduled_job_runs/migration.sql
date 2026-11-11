-- One row per scheduled job occurrence (e.g. a timesheet reminder day); the unique key stops
-- several API instances from running the same occurrence twice.
CREATE TABLE "ScheduledJobRun" (
    "key" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detail" JSONB,

    CONSTRAINT "ScheduledJobRun_pkey" PRIMARY KEY ("key")
);
