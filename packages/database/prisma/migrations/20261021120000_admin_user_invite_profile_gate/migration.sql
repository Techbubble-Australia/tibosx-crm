ALTER TABLE "AdminUser" ADD COLUMN "inviteCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN "profileOnboardingRequiredAt" TIMESTAMP(3);
