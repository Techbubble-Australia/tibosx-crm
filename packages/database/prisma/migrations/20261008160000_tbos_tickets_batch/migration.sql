-- Credential template date flags (tickets E/F)
ALTER TABLE "CredentialTemplate" ADD COLUMN "addStartDate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CredentialTemplate" ADD COLUMN "requireStartDate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CredentialTemplate" ADD COLUMN "addEndDate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CredentialTemplate" ADD COLUMN "requireEndDate" BOOLEAN NOT NULL DEFAULT true;

-- Admin user profile (ticket H/J)
ALTER TABLE "AdminUser" ADD COLUMN "phone" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "suburb" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "city" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "state" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "country" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "profileDetailsCompletedAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN "agreementDocumentUrl" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "emergencyContacts" JSONB;

CREATE TABLE "AdminUserActivityLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUserActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminUserActivityLog_adminUserId_idx" ON "AdminUserActivityLog"("adminUserId");
CREATE INDEX "AdminUserActivityLog_createdAt_idx" ON "AdminUserActivityLog"("createdAt");
ALTER TABLE "AdminUserActivityLog" ADD CONSTRAINT "AdminUserActivityLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminUserActivityLog" ADD CONSTRAINT "AdminUserActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Timesheet: project or opportunity (case) (ticket A)
ALTER TABLE "Timesheet" ADD COLUMN "opportunityId" TEXT;
ALTER TABLE "Timesheet" ALTER COLUMN "projectId" DROP NOT NULL;
CREATE INDEX "Timesheet_opportunityId_idx" ON "Timesheet"("opportunityId");
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
