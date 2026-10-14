ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "mappedProfileId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_mappedProfileId_key" ON "AdminUser"("mappedProfileId");

ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_mappedProfileId_fkey";
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_mappedProfileId_fkey"
  FOREIGN KEY ("mappedProfileId") REFERENCES "CandidateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
