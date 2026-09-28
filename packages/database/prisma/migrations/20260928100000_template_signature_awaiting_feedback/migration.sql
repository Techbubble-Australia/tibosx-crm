-- ProjectMember agreement signature
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "signatureDataUrl" TEXT;
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "agreementSignedAt" TIMESTAMP(3);
