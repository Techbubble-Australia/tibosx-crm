-- Enable MFA by default for client portal (CustomerUser) accounts.
ALTER TABLE "CustomerUser" ALTER COLUMN "mfaEnabled" SET DEFAULT true;

UPDATE "CustomerUser"
SET "mfaEnabled" = true
WHERE "mfaEnabled" = false;
