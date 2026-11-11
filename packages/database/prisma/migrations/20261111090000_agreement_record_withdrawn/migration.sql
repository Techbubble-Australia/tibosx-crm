-- Signed agreements that were withdrawn (replaced by an updated template) stay in history with this date.
ALTER TABLE "AdminUserAgreementRecord" ADD COLUMN "withdrawnAt" TIMESTAMP(3);
