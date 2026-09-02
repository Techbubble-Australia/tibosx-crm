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
      role: true,
      mfaEnabled: true,
      mfaEnrolledAt: true,
      passwordNeedsReset: true,
    },
  });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    data: {
      user: {
        ...publicUser(user),
        mfaEnrolledAt: user.mfaEnrolledAt?.toISOString() ?? null,
      },
    },
  });
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
