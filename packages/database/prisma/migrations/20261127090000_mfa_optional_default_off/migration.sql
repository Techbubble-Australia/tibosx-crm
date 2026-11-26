-- MFA is optional: default off; clear enrollments so password-only login works for everyone.
ALTER TABLE "CustomerUser" ALTER COLUMN "mfaEnabled" SET DEFAULT false;

UPDATE "CustomerUser"
SET "mfaEnabled" = false, "totpSecretEnc" = NULL, "mfaEnrolledAt" = NULL;

UPDATE "AdminUser"
SET "mfaEnabled" = false, "totpSecretEnc" = NULL, "mfaEnrolledAt" = NULL;
