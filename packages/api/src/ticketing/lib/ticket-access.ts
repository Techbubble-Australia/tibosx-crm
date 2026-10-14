import { prisma } from "@techbubble/database";
import type { TicketingAuthUser } from "../middleware/auth.js";

const TBOS_ADMIN_ROLES = new Set(["admin"]);

export function isTbosAdmin(user: TicketingAuthUser & { tbosRole?: string | null }): boolean {
  if (user.role !== "CONSULTANT" || !user.consultantVerified) return false;
  const role = (user.tbosRole || "").trim().toLowerCase();
  return TBOS_ADMIN_ROLES.has(role);
}

export async function assignedOrganizationIds(consultantUserId: string): Promise<string[]> {
  const rows = await prisma.consultantOrganization.findMany({
    where: { consultantId: consultantUserId },
    select: { organizationId: true },
  });
  return rows.map((r) => r.organizationId);
}

export function isCustomerSupportTbos(
  user: TicketingAuthUser & { tbosRole?: string | null },
): boolean {
  if (user.role !== "CONSULTANT") return false;
  const role = (user.tbosRole || "").trim().toLowerCase();
  return role === "customer_support";
}

/** Active support portal orgs for the client's CRM client (from linked org). */
export async function organizationIdsForClientPortal(
  clientOrganizationId: string | null,
): Promise<string[]> {
  if (!clientOrganizationId) return [];
  const anchor = await prisma.organization.findUnique({
    where: { id: clientOrganizationId },
    select: { project: { select: { clientId: true } } },
  });
  const clientId = anchor?.project?.clientId;
  if (!clientId) return [clientOrganizationId];
  const rows = await prisma.organization.findMany({
    where: {
      active: true,
      project: { status: "ACTIVE", clientId },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Orgs for ACTIVE SUPPORT projects where the TBOS user is a project or support-group member. */
export async function organizationIdsForTbosProjectMember(
  adminUserId: string,
  consultantTicketingUserId?: string,
): Promise<string[]> {
  const projectIds = new Set<string>();

  const members = await prisma.projectMember.findMany({
    where: { adminUserId },
    select: { projectId: true },
  });
  for (const row of members) projectIds.add(row.projectId);

  const groupMembers = await prisma.projectSupportGroupMember.findMany({
    where: {
      OR: [
        { adminUserId },
        ...(consultantTicketingUserId ? [{ ticketingUserId: consultantTicketingUserId }] : []),
      ],
    },
    select: { group: { select: { projectId: true } } },
  });
  for (const row of groupMembers) projectIds.add(row.group.projectId);

  if (projectIds.size === 0) return [];

  const orgs = await prisma.organization.findMany({
    where: {
      active: true,
      projectId: { in: [...projectIds] },
      project: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  return orgs.map((r) => r.id);
}

/**
 * null = all active support projects (TBOS admin).
 * string[] = allowed organization ids (may be empty).
 */
export async function scopeOrganizationIdsForPortal(
  user: TicketingAuthUser & { tbosRole?: string | null; tbosAdminUserId?: string | null },
): Promise<string[] | null> {
  if (user.role === "CLIENT") {
    return organizationIdsForClientPortal(user.organizationId);
  }
  if (user.role === "CONSULTANT" && user.consultantVerified) {
    if (isTbosAdmin(user)) return null;
    if (isCustomerSupportTbos(user)) return null;
    return assignedOrganizationIds(user.id);
  }
  return [];
}

export async function canSelectOrganizationForNewTicket(
  user: TicketingAuthUser & { tbosRole?: string | null; tbosAdminUserId?: string | null },
  organizationId: string,
): Promise<boolean> {
  const scopeIds = await scopeOrganizationIdsForPortal(user);
  if (scopeIds === null) {
    const org = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        active: true,
        projectId: { not: null },
        project: { status: "ACTIVE" },
      },
      select: { id: true },
    });
    return !!org;
  }
  return scopeIds.includes(organizationId);
}

export async function ticketOrganizationFilter(
  user: TicketingAuthUser & { tbosRole?: string | null; tbosAdminUserId?: string | null },
): Promise<{ organizationId?: string | { in: string[] } } | "deny"> {
  if (user.role === "CLIENT") {
    const orgIds = await organizationIdsForClientPortal(user.organizationId);
    if (orgIds.length === 0) return "deny";
    if (orgIds.length === 1) return { organizationId: orgIds[0] };
    return { organizationId: { in: orgIds } };
  }
  if (user.role === "CONSULTANT" && user.consultantVerified) {
    if (isTbosAdmin(user)) return {};
    if (isCustomerSupportTbos(user)) return {};
    const orgIds = await assignedOrganizationIds(user.id);
    if (orgIds.length === 0) return { organizationId: { in: [] } };
    return { organizationId: { in: orgIds } };
  }
  return "deny";
}

export async function canAccessTicketOrganization(
  user: TicketingAuthUser & { tbosRole?: string | null; tbosAdminUserId?: string | null },
  organizationId: string,
): Promise<boolean> {
  const filter = await ticketOrganizationFilter(user);
  if (filter === "deny") return false;
  if (!filter.organizationId) return true;
  if (typeof filter.organizationId === "string") return filter.organizationId === organizationId;
  return filter.organizationId.in.includes(organizationId);
}
