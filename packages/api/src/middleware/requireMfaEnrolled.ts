import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * MFA is not enforced in this project — password-only access for all users.
 * Kept as a no-op so route wiring stays unchanged.
 */
export async function requireMfaEnrolled(_req: AuthRequest, _res: Response, next: NextFunction) {
  next();
}
