import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@techbubble/database";
import {
  authMiddleware,
  generateToken,
  generateMfaPendingToken,
  generateMfaSetupRequiredToken,
  generatePasswordResetRequiredToken,
  MFA_SETUP_REQUIRED_PURPOSE,
  verifyMfaPendingToken,
  type AuthRequest,
} from "../middleware/auth";
import {
  createTotpEnrollment,
  encryptTotpSecret,
  verifyUserTotpCode,
} from "../lib/mfa";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import { createFullSessionTokenForUserId, sessionAuthUser } from "../lib/admin-session-token.js";
import { findMfaAccountById, mfaSessionUser, syncClientAdminMfa } from "../lib/mfa-account.js";
import { logAdminUserFieldChange } from "../lib/admin-user-activity";
import { adminUserFieldLabel } from "../lib/admin-user-field-labels";
import { effectiveRoleList, effectiveRolesForUser, hasEffectiveRole } from "../lib/admin-roles";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from "../lib/password-reset";
import { sendPasswordResetEmail } from "../lib/mail";
import { tbosLoginUrl } from "../lib/user-invite";
const router: IRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const mfaCodeSchema = z.object({
  code: z.string().min(6).max(8),
});

const mfaVerifyLoginSchema = mfaCodeSchema.extend({
  mfaToken: z.string().min(1),
});

const mfaDisableSchema = mfaCodeSchema.extend({
  password: z.string().min(1),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordWithTokenSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8),
});

function publicUser(user: {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  mfaEnabled: boolean;
  passwordNeedsReset?: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name?.trim() || null,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    passwordNeedsReset: user.passwordNeedsReset ?? false,
  };
}

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = parsed.email.trim().toLowerCase();
    const password = parsed.password;

    const customer = await prisma.customerUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        active: true,
        passwordHash: true,
        passwordNeedsReset: true,
        mfaEnabled: true,
        totpSecretEnc: true,
      },
    });
    if (customer?.passwordHash) {
      if (customer.active === false) {
        return res.status(401).json({ error: "Account is disabled" });
      }
      const validCustomer = await bcrypt.compare(password, customer.passwordHash);
      if (!validCustomer) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const customerPublic = publicUser({ ...customer, role: "client" });
      if (customer.passwordNeedsReset) {
        const resetToken = generatePasswordResetRequiredToken({
          id: customer.id,
          email: customer.email,
          role: "client",
        });
        return res.json({
          message: "Password reset required",
          data: {
            requiresPasswordReset: true,
            token: resetToken,
            user: customerPublic,
          },
        });
      }
      if (customer.mfaEnabled && customer.totpSecretEnc) {
        const mfaToken = generateMfaPendingToken({
          id: customer.id,
          email: customer.email,
          role: "client",
        });
        return res.json({
          message: "MFA required",
          data: {
            requiresMfa: true,
            mfaToken,
            user: customerPublic,
          },
        });
      }
      const setupToken = generateMfaSetupRequiredToken({
        id: customer.id,
        email: customer.email,
        role: "client",
      });
      return res.json({
        message: "MFA setup required",
        data: {
          requiresMfaSetup: true,
          token: setupToken,
          user: customerPublic,
        },
      });
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.active === false) {
      return res.status(401).json({ error: "Account is disabled" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.passwordNeedsReset) {
      const resetToken = generatePasswordResetRequiredToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      return res.json({
        message: "Password reset required",
        data: {
          requiresPasswordReset: true,
          token: resetToken,
          user: publicUser(user),
        },
      });
    }

    if (user.mfaEnabled && user.totpSecretEnc) {
      const mfaToken = generateMfaPendingToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      return res.json({
        message: "MFA required",
        data: {
          requiresMfa: true,
          mfaToken,
          user: publicUser(user),
        },
      });
    }

    const setupToken = generateMfaSetupRequiredToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: "MFA setup required",
      data: {
        requiresMfaSetup: true,
        token: setupToken,
        user: publicUser(user),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/mfa/verify", async (req, res) => {
  try {
    const { mfaToken, code } = mfaVerifyLoginSchema.parse(req.body);
    const pending = verifyMfaPendingToken(mfaToken);
    if (!pending) {
      return res.status(401).json({ error: "MFA session expired. Sign in again." });
    }

    const account = await findMfaAccountById(pending.id);
    if (
      !account ||
      account.user.active === false ||
      !account.user.mfaEnabled ||
      !account.user.totpSecretEnc
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validCode = await verifyUserTotpCode(account.user.totpSecretEnc, code);
    if (!validCode) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    const token = generateToken(mfaSessionUser(account));
    const user =
      account.kind === "admin"
        ? publicUser({ ...account.user, role: account.user.role })
        : publicUser({ ...account.user, role: "client" });

    res.json({
      message: "Login successful",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("MFA verify error:", error);
    res.status(500).json({ error: "MFA verification failed" });
  }
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).max(50),
  relation: z.string().trim().max(100).optional(),
});

const bankDetailsSchema = z.object({
  bankName: z.string().trim().min(1).max(200),
  accountName: z.string().trim().min(1).max(200),
  accountNumber: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  swiftCode: z.string().trim().max(50).optional(),
  bsb: z.string().trim().min(1).max(50),
  notes: z.string().trim().max(2000).optional(),
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50).optional().nullable(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  addressLine1: z.string().max(300).optional().nullable(),
  addressLine2: z.string().max(300).optional().nullable(),
  suburb: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().min(1).max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  bankDetails: bankDetailsSchema.optional(),
  idProofUrl: z.string().max(2000).optional().nullable(),
  addressProofUrl: z.string().max(2000).optional().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).max(5).optional(),
  markProfileComplete: z.boolean().optional(),
  taxNumber: z.string().min(1).max(50).optional(),
  userFiles: z
    .array(z.object({ name: z.string().max(500), url: z.string().min(1).max(2000) }))
    .max(50)
    .optional(),
});

/** Re-issue a full session JWT from the database (includes current additionalRoles). */
router.post("/refresh-full-session", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) return res.status(401).json({ error: "Unauthorized" });
  if (req.mfaSetupRequired) {
    return res.status(400).json({ error: "Complete password or MFA setup first" });
  }
  const token = await createFullSessionTokenForUserId(u.id, u.impersonatorId);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  res.json({ data: { token } });
});

