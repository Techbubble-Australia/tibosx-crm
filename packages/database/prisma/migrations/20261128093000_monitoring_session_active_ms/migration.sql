-- Credited online time (heartbeat gaps), not wall-clock start→end.
ALTER TABLE "MonitoringSession" ADD COLUMN "activeMs" BIGINT NOT NULL DEFAULT 0;
