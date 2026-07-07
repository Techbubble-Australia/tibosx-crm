import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

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

/** Block viewer role from mutating admin resources. */
export function blockViewerMutations(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === "viewer" && MUTATION_METHODS.has(req.method.toUpperCase())) {
    return res.status(403).json({ error: "Forbidden: read-only access" });
  }
  next();
}
