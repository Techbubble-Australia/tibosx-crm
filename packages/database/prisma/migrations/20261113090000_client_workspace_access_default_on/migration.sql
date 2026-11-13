-- "Client workspace" (invoices and payments) is now on by default; admins untick it to hide payment details.
ALTER TABLE "ClientContact" ALTER COLUMN "clientWorkspaceAccess" SET DEFAULT true;
UPDATE "ClientContact" SET "clientWorkspaceAccess" = true;
