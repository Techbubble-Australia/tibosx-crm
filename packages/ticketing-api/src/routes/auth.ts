import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ticketingPrisma } from "@techbubble/ticketing-database";
import {
  authMiddleware,
  signTicketingToken,
  type TicketingRequest,
  verifyTbosAdminToken,
} from "../middleware/auth.js";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const TBOS_CONSULTANT_ROLES = new Set(
  (process.env.TICKETING_TBOS_CONSULTANT_ROLES || "admin,sales").split(",").map((r) => r.trim()),
);

function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "CONSULTANT";
  organizationId: string | null;
  consultantVerified: boolean;
  organization?: { id: string; name: string; slug: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    consultantVerified: user.consultantVerified,
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

  const user = await ticketingPrisma.ticketingUser.findUnique({
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
  const tbosToken =
    typeof req.body?.tbosToken === "string"
      ? req.body.tbosToken
      : typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : "";
  if (!tbosToken) return res.status(400).json({ error: "TBOS token required" });

  const tbosUser = verifyTbosAdminToken(tbosToken);
  if (!tbosUser) return res.status(401).json({ error: "Invalid TBOS session" });
  if (!TBOS_CONSULTANT_ROLES.has(tbosUser.role)) {
    return res.status(403).json({ error: "Your TBOS role is not authorized for the support portal" });
  }

  let consultant = await ticketingPrisma.ticketingUser.findFirst({
    where: {
      role: "CONSULTANT",
      consultantVerified: true,
      OR: [{ tbosAdminUserId: tbosUser.id }, { email: tbosUser.email.toLowerCase() }],
    },
    include: { organization: true },
  });

  if (!consultant) {
    consultant = await ticketingPrisma.ticketingUser.create({
      data: {
        email: tbosUser.email.toLowerCase(),
        name: tbosUser.email.split("@")[0] || "Consultant",
        passwordHash: await bcrypt.hash(randomUUID(), 10),
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: tbosUser.id,
      },
      include: { organization: true },
    });
  } else if (!consultant.tbosAdminUserId) {
    consultant = await ticketingPrisma.ticketingUser.update({
      where: { id: consultant.id },
      data: { tbosAdminUserId: tbosUser.id },
      include: { organization: true },
    });
  }

  const token = signTicketingToken({
    id: consultant.id,
    email: consultant.email,
    role: consultant.role,
    organizationId: consultant.organizationId,
    consultantVerified: consultant.consultantVerified,
  });

  res.json({ data: { token, user: serializeUser(consultant) } });
});

router.get("/me", authMiddleware, async (req: TicketingRequest, res) => {
  const user = await ticketingPrisma.ticketingUser.findUnique({
    where: { id: req.ticketingUser!.id },
    include: { organization: true },
  });
  if (!user || !user.active) return res.status(401).json({ error: "User not found" });
  res.json({ data: serializeUser(user) });
});

export { router as authRoutes };
