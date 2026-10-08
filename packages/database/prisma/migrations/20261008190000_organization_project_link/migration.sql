ALTER TABLE "Organization" ADD COLUMN "projectId" TEXT;
CREATE UNIQUE INDEX "Organization_projectId_key" ON "Organization"("projectId");
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
