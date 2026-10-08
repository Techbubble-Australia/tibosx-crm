-- AlterTable
ALTER TABLE "TicketingUser" ADD COLUMN "tbosRole" TEXT;

-- CreateTable
CREATE TABLE "ConsultantOrganization" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultantOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultantOrganization_consultantId_idx" ON "ConsultantOrganization"("consultantId");

-- CreateIndex
CREATE INDEX "ConsultantOrganization_organizationId_idx" ON "ConsultantOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantOrganization_consultantId_organizationId_key" ON "ConsultantOrganization"("consultantId", "organizationId");

-- AddForeignKey
ALTER TABLE "ConsultantOrganization" ADD CONSTRAINT "ConsultantOrganization_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "TicketingUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantOrganization" ADD CONSTRAINT "ConsultantOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
