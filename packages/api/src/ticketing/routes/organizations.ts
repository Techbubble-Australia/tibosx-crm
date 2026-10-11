import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import { authMiddleware, requireConsultant, type TicketingRequest } from "../middleware/auth.js";
import { assignedOrganizationIds, isTbosAdmin } from "../lib/ticket-access.js";
import { listSupportPortalOrganizations } from "../lib/support-portal-orgs.js";

const router: IRouter = Router();

router.use(authMiddleware, requireConsultant);

router.get("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const scopeIds = isTbosAdmin(user) ? null : await assignedOrganizationIds(user.id);
  const rows = await listSupportPortalOrganizations(scopeIds);
  res.json({
    data: rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug })),
  });
});

export { router as organizationRoutes };
