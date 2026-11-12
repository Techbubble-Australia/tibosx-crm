-- "Access to client workspace": the contact's portal account can open the client workspace overview.
ALTER TABLE "ClientContact" ADD COLUMN "clientWorkspaceAccess" BOOLEAN NOT NULL DEFAULT false;
