-- Support project workflow: kind, client contacts, support group, ticket/timesheet links

ALTER TABLE "Project" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'DELIVERY';
CREATE INDEX "Project_kind_idx" ON "Project"("kind");

CREATE TABLE "ProjectClientContact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "portalAccess" BOOLEAN NOT NULL DEFAULT true,
    "canApproveTimesheets" BOOLEAN NOT NULL DEFAULT false,
    "ticketingUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectClientContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectSupportGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Support team',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSupportGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectSupportGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "projectMemberId" TEXT,
    "adminUserId" TEXT,
    "ticketingUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSupportGroupMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Ticket" ADD COLUMN "projectId" TEXT;
CREATE INDEX "Ticket_projectId_idx" ON "Ticket"("projectId");

ALTER TABLE "Timesheet" ADD COLUMN "ticketId" TEXT;
ALTER TABLE "Timesheet" ADD COLUMN "approverKind" TEXT;
ALTER TABLE "Timesheet" ADD COLUMN "projectClientContactId" TEXT;
CREATE INDEX "Timesheet_ticketId_idx" ON "Timesheet"("ticketId");
CREATE INDEX "Timesheet_projectClientContactId_idx" ON "Timesheet"("projectClientContactId");

CREATE UNIQUE INDEX "ProjectClientContact_projectId_contactId_key" ON "ProjectClientContact"("projectId", "contactId");
CREATE UNIQUE INDEX "ProjectClientContact_ticketingUserId_key" ON "ProjectClientContact"("ticketingUserId");
CREATE INDEX "ProjectClientContact_projectId_idx" ON "ProjectClientContact"("projectId");
CREATE INDEX "ProjectClientContact_contactId_idx" ON "ProjectClientContact"("contactId");

CREATE UNIQUE INDEX "ProjectSupportGroup_projectId_key" ON "ProjectSupportGroup"("projectId");

CREATE UNIQUE INDEX "ProjectSupportGroupMember_projectMemberId_key" ON "ProjectSupportGroupMember"("projectMemberId");
CREATE UNIQUE INDEX "ProjectSupportGroupMember_ticketingUserId_key" ON "ProjectSupportGroupMember"("ticketingUserId");
CREATE INDEX "ProjectSupportGroupMember_groupId_idx" ON "ProjectSupportGroupMember"("groupId");
CREATE INDEX "ProjectSupportGroupMember_adminUserId_idx" ON "ProjectSupportGroupMember"("adminUserId");

ALTER TABLE "ProjectClientContact" ADD CONSTRAINT "ProjectClientContact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectClientContact" ADD CONSTRAINT "ProjectClientContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ClientContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectClientContact" ADD CONSTRAINT "ProjectClientContact_ticketingUserId_fkey" FOREIGN KEY ("ticketingUserId") REFERENCES "TicketingUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectSupportGroup" ADD CONSTRAINT "ProjectSupportGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectSupportGroupMember" ADD CONSTRAINT "ProjectSupportGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectSupportGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSupportGroupMember" ADD CONSTRAINT "ProjectSupportGroupMember_projectMemberId_fkey" FOREIGN KEY ("projectMemberId") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectSupportGroupMember" ADD CONSTRAINT "ProjectSupportGroupMember_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectSupportGroupMember" ADD CONSTRAINT "ProjectSupportGroupMember_ticketingUserId_fkey" FOREIGN KEY ("ticketingUserId") REFERENCES "TicketingUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_projectClientContactId_fkey" FOREIGN KEY ("projectClientContactId") REFERENCES "ProjectClientContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
