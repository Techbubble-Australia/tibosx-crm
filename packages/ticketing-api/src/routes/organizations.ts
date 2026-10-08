import { Router, type IRouter } from "express";
import { ticketingPrisma } from "@techbubble/ticketing-database";
import { authMiddleware, requireConsultant } from "../middleware/auth.js";

const router: IRouter = Router();

router.use(authMiddleware, requireConsultant);

router.get("/", async (_req, res) => {
  const rows = await ticketingPrisma.organization.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json({ data: rows });
});

export { router as organizationRoutes };
