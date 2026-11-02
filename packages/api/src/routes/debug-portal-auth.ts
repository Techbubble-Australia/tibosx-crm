import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import {
  authMiddleware,
  generateToken,
  generateDebugPortalSsoToken,
  verifyDebugPortalSsoToken,
  type AuthRequest,
} from "../middleware/auth.js";
import { effectiveRoleList } from "../lib/admin-roles.js";
import { requireRole } from "../middleware/requireRole.js";

const router: IRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: { id: string; email: string; name: string | null; role: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    role: user.role,
  };
}

function hasAdminAccess(role: string, additionalRoles: unknown): boolean {
  return effectiveRoleList(role, additionalRoles).includes("admin");
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalized = email.trim().toLowerCase();

    const user = await prisma.adminUser.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        passwordHash: true,
        passwordNeedsReset: true,
        additionalRoles: true,
      },
    });

    if (!user?.passwordHash || user.active === false) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!hasAdminAccess(user.role, user.additionalRoles)) {
      return res.status(403).json({ error: "Only admin accounts can access the debug ticket portal" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.passwordNeedsReset) {
      return res.status(403).json({
        error: "Password reset required. Use the main TBOS admin app to update your password first.",
        code: "PASSWORD_RESET_REQUIRED",
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.adminUser.findUnique({
    where: { id: u.id },
    select: { id: true, email: true, name: true, role: true, active: true, additionalRoles: true },
  });

  if (!user || user.active === false || !hasAdminAccess(user.role, user.additionalRoles)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json({ data: { user: publicUser(user) } });
});

const exchangeSsoSchema = z.object({
  ssoToken: z.string().min(1),
});

/** Mint a short-lived token from an active TBOS admin session (for debug portal SSO). */
router.post("/sso-from-tbos", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.adminUser.findUnique({
    where: { id: u.id },
    select: { id: true, email: true, role: true, active: true, additionalRoles: true },
  });

  if (!user || user.active === false || !hasAdminAccess(user.role, user.additionalRoles)) {
    return res.status(403).json({ error: "Only admin accounts can access the debug ticket portal" });
  }

  const ssoToken = generateDebugPortalSsoToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    data: {
      ssoToken,
      reporterUserId: user.id,
    },
  });
});

/** Exchange SSO token for a debug portal session JWT. */
router.post("/exchange-sso", async (req, res) => {
  try {
    const { ssoToken } = exchangeSsoSchema.parse(req.body);
    const pending = verifyDebugPortalSsoToken(ssoToken);
    if (!pending) {
      return res.status(401).json({ error: "SSO link expired or invalid. Open reported tickets from TBOS admin again." });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: pending.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        additionalRoles: true,
      },
    });

    if (!user || user.active === false || !hasAdminAccess(user.role, user.additionalRoles)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal exchange-sso error:", error);
    res.status(500).json({ error: "SSO failed" });
  }
});

export { router as debugPortalAuthRoutes };
