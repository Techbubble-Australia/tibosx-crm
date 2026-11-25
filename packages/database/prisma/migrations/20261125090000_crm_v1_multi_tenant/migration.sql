-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ClientContact" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "opportunityId" TEXT,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ContractInvoice" ADD COLUMN     "accountingExternalId" TEXT,
ADD COLUMN     "accountingProvider" TEXT,
ADD COLUMN     "accountingSyncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN     "accountingSyncedAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "closeReason" TEXT,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "engagementModel" TEXT,
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "nextStep" TEXT,
ADD COLUMN     "nextStepDue" TIMESTAMP(3),
ADD COLUMN     "pipelineId" TEXT,
ADD COLUMN     "probability" INTEGER,
ADD COLUMN     "stageId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'au',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAccessSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAccessSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPipeline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'services',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmStage" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stageType" TEXT NOT NULL DEFAULT 'open',
    "winProbability" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "requiredFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStageHistory" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "title" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "country" TEXT,
    "message" TEXT,
    "ownerId" TEXT,
    "clientId" TEXT,
    "contactId" TEXT,
    "contactSubmissionId" TEXT,
    "customFields" JSONB,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "ownerId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDef" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_planId_idx" ON "Tenant"("planId");

-- CreateIndex
CREATE INDEX "Tenant_active_idx" ON "Tenant"("active");

-- CreateIndex
CREATE INDEX "TenantMembership_adminUserId_idx" ON "TenantMembership"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_tenantId_adminUserId_key" ON "TenantMembership"("tenantId", "adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_module_key" ON "TenantModule"("tenantId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key_key" ON "TenantSetting"("tenantId", "key");

-- CreateIndex
CREATE INDEX "SupportAccessSession_tenantId_idx" ON "SupportAccessSession"("tenantId");

-- CreateIndex
CREATE INDEX "SupportAccessSession_adminUserId_idx" ON "SupportAccessSession"("adminUserId");

-- CreateIndex
CREATE INDEX "SupportAccessSession_expiresAt_idx" ON "SupportAccessSession"("expiresAt");

