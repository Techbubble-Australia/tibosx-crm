import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { effectiveRolesForUser } from "../lib/admin-roles";
import { buildClientWorkspaceOverview, clientWorkspaceAccess } from "../lib/client-workspace";

const router: IRouter = Router();

const ALL_CLIENTS = "all";

type AllowedClient = { id: string; name: string; projectIds?: string[] };

/**
 * Admins: every client with invoices (all projects). Client users: every client they are linked to,
 * with projects and timesheets limited to their own projects (invoices and payments cover the client).
 */
async function allowedClients(req: AuthRequest): Promise<{ admin: boolean; clients: AllowedClient[] }> {
  const userId = req.user?.id;
  if (!userId) return { admin: false, clients: [] };
  const roles = await effectiveRolesForUser(userId, req.user?.role ?? "");
  if (roles.includes("admin")) {
    // Only clients that have had at least one invoice raised.
    const clients = await prisma.client.findMany({
      where: { contracts: { some: { invoices: { some: { status: { not: "CANCELED" } } } } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { admin: true, clients };
  }
  const access = await clientWorkspaceAccess(userId);
  const clientIds = [...new Set(access.workspaceProjects.map((p) => p.clientId))];
  if (!clientIds.length) return { admin: false, clients: [] };
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return {
    admin: false,
    clients: clients.map((c) => ({
      ...c,
      projectIds: access.workspaceProjects.filter((p) => p.clientId === c.id).map((p) => p.id),
    })),
  };
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { admin, clients } = await allowedClients(req);
    if (!clients.length) {
      return res.status(403).json({ error: "Your account doesn't have access to the client workspace." });
    }
    const requested = typeof req.query.clientId === "string" ? req.query.clientId : "";
    const currency = typeof req.query.currency === "string" ? req.query.currency : undefined;
    // Admins start on "All clients"; client users only ever see one client at a time.
    const showAll = admin && clients.length > 1 && (!requested || requested === ALL_CLIENTS);
    const client = showAll
      ? { id: ALL_CLIENTS, name: "All clients" }
      : (clients.find((c) => c.id === requested) ?? clients[0]!);
    const overview = await buildClientWorkspaceOverview(showAll ? clients.map((c) => c.id) : [client.id], {
      projectIds: "projectIds" in client ? client.projectIds : undefined,
      currency,
    });
    res.json({
      data: {
        ...overview,
        client: { id: client.id, name: client.name },
        allClientsOption: admin && clients.length > 1,
        clients: clients.map(({ id, name }) => ({ id, name })),
      },
    });
  } catch (error) {
    console.error("Error building client workspace:", error);
    res.status(500).json({ error: "Failed to load the client workspace" });
  }
});

export { router as clientWorkspaceRoutes };
