import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import {
  defaultCredentialValuesForProfile,
  type CredentialTemplateVariable,
} from "../lib/credential-template-vars";
import { renderTemplateHtml, wrapTemplateHtml } from "../lib/credential-template-render";
import { saveUploadBuffer } from "../lib/save-upload-buffer";
import { canManageProjects, getActorId, isProjectManagerRole, isProjectMemberRole } from "../lib/project-access";
import {
  generateProjectMonths,
  PROJECT_COST_TYPES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectCostType,
} from "../lib/project-types";
import {
  ensureSupportOrganizationForProject,
  syncConsultantAccessForOrganization,
} from "../lib/support-organization";

const router: IRouter = Router();

const estimateSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  qty: z.coerce.number().int().nonnegative(),
  currency: z.string().min(1).max(8),
  estimatedCost: z.coerce.number().nonnegative(),
  costType: z.enum(PROJECT_COST_TYPES),
});

const actualSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  qty: z.coerce.number().int().nonnegative(),
  currency: z.string().min(1).max(8),
  actualCost: z.coerce.number().nonnegative(),
  costType: z.enum(PROJECT_COST_TYPES),
});

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  clientId: z.string().min(1),
  status: z.enum(PROJECT_STATUSES).optional(),
  projectManagerId: z.string().min(1),
  contractId: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fileUrls: z.array(z.string().min(1)).optional().default([]),
  estimates: z.array(estimateSchema).optional(),
  actuals: z.array(actualSchema).optional(),
});

