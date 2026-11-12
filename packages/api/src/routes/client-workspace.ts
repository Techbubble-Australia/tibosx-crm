import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { effectiveRolesForUser } from "../lib/admin-roles";
import { buildClientWorkspaceOverview, clientWorkspaceClientIds } from "../lib/client-workspace";

const router: IRouter = Router();

/** Clients this user may open: their own (contact ticked "Access to client workspace"), or any for admins. */
async function allowedClients(req: AuthRequest): Promise<Array<{ id: string; name: string }>> {
  const userId = req.user?.id;
  if (!userId) return [];
  const roles = await effectiveRolesForUser(userId, req.user?.role ?? "");
  if (roles.includes("admin")) {
    return prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  }
  const ids = await clientWorkspaceClientIds(userId);
  if (!ids.length) return [];
  return prisma.client.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

router.get("/access", async (req: AuthRequest, res) => {
  try {
    const clients = await allowedClients(req);
    res.json({ data: { enabled: clients.length > 0, clients } });
  } catch (error) {
    console.error("Error checking client workspace access:", error);
    res.status(500).json({ error: "Failed to check access" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const clients = await allowedClients(req);
    if (!clients.length) {
      return res.status(403).json({ error: "Your account doesn't have access to the client workspace." });
    }
    const requested = typeof req.query.clientId === "string" ? req.query.clientId : "";
    const client = clients.find((c) => c.id === requested) ?? clients[0]!;
    const overview = await buildClientWorkspaceOverview(client.id);
    if (!overview) return res.status(404).json({ error: "Client not found" });
    res.json({ data: { ...overview, clients } });
  } catch (error) {
    console.error("Error building client workspace:", error);
    res.status(500).json({ error: "Failed to load the client workspace" });
  }
});

export { router as clientWorkspaceRoutes };
