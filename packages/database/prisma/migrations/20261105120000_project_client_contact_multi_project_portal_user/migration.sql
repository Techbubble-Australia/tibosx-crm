-- A client portal login can be the contact on more than one support project.
DROP INDEX IF EXISTS "ProjectClientContact_ticketingUserId_key";
CREATE INDEX IF NOT EXISTS "ProjectClientContact_ticketingUserId_idx" ON "ProjectClientContact"("ticketingUserId");
