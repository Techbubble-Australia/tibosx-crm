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
import { effectiveRoleList } from "../lib/admin-roles";
import { ensureCandidateProfileForAdminUser } from "../lib/admin-user-profile-map";
import {
  agreementDatesFromCredentialData,
  createUserAgreementRecord,
  markLatestAgreementSigned,
} from "../lib/user-agreement-records";
import {
  findCredentialProjectMemberForUser,
  findUserCredentialAgreement,
  hasEffectiveProjectMemberRole,
} from "../lib/project-member-user";
import { isValidProjectManagerUserId, isValidTimesheetApproverUserId } from "../lib/timesheet-approver";
import { emailTbosUserInvite } from "../lib/user-invite.js";
import { logProjectFieldChanges, type ProjectSnapshot } from "../lib/project-activity";
import {
  PROJECT_COST_TYPES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
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
import {
  MEMBER_RATE_FREQUENCIES,
  runProjectEstimates,
  syncProjectActualsFromTimesheets,
} from "../lib/project-financials";

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
  source: z.enum(["manual", "timesheet"]).optional(),
});

const memberRateSchema = z.object({
  rateCurrency: z.string().min(1).max(8).optional(),
  rate: z.coerce.number().nonnegative().nullable().optional(),
  rateFrequency: z.enum(MEMBER_RATE_FREQUENCIES).optional(),
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
  ticketPrefix: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Ticket prefix may only contain letters, numbers, and hyphens")
    .optional(),
  ticketNumberDigits: z.coerce.number().int().min(1).max(10).optional(),
  contractId: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fileUrls: z.array(z.string().min(1)).optional().default([]),
  budget: z.coerce.number().nonnegative().nullable().optional(),
  budgetCurrency: z.string().min(1).max(8).nullable().optional(),
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

async function projectHasTickets(projectId: string): Promise<boolean> {
  const org = await prisma.organization.findFirst({
    where: { projectId },
    select: { id: true },
  });
  const hit = await prisma.ticket.findFirst({
    where: org ? { OR: [{ projectId }, { organizationId: org.id }] } : { projectId },
    select: { id: true },
  });
  return Boolean(hit);
}

function normalizedTicketPrefix(raw: string | undefined): string {
  return (raw?.trim() || "TKT").toUpperCase();
}

function normalizedTicketDigits(raw: number | undefined): number {
  const digits = raw ?? 5;
  return digits >= 1 && digits <= 10 ? digits : 5;
}

async function assertTicketSettingsEditable(
  projectId: string,
  existing: { ticketPrefix: string | null; ticketNumberDigits: number | null },
  next: { ticketPrefix: string; ticketNumberDigits: number },
) {
  const prevPrefix = (existing.ticketPrefix ?? "TKT").toUpperCase();
  const prevDigits = existing.ticketNumberDigits ?? 5;
  if (prevPrefix === next.ticketPrefix && prevDigits === next.ticketNumberDigits) {
    return;
  }
  if (await projectHasTickets(projectId)) {
    throw new Error("TICKET_SETTINGS_LOCKED");
  }
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
  source: string;
}) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    qty: toNumber(row.qty),
    currency: row.currency,
    actualCost: toNumber(row.actualCost),
    costType: row.costType,
    source: row.source,
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
  rateCurrency: string;
  rate: { toString(): string } | null;
  rateFrequency: string;
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
    rateCurrency: row.rateCurrency,
    rate: row.rate != null ? toNumber(row.rate) : null,
    rateFrequency: row.rateFrequency,
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
  contractVariationId?: string | null;
  budget?: { toString(): string } | null;
  budgetCurrency?: string | null;
  startDate: Date;
  endDate: Date;
  ticketPrefix?: string;
  ticketNumberDigits?: number;
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
  _count?: { tickets: number };
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
    contractVariationId: row.contractVariationId ?? null,
    budget: row.budget != null ? toNumber(row.budget) : null,
    budgetCurrency: row.budgetCurrency ?? null,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    ticketPrefix: row.ticketPrefix ?? "TKT",
    ticketNumberDigits: row.ticketNumberDigits ?? 5,
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
  ticketSettingsLocked: (row._count?.tickets ?? 0) > 0,
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

/** Timesheet-sourced actuals are rebuilt from approved timesheets, so saves only replace manual rows. */
async function replaceActuals(
  tx: Prisma.TransactionClient,
  projectId: string,
  rows: z.infer<typeof actualSchema>[],
) {
  await tx.projectActual.deleteMany({ where: { projectId, source: { not: "timesheet" } } });
  const manualRows = rows.filter((row) => row.source !== "timesheet");
  if (!manualRows.length) return;
  await tx.projectActual.createMany({
    data: manualRows.map((row) => ({
      projectId,
      year: row.year,
      month: row.month,
      qty: row.qty,
      currency: row.currency,
      actualCost: row.actualCost,
      costType: row.costType,
      source: "manual",
    })),
  });
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
  return prisma.project.findUnique({
    where: { id },
    include: {
      ...detailInclude,
      _count: { select: { tickets: true } },
    },
  });
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    const where: Prisma.ProjectWhereInput = {};
    if (!canManageProjects(role)) {
      const memberships = await prisma.projectMember.findMany({
        where: { adminUserId: getActorId(req) },
        select: { projectId: true },
      });
      if (!memberships.length) return res.json({ data: [] });
      where.id = { in: memberships.map((row) => row.projectId) };
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
        signatureDataUrl: z.string().min(1).max(2_500_000).optional(),
        signatures: z.record(z.string().min(1), z.string().min(1).max(2_500_000)).optional(),
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
      const agreementDates = agreementDatesFromCredentialData(values);
      await markLatestAgreementSigned(tx, {
        adminUserId: userId,
        credentialTemplateId: template.id,
        templateName: template.name,
        projectMemberId: agreement.source === "project_member" ? agreement.memberId : null,
        startDate: agreementDates.startDate,
        endDate: agreementDates.endDate,
        agreementSignedAt: signedAt,
        agreementDocumentUrl: documentUrl,
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

router.get("/:id/tickets", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, kind: true },
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    if (project.kind !== "SUPPORT") {
      return res.json({ data: [] });
    }
    const tickets = await prisma.ticket.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        updatedAt: true,
      },
    });
    res.json({
      data: tickets.map((row) => ({
        ...row,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching project tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
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
          select: { contractValue: true, currency: true },
        })
      : null;
    const estimates = data.estimates ?? [];
    const actuals = data.actuals ?? [];
    const budget = data.budget !== undefined ? data.budget : contract ? toNumber(contract.contractValue) : null;
    const budgetCurrency = data.budgetCurrency ?? contract?.currency ?? (budget != null ? "AUD" : null);

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          projectNumber,
          title: data.title.trim(),
          description: data.description.trim(),
          clientId: data.clientId,
          kind: data.forCustomerSupport ? "SUPPORT" : (data.kind ?? "DELIVERY"),
          status: data.status ?? "DRAFT",
          projectManagerId: data.projectManagerId,
          timesheetApproverUserId,
          contractId: data.contractId ?? null,
          startDate: data.startDate,
          endDate: data.endDate,
          ticketPrefix: normalizedTicketPrefix(data.ticketPrefix),
          ticketNumberDigits: normalizedTicketDigits(data.ticketNumberDigits),
          budget,
          budgetCurrency,
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

    const nextTicketPrefix = normalizedTicketPrefix(data.ticketPrefix ?? existing.ticketPrefix);
    const nextTicketDigits = normalizedTicketDigits(data.ticketNumberDigits ?? existing.ticketNumberDigits);
    const supportEnabled =
      data.forCustomerSupport !== undefined ? data.forCustomerSupport : existing.kind === "SUPPORT";
    if (supportEnabled && !nextTicketPrefix) {
      return res.status(400).json({ error: "Ticket prefix is required for customer support projects" });
    }
    try {
      await assertTicketSettingsEditable(projectId, existing, {
        ticketPrefix: nextTicketPrefix,
        ticketNumberDigits: nextTicketDigits,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "TICKET_SETTINGS_LOCKED") {
        return res.status(400).json({
          error:
            "Ticket prefix and digit settings cannot be changed while this project has tickets. Delete all tickets first.",
        });
      }
      throw error;
    }

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
          ticketPrefix: nextTicketPrefix,
          ticketNumberDigits: nextTicketDigits,
          ...(data.budget !== undefined ? { budget: data.budget } : {}),
          ...(data.budgetCurrency !== undefined ? { budgetCurrency: data.budgetCurrency } : {}),
          fileUrls: data.fileUrls ?? existing.fileUrls ?? [],
        },
      });
      if (data.estimates) await replaceEstimates(tx, projectId, data.estimates);
      if (data.actuals) await replaceActuals(tx, projectId, data.actuals);
      await logProjectFieldChanges(tx, projectId, beforeSnapshot, afterSnapshot, getActorId(req) || null);
      if (afterSnapshot.title !== beforeSnapshot.title) {
        const orgName = `${existing.projectNumber} — ${afterSnapshot.title}`;
        await tx.organization.updateMany({
          where: { projectId },
          data: { name: orgName },
        });
      }
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
        console.error("Customer support settings update failed:", error);
        return res.status(400).json({
          error:
            error instanceof Error ? error.message : "Failed to update customer support settings for this project.",
        });
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
    if (error instanceof Error && error.message === "TICKET_SETTINGS_LOCKED") {
      return res.status(400).json({
        error:
          "Ticket prefix and digit settings cannot be changed while this project has tickets. Delete all tickets first.",
      });
    }
    console.error("Error updating project:", error);
    const message =
      error instanceof Error && error.message ? error.message : "Failed to update project";
    res.status(500).json({ error: message });
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

router.get("/:id/member-user-options", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    if (!canManageProjects(req.user?.role ?? "") && !isProjectManagerRole(req.user?.role ?? "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const existing = await prisma.projectMember.findMany({
      where: { projectId },
      select: { adminUserId: true, profileId: true },
    });
    const excludeUserIds = new Set(existing.map((row) => row.adminUserId).filter(Boolean) as string[]);
    const excludeProfileIds = new Set(existing.map((row) => row.profileId));

    const users = await prisma.adminUser.findMany({
      where: {
        active: true,
        role: { not: "client" },
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ email: "asc" }],
      take: 80,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        additionalRoles: true,
        mappedProfileId: true,
      },
    });

    const data = users
      .filter((user) => {
        if (excludeUserIds.has(user.id)) return false;
        if (user.mappedProfileId && excludeProfileIds.has(user.mappedProfileId)) return false;
        const roles = effectiveRoleList(user.role, user.additionalRoles);
        return !roles.includes("client");
      })
      .map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name?.trim() || user.email,
        phone: user.phone ?? "",
      }));

    res.json({ data });
  } catch (error) {
    console.error("Error fetching member user options:", error);
    res.status(500).json({ error: "Failed to fetch users" });
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

const addMemberSchema = z
  .object({
    profileId: z.string().min(1).optional(),
    adminUserId: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.profileId || data.adminUserId), {
    message: "profileId or adminUserId is required",
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

router.post("/:id/run-estimates", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Invalid id" });
    const role = req.user?.role ?? "";
    if (!canManageProjects(role) && !isProjectManagerRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const count = await runProjectEstimates(projectId);
    await prisma.projectActivityLog.create({
      data: {
        projectId,
        action: "ESTIMATES_RUN",
        newValue: `${count} personnel estimate row(s)`,
        performedById: getActorId(req) || null,
      },
    });
    const detail = await fetchProject(projectId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Project not found" });
    }
    if (error instanceof Error && error.message === "NO_MEMBER_RATES") {
      return res.status(400).json({
        error: "Add a rate to at least one project member before running estimates.",
      });
    }
    console.error("Error running project estimates:", error);
    res.status(500).json({ error: "Failed to run estimates" });
  }
});

router.patch("/:id/members/:memberId", async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    if (!projectId || !memberId) return res.status(400).json({ error: "Invalid id" });
    const role = req.user?.role ?? "";
    if (!canManageProjects(role) && !isProjectManagerRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const body = memberRateSchema.parse(req.body);
    const member = await prisma.projectMember.findFirst({ where: { id: memberId, projectId } });
    if (!member) return res.status(404).json({ error: "Member not found" });

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: {
        ...(body.rateCurrency !== undefined ? { rateCurrency: body.rateCurrency.toUpperCase() } : {}),
        ...(body.rate !== undefined ? { rate: body.rate } : {}),
        ...(body.rateFrequency !== undefined ? { rateFrequency: body.rateFrequency } : {}),
      },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, available: true },
        },
        adminUser: { select: { id: true, email: true, name: true } },
      },
    });
    await syncProjectActualsFromTimesheets(projectId);
    res.json({ data: serializeMember(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating project member rate:", error);
    res.status(500).json({ error: "Failed to update member" });
  }
});

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
    const body = addMemberSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return res.status(404).json({ error: "Not found" });

    let profileId = body.profileId;
    let linkedUserId: string | null = body.adminUserId ?? null;

    if (body.adminUserId) {
      const user = await prisma.adminUser.findUnique({
        where: { id: body.adminUserId },
        select: {
          id: true,
          email: true,
          role: true,
          additionalRoles: true,
          mappedProfileId: true,
        },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      const roles = effectiveRoleList(user.role, user.additionalRoles);
      if (roles.includes("client")) {
        return res.status(400).json({ error: "Client users cannot be added as project members" });
      }
      linkedUserId = user.id;
    }

    if (!profileId && !body.adminUserId) {
      return res.status(400).json({ error: "Profile is required" });
    }

    const member = await prisma.$transaction(async (tx) => {
      if (body.adminUserId && linkedUserId) {
        const fullUser = await tx.adminUser.findUnique({
          where: { id: linkedUserId },
          select: { id: true, email: true, name: true, phone: true },
        });
        if (!fullUser) throw new Error("USER_NOT_FOUND");
        profileId = await ensureCandidateProfileForAdminUser(tx, fullUser);
      }

      if (!profileId) {
        throw new Error("PROFILE_REQUIRED");
      }

      const profile = await tx.candidateProfile.findUnique({
        where: { id: profileId },
        select: { mappedAdminUser: { select: { id: true } } },
      });
      if (!profile) throw new Error("PROFILE_NOT_FOUND");

      if (!linkedUserId) {
        linkedUserId = profile.mappedAdminUser?.id ?? null;
      }

      return tx.projectMember.upsert({
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
    });

    await prisma.projectActivityLog.create({
      data: {
        projectId,
        action: "MEMBER_ADDED",
        newValue: member.profile.email,
        performedById: getActorId(req) || null,
      },
    });

    if (member.adminUserId) {
      try {
        await provisionSupportMemberConsultant(projectId, member.adminUserId, member.id);
      } catch (provisionError) {
        console.error("Support consultant provisioning after add member:", provisionError);
      }
    }

    const detail = await fetchProject(projectId);
    res.status(201).json({
      data: {
        member: serializeMember(member),
        project: detail ? mapDetail(detail) : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return res.status(400).json({ error: "Profile is required" });
    }
    if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (prismaCode === "P2002") {
      const target = (error as { meta?: { target?: string[] } }).meta?.target?.join(", ") ?? "record";
      return res.status(400).json({
        error:
          target.includes("adminUserId")
            ? "This user is already a member of this project."
            : "This profile is already on the project or conflicts with another record.",
      });
    }
    console.error("Error adding project member:", error);
    const message = error instanceof Error ? error.message : "Failed to add member";
    res.status(500).json({ error: message === "Failed to add member" ? message : `Failed to add member: ${message}` });
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
      const { recordTbUserInvite } = await import("../lib/user-profile-invite.js");
      await recordTbUserInvite(adminUser.id);
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
      await createUserAgreementRecord(tx, {
        adminUserId: member.adminUserId!,
        credentialTemplateId: template.id,
        templateName: template.name,
        projectId,
        projectMemberId: member.id,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
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
    const [adminUsers, customerUsers] = await Promise.all([
      prisma.adminUser.findMany({
        where: { mappedClientContactId: { in: contacts.map((c) => c.id) } },
        select: { id: true, email: true, mappedClientContactId: true },
      }),
      prisma.customerUser.findMany({
        where: { mappedClientContactId: { in: contacts.map((c) => c.id) } },
        select: { id: true, email: true, mappedClientContactId: true },
      }),
    ]);
    const userByContact = new Map<string, { id: string; email: string }>();
    for (const row of customerUsers) {
      if (row.mappedClientContactId) userByContact.set(row.mappedClientContactId, { id: row.id, email: row.email });
    }
    for (const row of adminUsers) {
      if (row.mappedClientContactId && !userByContact.has(row.mappedClientContactId)) {
        userByContact.set(row.mappedClientContactId, { id: row.id, email: row.email });
      }
    }
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
