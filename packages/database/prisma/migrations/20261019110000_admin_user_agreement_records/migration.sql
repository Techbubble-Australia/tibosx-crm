CREATE TABLE "AdminUserAgreementRecord" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "credentialTemplateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "projectId" TEXT,
    "projectMemberId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreementSignedAt" TIMESTAMP(3),
    "agreementDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUserAgreementRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminUserAgreementRecord_adminUserId_idx" ON "AdminUserAgreementRecord"("adminUserId");
CREATE INDEX "AdminUserAgreementRecord_projectMemberId_idx" ON "AdminUserAgreementRecord"("projectMemberId");

ALTER TABLE "AdminUserAgreementRecord" ADD CONSTRAINT "AdminUserAgreementRecord_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUserAgreementRecord" ADD CONSTRAINT "AdminUserAgreementRecord_credentialTemplateId_fkey" FOREIGN KEY ("credentialTemplateId") REFERENCES "CredentialTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminUserAgreementRecord" ADD CONSTRAINT "AdminUserAgreementRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
