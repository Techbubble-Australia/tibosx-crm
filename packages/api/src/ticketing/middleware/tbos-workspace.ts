import type { Response, NextFunction } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../../middleware/auth.js";
import { effectiveRoleList } from "../../lib/admin-roles.js";
import {
  isWorkspaceTbosRole,
  resolveTicketingUserForWorkspace,
} from "../lib/tbos-workspace-user.js";
import type { TicketingRequest } from "./auth.js";

export type WorkspaceRequest = AuthRequest & TicketingRequest;

export async function tbosWorkspaceTicketingMiddleware(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction,
) {
  const tbosUser = req.user;
  if (!tbosUser?.id || !tbosUser.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const effectiveRoles = effectiveRoleList(tbosUser.role, tbosUser.additionalRoles);
  const workspaceRole = effectiveRoles.includes("customer_support")
    ? "customer_support"
    : effectiveRoles.includes("client")
      ? "client"
      : effectiveRoles.find((r) => isWorkspaceTbosRole(r));
  if (!workspaceRole) {
    return res.status(403).json({ error: "Workspace access is for client and customer support roles only" });
  }

  try {
    const ticketingUser = await resolveTicketingUserForWorkspace(
      tbosUser.id,
      tbosUser.email,
      workspaceRole,
    );
    if (!ticketingUser) {
      return res.status(403).json({
        error:
          workspaceRole === "client"
            ? "No support portal access linked to your client contact. Ask your administrator to enable portal access on your project."
            : "Could not provision your support workspace account",
      });
    }
    if (workspaceRole === "client" && ticketingUser.tbosAdminUserId !== tbosUser.id) {
      await prisma.ticketingUser.updateMany({
        where: { tbosAdminUserId: tbosUser.id, id: { not: ticketingUser.id } },
        data: { tbosAdminUserId: null },
      });
      await prisma.ticketingUser.update({
        where: { id: ticketingUser.id },
        data: { tbosAdminUserId: tbosUser.id, tbosRole: "client" },
      });
      ticketingUser.tbosAdminUserId = tbosUser.id;
      ticketingUser.tbosRole = "client";
    }
    req.ticketingUser = ticketingUser;
    next();
  } catch (error) {
    console.error("workspace ticketing resolve failed", error);
    return res.status(500).json({ error: "Failed to open support workspace" });
  }
}
