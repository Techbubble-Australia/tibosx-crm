import { Response, NextFunction } from "express";
import { prisma } from "@techbubble/database";
import { AuthRequest } from "./auth";
import {
  canAccessModule,
  canAccessModuleForUser,
  effectiveRoleList,
  type TbModule,
} from "../lib/admin-roles";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function loadAdditionalRoles(userId: string): Promise<unknown> {
  const row = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { additionalRoles: true },
  });
  return row?.additionalRoles;
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (roles.includes(role)) {
      return next();
    }
    if (!req.user?.id) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    const additional = await loadAdditionalRoles(req.user.id);
    const hasRole = effectiveRoleList(role, additional).some((r) => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

export function requireModule(module: TbModule) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (canAccessModule(role, module)) {
      return next();
    }
    if (!req.user?.id) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    const additional = await loadAdditionalRoles(req.user.id);
    if (!canAccessModuleForUser(role, additional, module)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

export function requireAnyModule(...modules: TbModule[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (modules.some((module) => canAccessModule(role, module))) {
      return next();
    }
    if (!req.user?.id) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    const additional = await loadAdditionalRoles(req.user.id);
    const ok = modules.some((module) => canAccessModuleForUser(role, additional, module));
    if (!ok) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

/** Block roles without module access from mutating admin resources on that module's routes. */
export function blockModuleMutations(module: TbModule) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (!MUTATION_METHODS.has(req.method.toUpperCase())) {
      return next();
    }
    if (canAccessModule(role, module)) {
      return next();
    }
    if (!req.user?.id) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    const additional = await loadAdditionalRoles(req.user.id);
    if (!canAccessModuleForUser(role, additional, module)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}
