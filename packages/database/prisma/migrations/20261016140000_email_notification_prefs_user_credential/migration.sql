-- Email notification preferences (role × notification toggles)
CREATE TABLE IF NOT EXISTS "EmailNotificationPreference" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailNotificationPreference_notificationId_role_key"
ON "EmailNotificationPreference"("notificationId", "role");

-- Direct credential assignment for staff (e.g. recruiters) without project membership
CREATE TABLE IF NOT EXISTS "AdminUserCredentialAssignment" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "credentialTemplateId" TEXT NOT NULL,
    "credentialData" JSONB,
    "agreementSignedAt" TIMESTAMP(3),
    "signatureDataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUserCredentialAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUserCredentialAssignment_adminUserId_key"
ON "AdminUserCredentialAssignment"("adminUserId");

ALTER TABLE "AdminUserCredentialAssignment"
ADD CONSTRAINT "AdminUserCredentialAssignment_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminUserCredentialAssignment"
ADD CONSTRAINT "AdminUserCredentialAssignment_credentialTemplateId_fkey"
FOREIGN KEY ("credentialTemplateId") REFERENCES "CredentialTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