const generateCredentialsSchema = z.object({
  templateId: z.string().min(1),
  values: z.record(z.string(), z.string()),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

async function allocateProjectNumber(): Promise<string> {
  const rows = await prisma.project.findMany({ select: { projectNumber: true } });
  let max = 0;
  for (const row of rows) {
    const match = row.projectNumber.match(/^PRJ(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return `PRJ${String(max + 1).padStart(3, "0")}`;
}

function serializeEstimate(row: {
  id: string;
  year: number;
  month: number;
  qty: number;
  currency: string;
  estimatedCost: { toString(): string } | number;
  costType: string;
}) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    qty: row.qty,
    currency: row.currency,
    estimatedCost: toNumber(row.estimatedCost),
    costType: row.costType,
  };
}

function serializeActual(row: {
  id: string;
  year: number;
  month: number;
  qty: number;
  currency: string;
  actualCost: { toString(): string } | number;
  costType: string;
}) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    qty: row.qty,
    currency: row.currency,
    actualCost: toNumber(row.actualCost),
    costType: row.costType,
  };
}

function serializeMember(row: {
  id: string;
  profileId: string;
  adminUserId: string | null;
  credentialTemplateId: string | null;
  credentialData: unknown;
  signatureDataUrl: string | null;
  agreementSignedAt: Date | null;
  createdAt: Date;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    available: boolean;
  };
  adminUser?: { id: string; email: string; name: string | null } | null;
}) {
  return {
    id: row.id,
    profileId: row.profileId,
    firstName: row.profile.firstName,
    lastName: row.profile.lastName,
    email: row.profile.email,
    phone: row.profile.phone,
    available: row.profile.available,
    adminUserId: row.adminUserId,
    adminUserEmail: row.adminUser?.email ?? null,
    credentialTemplateId: row.credentialTemplateId,
    credentialData: row.credentialData ?? null,
    signatureDataUrl: row.signatureDataUrl ?? null,
    agreementSignedAt: row.agreementSignedAt?.toISOString() ?? null,
    hasCredentials: Boolean(row.adminUserId),
    agreementSigned: Boolean(row.agreementSignedAt),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeActivity(row: {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: Date;
  performedBy?: { name: string | null; email: string } | null;
}) {
  return {
    id: row.id,
    action: row.action,
    fieldName: row.fieldName,
    oldValue: row.oldValue,
    newValue: row.newValue,
    reason: row.reason,
    performedByName: row.performedBy?.name || row.performedBy?.email || "",
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeProject(row: {
  id: string;
  projectNumber: string;
  title: string;
  description: string;
  clientId: string;
  status: string;
  projectManagerId: string;
  contractId: string | null;
  startDate: Date;
  endDate: Date;
  fileUrls: unknown;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string };
  projectManager?: { id: string; name: string | null; email: string };
  contract?: { id: string; contractNumber: string; title: string; type: string; unit: string | null; currency: string } | null;
  members?: unknown;
  estimates?: unknown;
  actuals?: unknown;
  activityLogs?: unknown;
  supportOrganization?: { id: string; name: string; slug: string } | null;
}) {
  const fileUrls = Array.isArray(row.fileUrls)
    ? row.fileUrls.filter((url): url is string => typeof url === "string")
    : [];
  const status = row.status as keyof typeof PROJECT_STATUS_LABELS;
  return {
    id: row.id,
    projectNumber: row.projectNumber,
    title: row.title,
    description: row.description,
    clientId: row.clientId,
    clientName: row.client?.name ?? "",
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[status] ?? row.status,
    projectManagerId: row.projectManagerId,
    projectManagerName: row.projectManager?.name || row.projectManager?.email || "",
    contractId: row.contractId,
    contractNumber: row.contract?.contractNumber ?? null,
    contractTitle: row.contract?.title ?? null,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    fileUrls,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    members: Array.isArray(row.members) ? row.members : [],
    estimates: Array.isArray(row.estimates) ? row.estimates : [],
    actuals: Array.isArray(row.actuals) ? row.actuals : [],
    activityLogs: Array.isArray(row.activityLogs) ? row.activityLogs : [],
    supportOrganizationId: row.supportOrganization?.id ?? null,
    supportOrganizationName: row.supportOrganization?.name ?? null,
    supportOrganizationSlug: row.supportOrganization?.slug ?? null,
  };
}

const detailInclude = {
  client: { select: { id: true, name: true } },
  projectManager: { select: { id: true, name: true, email: true } },
  contract: { select: { id: true, contractNumber: true, title: true, type: true, unit: true, currency: true } },
  members: {
    orderBy: { createdAt: "asc" as const },
    include: {
      profile: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, available: true },
      },
      adminUser: { select: { id: true, email: true, name: true } },
    },
  },
  estimates: { orderBy: [{ year: "asc" as const }, { month: "asc" as const }] },
  actuals: { orderBy: [{ year: "asc" as const }, { month: "asc" as const }] },
  activityLogs: {
    orderBy: { createdAt: "desc" as const },
    include: { performedBy: { select: { name: true, email: true } } },
  },
  supportOrganization: { select: { id: true, name: true, slug: true } },
};

async function syncMembersFromContract(projectId: string, contractId: string | null | undefined) {
  if (!contractId) return;
  const profiles = await prisma.contractProfile.findMany({
    where: { contractId },
    select: { profileId: true },
  });
  for (const row of profiles) {
    await prisma.projectMember.upsert({
      where: { projectId_profileId: { projectId, profileId: row.profileId } },
      create: { projectId, profileId: row.profileId },
      update: {},
    });
  }
}

async function replaceEstimates(
  tx: Prisma.TransactionClient,
  projectId: string,
  rows: z.infer<typeof estimateSchema>[],
) {
  await tx.projectEstimate.deleteMany({ where: { projectId } });
  if (!rows.length) return;
  await tx.projectEstimate.createMany({
    data: rows.map((row) => ({
      projectId,
      year: row.year,
      month: row.month,
      qty: row.qty,
      currency: row.currency,
      estimatedCost: row.estimatedCost,
      costType: row.costType,
    })),
  });
}

async function replaceActuals(
  tx: Prisma.TransactionClient,
  projectId: string,
  rows: z.infer<typeof actualSchema>[],
) {
  await tx.projectActual.deleteMany({ where: { projectId } });
  if (!rows.length) return;
  await tx.projectActual.createMany({
    data: rows.map((row) => ({
      projectId,
      year: row.year,
      month: row.month,
      qty: row.qty,
      currency: row.currency,
      actualCost: row.actualCost,
      costType: row.costType,
    })),
  });
}

function buildDefaultFinancialRows(
  startDate: Date,
  endDate: Date,
  contract: { type: string; unit: string | null; currency: string } | null,
  costType: ProjectCostType = "personnel",
) {
  const months = generateProjectMonths(startDate, endDate, contract?.type, contract?.unit);
  const currency = contract?.currency ?? "AUD";
  return months.map((row) => ({
    year: row.year,
    month: row.month,
    qty: row.qty,
    currency,
    costType,
  }));
}

function buildDefaultEstimates(
  startDate: Date,
  endDate: Date,
  contract: { type: string; unit: string | null; currency: string } | null,
  costType: ProjectCostType = "personnel",
) {
  return buildDefaultFinancialRows(startDate, endDate, contract, costType).map((row) => ({
    ...row,
    estimatedCost: 0,
  }));
}

function mapDetail(row: NonNullable<Awaited<ReturnType<typeof fetchProject>>>) {
  return serializeProject({
    ...row,
    members: row.members.map(serializeMember),
    estimates: row.estimates.map(serializeEstimate),
    actuals: row.actuals.map(serializeActual),
    activityLogs: row.activityLogs.map(serializeActivity),
  });
}

async function fetchProject(id: string) {
  return prisma.project.findUnique({ where: { id }, include: detailInclude });
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    const where: Prisma.ProjectWhereInput = {};
    if (!canManageProjects(role)) {
      const membership = await prisma.projectMember.findFirst({
        where: { adminUserId: getActorId(req) },
        select: { projectId: true },
      });
      if (!membership) return res.json({ data: [] });
      where.id = membership.projectId;
    }
    const rows = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        projectManager: { select: { id: true, name: true, email: true } },
        contract: { select: { id: true, contractNumber: true, title: true, type: true, unit: true, currency: true } },
        supportOrganization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      data: rows.map((row) =>
        serializeProject({
          ...row,
          members: [],
          estimates: [],
          actuals: [],
          activityLogs: [],
        }),
      ),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/my-agreement", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    if (!isProjectMemberRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const userId = getActorId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const member = await prisma.projectMember.findFirst({
      where: { adminUserId: userId },
      include: {
        project: { select: { id: true, title: true, projectNumber: true } },
        credentialTemplate: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    if (!member?.credentialTemplate) {
      return res.status(404).json({ error: "No agreement assigned" });
    }

    const variables = Array.isArray(member.credentialTemplate.variables)
      ? (member.credentialTemplate.variables as CredentialTemplateVariable[])
      : [];
    const values =
      member.credentialData && typeof member.credentialData === "object"
        ? (member.credentialData as Record<string, string>)
        : {};
    const rendered = renderTemplateHtml(
      member.credentialTemplate.html,
      values,
      variables,
      member.signatureDataUrl,
    );

    res.json({
      data: {
        memberId: member.id,
        projectId: member.projectId,
        projectTitle: member.project.title,
        projectNumber: member.project.projectNumber,
        templateName: member.credentialTemplate.name,
        html: wrapTemplateHtml(rendered),
        signed: Boolean(member.agreementSignedAt),
        signedAt: member.agreementSignedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({ error: "Failed to fetch agreement" });
  }
});

router.post("/my-agreement/sign", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    if (!isProjectMemberRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const userId = getActorId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = z
      .object({
        signatureDataUrl: z.string().min(1).max(500_000),
      })
      .parse(req.body);

    if (!body.signatureDataUrl.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid signature image" });
    }

    const member = await prisma.projectMember.findFirst({
      where: { adminUserId: userId, credentialTemplateId: { not: null } },
      include: { credentialTemplate: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!member?.credentialTemplate) return res.status(404).json({ error: "No agreement assigned" });

    const variables = Array.isArray(member.credentialTemplate.variables)
      ? (member.credentialTemplate.variables as CredentialTemplateVariable[])
      : [];
    const values =
      member.credentialData && typeof member.credentialData === "object"
        ? (member.credentialData as Record<string, string>)
        : {};
    const rendered = renderTemplateHtml(
      member.credentialTemplate.html,
      values,
      variables,
      body.signatureDataUrl,
    );
    const wrapped = wrapTemplateHtml(rendered);
    const documentUrl = await saveUploadBuffer(
      Buffer.from(wrapped, "utf8"),
      `agreement-${member.id}.html`,
      "text/html; charset=utf-8",
    );

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.projectMember.update({
        where: { id: member.id },
        data: {
          signatureDataUrl: body.signatureDataUrl,
          agreementSignedAt: new Date(),
        },
      });
      await tx.adminUser.update({
        where: { id: userId },
        data: { agreementDocumentUrl: documentUrl },
      });
      return row;
    });

    res.json({
      data: {
        signed: true,
        signedAt: updated.agreementSignedAt?.toISOString() ?? null,
        agreementDocumentUrl: documentUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error signing agreement:", error);
    res.status(500).json({ error: "Failed to sign agreement" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    const role = req.user?.role ?? "";
    if (isProjectMemberRole(role)) {
      const actorId = getActorId(req);
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, adminUserId: actorId },
      });
      if (!membership) return res.status(403).json({ error: "Forbidden" });
    }
    const row = await fetchProject(projectId);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: mapDetail(row) });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    if (!canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = projectSchema.parse(req.body);
    const projectNumber = await allocateProjectNumber();
    const contract = data.contractId
      ? await prisma.contract.findUnique({
          where: { id: data.contractId },
          select: { type: true, unit: true, currency: true },
        })
      : null;
    const estimates =
      data.estimates?.length
        ? data.estimates
        : buildDefaultEstimates(data.startDate, data.endDate, contract);
    const actuals = data.actuals ?? [];

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          projectNumber,
          title: data.title.trim(),
          description: data.description.trim(),
          clientId: data.clientId,
          status: data.status ?? "DRAFT",
          projectManagerId: data.projectManagerId,
          contractId: data.contractId ?? null,
          startDate: data.startDate,
          endDate: data.endDate,
          fileUrls: data.fileUrls ?? [],
        },
      });
      await replaceEstimates(tx, created.id, estimates);
      await replaceActuals(tx, created.id, actuals);
      await tx.projectActivityLog.create({
        data: {
          projectId: created.id,
          action: "CREATED",
          performedById: getActorId(req) || null,
        },
      });
      return created;
    });

    await syncMembersFromContract(row.id, data.contractId);
    const detail = await fetchProject(row.id);
    res.status(201).json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = projectSchema.parse(req.body);
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const contract = data.contractId
      ? await prisma.contract.findUnique({
          where: { id: data.contractId },
          select: { type: true, unit: true, currency: true },
        })
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          title: data.title.trim(),
          description: data.description.trim(),
          clientId: data.clientId,
          status: data.status ?? existing.status,
          projectManagerId: data.projectManagerId,
          contractId: data.contractId ?? null,
          startDate: data.startDate,
          endDate: data.endDate,
          fileUrls: data.fileUrls ?? [],
        },
      });
      const estimates =
        data.estimates?.length
          ? data.estimates
          : buildDefaultEstimates(data.startDate, data.endDate, contract);
      const actuals = data.actuals ?? [];
      await replaceEstimates(tx, projectId, estimates);
      await replaceActuals(tx, projectId, actuals);
      await tx.projectActivityLog.create({
        data: {
          projectId,
          action: "UPDATED",
          performedById: getActorId(req) || null,
        },
      });
    });

    await syncMembersFromContract(projectId, data.contractId);
    const linkedOrg = await prisma.organization.findFirst({ where: { projectId } });
    if (linkedOrg && data.projectManagerId !== existing.projectManagerId) {
      await syncConsultantAccessForOrganization(linkedOrg.id);
    }
    const detail = await fetchProject(projectId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.post("/:id/support-organization", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const org = await ensureSupportOrganizationForProject(projectId);
    res.status(201).json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        projectId: org.projectId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ error: "Project not found" });
    }
    console.error("Error enabling support organization:", error);
    res.status(500).json({ error: "Failed to enable support portal for project" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft projects can be deleted" });
    }
    const timesheetCount = await prisma.timesheet.count({ where: { projectId } });
    if (timesheetCount > 0) {
      return res.status(400).json({ error: "Cannot delete a project that has timesheets" });
    }
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

router.post("/:id/members/:memberId/generate-credentials", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    if (!projectId || !memberId) return res.status(400).json({ error: "Invalid id" });
    const role = req.user?.role ?? "";
    if (!isProjectManagerRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const input = generateCredentialsSchema.parse(req.body);
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: {
        profile: true,
        project: { select: { projectManagerId: true } },
      },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (role === "project_manager" && member.project.projectManagerId !== getActorId(req)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const template = await prisma.credentialTemplate.findUnique({ where: { id: input.templateId } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    if (template.addStartDate && template.requireStartDate && !input.startDate) {
      return res.status(400).json({ error: "Start date is required for this template" });
    }
    if (template.addEndDate && template.requireEndDate && !input.endDate) {
      return res.status(400).json({ error: "End date is required for this template" });
    }
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      return res.status(400).json({ error: "End date must be on or after start date" });
    }
    const variables = Array.isArray(template.variables)
      ? (template.variables as CredentialTemplateVariable[])
      : [];
    for (const variable of variables) {
      if (variable.required && !input.values[variable.key]?.trim()) {
        return res.status(400).json({ error: `${variable.label} is required` });
      }
      const value = input.values[variable.key];
      if (variable.type === "select" && value) {
        if (!variable.options.includes(value)) {
          return res.status(400).json({ error: `Invalid value for ${variable.label}` });
        }
      }
    }

    const defaults = defaultCredentialValuesForProfile(member.profile);
    const formatCredentialDate = (value: Date) =>
      value.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
    const dateValues: Record<string, string> = {};
    if (input.startDate) {
      const formatted = formatCredentialDate(input.startDate);
      dateValues.start_date = formatted;
      dateValues.startDate = formatted;
      dateValues.Start_Date = formatted;
    }
    if (input.endDate) {
      const formatted = formatCredentialDate(input.endDate);
      dateValues.end_date = formatted;
      dateValues.endDate = formatted;
      dateValues.End_Date = formatted;
    }
    const mergedValues = { ...defaults, ...dateValues, ...input.values };
    const email =
      mergedValues.email?.trim() || mergedValues.Email?.trim() || member.profile.email;
    const name =
      mergedValues.name?.trim() ||
      mergedValues.Name?.trim() ||
      `${member.profile.firstName} ${member.profile.lastName}`.trim();

    const existingUser = await prisma.adminUser.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== member.adminUserId) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }

    const tempPassword = randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const adminUser = await prisma.$transaction(async (tx) => {
      const user =
        member.adminUserId && existingUser
          ? await tx.adminUser.update({
              where: { id: member.adminUserId },
              data: {
                email,
                name,
                role: "project_member",
                active: true,
                passwordHash,
                passwordNeedsReset: true,
              },
            })
          : await tx.adminUser.create({
              data: {
                email,
                name,
                role: "project_member",
                active: true,
                passwordHash,
                passwordNeedsReset: true,
              },
            });

      await tx.projectMember.update({
        where: { id: member.id },
        data: {
          adminUserId: user.id,
          credentialTemplateId: template.id,
          credentialData: mergedValues,
        },
      });

      await tx.projectActivityLog.create({
        data: {
          projectId,
          action: "CREDENTIALS_GENERATED",
          newValue: email,
          performedById: getActorId(req) || null,
        },
      });

      return user;
    });

    const detail = await fetchProject(projectId);
    res.json({
      data: {
        memberId: member.id,
        adminUserId: adminUser.id,
        email: adminUser.email,
        temporaryPassword: tempPassword,
        project: detail ? mapDetail(detail) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error generating credentials:", error);
    res.status(500).json({ error: "Failed to generate credentials" });
  }
});

router.get("/:id/members/:memberId/credential-defaults", async (req, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    if (!projectId || !memberId) return res.status(400).json({ error: "Invalid id" });
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { profile: true },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ data: defaultCredentialValuesForProfile(member.profile) });
  } catch (error) {
    console.error("Error fetching credential defaults:", error);
    res.status(500).json({ error: "Failed to fetch defaults" });
  }
});

export { router as projectRoutes };