router.get("/impersonate/search", authMiddleware, async (req: AuthRequest, res) => {
  const actor = req.user;
  if (!actor || actor.role !== "admin" || actor.impersonatorId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) return res.json({ data: [] });
  const rows = await prisma.adminUser.findMany({
    where: {
      active: true,
      id: { not: actor.id },
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { email: "asc" },
    take: 20,
    select: { id: true, email: true, name: true, role: true },
  });
  res.json({ data: rows });
});

router.post("/impersonate/start", authMiddleware, async (req: AuthRequest, res) => {
  const actor = req.user;
  if (!actor || actor.role !== "admin" || actor.impersonatorId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const targetUserId = typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
  if (!targetUserId) return res.status(400).json({ error: "userId is required" });
  const { createImpersonationToken } = await import("../lib/admin-session-token.js");
  const token = await createImpersonationToken(actor.id, targetUserId);
  if (!token) return res.status(400).json({ error: "Cannot impersonate this user" });
  res.json({ data: { token } });
});

router.post("/impersonate/end", authMiddleware, async (req: AuthRequest, res) => {
  const actor = req.user;
  if (!actor?.impersonatorId) {
    return res.status(400).json({ error: "Not impersonating" });
  }
  const token = await createFullSessionTokenForUserId(actor.impersonatorId);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  res.json({ data: { token } });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: u.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      mfaEnabled: true,
      mfaEnrolledAt: true,
      passwordNeedsReset: true,
      addressLine1: true,
      addressLine2: true,
      suburb: true,
      city: true,
      state: true,
      postcode: true,
      country: true,
      emergencyContacts: true,
      profileDetailsCompletedAt: true,
      agreementDocumentUrl: true,
      profilePhotoUrl: true,
      bankDetails: true,
      idProofUrl: true,
      addressProofUrl: true,
      userFiles: true,
      additionalRoles: true,
      taxNumber: true,
    },
  });
  if (!user) {
    const customer = await prisma.customerUser.findUnique({
      where: { id: u.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhotoUrl: true,
        passwordNeedsReset: true,
        mfaEnabled: true,
        mfaEnrolledAt: true,
        totpSecretEnc: true,
      },
    });
    if (!customer) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { getTimesheetAccessForUser } = await import("../lib/timesheet-access.js");
    const timesheetAccess = await getTimesheetAccessForUser(customer.id, "client", []);
    return res.json({
      data: {
        impersonation: null,
        user: {
          ...publicUser({ ...customer, role: "client", mfaEnabled: customer.mfaEnabled }),
          requiresMfaEnrollment:
            req.sessionPurpose === MFA_SETUP_REQUIRED_PURPOSE ||
            (customer.mfaEnabled && !customer.totpSecretEnc),
          mfaEnrolledAt: customer.mfaEnrolledAt?.toISOString() ?? null,
          phone: customer.phone,
          profilePhotoUrl: customer.profilePhotoUrl ?? null,
          additionalRoles: [],
          onboarding: null,
          timesheetAccess,
          agreementRecords: [],
        },
      },
    });
  }

  const { prepareMemberOnboardingForUser, userQualifiesForMemberOnboarding } = await import(
    "../lib/project-member-user.js"
  );
  await prepareMemberOnboardingForUser(user.id);
  await userQualifiesForMemberOnboarding(user.id, user.role, user.additionalRoles);
  const onboarding = await getMemberOnboardingStatus(user.id);

  if (onboarding?.hasAgreementAssignment) {
    const refreshed = await prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { role: true, additionalRoles: true },
    });
    if (refreshed) {
      user.role = refreshed.role;
      user.additionalRoles = refreshed.additionalRoles;
    }
  }

  const { getTimesheetAccessForUser } = await import("../lib/timesheet-access.js");
  const timesheetAccess = await getTimesheetAccessForUser(
    user.id,
    user.role,
    user.additionalRoles,
  );

  const { buildAgreementRecordsForUser } = await import("../lib/user-agreement-records.js");
  const agreementRecords = await buildAgreementRecordsForUser(user.id);

  let impersonation: { impersonatorId: string; impersonatorName: string } | null = null;
  if (u.impersonatorId) {
    const impersonator = await prisma.adminUser.findUnique({
      where: { id: u.impersonatorId },
      select: { id: true, name: true, email: true },
    });
    if (impersonator) {
      impersonation = {
        impersonatorId: impersonator.id,
        impersonatorName: impersonator.name || impersonator.email,
      };
    }
  }

  res.json({
    data: {
      impersonation,
      user: {
        ...publicUser(user),
        requiresMfaEnrollment: req.sessionPurpose === MFA_SETUP_REQUIRED_PURPOSE,
        mfaEnrolledAt: user.mfaEnrolledAt?.toISOString() ?? null,
        phone: user.phone,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        suburb: user.suburb,
        city: user.city,
        state: user.state,
        postcode: user.postcode,
        country: user.country,
        emergencyContacts: user.emergencyContacts ?? [],
        profileDetailsCompletedAt: user.profileDetailsCompletedAt?.toISOString() ?? null,
        agreementDocumentUrl: user.agreementDocumentUrl,
        bankDetails: user.bankDetails ?? null,
        idProofUrl: user.idProofUrl,
        addressProofUrl: user.addressProofUrl,
        userFiles: Array.isArray(user.userFiles) ? user.userFiles : [],
        profilePhotoUrl: user.profilePhotoUrl ?? null,
        additionalRoles: Array.isArray(user.additionalRoles)
          ? (user.additionalRoles as string[]).filter((r) => typeof r === "string")
          : [],
        onboarding,
        timesheetAccess,
        agreementRecords,
      },
    },
  });
});

