import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { ADMIN_ROLES_LIST, assertCanModifyAdminUser, isAdminRole } from "../lib/admin-roles";
import { logAdminUserFieldChange } from "../lib/admin-user-activity";
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

const router: IRouter = Router();

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(1).max(50),
  relation: z.string().max(100).optional(),
});

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
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(200).optional().nullable(),
  phone: z.string().min(1).max(50).optional(),
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
  bankDetails: bankDetailsUpdateSchema.optional(),
  emergencyContacts: z.array(emergencyContactSchema).max(5).optional(),
  mappedClientContactId: z.string().min(1).optional().nullable(),
  mappedProfileId: z.string().min(1).optional().nullable(),
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
  };
}

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.adminUser.findMany({
      orderBy: { email: "asc" },
      select: listSelect,
    });
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

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: req.params.id },
      select: detailSelect,
    });
    if (!row) return res.status(404).json({ error: "Not found" });

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
        agreementTemplate,
        agreementFiles: row.agreementDocumentUrl
          ? [{ name: "Signed contract / agreement", url: row.agreementDocumentUrl }]
          : [],
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

router.post("/", async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
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
          mfaEnabled: true,
        },
        select: listSelect,
      });
      if (mappedProfileId) {
        await applyMappedProfile(tx, created.id, mappedProfileId);
      }
      return created;
    });
    let inviteEmailSent = false;
    try {
      await emailTbosUserInvite({
        to: row.email,
        name: row.name || row.email,
        temporaryPassword: data.password,
      });
      inviteEmailSent = true;
    } catch (emailErr) {
      console.error("User invite email failed:", emailErr);
    }

    res.status(201).json({ data: { ...sanitizeUser(row), inviteEmailSent } });
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
