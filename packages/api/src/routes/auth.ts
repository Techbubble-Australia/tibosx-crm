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
  verifyMfaPendingToken,
  type AuthRequest,
} from "../middleware/auth";
import {
  createTotpEnrollment,
  encryptTotpSecret,
  verifyUserTotpCode,
} from "../lib/mfa";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import {
  addressComplete,
  bankDetailsComplete,
  emergencyContactsComplete,
} from "../lib/member-profile";
import { logAdminUserFieldChange } from "../lib/admin-user-activity";
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
    const { email, password } = loginSchema.parse(req.body);

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

    const user = await prisma.adminUser.findUnique({ where: { id: pending.id } });
    if (!user || user.active === false || !user.mfaEnabled || !user.totpSecretEnc) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validCode = await verifyUserTotpCode(user.totpSecretEnc, code);
    if (!validCode) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      data: {
        token,
        user: publicUser(user),
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
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
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

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50).optional().nullable(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  addressLine1: z.string().max(300).optional().nullable(),
  addressLine2: z.string().max(300).optional().nullable(),
  suburb: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  bankDetails: bankDetailsSchema.optional(),
  idProofUrl: z.string().max(2000).optional().nullable(),
  addressProofUrl: z.string().max(2000).optional().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).max(5).optional(),
  markProfileComplete: z.boolean().optional(),
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
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const onboarding = effectiveRoleList(user.role, user.additionalRoles).includes("project_member")
    ? await getMemberOnboardingStatus(user.id)
    : null;

  res.json({
    data: {
      user: {
        ...publicUser(user),
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

    if (isProjectMemberUser) {
      for (const field of addressFields) {
        if (input[field] !== undefined) {
          patch[field] = input[field] as string | null;
        }
      }
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
    };
    const hasFullProfile =
      addressComplete(mergedForComplete) &&
      bankDetailsComplete(mergedForComplete.bankDetails) &&
      emergencyContactsComplete(mergedForComplete.emergencyContacts) &&
      Boolean(mergedForComplete.idProofUrl?.trim()) &&
      Boolean(mergedForComplete.addressProofUrl?.trim());

    if (input.markProfileComplete && hasFullProfile) {
      patch.profileDetailsCompletedAt = new Date();
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
        if (!isProjectMemberUser || input[field] === undefined) continue;
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
      select: { id: true, email: true, role: true, mfaEnabled: true, passwordNeedsReset: true },
    });

    const setupToken = generateMfaSetupRequiredToken({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    });

    res.json({
      message: "Password updated",
      data: {
        token: setupToken,
        user: publicUser(updated),
        requiresMfaSetup: !updated.mfaEnabled,
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

router.post("/mfa/setup", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: u.id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { secret, otpauthUrl } = createTotpEnrollment(user.email);
  const totpSecretEnc = encryptTotpSecret(secret);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      totpSecretEnc,
      mfaEnabled: false,
      mfaEnrolledAt: null,
    },
  });

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
    const user = await prisma.adminUser.findUnique({ where: { id: u.id } });
    if (!user?.totpSecretEnc) {
      return res.status(400).json({ error: "Start MFA setup first" });
    }

    const validCode = await verifyUserTotpCode(user.totpSecretEnc, code);
    if (!validCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const updated = await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaEnrolledAt: new Date(),
      },
      select: { id: true, email: true, role: true, mfaEnabled: true, mfaEnrolledAt: true },
    });

    const token = generateToken({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    });

    res.json({
      message: "MFA enabled",
      data: {
        token,
        user: {
          ...publicUser(updated),
          mfaEnrolledAt: updated.mfaEnrolledAt?.toISOString() ?? null,
        },
        mfaEnabled: updated.mfaEnabled,
        mfaEnrolledAt: updated.mfaEnrolledAt?.toISOString() ?? null,
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
