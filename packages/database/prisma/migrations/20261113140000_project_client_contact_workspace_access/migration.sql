-- "Client workspace" is now set per project: the contact sees that project, its timesheets and invoices.
ALTER TABLE "ProjectClientContact" ADD COLUMN "clientWorkspaceAccess" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ProjectClientContact" AS pcc
SET "clientWorkspaceAccess" = cc."clientWorkspaceAccess"
FROM "ClientContact" AS cc
WHERE cc.id = pcc."contactId";

ALTER TABLE "ClientContact" DROP COLUMN "clientWorkspaceAccess";
