import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import {
  authMiddleware,
  signTicketingToken,
  type TicketingRequest,
  verifyTbosAdminToken,
} from "../middleware/auth.js";
import { randomUUID } from "crypto";
import { syncConsultantOrganizationsForTbosUser } from "../../lib/support-organization.js";

const router: IRouter = Router();

const TBOS_CONSULTANT_ROLES = new Set(
  (process.env.TICKETING_TBOS_CONSULTANT_ROLES || "admin,sales")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean),
);

function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "CONSULTANT";
  organizationId: string | null;
  consultantVerified: boolean;
  tbosRole?: string | null;
  organization?: { id: string; name: string; slug: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    consultantVerified: user.consultantVerified,
    tbosRole: user.tbosRole ?? null,
    organization: user.organization
      ? { id: user.organization.id, name: user.organization.name, slug: user.organization.slug }
      : null,
  };
}

router.post("/login", async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid credentials" });

  const user = await prisma.ticketingUser.findUnique({
    where: { email: body.data.email.toLowerCase() },
    include: { organization: true },
  });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.role === "CONSULTANT" && !user.consultantVerified) {
    return res.status(403).json({ error: "Consultant account is not verified" });
  }
  const ok = await bcrypt.compare(body.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signTicketingToken({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    consultantVerified: user.consultantVerified,
  });

  res.json({ data: { token, user: serializeUser(user) } });
});

router.post("/tbos-sso", async (req, res) => {
  try {
  const tbosToken =
    typeof req.body?.tbosToken === "string"
      ? req.body.tbosToken
      : typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : "";
  if (!tbosToken) return res.status(400).json({ error: "TBOS token required" });

  const tbosUser = verifyTbosAdminToken(tbosToken);
  if (!tbosUser) {
    return res.status(401).json({
      error:
        "Invalid TBOS session. JWT_SECRET must match the main TBOS API that issued your login cookie.",
    });
  }
  const tbosRole = tbosUser.role.trim().toLowerCase();
  if (!TBOS_CONSULTANT_ROLES.has(tbosRole)) {
    return res.status(403).json({ error: "Your TBOS role is not authorized for the support portal" });
  }

  let consultant = await prisma.ticketingUser.findFirst({
    where: {
      role: "CONSULTANT",
      consultantVerified: true,
      OR: [{ tbosAdminUserId: tbosUser.id }, { email: tbosUser.email.toLowerCase() }],
    },
    include: { organization: true },
  });

  if (!consultant) {
    consultant = await prisma.ticketingUser.create({
      data: {
        email: tbosUser.email.toLowerCase(),
        name: tbosUser.email.split("@")[0] || "Consultant",
        passwordHash: await bcrypt.hash(randomUUID(), 10),
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: tbosUser.id,
        tbosRole: tbosRole,
      },
      include: { organization: true },
    });
  } else {
    consultant = await prisma.ticketingUser.update({
      where: { id: consultant.id },
      data: {
        tbosAdminUserId: consultant.tbosAdminUserId ?? tbosUser.id,
        tbosRole: tbosRole,
      },
      include: { organization: true },
    });
  }

  if (!consultant) {
    return res.status(500).json({ error: "Could not provision consultant account" });
  }

  await syncConsultantOrganizationsForTbosUser(tbosUser.id);

  const token = signTicketingToken({
    id: consultant.id,
    email: consultant.email,
    role: consultant.role,
    organizationId: consultant.organizationId,
    consultantVerified: consultant.consultantVerified,
    tbosRole: tbosRole,
  });

  res.json({ data: { token, user: serializeUser(consultant) } });
  } catch (err) {
    console.error("tbos-sso failed", err);
    const message = err instanceof Error ? err.message : "SSO failed";
    if (message.includes("connect") || message.includes("DATABASE")) {
      return res.status(503).json({ error: "Database unavailable." });
    }
    return res.status(500).json({ error: "Support portal SSO failed on server" });
  }
});

router.get("/me", authMiddleware, async (req: TicketingRequest, res) => {
  const user = await prisma.ticketingUser.findUnique({
    where: { id: req.ticketingUser!.id },
    include: { organization: true },
  });
  if (!user || !user.active) return res.status(401).json({ error: "User not found" });
  res.json({ data: serializeUser(user) });
});

export { router as authRoutes };
