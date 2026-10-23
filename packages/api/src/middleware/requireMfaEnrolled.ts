import { Response, NextFunction } from "express";
import { prisma } from "@techbubble/database";
import { AuthRequest } from "./auth";

/** Blocks access until the user has completed MFA enrollment. */
export async function requireMfaEnrolled(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const customer = await prisma.customerUser.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (customer) {
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
