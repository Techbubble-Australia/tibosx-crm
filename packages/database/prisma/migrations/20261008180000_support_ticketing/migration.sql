-- Support ticketing (merged from packages/ticketing-database)
CREATE TYPE "TicketingUserRole" AS ENUM ('CLIENT', 'CONSULTANT');
CREATE TYPE "TicketType" AS ENUM ('TECHNICAL', 'FINANCIAL_LOAN', 'SERVICE_INTERNAL', 'SERVICE_EXTERNAL');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_CLIENT', 'RESOLVED', 'CLOSED');

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

CREATE TABLE "TicketingUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "TicketingUserRole" NOT NULL,
    "organizationId" TEXT,
    "consultantVerified" BOOLEAN NOT NULL DEFAULT false,
    "tbosAdminUserId" TEXT,
    "tbosRole" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TicketingUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TicketingUser_email_key" ON "TicketingUser"("email");
CREATE UNIQUE INDEX "TicketingUser_tbosAdminUserId_key" ON "TicketingUser"("tbosAdminUserId");
CREATE INDEX "TicketingUser_organizationId_idx" ON "TicketingUser"("organizationId");
CREATE INDEX "TicketingUser_role_idx" ON "TicketingUser"("role");
ALTER TABLE "TicketingUser" ADD CONSTRAINT "TicketingUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketingUser" ADD CONSTRAINT "TicketingUser_tbosAdminUserId_fkey" FOREIGN KEY ("tbosAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ConsultantOrganization" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsultantOrganization_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConsultantOrganization_consultantId_idx" ON "ConsultantOrganization"("consultantId");
CREATE INDEX "ConsultantOrganization_organizationId_idx" ON "ConsultantOrganization"("organizationId");
CREATE UNIQUE INDEX "ConsultantOrganization_consultantId_organizationId_key" ON "ConsultantOrganization"("consultantId", "organizationId");
ALTER TABLE "ConsultantOrganization" ADD CONSTRAINT "ConsultantOrganization_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "TicketingUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsultantOrganization" ADD CONSTRAINT "ConsultantOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_organizationId_status_idx" ON "Ticket"("organizationId", "status");
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TicketingUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TicketingUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TicketingUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TicketAuditLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TicketAuditLog_ticketId_createdAt_idx" ON "TicketAuditLog"("ticketId", "createdAt");
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "TicketingUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
