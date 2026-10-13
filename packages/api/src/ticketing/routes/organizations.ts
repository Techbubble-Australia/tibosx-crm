import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { scopeOrganizationIdsForPortal } from "../lib/ticket-access.js";
import { listSupportPortalOrganizations } from "../lib/support-portal-orgs.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role === "CLIENT") {
    if (!user.organizationId) {
      return res.json({ data: [] });
    }
  } else if (user.role !== "CONSULTANT" || !user.consultantVerified) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const scopeIds = await scopeOrganizationIdsForPortal(user);
  const rows = await listSupportPortalOrganizations(scopeIds);
  res.json({
    data: rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug })),
  });
});

export { router as organizationRoutes };
