ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "mappedClientContactId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_mappedClientContactId_key" ON "AdminUser"("mappedClientContactId");

ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_mappedClientContactId_fkey";
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_mappedClientContactId_fkey"
  FOREIGN KEY ("mappedClientContactId") REFERENCES "ClientContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
