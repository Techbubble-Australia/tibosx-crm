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
import {
  listSignatureCaptureIds,
  renderTemplateHtml,
  renderTemplateHtmlWithSignatures,
  wrapTemplateHtml,
} from "../lib/credential-template-render";
import { saveUploadBuffer } from "../lib/save-upload-buffer";
import { readUploadTextByUrl } from "../lib/read-upload-buffer";
import { canManageProjects, getActorId, isProjectManagerRole, isProjectMemberRole } from "../lib/project-access";
import {
  findCredentialProjectMemberForUser,
  findUserCredentialAgreement,
  hasEffectiveProjectMemberRole,
} from "../lib/project-member-user";
import { isValidProjectManagerUserId, isValidTimesheetApproverUserId } from "../lib/timesheet-approver";
import { emailTbosUserInvite } from "../lib/user-invite.js";
import { logProjectFieldChanges, type ProjectSnapshot } from "../lib/project-activity";
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
import {
  activateSupportProject,
  PROJECT_KINDS,
  provisionSupportMemberConsultant,
  setProjectSupportGroupMembers,
  syncProjectClientContacts,
} from "../lib/support-project";
import { applyProjectCustomerSupportSettings } from "../lib/project-customer-support";

const router: IRouter = Router();

const estimateSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  qty: z.coerce.number().nonnegative(),
  currency: z.string().min(1).max(8),
  estimatedCost: z.coerce.number().nonnegative(),
  costType: z.enum(PROJECT_COST_TYPES),
});

const actualSchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  qty: z.coerce.number().nonnegative(),
  currency: z.string().min(1).max(8),
  actualCost: z.coerce.number().nonnegative(),
  costType: z.enum(PROJECT_COST_TYPES),
});

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  clientId: z.string().min(1),
  kind: z.enum(PROJECT_KINDS).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  projectManagerId: z.string().min(1),
  timesheetApproverUserId: z.string().min(1).optional(),
  forCustomerSupport: z.boolean().optional(),
  supportClientContacts: z
    .array(
      z.object({
        contactId: z.string().min(1),
        portalAccess: z.boolean(),
        canApproveTimesheets: z.boolean(),
      }),
    )
    .optional(),
  contractId: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fileUrls: z.array(z.string().min(1)).optional().default([]),
  estimates: z.array(estimateSchema).optional(),
  actuals: z.array(actualSchema).optional(),
});

const generateCredentialsSchema = z.object({
  templateId: z.string().min(1),
  inviteEmail: z.string().email(),
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
  qty: { toString(): string } | number;
  currency: string;
  estimatedCost: { toString(): string } | number;
  costType: string;
}) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    qty: toNumber(row.qty),
    currency: row.currency,
    estimatedCost: toNumber(row.estimatedCost),
    costType: row.costType,
  };
}

function serializeActual(row: {
  id: string;
  year: number;
  month: number;
  qty: { toString(): string } | number;
  currency: string;
  actualCost: { toString(): string } | number;
  costType: string;
}) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    qty: toNumber(row.qty),
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
  kind: string;
  status: string;
  projectManagerId: string;
  timesheetApproverUserId: string;
  contractId: string | null;
  startDate: Date;
  endDate: Date;
  fileUrls: unknown;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string };
  projectManager?: { id: string; name: string | null; email: string };
  timesheetApprover?: { id: string; name: string | null; email: string };
  contract?: { id: string; contractNumber: string; title: string; type: string; unit: string | null; currency: string } | null;
  members?: unknown;
  estimates?: unknown;
  actuals?: unknown;
  activityLogs?: unknown;
  supportOrganization?: { id: string; name: string; slug: string } | null;
  clientContacts?: unknown;
  supportGroup?: { members?: unknown } | null;
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
    kind: row.kind,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[status] ?? row.status,
    projectManagerId: row.projectManagerId,
    projectManagerName: row.projectManager?.name || row.projectManager?.email || "",
    timesheetApproverUserId: row.timesheetApproverUserId,
    timesheetApproverName:
      row.timesheetApprover?.name || row.timesheetApprover?.email || row.projectManager?.name || "",
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
    clientContacts: Array.isArray(row.clientContacts) ? row.clientContacts : [],
    supportGroupMembers: Array.isArray(row.supportGroup?.members) ? row.supportGroup.members : [],
  };
}

