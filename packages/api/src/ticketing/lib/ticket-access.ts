import { prisma } from "@techbubble/database";
import type { TicketingAuthUser } from "../middleware/auth.js";
import { ensureClientPortalContactLinks } from "./client-timesheet-projects.js";
import { resolveTbosClientPortalIdentity } from "./client-portal-identity.js";

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

/** Support portal org ids a workspace client may create tickets against. */
export async function organizationIdsForClientPortal(
  ticketingUserId: string,
  tbosAdminUserId: string | null,
): Promise<string[]> {
  const projectIds = new Set<string>();
  const portalAccessOr = [{ portalAccess: true }, { canApproveTimesheets: true }] as const;

  let identity = { adminEmail: null as string | null, contactIds: [] as string[], contactEmails: [] as string[] };
  if (tbosAdminUserId) {
    identity = await resolveTbosClientPortalIdentity(tbosAdminUserId);
    await ensureClientPortalContactLinks(ticketingUserId, identity.contactEmails, identity.contactIds);

    const approverProjects = await prisma.project.findMany({
      where: {
        status: "ACTIVE",
        timesheetApproverUserId: tbosAdminUserId,
        supportOrganization: { active: true },
      },
      select: { id: true },
    });
    for (const row of approverProjects) {
      projectIds.add(row.id);
    }
  }

  const contactEmailFilters =
    identity.contactEmails.length > 0
      ? identity.contactEmails.map((email) => ({
          contact: { email: { equals: email, mode: "insensitive" as const } },
        }))
      : [];

  const portalLinks = await prisma.projectClientContact.findMany({
    where: {
      OR: [
        { ticketingUserId, OR: [...portalAccessOr] },
        ...(identity.contactIds.length
          ? [{ contactId: { in: identity.contactIds }, OR: [...portalAccessOr] }]
          : []),
        ...contactEmailFilters.map((filter) => ({ ...filter, OR: [...portalAccessOr] })),
      ],
      project: { status: "ACTIVE" },
    },
    select: { projectId: true },
  });
  for (const link of portalLinks) {
    projectIds.add(link.projectId);
  }

  const clientIds = new Set<string>();
  if (identity.contactIds.length) {
    const contacts = await prisma.clientContact.findMany({
      where: { id: { in: identity.contactIds } },
      select: { clientId: true },
    });
    for (const row of contacts) {
      if (row.clientId) clientIds.add(row.clientId);
    }
  }

  for (const clientId of clientIds) {
    const clientProjects = await prisma.project.findMany({
      where: {
        clientId,
        status: "ACTIVE",
        supportOrganization: { active: true },
      },
      select: { id: true },
    });
    for (const row of clientProjects) {
      projectIds.add(row.id);
    }
  }

  if (projectIds.size === 0) return [];

  const orgs = await prisma.organization.findMany({
    where: {
      active: true,
      projectId: { in: [...projectIds] },
      project: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  return orgs.map((row) => row.id);
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
    return organizationIdsForClientPortal(user.id, user.tbosAdminUserId ?? null);
  }
  if (user.role === "CONSULTANT" && user.consultantVerified) {
    if (isTbosAdmin(user)) return null;
    if (isCustomerSupportTbos(user)) {
      const adminId = user.tbosAdminUserId;
      if (!adminId) return [];
      return organizationIdsForTbosProjectMember(adminId, user.id);
    }
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
    const orgIds = await organizationIdsForClientPortal(user.id, user.tbosAdminUserId ?? null);
    if (orgIds.length === 0) return "deny";
    if (orgIds.length === 1) return { organizationId: orgIds[0] };
    return { organizationId: { in: orgIds } };
  }
  if (user.role === "CONSULTANT" && user.consultantVerified) {
    if (isTbosAdmin(user)) return {};
    if (isCustomerSupportTbos(user)) {
      const adminId = user.tbosAdminUserId;
      if (!adminId) return { organizationId: { in: [] as string[] } };
      const orgIds = await organizationIdsForTbosProjectMember(adminId, user.id);
      if (orgIds.length === 0) return { organizationId: { in: [] as string[] } };
      if (orgIds.length === 1) return { organizationId: orgIds[0] };
      return { organizationId: { in: orgIds } };
    }
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