router.get("/profile/activity", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) return res.status(401).json({ error: "Unauthorized" });

  const rows = await prisma.adminUserActivityLog.findMany({
    where: { adminUserId: u.id },
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
});

router.patch("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(401).json({ error: "Unauthorized" });

    const input = profileUpdateSchema.parse(req.body);
    const existing = await prisma.adminUser.findUnique({ where: { id: u.id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const roles = await effectiveRolesForUser(u.id, existing.role);
    const isProjectMemberUser = hasEffectiveRole(roles, "project_member");

    const patch: Record<string, unknown> = {};
    const addressFields = [
      "addressLine1",
      "addressLine2",
      "suburb",
      "city",
      "state",
      "postcode",
      "country",
    ] as const;

    if (existing.role === "admin") {
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
      if (input.email !== undefined) patch.email = input.email.trim().toLowerCase();
    }

    for (const field of addressFields) {
      if (input[field] !== undefined) {
        patch[field] = input[field] as string | null;
      }
    }
    if (existing.role !== "client") {
      if (input.bankDetails !== undefined) patch.bankDetails = input.bankDetails;
      if (input.idProofUrl !== undefined) patch.idProofUrl = input.idProofUrl;
      if (input.addressProofUrl !== undefined) patch.addressProofUrl = input.addressProofUrl;
    }
    if (input.emergencyContacts !== undefined) {
      patch.emergencyContacts = input.emergencyContacts;
    }
    if (input.profilePhotoUrl !== undefined) {
      patch.profilePhotoUrl = input.profilePhotoUrl;
    }
    if (input.userFiles !== undefined) {
      patch.userFiles = input.userFiles;
    }
    if (input.taxNumber !== undefined && existing.role !== "client") {
      patch.taxNumber = input.taxNumber.trim();
    }

    const mergedForComplete = {
      addressLine1: (input.addressLine1 ?? existing.addressLine1) as string | null,
      city: (input.city ?? existing.city) as string | null,
      state: (input.state ?? existing.state) as string | null,
      postcode: (input.postcode ?? existing.postcode) as string | null,
      country: (input.country ?? existing.country) as string | null,
      bankDetails: input.bankDetails ?? existing.bankDetails,
      idProofUrl: (input.idProofUrl ?? existing.idProofUrl) as string | null,
      addressProofUrl: (input.addressProofUrl ?? existing.addressProofUrl) as string | null,
      emergencyContacts: input.emergencyContacts ?? existing.emergencyContacts,
      taxNumber: (input.taxNumber ?? existing.taxNumber) as string | null,
      profileDetailsCompletedAt: existing.profileDetailsCompletedAt,
    };
    const { profileKycFieldsFromMergedProfile } = await import("../lib/admin-user-profile-kyc.js");
    const kyc = profileKycFieldsFromMergedProfile(mergedForComplete);
    patch.profileKycStatus = kyc.profileKycStatus;
    patch.profileDetailsCompletedAt = kyc.profileDetailsCompletedAt;
    if (kyc.profileKycStatus === "COMPLETE") {
      patch.profileOnboardingRequiredAt = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (existing.role === "admin") {
        for (const field of ["name", "phone", "email"] as const) {
          if (input[field] === undefined) continue;
          const oldVal = (existing[field] as string | null) ?? null;
          const newVal = (patch[field] as string | null) ?? null;
          await logAdminUserFieldChange(tx, u.id, u.id, field, oldVal, newVal);
        }
      }
      for (const field of addressFields) {
        if (input[field] === undefined) continue;
        const oldVal = (existing[field] as string | null) ?? null;
        const newVal = (input[field] as string | null) ?? null;
        await logAdminUserFieldChange(tx, u.id, u.id, field, oldVal, newVal);
      }
      if (input.emergencyContacts !== undefined) {
        await logAdminUserFieldChange(
          tx,
          u.id,
          u.id,
          "emergencyContacts",
          JSON.stringify(existing.emergencyContacts ?? []),
          JSON.stringify(input.emergencyContacts),
        );
      }
      if (input.profilePhotoUrl !== undefined && input.profilePhotoUrl !== existing.profilePhotoUrl) {
        await logAdminUserFieldChange(
          tx,
          u.id,
          u.id,
          "profilePhotoUrl",
          existing.profilePhotoUrl,
          input.profilePhotoUrl,
        );
      }
      return tx.adminUser.update({
        where: { id: u.id },
        data: patch,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          mfaEnabled: true,
          passwordNeedsReset: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          city: true,
          state: true,
          country: true,
          emergencyContacts: true,
          profileDetailsCompletedAt: true,
          agreementDocumentUrl: true,
          profilePhotoUrl: true,
        },
      });
    });

    res.json({
      data: {
        user: {
          ...publicUser(updated),
          phone: updated.phone,
          addressLine1: updated.addressLine1,
          addressLine2: updated.addressLine2,
          suburb: updated.suburb,
          city: updated.city,
          state: updated.state,
          country: updated.country,
          emergencyContacts: updated.emergencyContacts ?? [],
          profileDetailsCompletedAt: updated.profileDetailsCompletedAt?.toISOString() ?? null,
          agreementDocumentUrl: updated.agreementDocumentUrl,
          profilePhotoUrl: updated.profilePhotoUrl ?? null,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/mfa/status", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: u.id },
    select: { mfaEnabled: true, mfaEnrolledAt: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    data: {
      mfaEnabled: user.mfaEnabled,
      mfaEnrolledAt: user.mfaEnrolledAt?.toISOString() ?? null,
    },
  });
});

router.post("/password/change", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { id: u.id } });
    if (!user?.passwordHash) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.adminUser.update({
      where: { id: u.id },
      data: { passwordHash, passwordNeedsReset: false },
      select: { id: true, email: true, role: true, mfaEnabled: true, passwordNeedsReset: true },
    });

    res.json({ data: { user: publicUser(updated) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Password change error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

router.post("/password/change-required", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { id: u.id } });
    if (!user?.passwordHash) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.passwordNeedsReset) {
      return res.status(400).json({ error: "Password reset is not required for this account" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash, passwordNeedsReset: false },
      select: {
        id: true,
        email: true,
        role: true,
        mfaEnabled: true,
        passwordNeedsReset: true,
        totpSecretEnc: true,
      },
    });

    const mfaFullyEnrolled = Boolean(updated.mfaEnabled && updated.totpSecretEnc);
    if (!mfaFullyEnrolled) {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { mfaEnabled: false, totpSecretEnc: null, mfaEnrolledAt: null },
      });
    }
    const sessionUser = sessionAuthUser({
      ...updated,
      additionalRoles: user.additionalRoles,
    });
    const token = mfaFullyEnrolled
      ? generateToken(sessionUser)
      : generateMfaSetupRequiredToken(sessionUser);

    res.json({
      message: "Password updated",
      data: {
        token,
        user: publicUser(updated),
        requiresMfaSetup: !mfaFullyEnrolled,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Password change error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

/** Issue a full session when MFA is already enrolled but the cookie still has `mfa_setup_required`. */
router.post("/mfa/resume-session", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const account = await findMfaAccountById(u.id);
  if (!account || account.user.active === false) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!account.user.mfaEnabled || !account.user.totpSecretEnc) {
    return res.status(400).json({ error: "MFA enrollment is not complete" });
  }

  const token = generateToken(mfaSessionUser(account));
  const user =
    account.kind === "admin"
      ? publicUser({ ...account.user, role: account.user.role })
      : publicUser({ ...account.user, role: "client" });

  res.json({
    data: {
      token,
      user,
    },
  });
});

/** Clear incomplete MFA so the user can scan a new QR code (e.g. after password reset). */
router.post("/mfa/restart-enrollment", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const account = await findMfaAccountById(u.id);
  if (!account || account.user.active === false) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const forceReEnroll = req.sessionPurpose === MFA_SETUP_REQUIRED_PURPOSE;
  if (account.user.mfaEnabled && account.user.totpSecretEnc && !forceReEnroll) {
    return res.status(400).json({ error: "MFA is already enabled" });
  }

  if (account.kind === "customer") {
    await prisma.customerUser.update({
      where: { id: u.id },
      data: { mfaEnabled: false, totpSecretEnc: null, mfaEnrolledAt: null },
    });
    await syncClientAdminMfa(u.id, { mfaEnabled: false, totpSecretEnc: null, mfaEnrolledAt: null });
  } else {
    await prisma.adminUser.update({
      where: { id: u.id },
      data: { mfaEnabled: false, totpSecretEnc: null, mfaEnrolledAt: null },
    });
  }

  res.json({ data: { ok: true } });
});

router.post("/mfa/setup", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const account = await findMfaAccountById(u.id);
  if (!account) {
    return res.status(404).json({ error: "User not found" });
  }

  const { secret, otpauthUrl } = createTotpEnrollment(account.user.email);
  const totpSecretEnc = encryptTotpSecret(secret);

  if (account.kind === "customer") {
    await prisma.customerUser.update({
      where: { id: account.user.id },
      data: {
        totpSecretEnc,
        mfaEnabled: false,
        mfaEnrolledAt: null,
      },
    });
    await syncClientAdminMfa(account.user.id, {
      totpSecretEnc,
      mfaEnabled: false,
      mfaEnrolledAt: null,
    });
  } else {
    await prisma.adminUser.update({
      where: { id: account.user.id },
      data: {
        totpSecretEnc,
        mfaEnabled: false,
        mfaEnrolledAt: null,
      },
    });
  }

  res.json({
    data: {
      otpauthUrl,
      secret,
    },
  });
});

