-- CreateTable
CREATE TABLE "MonitoringSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "captureIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringDevice" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "MonitoringSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringScreenshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringDevice_tokenHash_key" ON "MonitoringDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "MonitoringDevice_adminUserId_idx" ON "MonitoringDevice"("adminUserId");

-- CreateIndex
CREATE INDEX "MonitoringDevice_revokedAt_idx" ON "MonitoringDevice"("revokedAt");

-- CreateIndex
CREATE INDEX "MonitoringSession_adminUserId_startedAt_idx" ON "MonitoringSession"("adminUserId", "startedAt");

-- CreateIndex
CREATE INDEX "MonitoringSession_deviceId_endedAt_idx" ON "MonitoringSession"("deviceId", "endedAt");

-- CreateIndex
CREATE INDEX "MonitoringSession_lastHeartbeatAt_idx" ON "MonitoringSession"("lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "MonitoringScreenshot_adminUserId_capturedAt_idx" ON "MonitoringScreenshot"("adminUserId", "capturedAt");

-- CreateIndex
CREATE INDEX "MonitoringScreenshot_sessionId_capturedAt_idx" ON "MonitoringScreenshot"("sessionId", "capturedAt");

-- CreateIndex
CREATE INDEX "MonitoringScreenshot_deviceId_capturedAt_idx" ON "MonitoringScreenshot"("deviceId", "capturedAt");

-- AddForeignKey
ALTER TABLE "MonitoringDevice" ADD CONSTRAINT "MonitoringDevice_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringSession" ADD CONSTRAINT "MonitoringSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "MonitoringDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringSession" ADD CONSTRAINT "MonitoringSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringScreenshot" ADD CONSTRAINT "MonitoringScreenshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MonitoringSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringScreenshot" ADD CONSTRAINT "MonitoringScreenshot_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "MonitoringDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringScreenshot" ADD CONSTRAINT "MonitoringScreenshot_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed singleton settings row
INSERT INTO "MonitoringSettings" ("id", "enabled", "captureIntervalSeconds", "createdAt", "updatedAt")
VALUES ('default', false, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
