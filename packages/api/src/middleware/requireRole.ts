import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { canAccessModule, type TbModule } from "../lib/admin-roles";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (!roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

export function requireModule(module: TbModule) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (!canAccessModule(role, module)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

/** Block roles without module access from mutating admin resources on that module's routes. */
export function blockModuleMutations(module: TbModule) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? "";
    if (MUTATION_METHODS.has(req.method.toUpperCase()) && !canAccessModule(role, module)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}
