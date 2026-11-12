-- Agreement history keeps its name and signed document when the template is later deleted.
ALTER TABLE "AdminUserAgreementRecord" DROP CONSTRAINT "AdminUserAgreementRecord_credentialTemplateId_fkey";
ALTER TABLE "AdminUserAgreementRecord" ALTER COLUMN "credentialTemplateId" DROP NOT NULL;
ALTER TABLE "AdminUserAgreementRecord" ADD CONSTRAINT "AdminUserAgreementRecord_credentialTemplateId_fkey"
  FOREIGN KEY ("credentialTemplateId") REFERENCES "CredentialTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