router.post("/mfa/confirm", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { code } = mfaCodeSchema.parse(req.body);
    const account = await findMfaAccountById(u.id);
    if (!account?.user.totpSecretEnc) {
      return res.status(400).json({ error: "Start MFA setup first" });
    }

    const validCode = await verifyUserTotpCode(account.user.totpSecretEnc, code);
    if (!validCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const enrolledAt = new Date();
    if (account.kind === "customer") {
      await prisma.customerUser.update({
        where: { id: account.user.id },
        data: {
          mfaEnabled: true,
          mfaEnrolledAt: enrolledAt,
        },
      });
      await syncClientAdminMfa(account.user.id, {
        mfaEnabled: true,
        mfaEnrolledAt: enrolledAt,
      });
    } else {
      await prisma.adminUser.update({
        where: { id: account.user.id },
        data: {
          mfaEnabled: true,
          mfaEnrolledAt: enrolledAt,
        },
      });
    }

    const updated = await findMfaAccountById(u.id);
    if (!updated) {
      return res.status(500).json({ error: "Failed to load user after MFA enrollment" });
    }

    const token = generateToken(mfaSessionUser(updated));

    const enrolledUser =
      updated.kind === "admin"
        ? publicUser({ ...updated.user, role: updated.user.role })
        : publicUser({ ...updated.user, role: "client" });

    res.json({
      message: "MFA enabled",
      data: {
        token,
        user: {
          ...enrolledUser,
          mfaEnrolledAt: updated.user.mfaEnrolledAt?.toISOString() ?? null,
        },
        mfaEnabled: updated.user.mfaEnabled,
        mfaEnrolledAt: updated.user.mfaEnrolledAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("MFA confirm error:", error);
    res.status(500).json({ error: "Failed to enable MFA" });
  }
});

router.post("/password/forgot", async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.adminUser.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true, active: true, passwordHash: true },
    });

    if (user?.active !== false && user?.passwordHash) {
      const rawToken = generatePasswordResetToken();
      const tokenHash = hashPasswordResetToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

      const resetUrl = `${tbosLoginUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name?.trim() || "",
          resetUrl,
        });
      } catch (emailErr) {
        console.error("Password reset email failed:", emailErr);
        return res.status(503).json({ error: "Could not send reset email. Try again later." });
      }

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });
    }

    res.json({
      message: "If an account exists for that email, we sent password reset instructions.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/password/reset", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordWithTokenSchema.parse(req.body);
    const tokenHash = hashPasswordResetToken(token.trim());

    const user = await prisma.adminUser.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      select: { id: true, active: true },
    });

    if (!user || user.active === false) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordNeedsReset: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    res.json({ message: "Password updated. You can sign in with your new password." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/mfa/disable", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { password, code } = mfaDisableSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { id: u.id } });
    if (!user?.passwordHash) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    if (user.mfaEnabled && user.totpSecretEnc) {
      const validCode = await verifyUserTotpCode(user.totpSecretEnc, code);
      if (!validCode) {
        return res.status(401).json({ error: "Invalid verification code" });
      }
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        totpSecretEnc: null,
        mfaEnrolledAt: null,
      },
    });

    res.json({
      message: "MFA disabled",
      data: {
        mfaEnabled: false,
        mfaEnrolledAt: null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("MFA disable error:", error);
    res.status(500).json({ error: "Failed to disable MFA" });
  }
});

export { router as authRoutes };
