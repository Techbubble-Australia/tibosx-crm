ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);
