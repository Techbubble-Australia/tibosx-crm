import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { TicketingRequest } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/me", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const row = await prisma.ticketingUser.findUnique({
    where: { id: user.id },
    include: { organization: true, tbosAdminUser: { select: { profilePhotoUrl: true } } },
  });
  if (!row || !row.active) return res.status(401).json({ error: "User not found" });

  const approverLink =
    row.role === "CLIENT"
      ? await prisma.projectClientContact.findFirst({
          where: { ticketingUserId: row.id, canApproveTimesheets: true },
          select: { id: true },
        })
      : null;

  const photo =
    row.profilePhotoUrl?.trim() || row.tbosAdminUser?.profilePhotoUrl?.trim() || null;

  res.json({
    data: {
      id: row.id,
      email: row.email,
      name: row.name,
      profilePhotoUrl: photo,
      role: row.role,
      organizationId: row.organizationId,
      consultantVerified: row.consultantVerified,
      tbosRole: row.tbosRole ?? user.tbosRole ?? null,
      organization: row.organization
        ? { id: row.organization.id, name: row.organization.name, slug: row.organization.slug }
        : null,
      canApproveTimesheets: Boolean(approverLink),
    },
  });
});

export { router as workspaceAuthRoutes };
