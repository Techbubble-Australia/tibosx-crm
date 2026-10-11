-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "additionalRoles" JSONB;

ALTER TABLE "TicketingUser" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
