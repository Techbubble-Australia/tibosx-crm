import { Response, NextFunction } from "express";
import { prisma } from "@techbubble/database";
import { AuthRequest } from "./auth";

async function impersonatorBypassesMfaForTarget(req: AuthRequest): Promise<boolean> {
  const impersonatorId = req.user?.impersonatorId;
  if (!impersonatorId) return false;
  const impersonator = await prisma.adminUser.findUnique({
    where: { id: impersonatorId },
    select: { role: true, active: true, mfaEnabled: true },
  });
  return Boolean(impersonator?.active && impersonator.role === "admin" && impersonator.mfaEnabled);
}

/** Blocks access until the user has completed MFA enrollment. */
export async function requireMfaEnrolled(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (await impersonatorBypassesMfaForTarget(req)) {
    return next();
  }

  const customer = await prisma.customerUser.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, totpSecretEnc: true },
  });
  if (customer) {
    if (!customer.mfaEnabled || !customer.totpSecretEnc) {
      return res.status(403).json({
        error: "MFA setup is required before you can access TBOS",
        code: "MFA_SETUP_REQUIRED",
      });
    }
    return next();
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  if (!user?.mfaEnabled) {
    return res.status(403).json({
      error: "MFA setup is required before you can access TBOS",
      code: "MFA_SETUP_REQUIRED",
    });
  }

  next();
}
