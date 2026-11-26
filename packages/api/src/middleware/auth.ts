import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ADMIN_SESSION_MAX_AGE_SEC } from "../lib/session.js";
import { isMfaEnforcementDisabled } from "../lib/mfa-policy.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/** Cookie set by the admin Next.js app after login (httpOnly). */
export const ADMIN_SESSION_COOKIE = "admin_session";
/** Cookie for the debug ticket portal app (admin-only, MFA bypass at login). */
export const DEBUG_PORTAL_SESSION_COOKIE = "debug_portal_session";

export const MFA_PENDING_PURPOSE = "mfa_pending";
export const MFA_SETUP_REQUIRED_PURPOSE = "mfa_setup_required";
export const PASSWORD_RESET_REQUIRED_PURPOSE = "password_reset_required";
export const DEBUG_PORTAL_SSO_PURPOSE = "debug_portal_sso";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  additionalRoles?: string[];
  /** When set, the session acts as `id` but the real admin is this user. */
  impersonatorId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  mfaSetupRequired?: boolean;
  sessionPurpose?: string;
  /** Set by requireTenant on CRM / sales routes. */
  tenant?: import("../lib/tenant").TenantContext;
}

interface JwtPayload extends AuthUser {
  purpose?: string;
  additionalRoles?: string[];
  impersonatorId?: string;
}

function getCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const parts = raw.split(";").map((c) => c.trim());
  const prefix = `${name}=`;
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return undefined;
}

function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return getCookie(req, ADMIN_SESSION_COOKIE) ?? getCookie(req, DEBUG_PORTAL_SESSION_COOKIE);
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.id || !decoded?.email) {
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }
    const mfaOff = isMfaEnforcementDisabled();
    if (decoded.purpose === MFA_PENDING_PURPOSE && !mfaOff) {
      return res.status(401).json({ error: "Unauthorized: MFA verification required" });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.additionalRoles?.length ? { additionalRoles: decoded.additionalRoles } : {}),
      ...(decoded.impersonatorId ? { impersonatorId: decoded.impersonatorId } : {}),
    };
    req.sessionPurpose = decoded.purpose;
    req.mfaSetupRequired =
      decoded.purpose === PASSWORD_RESET_REQUIRED_PURPOSE ||
      (!mfaOff && decoded.purpose === MFA_SETUP_REQUIRED_PURPOSE);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const generateToken = (payload: AuthUser) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ADMIN_SESSION_MAX_AGE_SEC });
};

export const generateMfaPendingToken = (payload: AuthUser) => {
  return jwt.sign({ ...payload, purpose: MFA_PENDING_PURPOSE }, JWT_SECRET, { expiresIn: "5m" });
};

export const generateMfaSetupRequiredToken = (payload: AuthUser) => {
  return jwt.sign({ ...payload, purpose: MFA_SETUP_REQUIRED_PURPOSE }, JWT_SECRET, { expiresIn: "2h" });
};

export const generatePasswordResetRequiredToken = (payload: AuthUser) => {
  return jwt.sign({ ...payload, purpose: PASSWORD_RESET_REQUIRED_PURPOSE }, JWT_SECRET, { expiresIn: "2h" });
};

export function verifyMfaPendingToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.purpose !== MFA_PENDING_PURPOSE || !decoded.id || !decoded.email) {
      return null;
    }
    return { id: decoded.id, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export function generateDebugPortalSsoToken(payload: AuthUser): string {
  return jwt.sign({ ...payload, purpose: DEBUG_PORTAL_SSO_PURPOSE }, JWT_SECRET, { expiresIn: "2m" });
}

export function verifyDebugPortalSsoToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.purpose !== DEBUG_PORTAL_SSO_PURPOSE || !decoded.id || !decoded.email) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.additionalRoles?.length ? { additionalRoles: decoded.additionalRoles } : {}),
    };
  } catch {
    return null;
  }
}
