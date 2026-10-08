import { Router, type IRouter } from "express";
import { ticketingPrisma } from "@techbubble/ticketing-database";
import { authMiddleware, requireConsultant, type TicketingRequest } from "../middleware/auth.js";
import { assignedOrganizationIds, isTbosAdmin } from "../lib/ticket-access.js";

const router: IRouter = Router();

router.use(authMiddleware, requireConsultant);

router.get("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  let where: { active: boolean; id?: { in: string[] } } = { active: true };
  if (!isTbosAdmin(user)) {
    const orgIds = await assignedOrganizationIds(user.id);
    where = { active: true, id: { in: orgIds } };
  }
  const rows = await ticketingPrisma.organization.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json({ data: rows });
});

export { router as organizationRoutes };
