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
import { resolveDebugPortalUser, type DebugPortalUser } from "../lib/debug-portal-user.js";

const router: IRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: DebugPortalUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
  };
}

const PASSWORD_RESET_REQUIRED = {
  error: "Password reset required. Use the main TBOS app to update your password first.",
  code: "PASSWORD_RESET_REQUIRED",
};

/** Any active TBOS account (internal or customer user) may sign in; MFA is not required here. */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalized = email.trim().toLowerCase();

    const [adminUser, customerUser] = await Promise.all([
      prisma.adminUser.findFirst({
        where: { email: { equals: normalized, mode: "insensitive" } },
        select: { id: true, role: true, active: true, passwordHash: true, passwordNeedsReset: true },
      }),
      prisma.customerUser.findFirst({
        where: { email: { equals: normalized, mode: "insensitive" } },
        select: { id: true, active: true, passwordHash: true, passwordNeedsReset: true },
      }),
    ]);

    const adminOk =
      Boolean(adminUser?.passwordHash) &&
      adminUser!.active !== false &&
      (await bcrypt.compare(password, adminUser!.passwordHash!));
    const customerOk =
      Boolean(customerUser?.passwordHash) &&
      customerUser!.active !== false &&
      (await bcrypt.compare(password, customerUser!.passwordHash!));

    // Same preference as the main TBOS login: internal accounts win unless they are client-only.
    const account =
      adminOk && adminUser && (adminUser.role !== "client" || !customerOk)
        ? adminUser
        : customerOk && customerUser
          ? customerUser
          : null;
    if (!account) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (account.passwordNeedsReset) {
      return res.status(403).json(PASSWORD_RESET_REQUIRED);
    }

    const user = await resolveDebugPortalUser(account.id);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ data: { token, user: publicUser(user) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u) return res.status(401).json({ error: "Unauthorized" });
  const user = await resolveDebugPortalUser(u.id);
  if (!user) return res.status(403).json({ error: "Forbidden" });
  res.json({ data: { user: publicUser(user) } });
});

const exchangeSsoSchema = z.object({
  ssoToken: z.string().min(1),
});

/** Mint a short-lived token from an active TBOS session (for debug portal SSO). */
router.post("/sso-from-tbos", authMiddleware, async (req: AuthRequest, res) => {
  const u = req.user;
  if (!u?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await resolveDebugPortalUser(u.id);
  if (!user) return res.status(403).json({ error: "Forbidden" });

  const ssoToken = generateDebugPortalSsoToken({ id: user.id, email: user.email, role: user.role });
  res.json({ data: { ssoToken, reporterUserId: user.id } });
});

/** Exchange SSO token for a debug portal session JWT. */
router.post("/exchange-sso", async (req, res) => {
  try {
    const { ssoToken } = exchangeSsoSchema.parse(req.body);
    const pending = verifyDebugPortalSsoToken(ssoToken);
    if (!pending) {
      return res.status(401).json({ error: "SSO link expired or invalid. Open reported tickets from TBOS again." });
    }

    const user = await resolveDebugPortalUser(pending.id);
    if (!user) return res.status(403).json({ error: "Forbidden" });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ data: { token, user: publicUser(user) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal exchange-sso error:", error);
    res.status(500).json({ error: "SSO failed" });
  }
});

export { router as debugPortalAuthRoutes };
