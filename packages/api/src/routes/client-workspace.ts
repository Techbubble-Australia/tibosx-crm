import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { effectiveRolesForUser } from "../lib/admin-roles";
import { buildClientWorkspaceOverview, clientWorkspaceAccess } from "../lib/client-workspace";

const router: IRouter = Router();

type AllowedClient = { id: string; name: string; projectIds?: string[] };

/**
 * Admins: every active client. Client users: full view for clients where their contact has
 * "Access to client workspace" ticked, otherwise just the projects they are linked to.
 */
async function allowedClients(req: AuthRequest): Promise<AllowedClient[]> {
  const userId = req.user?.id;
  if (!userId) return [];
  const roles = await effectiveRolesForUser(userId, req.user?.role ?? "");
  if (roles.includes("admin")) {
    return prisma.client.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  }
  const access = await clientWorkspaceAccess(userId);
  const clientIds = [...new Set([...access.fullClientIds, ...access.linkedProjects.map((p) => p.clientId)])];
  if (!clientIds.length) return [];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return clients.map((c) =>
    access.fullClientIds.includes(c.id)
      ? c
      : { ...c, projectIds: access.linkedProjects.filter((p) => p.clientId === c.id).map((p) => p.id) },
  );
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const clients = await allowedClients(req);
    if (!clients.length) {
      return res.status(403).json({ error: "Your account doesn't have access to the client workspace." });
    }
    const requested = typeof req.query.clientId === "string" ? req.query.clientId : "";
    const client = clients.find((c) => c.id === requested) ?? clients[0]!;
    const overview = await buildClientWorkspaceOverview(client.id, { projectIds: client.projectIds });
    if (!overview) return res.status(404).json({ error: "Client not found" });
    res.json({ data: { ...overview, clients: clients.map(({ id, name }) => ({ id, name })) } });
  } catch (error) {
    console.error("Error building client workspace:", error);
    res.status(500).json({ error: "Failed to load the client workspace" });
  }
});

export { router as clientWorkspaceRoutes };