const detailInclude = {
  client: { select: { id: true, name: true } },
  projectManager: { select: { id: true, name: true, email: true } },
  timesheetApprover: { select: { id: true, name: true, email: true } },
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
  clientContacts: {
    orderBy: { createdAt: "asc" as const },
    include: {
      contact: { select: { id: true, name: true, email: true, position: true } },
      ticketingUser: { select: { id: true, email: true } },
    },
  },
  supportGroup: {
    include: {
      members: {
        include: {
          projectMember: {
            include: {
              profile: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          adminUser: { select: { id: true, email: true, name: true } },
          ticketingUser: { select: { id: true, email: true } },
        },
      },
    },
  },
};

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

function serializeProjectClientContact(row: {
  id: string;
  portalAccess: boolean;
  canApproveTimesheets: boolean;
  ticketingUserId: string | null;
  contact: { id: string; name: string; email: string; position: string | null };
}) {
  return {
    id: row.id,
    contactId: row.contact.id,
    name: row.contact.name,
    email: row.contact.email,
    position: row.contact.position,
    portalAccess: row.portalAccess,
    canApproveTimesheets: row.canApproveTimesheets,
    portalProvisioned: Boolean(row.ticketingUserId),
  };
}

function serializeSupportGroupMember(row: {
  id: string;
  projectMemberId: string | null;
  adminUserId: string | null;
  ticketingUserId: string | null;
  projectMember?: {
    id: string;
    profile: { firstName: string; lastName: string; email: string };
  } | null;
  adminUser?: { id: string; email: string; name: string | null } | null;
}) {
  const profile = row.projectMember?.profile;
  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : row.adminUser?.name || "";
  const email = profile?.email || row.adminUser?.email || "";
  return {
    id: row.id,
    projectMemberId: row.projectMemberId,
    adminUserId: row.adminUserId,
    ticketingUserId: row.ticketingUserId,
    name,
    email,
    credentialsReady: Boolean(row.adminUserId && row.ticketingUserId),
  };
}

function mapDetail(row: NonNullable<Awaited<ReturnType<typeof fetchProject>>>) {
  return serializeProject({
    ...row,
    members: row.members.map(serializeMember),
    estimates: row.estimates.map(serializeEstimate),
    actuals: row.actuals.map(serializeActual),
    activityLogs: row.activityLogs.map(serializeActivity),
    clientContacts: row.clientContacts.map(serializeProjectClientContact),
    supportGroup: row.supportGroup
      ? { members: row.supportGroup.members.map(serializeSupportGroupMember) }
      : null,
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
    const userId = getActorId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const agreement = await findUserCredentialAgreement(userId);
    if (!agreement) {
      return res.status(404).json({ error: "No agreement assigned" });
    }

    const template = agreement.credentialTemplate;
    const variables = Array.isArray(template.variables)
      ? (template.variables as CredentialTemplateVariable[])
      : [];
    const values =
      agreement.credentialData && typeof agreement.credentialData === "object"
        ? (agreement.credentialData as Record<string, string>)
        : {};
    const captureIds = listSignatureCaptureIds(template.html);
    let html = "";
    if (agreement.agreementSignedAt) {
      const storedUser = await prisma.adminUser.findUnique({
        where: { id: userId },
        select: { agreementDocumentUrl: true },
      });
      const storedHtml =
        storedUser?.agreementDocumentUrl
          ? await readUploadTextByUrl(storedUser.agreementDocumentUrl)
          : null;
      html = storedHtml?.trim()
        ? storedHtml
        : wrapTemplateHtml(
            renderTemplateHtmlWithSignatures(
              template.html,
              values,
              variables,
              agreement.signatureDataUrl
                ? { [captureIds[0] ?? "contractor"]: agreement.signatureDataUrl }
                : {},
            ),
          );
    } else {
      const rendered = renderTemplateHtml(template.html, values, variables, null);
      html = wrapTemplateHtml(rendered);
    }

    const storedUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { agreementDocumentUrl: true },
    });

    res.json({
      data: {
        memberId: agreement.source === "project_member" ? agreement.memberId : null,
        projectId: agreement.source === "project_member" ? agreement.projectId : null,
        projectTitle:
          agreement.source === "project_member" ? agreement.projectTitle : agreement.credentialTemplate.name,
        projectNumber: agreement.source === "project_member" ? agreement.projectNumber : "",
        templateName: template.name,
        html,
        signed: Boolean(agreement.agreementSignedAt),
        signedAt: agreement.agreementSignedAt?.toISOString() ?? null,
        signatureCaptureIds: captureIds,
        agreementDocumentUrl: storedUser?.agreementDocumentUrl ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({ error: "Failed to fetch agreement" });
  }
});

router.post("/my-agreement/sign", async (req: AuthRequest, res) => {
  try {
    const userId = getActorId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = z
      .object({
        signatureDataUrl: z.string().min(1).max(500_000).optional(),
        signatures: z.record(z.string().min(1), z.string().min(1).max(500_000)).optional(),
      })
      .parse(req.body);

    const agreement = await findUserCredentialAgreement(userId);
    if (!agreement) {
      return res.status(404).json({ error: "No agreement assigned" });
    }

    const template = agreement.credentialTemplate;
    const variables = Array.isArray(template.variables)
      ? (template.variables as CredentialTemplateVariable[])
      : [];
    const values =
      agreement.credentialData && typeof agreement.credentialData === "object"
        ? (agreement.credentialData as Record<string, string>)
        : {};
    const captureIds = listSignatureCaptureIds(template.html);
    const signatures: Record<string, string> = body.signatures ?? {};
    if (body.signatureDataUrl) {
      if (!body.signatureDataUrl.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid signature image" });
      }
      const soleCaptureId = captureIds.length === 1 ? captureIds[0] : undefined;
      if (soleCaptureId) {
        signatures[soleCaptureId] = body.signatureDataUrl;
      } else if (!body.signatures) {
        return res.status(400).json({ error: "Sign each signature field in the agreement" });
      }
    }

    for (const dataUrl of Object.values(signatures)) {
      if (!dataUrl.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid signature image" });
      }
    }

    if (captureIds.length > 0) {
      const missing = captureIds.filter((id) => !signatures[id]);
      if (missing.length) {
        return res.status(400).json({
          error: "All signature fields must be signed before submitting",
          missingCaptureIds: missing,
        });
      }
    } else if (!body.signatureDataUrl) {
      return res.status(400).json({ error: "Signature is required" });
    }

    const signDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const valuesWithDate = {
      ...values,
      date: signDate,
      signature_date: signDate,
      contractor_signature_date: signDate,
      personnel_signature_date: signDate,
    };

    const firstCaptureId = captureIds[0];
    const primarySignature =
      captureIds.length && firstCaptureId ? signatures[firstCaptureId] : body.signatureDataUrl!;
    const rendered = captureIds.length
      ? renderTemplateHtmlWithSignatures(template.html, valuesWithDate, variables, signatures)
      : renderTemplateHtml(template.html, valuesWithDate, variables, primarySignature);
    const wrapped = wrapTemplateHtml(rendered);
    const fileKey =
      agreement.source === "project_member" ? `agreement-${agreement.memberId}` : `agreement-user-${userId}`;
    const documentUrl = await saveUploadBuffer(
      Buffer.from(wrapped, "utf8"),
      `${fileKey}.html`,
      "text/html; charset=utf-8",
    );

    const signedAt = new Date();
    await prisma.$transaction(async (tx) => {
      if (agreement.source === "project_member") {
        await tx.projectMember.update({
          where: { id: agreement.memberId },
          data: {
            signatureDataUrl: primarySignature,
            agreementSignedAt: signedAt,
          },
        });
      } else {
        await tx.adminUserCredentialAssignment.update({
          where: { adminUserId: userId },
          data: {
            signatureDataUrl: primarySignature,
            agreementSignedAt: signedAt,
          },
        });
      }
      await tx.adminUser.update({
        where: { id: userId },
        data: { agreementDocumentUrl: documentUrl },
      });
    });

    res.json({
      data: {
        signed: true,
        signedAt: signedAt.toISOString(),
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
      return res.status(403).json({ error: "Forbidden" });
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
    if (!(await isValidProjectManagerUserId(data.projectManagerId))) {
      return res.status(400).json({
        error: "Project manager must be a user with Administrator or Project manager role",
      });
    }
    const timesheetApproverUserId = data.timesheetApproverUserId ?? data.projectManagerId;
    if (!(await isValidTimesheetApproverUserId(timesheetApproverUserId))) {
      return res.status(400).json({
        error: "Timesheet approver must be a user with Administrator, Project manager, or Client role",
      });
    }
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
          kind: data.kind ?? "DELIVERY",
          status: data.status ?? "DRAFT",
          projectManagerId: data.projectManagerId,
          timesheetApproverUserId,
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

    if ((data.kind ?? "DELIVERY") === "SUPPORT" && (data.status ?? "DRAFT") === "ACTIVE") {
      await activateSupportProject(row.id);
    }
    if (data.forCustomerSupport) {
      try {
        await applyProjectCustomerSupportSettings(
          row.id,
          true,
          data.supportClientContacts ?? [],
        );
      } catch (error) {
        if (error instanceof Error && error.message === "CLIENT_ACCESS_REQUIRED") {
          return res.status(400).json({ error: "Select at least one client contact for customer support access." });
        }
        throw error;
      }
    }

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
    if (!(await isValidProjectManagerUserId(data.projectManagerId))) {
      return res.status(400).json({
        error: "Project manager must be a user with Administrator or Project manager role",
      });
    }
    const timesheetApproverUserId = data.timesheetApproverUserId ?? data.projectManagerId;
    if (!(await isValidTimesheetApproverUserId(timesheetApproverUserId))) {
      return res.status(400).json({
        error: "Timesheet approver must be a user with Administrator, Project manager, or Client role",
      });
    }

    const contract = data.contractId
      ? await prisma.contract.findUnique({
          where: { id: data.contractId },
          select: { type: true, unit: true, currency: true },
        })
      : null;

    const beforeSnapshot: ProjectSnapshot = {
      title: existing.title,
      description: existing.description,
      clientId: existing.clientId,
      kind: existing.kind,
      status: existing.status,
      projectManagerId: existing.projectManagerId,
      timesheetApproverUserId: existing.timesheetApproverUserId,
      contractId: existing.contractId,
      startDate: existing.startDate,
      endDate: existing.endDate,
    };
    const afterSnapshot: ProjectSnapshot = {
      title: data.title.trim(),
      description: data.description.trim(),
      clientId: data.clientId,
      kind:
        data.forCustomerSupport !== undefined
          ? data.forCustomerSupport
            ? "SUPPORT"
            : "DELIVERY"
          : (data.kind ?? existing.kind),
      status: data.status ?? existing.status,
      projectManagerId: data.projectManagerId,
      timesheetApproverUserId,
      contractId: data.contractId ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          title: afterSnapshot.title,
          description: afterSnapshot.description,
          clientId: afterSnapshot.clientId,
          kind: afterSnapshot.kind,
          status: afterSnapshot.status,
          projectManagerId: afterSnapshot.projectManagerId,
          timesheetApproverUserId: afterSnapshot.timesheetApproverUserId,
          contractId: afterSnapshot.contractId,
          startDate: afterSnapshot.startDate,
          endDate: afterSnapshot.endDate,
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
      await logProjectFieldChanges(tx, projectId, beforeSnapshot, afterSnapshot, getActorId(req) || null);
    });

    if (data.forCustomerSupport !== undefined) {
      try {
        await applyProjectCustomerSupportSettings(
          projectId,
          data.forCustomerSupport,
          data.supportClientContacts ?? [],
        );
      } catch (error) {
        if (error instanceof Error && error.message === "CLIENT_ACCESS_REQUIRED") {
          return res.status(400).json({ error: "Select at least one client contact for customer support access." });
        }
        throw error;
      }
    }

    const nextStatus = data.status ?? existing.status;
    const nextKind = afterSnapshot.kind;
    if (nextKind === "SUPPORT" && nextStatus === "ACTIVE") {
      await activateSupportProject(projectId);
    }

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

router.get("/:id/member-options", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "") && !isProjectManagerRole(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { contractId: true },
    });
    if (!project) return res.status(404).json({ error: "Not found" });

    const existing = await prisma.projectMember.findMany({
      where: { projectId },
      select: { profileId: true },
    });
    const exclude = new Set(existing.map((row) => row.profileId));

    const mapProfile = (p: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) => ({
      profileId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
    });

    let contractProfiles: ReturnType<typeof mapProfile>[] = [];
    if (project.contractId) {
      const rows = await prisma.contractProfile.findMany({
        where: { contractId: project.contractId },
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      });
      contractProfiles = rows
        .filter((row) => !exclude.has(row.profileId))
        .map((row) => mapProfile(row.profile));
    }

    const databaseProfiles = await prisma.candidateProfile.findMany({
      where: { id: { notIn: [...exclude] } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 150,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    res.json({
      data: {
        contractProfiles,
        databaseProfiles: databaseProfiles.map(mapProfile),
      },
    });
  } catch (error) {
    console.error("Error fetching member options:", error);
    res.status(500).json({ error: "Failed to fetch member options" });
  }
});

const addMemberSchema = z.object({
  profileId: z.string().min(1),
});

async function canRemoveProjectMember(req: AuthRequest, projectId: string): Promise<boolean> {
  const role = req.user?.role ?? "";
  const actorId = getActorId(req);
  if (role === "admin") return true;
  if (role !== "project_manager") return false;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { projectManagerId: true },
  });
  return project?.projectManagerId === actorId;
}

router.delete("/:id/members/:memberId", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    if (!projectId || !memberId) return res.status(400).json({ error: "Invalid id" });
    if (!(await canRemoveProjectMember(req, projectId))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({ where: { id: memberId } });
      await tx.projectActivityLog.create({
        data: {
          projectId,
          action: "MEMBER_REMOVED",
          newValue: member.profileId,
          performedById: getActorId(req) || null,
        },
      });
    });
    res.json({ message: "Member removed" });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

router.post("/:id/members", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "") && !isProjectManagerRole(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { profileId } = addMemberSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return res.status(404).json({ error: "Not found" });

    const profile = await prisma.candidateProfile.findUnique({
      where: { id: profileId },
      select: { mappedAdminUser: { select: { id: true } } },
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const linkedUserId = profile.mappedAdminUser?.id ?? null;

    const member = await prisma.projectMember.upsert({
      where: { projectId_profileId: { projectId, profileId } },
      create: { projectId, profileId, adminUserId: linkedUserId },
      update: linkedUserId ? { adminUserId: linkedUserId } : {},
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            available: true,
          },
        },
        adminUser: { select: { id: true, email: true, name: true } },
      },
    });

    await prisma.projectActivityLog.create({
      data: {
        projectId,
        action: "MEMBER_ADDED",
        newValue: member.profile.email,
        performedById: getActorId(req) || null,
      },
    });

    const detail = await fetchProject(projectId);
    res.status(201).json({
      data: {
        member: serializeMember(member),
        project: detail ? mapDetail(detail) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add member" });
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
    if (member.adminUserId) {
      return res.status(400).json({ error: "This member already has a user record" });
    }
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
    const inviteEmail = input.inviteEmail.trim().toLowerCase();
    const mergedValues: Record<string, string> = {
      ...defaults,
      ...dateValues,
      ...input.values,
      email: inviteEmail,
      Email: inviteEmail,
    };
    const email = inviteEmail;
    const name =
      mergedValues.name?.trim() ||
      mergedValues.Name?.trim() ||
      `${member.profile.firstName} ${member.profile.lastName}`.trim();
    const phone =
      mergedValues.phone?.trim() ||
      mergedValues.Phone?.trim() ||
      mergedValues.mobile?.trim() ||
      member.profile.phone.trim();
    if (!phone) {
      return res.status(400).json({ error: "Phone is required to create the user account" });
    }

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
                phone,
                role: "project_member",
                active: true,
                passwordHash,
                passwordNeedsReset: true,
                mfaEnabled: false,
              },
            })
          : await tx.adminUser.create({
              data: {
                email,
                name,
                phone,
                role: "project_member",
                active: true,
                passwordHash,
                passwordNeedsReset: true,
                mfaEnabled: false,
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

    try {
      await provisionSupportMemberConsultant(projectId, adminUser.id, member.id);
    } catch (error) {
      console.error("Support consultant provisioning failed:", error);
    }

    let inviteEmailSent = false;
    try {
      await emailTbosUserInvite({
        to: adminUser.email,
        name: adminUser.name || adminUser.email,
        temporaryPassword: tempPassword,
        context: "project_member",
      });
      inviteEmailSent = true;
    } catch (error) {
      console.error("Invite email failed:", error);
    }

    const detail = await fetchProject(projectId);
    res.json({
      data: {
        memberId: member.id,
        adminUserId: adminUser.id,
        email: adminUser.email,
        inviteEmailSent,
        temporaryPassword: inviteEmailSent ? undefined : tempPassword,
        project: detail ? mapDetail(detail) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

const assignTemplateSchema = z.object({
  templateId: z.string().min(1),
  values: z.record(z.string(), z.string()),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.post("/:id/members/:memberId/assign-template", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    if (!projectId || !memberId) return res.status(400).json({ error: "Invalid id" });
    const role = req.user?.role ?? "";
    if (!isProjectManagerRole(role) && !canManageProjects(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const input = assignTemplateSchema.parse(req.body);
    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: {
        profile: true,
        project: { select: { projectManagerId: true } },
        adminUser: { select: { id: true, email: true, name: true, phone: true, active: true } },
      },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });

    if (!member.adminUserId) {
      const linkedUser = await prisma.adminUser.findFirst({
        where: { mappedProfileId: member.profileId },
        select: { id: true, email: true, name: true, phone: true, active: true },
      });
      if (linkedUser) {
        await prisma.projectMember.update({
          where: { id: member.id },
          data: { adminUserId: linkedUser.id },
        });
        member.adminUserId = linkedUser.id;
        member.adminUser = linkedUser;
      }
    }

    if (!member.adminUserId || !member.adminUser) {
      return res.status(400).json({ error: "Create the user record before assigning a template" });
    }
    if (member.agreementSignedAt) {
      return res.status(400).json({ error: "Template has already been signed" });
    }
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
    const email = member.adminUser.email.trim().toLowerCase();
    const mergedValues: Record<string, string> = {
      ...defaults,
      ...dateValues,
      ...input.values,
      email,
      Email: email,
    };

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.update({
        where: { id: member.id },
        data: {
          credentialTemplateId: template.id,
          credentialData: mergedValues,
          agreementSignedAt: null,
        },
      });
      await tx.projectActivityLog.create({
        data: {
          projectId,
          action: "TEMPLATE_ASSIGNED",
          newValue: template.name,
          performedById: getActorId(req) || null,
        },
      });
    });

    const detail = await fetchProject(projectId);
    res.json({
      data: {
        memberId: member.id,
        adminUserId: member.adminUserId,
        templateAssigned: true,
        project: detail ? mapDetail(detail) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error assigning template:", error);
    res.status(500).json({ error: "Failed to assign template" });
  }
});

const supportClientContactsSchema = z.object({
  contacts: z.array(
    z.object({
      contactId: z.string().min(1),
      portalAccess: z.boolean(),
      canApproveTimesheets: z.boolean(),
    }),
  ),
});

router.put("/:id/support/client-contacts", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!isProjectManagerRole(req.user?.role ?? "") && !canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const body = supportClientContactsSchema.parse(req.body);
    await syncProjectClientContacts(projectId, body.contacts);
    const detail = await fetchProject(projectId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ error: "Project not found" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error saving support client contacts:", error);
    res.status(500).json({ error: "Failed to save client contacts" });
  }
});

const supportGroupSchema = z.object({
  projectMemberIds: z.array(z.string().min(1)),
});

router.put("/:id/support/group-members", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!isProjectManagerRole(req.user?.role ?? "") && !canManageProjects(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const body = supportGroupSchema.parse(req.body);
    await setProjectSupportGroupMembers(projectId, body.projectMemberIds);
    const detail = await fetchProject(projectId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_SUPPORT_PROJECT") {
      return res.status(400).json({ error: "Only support projects can have a support group" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error saving support group:", error);
    res.status(500).json({ error: "Failed to save support group" });
  }
});

router.get("/:id/support/available-contacts", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    const contacts = await prisma.clientContact.findMany({
      where: { clientId: project.clientId },
      orderBy: { order: "asc" },
      select: { id: true, name: true, email: true, position: true },
    });
    const mappedUsers = await prisma.adminUser.findMany({
      where: { mappedClientContactId: { in: contacts.map((c) => c.id) } },
      select: { id: true, email: true, mappedClientContactId: true },
    });
    const userByContact = new Map(
      mappedUsers.map((u) => [u.mappedClientContactId!, { id: u.id, email: u.email }]),
    );
    res.json({
      data: contacts.map((c) => ({
        ...c,
        userRecord: userByContact.get(c.id) ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching client contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
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
