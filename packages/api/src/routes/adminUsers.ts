import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { ADMIN_ROLES_LIST, assertCanModifyAdminUser, isAdminRole } from "../lib/admin-roles";
import { logAdminUserCreated, logAdminUserFieldChange } from "../lib/admin-user-activity";
import { adminUserFieldLabel } from "../lib/admin-user-field-labels";
import {
  assertMappedContactAvailable,
  rolesIncludeClient,
} from "../lib/admin-user-contact-map";
import {
  applyMappedProfile,
  assertMappedProfileAvailable,
} from "../lib/admin-user-profile-map";
import { candidateProfileSearchWhere } from "../lib/profile-search";
import { deleteAdminUserCompletely } from "../lib/delete-admin-user.js";
import { emailTbosUserInvite } from "../lib/user-invite.js";
import {
  assignCredentialTemplateSchema,
  assignCredentialTemplateToAdminUser,
  credentialDefaultsForAdminUser,
} from "../lib/assign-credential-template";
import { buildAgreementRecordsForUser } from "../lib/user-agreement-records";
import {
  profileKycFieldsFromMergedProfile,
  syncAdminUserProfileKycStatus,
} from "../lib/admin-user-profile-kyc";
import { resetMfaForAdminUser } from "../lib/admin-reset-user-mfa.js";

const router: IRouter = Router();

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(1).max(50),
  relation: z.string().max(100).optional(),
});

function sanitizeEmergencyContactsInput(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.filter((row) => {
    if (!row || typeof row !== "object") return false;
    const record = row as Record<string, unknown>;
    return (
      typeof record.name === "string" &&
      record.name.trim() &&
      typeof record.email === "string" &&
      record.email.trim() &&
      typeof record.phone === "string" &&
      record.phone.trim()
    );
  });
}

function sanitizeBankDetailsInput(value: unknown) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  const row = value as Record<string, unknown>;
  const keys = ["bankName", "accountName", "accountNumber", "country", "bsb", "swiftCode", "notes"] as const;
  const hasValue = keys.some((key) => typeof row[key] === "string" && row[key]!.trim());
  if (!hasValue) return null;
  return value;
}

const bankDetailsSchema = z.object({
  bankName: z.string().min(1).max(200),
  accountName: z.string().min(1).max(200),
  accountNumber: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  swiftCode: z.string().max(50).optional(),
  bsb: z.string().min(1).max(50),
  notes: z.string().max(2000).optional(),
});

const bankDetailsUpdateSchema = z
  .object({
    bankName: z.string().max(200).optional(),
    accountName: z.string().max(200).optional(),
    accountNumber: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    swiftCode: z.string().max(50).optional(),
    bsb: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
  })
  .nullable();

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  phone: z.string().min(1).max(50),
  password: z.string().min(8),
  role: z.enum(ADMIN_ROLES_LIST).default("website"),
  additionalRoles: z.array(z.enum(ADMIN_ROLES_LIST)).max(10).optional(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  active: z.boolean().default(true),
  passwordNeedsReset: z.boolean().default(false),
  mappedClientContactId: z.string().min(1).optional().nullable(),
  mappedProfileId: z.string().min(1).optional().nullable(),
  taxNumber: z.string().max(50).optional(),
  requireProfileAfterFirstLogin: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(200).optional().nullable(),
  phone: z.preprocess(
    (val) => (typeof val === "string" && !val.trim() ? undefined : val),
    z.string().min(1).max(50).optional(),
  ),
  password: z.string().min(8).optional(),
  role: z.enum(ADMIN_ROLES_LIST).optional(),
  additionalRoles: z.array(z.enum(ADMIN_ROLES_LIST)).max(10).optional(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
  passwordNeedsReset: z.boolean().optional(),
  addressLine1: z.string().max(300).optional().nullable(),
  addressLine2: z.string().max(300).optional().nullable(),
  suburb: z.string().max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  bankDetails: z.preprocess(sanitizeBankDetailsInput, bankDetailsUpdateSchema.optional()),
  emergencyContacts: z
    .preprocess(sanitizeEmergencyContactsInput, z.array(emergencyContactSchema).max(5).optional())
    .optional(),
  mappedClientContactId: z.string().min(1).optional().nullable(),
  mappedProfileId: z.string().min(1).optional().nullable(),
  taxNumber: z.string().min(1).max(50).optional(),
  requireProfileAfterFirstLogin: z.boolean().optional(),
  userFiles: z
    .array(z.object({ name: z.string().min(1).max(500), url: z.string().min(1).max(2000) }))
    .max(50)
    .optional(),
});

const listSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  additionalRoles: true,
  profilePhotoUrl: true,
  active: true,
  mfaEnabled: true,
  mfaEnrolledAt: true,
  passwordNeedsReset: true,
  createdAt: true,
  updatedAt: true,
  requireProfileAfterFirstLogin: true,
  profileKycStatus: true,
} as const;

function parseAdditionalRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is string => typeof r === "string" && isAdminRole(r));
}

function sanitizeUser(row: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  additionalRoles?: unknown;
  profilePhotoUrl?: string | null;
  active: boolean;
  mfaEnabled: boolean;
  mfaEnrolledAt: Date | null;
  passwordNeedsReset: boolean;
  requireProfileAfterFirstLogin: boolean;
  profileKycStatus: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    additionalRoles: parseAdditionalRoles(row.additionalRoles),
    profilePhotoUrl: row.profilePhotoUrl ?? null,
    active: row.active,
    mfaEnabled: row.mfaEnabled,
    mfaEnrolledAt: row.mfaEnrolledAt?.toISOString() ?? null,
    passwordNeedsReset: row.passwordNeedsReset,
    requireProfileAfterFirstLogin: row.requireProfileAfterFirstLogin,
    profileKycStatus: row.profileKycStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const detailSelect = {
  ...listSelect,
  addressLine1: true,
  addressLine2: true,
  suburb: true,
  postcode: true,
  city: true,
  state: true,
  country: true,
  bankDetails: true,
  emergencyContacts: true,
  agreementDocumentUrl: true,
  profileDetailsCompletedAt: true,
  mappedClientContactId: true,
  mappedProfileId: true,
  mappedProfile: { select: { id: true, firstName: true, lastName: true, email: true } },
  idProofUrl: true,
  addressProofUrl: true,
  userFiles: true,
  taxNumber: true,
} as const;

function sanitizeDetail(row: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  additionalRoles?: unknown;
  profilePhotoUrl?: string | null;
  active: boolean;
  mfaEnabled: boolean;
  mfaEnrolledAt: Date | null;
  passwordNeedsReset: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bankDetails: unknown;
  emergencyContacts: unknown;
  agreementDocumentUrl: string | null;
  profileDetailsCompletedAt: Date | null;
  mappedClientContactId: string | null;
  mappedProfileId: string | null;
  mappedProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  idProofUrl: string | null;
  addressProofUrl: string | null;
  userFiles: unknown;
  taxNumber?: string | null;
  requireProfileAfterFirstLogin: boolean;
  profileKycStatus: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...sanitizeUser(row),
    mappedClientContactId: row.mappedClientContactId,
    mappedProfileId: row.mappedProfileId,
    mappedProfileLabel: row.mappedProfile
      ? `${row.mappedProfile.firstName} ${row.mappedProfile.lastName}`.trim() +
        ` (${row.mappedProfile.email})`
      : null,
    idProofUrl: row.idProofUrl,
    addressProofUrl: row.addressProofUrl,
    userFiles: Array.isArray(row.userFiles) ? row.userFiles : [],
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    suburb: row.suburb,
    postcode: row.postcode,
    city: row.city,
    state: row.state,
    country: row.country,
    bankDetails: row.bankDetails ?? null,
    emergencyContacts: Array.isArray(row.emergencyContacts) ? row.emergencyContacts : [],
    agreementDocumentUrl: row.agreementDocumentUrl,
    profileDetailsCompletedAt: row.profileDetailsCompletedAt?.toISOString() ?? null,
    taxNumber: row.taxNumber ?? "",
    requireProfileAfterFirstLogin: row.requireProfileAfterFirstLogin,
    profileKycStatus: row.profileKycStatus,
  };
}

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.adminUser.findMany({
      where: { role: { not: "client" } },
      orderBy: { email: "asc" },
      select: listSelect,
    });
    for (const row of rows) {
      if (row.profileKycStatus !== "COMPLETE") {
        const synced = await syncAdminUserProfileKycStatus(row.id);
        if (synced) row.profileKycStatus = synced.profileKycStatus;
      }
    }
    res.json({ data: rows.map(sanitizeUser) });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/profile-map-options", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const where = candidateProfileSearchWhere(q);
    if (q.length > 0 && Object.keys(where).length === 0) {
      return res.json({ data: [] });
    }

    const rows = await prisma.candidateProfile.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mappedAdminUser: { select: { id: true, email: true } },
      },
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        label: `${row.firstName} ${row.lastName}`.trim() + ` (${row.email})`,
        mappedUserId: row.mappedAdminUser?.id ?? null,
        mappedUserEmail: row.mappedAdminUser?.email ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile map options:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.get("/contact-map-options", async (_req, res) => {
  try {
    const rows = await prisma.clientContact.findMany({
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        client: { select: { name: true } },
        mappedAdminUser: { select: { id: true, email: true } },
      },
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        label: `${row.client.name} — ${row.name} (${row.email})`,
        mappedUserId: row.mappedAdminUser?.id ?? null,
        mappedUserEmail: row.mappedAdminUser?.email ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching contact map options:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.get("/:id/activity", async (req, res) => {
  try {
    const rows = await prisma.adminUserActivityLog.findMany({
      where: { adminUserId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { performedBy: { select: { name: true, email: true } } },
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        action: row.action,
        fieldName: row.fieldName,
        fieldLabel: adminUserFieldLabel(row.fieldName),
        oldValue: row.oldValue,
        newValue: row.newValue,
        performedByName: row.performedBy?.name || row.performedBy?.email || "",
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

router.get("/:id/credential-defaults", async (req, res) => {
  try {
    const defaults = await credentialDefaultsForAdminUser(req.params.id);
    res.json({ data: defaults });
  } catch (error) {
    console.error("Error fetching user credential defaults:", error);
    res.status(500).json({ error: "Failed to load defaults" });
  }
});

router.post("/:id/assign-template", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const input = assignCredentialTemplateSchema.parse(req.body);
    const result = await assignCredentialTemplateToAdminUser(userId, input);
    if (result.error) {
      const status = result.error === "User not found" ? 404 : 400;
      return res.status(status).json({ error: result.error });
    }
    res.json({ message: "Template assigned" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error assigning user template:", error);
    res.status(500).json({ error: "Failed to assign template" });
  }
});

router.post("/:id/invite", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    if (!user.active) return res.status(400).json({ error: "User is inactive" });

    const temporaryPassword = randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const normalizedEmail = user.email.trim().toLowerCase();
    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: userId },
        data: { passwordHash, passwordNeedsReset: true, email: normalizedEmail },
      }),
      prisma.customerUser.updateMany({
        where: {
          OR: [{ id: userId }, { email: { equals: user.email, mode: "insensitive" } }],
        },
        data: { passwordHash, passwordNeedsReset: true, email: normalizedEmail },
      }),
    ]);

    try {
      await emailTbosUserInvite({
        to: user.email,
        name: user.name || user.email,
        temporaryPassword,
        context: user.role === "client" ? "client" : "project_member",
      });
      if (user.role !== "client") {
        const { recordTbUserInvite } = await import("../lib/user-profile-invite.js");
        await recordTbUserInvite(userId);
      }
    } catch (emailErr) {
      console.error("User invite email failed:", emailErr);
      const message =
        emailErr instanceof Error ? emailErr.message : "Failed to send invite email";
      return res.status(502).json({
        error: `${message} The user's password was reset — share the temporary password manually, or fix TBOS_MAIL_FROM / Resend domain verification and try again.`,
        inviteEmailSent: false,
        temporaryPassword,
        passwordReset: true,
      });
    }

    res.json({
      message:
        "Invite email sent. A new temporary password replaced any previous password on this account.",
      passwordReset: true,
      passwordReplaced: true,
      inviteEmailSent: true,
    });
  } catch (error) {
    console.error("Error sending user invite:", error);
    const message = error instanceof Error ? error.message : "Failed to send invite email";
    res.status(500).json({ error: message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: req.params.id },
      select: detailSelect,
    });
    if (!row) return res.status(404).json({ error: "Not found" });

    const synced = await syncAdminUserProfileKycStatus(row.id);
    const profileKycStatus = synced?.profileKycStatus ?? row.profileKycStatus;

    const agreementRecords = await buildAgreementRecordsForUser(row.id);

    const memberWhere: { OR: Array<{ adminUserId: string } | { profileId: string }> } = {
      OR: [{ adminUserId: row.id }],
    };
    if (row.mappedProfileId) {
      memberWhere.OR.push({ profileId: row.mappedProfileId });
    }
    const agreementMembers = await prisma.projectMember.findMany({
      where: { ...memberWhere, credentialTemplateId: { not: null } },
      select: { agreementSignedAt: true },
    });
    const userAssignment = await prisma.adminUserCredentialAssignment.findUnique({
      where: { adminUserId: row.id },
      select: { agreementSignedAt: true, credentialTemplateId: true },
    });
    const sentFromMembers = agreementMembers.length;
    const signedFromMembers = agreementMembers.filter((m) => m.agreementSignedAt).length;
    const sentFromUser = userAssignment?.credentialTemplateId ? 1 : 0;
    const signedFromUser = userAssignment?.agreementSignedAt ? 1 : 0;
    const agreementTemplate = {
      templatesSent: sentFromMembers + sentFromUser,
      templatesSigned: signedFromMembers + signedFromUser,
    };

    let membership = await prisma.projectMember.findFirst({
      where: { adminUserId: row.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectId: true,
        credentialTemplateId: true,
        agreementSignedAt: true,
        project: { select: { projectNumber: true, title: true } },
        profile: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!membership && row.mappedProfileId) {
      membership = await prisma.projectMember.findFirst({
        where: { profileId: row.mappedProfileId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          projectId: true,
          credentialTemplateId: true,
          agreementSignedAt: true,
          project: { select: { projectNumber: true, title: true } },
          profile: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    }

    res.json({
      data: {
        ...sanitizeDetail(row),
        profileKycStatus,
        agreementTemplate,
        agreementRecords,
        agreementFiles: [],
        projectMembership: membership
          ? {
              memberId: membership.id,
              projectId: membership.projectId,
              projectLabel: `${membership.project.projectNumber} — ${membership.project.title}`,
              profileName: `${membership.profile.firstName} ${membership.profile.lastName}`.trim(),
              profileEmail: membership.profile.email,
              templateAssigned: Boolean(membership.credentialTemplateId),
              templateSigned: Boolean(membership.agreementSignedAt),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/:id/agreements/offline", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const input = z
      .object({
        credentialTemplateId: z.string().min(1),
        templateName: z.string().min(1).max(200).optional(),
        documentUrl: z.string().min(1),
        signedAt: z.coerce.date().optional(),
        startDate: z.coerce.date().optional().nullable(),
        endDate: z.coerce.date().optional().nullable(),
        projectId: z.string().optional().nullable(),
        projectMemberId: z.string().optional().nullable(),
      })
      .parse(req.body);

    const user = await prisma.adminUser.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const template = await prisma.credentialTemplate.findUnique({
      where: { id: input.credentialTemplateId },
      select: { id: true, name: true },
    });
    if (!template) return res.status(400).json({ error: "Template not found" });

    const signedAt = input.signedAt ?? new Date();
    await prisma.$transaction(async (tx) => {
      await tx.adminUserAgreementRecord.create({
        data: {
          adminUserId: userId,
          credentialTemplateId: template.id,
          templateName: input.templateName?.trim() || template.name,
          projectId: input.projectId ?? null,
          projectMemberId: input.projectMemberId ?? null,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          agreementSignedAt: signedAt,
          agreementDocumentUrl: input.documentUrl,
        },
      });
      await tx.adminUser.update({
        where: { id: userId },
        data: { agreementDocumentUrl: input.documentUrl },
      });
    });

    const agreementRecords = await buildAgreementRecordsForUser(userId);
    res.json({ data: { agreementRecords } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error recording offline agreement:", error);
    res.status(500).json({ error: "Failed to record offline agreement" });
  }
});

const agreementRecordPatchSchema = z.object({
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  status: z.enum(["awaiting_signature", "signed"]).optional(),
});

router.patch("/:id/agreements/:recordId", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const recordId = req.params.recordId;
    if (!userId || !recordId) return res.status(400).json({ error: "Invalid id" });
    const input = agreementRecordPatchSchema.parse(req.body);

    const record = await prisma.adminUserAgreementRecord.findFirst({
      where: { id: recordId, adminUserId: userId },
    });
    if (!record) return res.status(404).json({ error: "Agreement record not found" });

    const data: {
      startDate?: Date | null;
      endDate?: Date | null;
      agreementSignedAt?: Date | null;
      agreementDocumentUrl?: string | null;
    } = {};
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    if (input.status === "awaiting_signature") {
      data.agreementSignedAt = null;
      data.agreementDocumentUrl = null;
    } else if (input.status === "signed") {
      if (!record.agreementDocumentUrl) {
        return res.status(400).json({ error: "Upload a signed document before marking as signed" });
      }
      data.agreementSignedAt = record.agreementSignedAt ?? new Date();
    }

    await prisma.adminUserAgreementRecord.update({ where: { id: recordId }, data });
    const agreementRecords = await buildAgreementRecordsForUser(userId);
    res.json({ data: { agreementRecords } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating agreement record:", error);
    res.status(500).json({ error: "Failed to update agreement record" });
  }
});

router.delete("/:id/agreements/:recordId", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const recordId = req.params.recordId;
    if (!userId || !recordId) return res.status(400).json({ error: "Invalid id" });

    const record = await prisma.adminUserAgreementRecord.findFirst({
      where: { id: recordId, adminUserId: userId },
    });
    if (!record) return res.status(404).json({ error: "Agreement record not found" });

    await prisma.adminUserAgreementRecord.delete({ where: { id: recordId } });
    const agreementRecords = await buildAgreementRecordsForUser(userId);
    res.json({ data: { agreementRecords } });
  } catch (error) {
    console.error("Error deleting agreement record:", error);
    res.status(500).json({ error: "Failed to delete agreement record" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.role === "client") {
      return res.status(400).json({
        error: "Client portal accounts are managed under Customer users. Create them from a client contact instead.",
      });
    }
    const additionalRoles = data.additionalRoles?.length ? data.additionalRoles : [];
    const needsContact = rolesIncludeClient(data.role, additionalRoles);
    const mappedId = data.mappedClientContactId?.trim() || null;
    const mappedProfileId = data.mappedProfileId?.trim() || null;
    if (mappedProfileId) {
      const mapError = await assertMappedProfileAvailable(mappedProfileId);
      if (mapError) return res.status(409).json({ error: mapError });
    }

    if (needsContact && !mappedId) {
      return res.status(400).json({ error: "Map to contact record is required when the Client role is selected" });
    }
    if (!needsContact && mappedId) {
      return res.status(400).json({ error: "Remove the contact mapping when the Client role is not selected" });
    }
    if (mappedId) {
      const mapError = await assertMappedContactAvailable(mappedId);
      if (mapError) return res.status(409).json({ error: mapError });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const actorId = req.user?.impersonatorId ?? req.user?.id ?? null;
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.adminUser.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          phone: data.phone.trim(),
          passwordHash,
          role: data.role,
          additionalRoles: additionalRoles.length ? additionalRoles : undefined,
          profilePhotoUrl: data.profilePhotoUrl ?? null,
          active: data.active,
          passwordNeedsReset: data.passwordNeedsReset,
          mappedClientContactId: mappedId,
          mappedProfileId,
          taxNumber: data.taxNumber?.trim() || null,
          mfaEnabled: true,
          requireProfileAfterFirstLogin: data.requireProfileAfterFirstLogin ?? true,
          profileKycStatus: "INCOMPLETE",
        },
        select: listSelect,
      });
      if (mappedProfileId) {
        await applyMappedProfile(tx, created.id, mappedProfileId);
      }
      await logAdminUserCreated(tx, created.id, actorId, created.email);
      return created;
    });
    res.status(201).json({ data: { ...sanitizeUser(row), inviteEmailSent: false } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating admin user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const guardError = await assertCanModifyAdminUser(
      req.user?.impersonatorId ?? req.user?.id ?? "",
      req.params.id ?? "",
      {
      role: data.role,
      active: data.active,
    });
    if (guardError) {
      return res.status(400).json({ error: guardError });
    }

    const actorId = req.user?.impersonatorId ?? req.user?.id ?? "";

    const nextRole = data.role ?? existing.role;
    const nextAdditional =
      data.additionalRoles !== undefined
        ? data.additionalRoles
        : parseAdditionalRoles(existing.additionalRoles);
    const needsContact = rolesIncludeClient(nextRole, nextAdditional);
    const mappedId =
      data.mappedClientContactId !== undefined
        ? data.mappedClientContactId?.trim() || null
        : existing.mappedClientContactId;

    if (needsContact && !mappedId) {
      return res.status(400).json({ error: "Map to contact record is required when the Client role is selected" });
    }
    if (!needsContact && mappedId) {
      return res.status(400).json({ error: "Remove the contact mapping when the Client role is not selected" });
    }
    if (mappedId && mappedId !== existing.mappedClientContactId) {
      const mapError = await assertMappedContactAvailable(mappedId, existing.id);
      if (mapError) return res.status(409).json({ error: mapError });
    }

    const nextMappedProfileId =
      data.mappedProfileId !== undefined
        ? data.mappedProfileId?.trim() || null
        : existing.mappedProfileId;
    if (nextMappedProfileId && nextMappedProfileId !== existing.mappedProfileId) {
      const mapError = await assertMappedProfileAvailable(nextMappedProfileId, existing.id);
      if (mapError) return res.status(409).json({ error: mapError });
    }

    const row = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      const logField = async (field: string, oldVal: string | null, newVal: string | null) => {
        await logAdminUserFieldChange(tx, existing.id, actorId, field, oldVal, newVal);
      };

      if (data.email !== undefined && data.email !== existing.email) {
        updateData.email = data.email;
        await logField("email", existing.email, data.email);
      }
      if (data.name !== undefined && data.name !== existing.name) {
        updateData.name = data.name;
        await logField("name", existing.name, data.name);
      }
      if (data.phone !== undefined && data.phone.trim() !== (existing.phone ?? "")) {
        updateData.phone = data.phone.trim();
        await logField("phone", existing.phone, data.phone.trim());
      }
      if (data.taxNumber !== undefined && data.taxNumber.trim() !== (existing.taxNumber ?? "")) {
        updateData.taxNumber = data.taxNumber.trim();
        await logField("taxNumber", existing.taxNumber, data.taxNumber.trim());
      }
      if (data.role !== undefined && data.role !== existing.role) {
        updateData.role = data.role;
        await logField("role", existing.role, data.role);
      }
      if (data.additionalRoles !== undefined) {
        const oldJson = JSON.stringify(parseAdditionalRoles(existing.additionalRoles));
        const newJson = JSON.stringify(data.additionalRoles);
        if (oldJson !== newJson) {
          updateData.additionalRoles = data.additionalRoles;
          await logField("additionalRoles", oldJson, newJson);
        }
      }
      if (data.profilePhotoUrl !== undefined && data.profilePhotoUrl !== existing.profilePhotoUrl) {
        updateData.profilePhotoUrl = data.profilePhotoUrl;
        await logField("profilePhotoUrl", existing.profilePhotoUrl, data.profilePhotoUrl);
      }
      if (data.active !== undefined && data.active !== existing.active) {
        updateData.active = data.active;
        await logField("active", String(existing.active), String(data.active));
      }
      if (data.passwordNeedsReset !== undefined && data.passwordNeedsReset !== existing.passwordNeedsReset) {
        updateData.passwordNeedsReset = data.passwordNeedsReset;
        await logField(
          "passwordNeedsReset",
          String(existing.passwordNeedsReset),
          String(data.passwordNeedsReset),
        );
      }
      const addressFields = [
        "addressLine1",
        "addressLine2",
        "suburb",
        "postcode",
        "city",
        "state",
        "country",
      ] as const;
      for (const field of addressFields) {
        if (data[field] === undefined) continue;
        const oldVal = (existing[field] as string | null) ?? null;
        const newVal = data[field] ?? null;
        if (oldVal !== newVal) {
          updateData[field] = newVal;
          await logField(field, oldVal, newVal);
        }
      }
      if (data.emergencyContacts !== undefined) {
        const oldJson = JSON.stringify(existing.emergencyContacts ?? []);
        const newJson = JSON.stringify(data.emergencyContacts);
        if (oldJson !== newJson) {
          updateData.emergencyContacts = data.emergencyContacts;
          await logField("emergencyContacts", oldJson, newJson);
        }
      }
      if (data.bankDetails !== undefined) {
        const oldJson = JSON.stringify(existing.bankDetails ?? null);
        const newJson = JSON.stringify(data.bankDetails);
        if (oldJson !== newJson) {
          updateData.bankDetails = data.bankDetails;
          await logField("bankDetails", oldJson, newJson);
        }
      }
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
        await logField("password", "(hidden)", "(updated)");
      }
      if (data.userFiles !== undefined) {
        const oldJson = JSON.stringify(existing.userFiles ?? []);
        const newJson = JSON.stringify(data.userFiles);
        if (oldJson !== newJson) {
          updateData.userFiles = data.userFiles;
          await logField("userFiles", oldJson, newJson);
        }
      }
      if (
        data.mappedClientContactId !== undefined ||
        data.role !== undefined ||
        data.additionalRoles !== undefined
      ) {
        const newMapped = needsContact ? mappedId : null;
        if (newMapped !== existing.mappedClientContactId) {
          updateData.mappedClientContactId = newMapped;
          await logField(
            "mappedClientContactId",
            existing.mappedClientContactId,
            newMapped,
          );
        }
      }
      if (data.mappedProfileId !== undefined && nextMappedProfileId !== existing.mappedProfileId) {
        updateData.mappedProfileId = nextMappedProfileId;
        await logField("mappedProfileId", existing.mappedProfileId, nextMappedProfileId);
      }
      if (
        data.requireProfileAfterFirstLogin !== undefined &&
        data.requireProfileAfterFirstLogin !== existing.requireProfileAfterFirstLogin
      ) {
        updateData.requireProfileAfterFirstLogin = data.requireProfileAfterFirstLogin;
        await logField(
          "requireProfileAfterFirstLogin",
          String(existing.requireProfileAfterFirstLogin),
          String(data.requireProfileAfterFirstLogin),
        );
      }

      const mergedForKyc = {
        addressLine1: (updateData.addressLine1 as string | null | undefined) ?? existing.addressLine1,
        city: (updateData.city as string | null | undefined) ?? existing.city,
        state: (updateData.state as string | null | undefined) ?? existing.state,
        postcode: (updateData.postcode as string | null | undefined) ?? existing.postcode,
        country: (updateData.country as string | null | undefined) ?? existing.country,
        bankDetails: updateData.bankDetails !== undefined ? updateData.bankDetails : existing.bankDetails,
        idProofUrl: existing.idProofUrl,
        addressProofUrl: existing.addressProofUrl,
        emergencyContacts:
          updateData.emergencyContacts !== undefined
            ? updateData.emergencyContacts
            : existing.emergencyContacts,
        taxNumber: (updateData.taxNumber as string | undefined) ?? existing.taxNumber,
        profileDetailsCompletedAt: existing.profileDetailsCompletedAt,
      };
      const kyc = profileKycFieldsFromMergedProfile(mergedForKyc);
      if (kyc.profileKycStatus !== existing.profileKycStatus) {
        updateData.profileKycStatus = kyc.profileKycStatus;
        await logField("profileKycStatus", existing.profileKycStatus, kyc.profileKycStatus);
      }
      const existingCompletedAt = existing.profileDetailsCompletedAt?.toISOString() ?? null;
      const nextCompletedAt = kyc.profileDetailsCompletedAt?.toISOString() ?? null;
      if (existingCompletedAt !== nextCompletedAt) {
        updateData.profileDetailsCompletedAt = kyc.profileDetailsCompletedAt;
        await logField("profileDetailsCompletedAt", existingCompletedAt, nextCompletedAt);
      }

      const updated = await tx.adminUser.update({
        where: { id: existing.id },
        data: updateData,
        select: detailSelect,
      });

      if (data.mappedProfileId !== undefined && nextMappedProfileId !== existing.mappedProfileId) {
        await applyMappedProfile(tx, existing.id, nextMappedProfileId);
      }

      return updated;
    });

    res.json({ data: sanitizeDetail(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0];
      const hint = first ? `${first.path.join(".")}: ${first.message}` : "Invalid request";
      return res.status(400).json({ error: hint, details: error.errors });
    }
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return res.status(409).json({ error: "That email address is already in use" });
    }
    console.error("Error updating admin user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/:id/reset-mfa", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "User id is required" });
    if (req.user?.id === userId && !req.user?.impersonatorId) {
      return res.status(400).json({
        error: "Use Settings → Security to change your own MFA, or ask another administrator.",
      });
    }

    const actorId = req.user?.impersonatorId ?? req.user?.id ?? "";
    const guardError = await assertCanModifyAdminUser(actorId, userId, {});
    if (guardError) return res.status(400).json({ error: guardError });

    const existing = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, mfaEnrolledAt: true, totpSecretEnc: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const result = await resetMfaForAdminUser(userId);
    if (!result) return res.status(404).json({ error: "Not found" });

    await prisma.$transaction(async (tx) => {
      await logAdminUserFieldChange(
        tx,
        userId,
        actorId,
        "mfaEnrolledAt",
        existing.mfaEnrolledAt?.toISOString() ?? (existing.totpSecretEnc ? "enrolled" : null),
        "reset by administrator",
      );
    });

    res.json({
      message: result.hadEnrollment
        ? "MFA has been reset. The user must set up authenticator again on next sign-in."
        : "MFA enrollment cleared. The user will set up authenticator on next sign-in.",
      data: {
        mfaEnabled: result.mfaEnabled,
        mfaEnrolledAt: result.mfaEnrolledAt,
      },
    });
  } catch (error) {
    console.error("Error resetting user MFA:", error);
    res.status(500).json({ error: "Failed to reset MFA" });
  }
});

router.post("/:id/deactivate", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "User id is required" });
    const actorId = req.user?.impersonatorId ?? req.user?.id ?? "";
    const guardError = await assertCanModifyAdminUser(actorId, userId, { active: false });
    if (guardError) return res.status(400).json({ error: guardError });

    const existing = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (!existing.active) return res.json({ data: { active: false } });

    await prisma.$transaction(async (tx) => {
      await tx.adminUser.update({ where: { id: userId }, data: { active: false } });
      await logAdminUserFieldChange(tx, userId, actorId, "active", "true", "false");
    });
    res.json({ data: { active: false } });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "User id is required" });
    if (req.user?.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const target = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: "Not found" });

    if (target.role === "admin" && target.active) {
      const adminCount = await prisma.adminUser.count({ where: { role: "admin", active: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last active administrator" });
      }
    }

    try {
      await deleteAdminUserCompletely(userId);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
      if (code === "PROJECT_MANAGER") {
        return res.status(400).json({
          error: "Reassign project manager on all projects before deleting this user",
        });
      }
      if (code === "TIMESHEET_APPROVER") {
        return res.status(400).json({
          error: "Reassign timesheet approver on all projects before deleting this user",
        });
      }
      throw err;
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export { router as adminUserRoutes };
