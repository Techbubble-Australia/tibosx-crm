-- Workspace groups (Settings → Groups)
CREATE TABLE "WorkspaceGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceGroupMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkspaceGroup_clientId_idx" ON "WorkspaceGroup"("clientId");
CREATE UNIQUE INDEX "WorkspaceGroupMember_groupId_adminUserId_key" ON "WorkspaceGroupMember"("groupId", "adminUserId");
CREATE INDEX "WorkspaceGroupMember_adminUserId_idx" ON "WorkspaceGroupMember"("adminUserId");

ALTER TABLE "WorkspaceGroup" ADD CONSTRAINT "WorkspaceGroup_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceGroupMember" ADD CONSTRAINT "WorkspaceGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WorkspaceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceGroupMember" ADD CONSTRAINT "WorkspaceGroupMember_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'BUG';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'ENHANCEMENT';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'OTHER';
