-- CreateTable
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "profilePhotoUrl" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnrolledAt" TIMESTAMP(3),
    "totpSecretEnc" TEXT,
    "passwordNeedsReset" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "mappedClientContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "taxNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");
CREATE UNIQUE INDEX "CustomerUser_mappedClientContactId_key" ON "CustomerUser"("mappedClientContactId");

-- AddForeignKey
ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_mappedClientContactId_fkey" FOREIGN KEY ("mappedClientContactId") REFERENCES "ClientContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill client portal users from internal AdminUser rows (same ids preserved for existing FKs).
INSERT INTO "CustomerUser" (
    "id",
    "email",
    "name",
    "phone",
    "passwordHash",
    "active",
    "profilePhotoUrl",
    "mfaEnabled",
    "mfaEnrolledAt",
    "totpSecretEnc",
    "passwordNeedsReset",
    "passwordResetTokenHash",
    "passwordResetExpiresAt",
    "mappedClientContactId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "email",
    "name",
    "phone",
    "passwordHash",
    "active",
    "profilePhotoUrl",
    "mfaEnabled",
    "mfaEnrolledAt",
    "totpSecretEnc",
    "passwordNeedsReset",
    "passwordResetTokenHash",
    "passwordResetExpiresAt",
    "mappedClientContactId",
    "createdAt",
    "updatedAt"
FROM "AdminUser"
WHERE "role" = 'client'
ON CONFLICT ("id") DO NOTHING;
