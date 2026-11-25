import { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { resolveTenantContext, type TenantContext } from "../lib/tenant";

export function getViewAsTenantId(req: AuthRequest): string | null {
  const header = req.headers["x-tenant-id"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const q = req.query.tenantId;
  if (typeof q === "string" && q.trim()) return q.trim();
  return null;
}

/** Resolve tenant context for CRM / sales routes. */
export async function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.tenant = await resolveTenantContext({
      userId: req.user.id,
      viewAsTenantId: getViewAsTenantId(req),
    });
    return next();
  } catch (err) {
    console.error("requireTenant", err);
    return res.status(500).json({ error: "Failed to resolve tenant" });
  }
}

export function requirePlatformAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.tenant?.isPlatformAdmin) {
    return res.status(403).json({ error: "Forbidden: platform admin required" });
  }
  return next();
}

export function requireTenantModule(module: keyof TenantContext["modules"]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(500).json({ error: "Tenant context missing" });
    }
    if (!req.tenant.modules[module]) {
      return res.status(403).json({ error: `Forbidden: module ${module} disabled for tenant` });
    }
    return next();
  };
}
