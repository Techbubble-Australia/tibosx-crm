import { Router, type IRouter } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import { getNotificationCatalog } from "../lib/notifications";
import {
  getNotificationPreferenceMatrix,
  NOTIFICATION_SETTING_ROLES,
  saveNotificationPreferences,
} from "../lib/notifications/preferences";
import type { AdminRole } from "../lib/admin-roles";

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Administrator",
  recruiter_admin: "Recruiter admin",
  recruiter: "Recruiter",
  sales: "Sales",
  website: "Website",
  project_manager: "Project manager",
  project_member: "Project member",
  customer_support: "Customer support",
  client: "Client",
};

const router: IRouter = Router();

/** Read-only catalog of email notifications (for ops / admin settings). */
router.get("/catalog", (_req: AuthRequest, res) => {
  res.json({ data: getNotificationCatalog() });
});

router.get("/preferences", async (_req: AuthRequest, res) => {
  try {
    const matrix = await getNotificationPreferenceMatrix();
    const roles = NOTIFICATION_SETTING_ROLES.map((role) => ({
      id: role,
      label: ROLE_LABELS[role as AdminRole] ?? role,
    }));
    res.json({
      data: {
        notifications: getNotificationCatalog().filter((row) => row.implemented),
        roles,
        matrix,
      },
    });
  } catch (error) {
    console.error("Error loading notification preferences:", error);
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

const preferenceUpdateSchema = z.object({
  updates: z.array(
    z.object({
      notificationId: z.string().min(1),
      role: z.string().min(1),
      enabled: z.boolean(),
    }),
  ),
});

router.put("/preferences", async (req: AuthRequest, res) => {
  try {
    const { updates } = preferenceUpdateSchema.parse(req.body);
    await saveNotificationPreferences(updates);
    res.json({ message: "Saved" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error saving notification preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

export { router as notificationRoutes };