-- CreateIndex
CREATE INDEX "CrmPipeline_tenantId_idx" ON "CrmPipeline"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmPipeline_tenantId_name_key" ON "CrmPipeline"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CrmStage_pipelineId_idx" ON "CrmStage"("pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmStage_pipelineId_name_key" ON "CrmStage"("pipelineId", "name");

-- CreateIndex
CREATE INDEX "OpportunityStageHistory_opportunityId_createdAt_idx" ON "OpportunityStageHistory"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "OpportunityStageHistory_toStageId_idx" ON "OpportunityStageHistory"("toStageId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_contactSubmissionId_key" ON "Lead"("contactSubmissionId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Quote_tenantId_idx" ON "Quote"("tenantId");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE INDEX "Quote_opportunityId_idx" ON "Quote"("opportunityId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_ownerId_idx" ON "Quote"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_tenantId_quoteNumber_key" ON "Quote"("tenantId", "quoteNumber");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLine_productId_idx" ON "QuoteLine"("productId");

-- CreateIndex
CREATE INDEX "CustomFieldDef_tenantId_entityType_idx" ON "CustomFieldDef"("tenantId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDef_tenantId_entityType_key_key" ON "CustomFieldDef"("tenantId", "entityType", "key");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE INDEX "ClientContact_tenantId_idx" ON "ClientContact"("tenantId");

-- CreateIndex
CREATE INDEX "ClientContact_email_idx" ON "ClientContact"("email");

-- CreateIndex
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");

-- CreateIndex
CREATE INDEX "Contract_opportunityId_idx" ON "Contract"("opportunityId");

-- CreateIndex
CREATE INDEX "Contract_quoteId_idx" ON "Contract"("quoteId");

-- CreateIndex
CREATE INDEX "ContractInvoice_tenantId_idx" ON "ContractInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "ContractInvoice_accountingSyncStatus_idx" ON "ContractInvoice"("accountingSyncStatus");

-- CreateIndex
CREATE INDEX "EmailNotificationPreference_notificationId_idx" ON "EmailNotificationPreference"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_leadId_key" ON "Opportunity"("leadId");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_idx" ON "Opportunity"("tenantId");

-- CreateIndex
CREATE INDEX "Opportunity_pipelineId_idx" ON "Opportunity"("pipelineId");

-- CreateIndex
CREATE INDEX "Opportunity_stageId_idx" ON "Opportunity"("stageId");

-- CreateIndex
CREATE INDEX "Opportunity_nextStepDue_idx" ON "Opportunity"("nextStepDue");

-- CreateIndex

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CrmStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractInvoice" ADD CONSTRAINT "ContractInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccessSession" ADD CONSTRAINT "SupportAccessSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccessSession" ADD CONSTRAINT "SupportAccessSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPipeline" ADD CONSTRAINT "CrmPipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmStage" ADD CONSTRAINT "CrmStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "CrmStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "CrmStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ClientContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDef" ADD CONSTRAINT "CustomFieldDef_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex

-- Seed TechBubble tenant, modules, and default Services pipeline
INSERT INTO "Plan" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES ('plan_growth_v1', 'Growth', 'growth', 'Default CRM growth plan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Tenant" ("id", "name", "slug", "region", "active", "planId", "createdAt", "updatedAt")
VALUES ('tenant_techbubble', 'TechBubble', 'techbubble', 'au', true, 'plan_growth_v1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "TenantModule" ("id", "tenantId", "module", "enabled") VALUES
  ('tm_tb_sales', 'tenant_techbubble', 'sales_crm', true),
  ('tm_tb_recruit', 'tenant_techbubble', 'recruitment', true),
  ('tm_tb_support', 'tenant_techbubble', 'customer_support', true),
  ('tm_tb_projects', 'tenant_techbubble', 'projects', true)
ON CONFLICT ("tenantId", "module") DO NOTHING;

-- Backfill tenantId on existing sales rows
UPDATE "Client" SET "tenantId" = 'tenant_techbubble' WHERE "tenantId" IS NULL;
UPDATE "ClientContact" SET "tenantId" = 'tenant_techbubble' WHERE "tenantId" IS NULL;
UPDATE "Opportunity" SET "tenantId" = 'tenant_techbubble' WHERE "tenantId" IS NULL;
UPDATE "Contract" SET "tenantId" = 'tenant_techbubble' WHERE "tenantId" IS NULL;
UPDATE "ContractInvoice" SET "tenantId" = 'tenant_techbubble' WHERE "tenantId" IS NULL;

-- Default Services pipeline
INSERT INTO "CrmPipeline" ("id", "tenantId", "name", "kind", "isDefault", "order", "active", "createdAt", "updatedAt")
VALUES ('pipe_tb_services', 'tenant_techbubble', 'Services', 'services', true, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tenantId", "name") DO NOTHING;

INSERT INTO "CrmStage" ("id", "pipelineId", "name", "stageType", "winProbability", "order", "createdAt", "updatedAt") VALUES
  ('stage_tb_qualify', 'pipe_tb_services', 'Qualify', 'open', 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_scope', 'pipe_tb_services', 'Scope', 'open', 25, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_proposal', 'pipe_tb_services', 'Proposal', 'open', 50, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_negotiate', 'pipe_tb_services', 'Negotiate', 'open', 75, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_verbal', 'pipe_tb_services', 'Verbal yes', 'open', 90, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_won', 'pipe_tb_services', 'Won', 'won', 100, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_tb_lost', 'pipe_tb_services', 'Lost', 'lost', 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("pipelineId", "name") DO NOTHING;

-- Map legacy opportunity statuses to stages
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_qualify', "probability" = 10
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL AND "status" IN ('DRAFT');
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_proposal', "probability" = 50
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL AND "status" IN ('PROPOSAL');
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_scope', "probability" = 25
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL AND "status" IN ('IN_PROGRESS');
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_won', "probability" = 100
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL AND "status" IN ('ACCEPTED');
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_lost', "probability" = 0
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL AND "status" IN ('REJECTED');
UPDATE "Opportunity" SET "pipelineId" = 'pipe_tb_services', "stageId" = 'stage_tb_qualify', "probability" = 10
WHERE "tenantId" = 'tenant_techbubble' AND "stageId" IS NULL;

-- Mark platform admins (existing admin role users)
UPDATE "AdminUser" SET "isPlatformAdmin" = true WHERE "role" = 'admin' AND "active" = true;

-- Membership for platform admins
INSERT INTO "TenantMembership" ("id", "tenantId", "adminUserId", "role", "createdAt", "updatedAt")
SELECT 'tm_' || a."id", 'tenant_techbubble', a."id", 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "AdminUser" a
WHERE a."role" = 'admin' AND a."active" = true
ON CONFLICT ("tenantId", "adminUserId") DO NOTHING;
