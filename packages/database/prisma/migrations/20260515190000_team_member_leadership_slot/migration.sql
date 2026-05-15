-- AlterTable: exactly one member per slot (1–3); multiple NULLs allowed with UNIQUE in PostgreSQL
ALTER TABLE "TeamMember" ADD COLUMN "featuredLeadershipOrder" INTEGER;
CREATE UNIQUE INDEX "TeamMember_featuredLeadershipOrder_key" ON "TeamMember"("featuredLeadershipOrder");
