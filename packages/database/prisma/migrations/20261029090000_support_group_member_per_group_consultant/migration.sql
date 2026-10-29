-- A consultant may belong to the support group of more than one project.
DROP INDEX IF EXISTS "ProjectSupportGroupMember_ticketingUserId_key";

CREATE INDEX "ProjectSupportGroupMember_ticketingUserId_idx" ON "ProjectSupportGroupMember"("ticketingUserId");

CREATE UNIQUE INDEX "ProjectSupportGroupMember_groupId_ticketingUserId_key" ON "ProjectSupportGroupMember"("groupId", "ticketingUserId");
