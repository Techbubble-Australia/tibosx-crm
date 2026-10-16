import { Router, type IRouter } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getNotificationCatalog } from "../lib/notifications";

const router: IRouter = Router();

/** Read-only catalog of email notifications (for ops / admin settings). */
router.get("/catalog", (_req: AuthRequest, res) => {
  res.json({ data: getNotificationCatalog() });
});

export { router as notificationRoutes };
