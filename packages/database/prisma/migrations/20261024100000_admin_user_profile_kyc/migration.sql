-- Simplified KYC: explicit flag + status on internal users
ALTER TABLE "AdminUser" ADD COLUMN "requireProfileAfterFirstLogin" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminUser" ADD COLUMN "profileKycStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE';

UPDATE "AdminUser"
SET "profileKycStatus" = 'COMPLETE'
WHERE "profileDetailsCompletedAt" IS NOT NULL;

UPDATE "AdminUser"
SET "requireProfileAfterFirstLogin" = false
WHERE "role" IN ('admin', 'project_manager');
