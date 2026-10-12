import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@techbubble/database";
import { TICKETING_SESSION_COOKIE } from "../lib/session.js";

/** Signs ticketing portal session JWTs. */
function ticketingJwtSecret(): string {
  return process.env.TICKETING_JWT_SECRET || process.env.JWT_SECRET || "ticketing-dev-secret";
}

/** Verifies TBOS admin session JWTs (must match packages/api JWT_SECRET). */
function tbosJwtSecret(): string {
  return (
    process.env.TBOS_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.TICKETING_JWT_SECRET ||
    "your-secret-key-change-in-production"
  );
}

export type TicketingAuthUser = {
  id: string;
  email: string;
  role: "CLIENT" | "CONSULTANT";
  organizationId: string | null;
  consultantVerified: boolean;
  tbosRole?: string | null;
  tbosAdminUserId?: string | null;
};

export interface TicketingRequest extends Request {
  ticketingUser?: TicketingAuthUser;
}

function getCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const prefix = `${name}=`;
  for (const part of raw.split(";").map((c) => c.trim())) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
  }
  return undefined;
}

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return getCookie(req, TICKETING_SESSION_COOKIE);
}

export async function authMiddleware(req: TicketingRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, ticketingJwtSecret()) as TicketingAuthUser & { purpose?: string };
    if (decoded.purpose === "tbos_exchange") {
      return res.status(401).json({ error: "Exchange token not valid for API access" });
    }
    const dbUser = await prisma.ticketingUser.findUnique({
      where: { id: decoded.id },
      select: {
        tbosRole: true,
        tbosAdminUserId: true,
        consultantVerified: true,
        role: true,
        organizationId: true,
        active: true,
      },
    });
    if (!dbUser?.active) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    req.ticketingUser = {
      id: decoded.id,
      email: decoded.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId ?? null,
      consultantVerified: dbUser.consultantVerified,
      // Prefer DB (SSO updates) over stale JWT claims — fixes empty ticket lists for TBOS admin.
      tbosRole: dbUser.tbosRole ?? decoded.tbosRole ?? null,
      tbosAdminUserId: dbUser.tbosAdminUserId ?? null,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

export function requireConsultant(req: TicketingRequest, res: Response, next: NextFunction) {
  const user = req.ticketingUser;
  if (!user || user.role !== "CONSULTANT" || !user.consultantVerified) {
    return res.status(403).json({ error: "Consultant access required" });
  }
  next();
}

export function signTicketingToken(payload: TicketingAuthUser): string {
  return jwt.sign(payload, ticketingJwtSecret(), { expiresIn: "8h" });
}

export function verifyTbosAdminToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, tbosJwtSecret()) as {
      id?: string;
      email?: string;
      role?: string;
      purpose?: string;
    };
    if (!decoded.id || !decoded.email) return null;
    if (
      decoded.purpose === "mfa_pending" ||
      decoded.purpose === "mfa_setup_required" ||
      decoded.purpose === "password_reset_required"
    ) {
      return null;
    }
    return { id: decoded.id, email: decoded.email, role: decoded.role || "" };
  } catch {
    return null;
  }
}
