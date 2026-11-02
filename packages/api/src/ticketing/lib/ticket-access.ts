import { prisma, TicketingUserRole } from "@techbubble/database";
import type { TicketingAuthUser } from "../middleware/auth.js";
import { ensureClientPortalContactLinks } from "./client-timesheet-projects.js";
import {
  resolveLinkedTbosClientPortalIdentity,
  resolveTbosClientUserIds,
} from "./client-portal-identity.js";
import { TICKETABLE_PROJECT_WHERE } from "./support-portal-orgs.js";

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
  const portalAccessOr = [{ portalAccess: true }, { canApproveTimesheets: true }] as const;
  const projectIds = new Set<string>();

  const tu = await prisma.ticketingUser.findUnique({
    where: { id: ticketingUserId },
    select: {
      email: true,
      tbosAdminUserId: true,
      projectClientLink: {
        select: {
          projectId: true,
          contactId: true,
          portalAccess: true,
          canApproveTimesheets: true,
        },
      },
    },
  });
  if (!tu) return [];

  let adminId = tbosAdminUserId ?? tu.tbosAdminUserId ?? null;
  if (!adminId) {
    const adminById = await prisma.adminUser.findUnique({
      where: { id: ticketingUserId },
      select: { id: true, role: true, active: true },
    });
    if (adminById?.active && adminById.role === "client") {
      adminId = adminById.id;
    }
  }
  if (!adminId) {
    const customerById = await prisma.customerUser.findUnique({
      where: { id: ticketingUserId },
      select: { id: true, active: true },
    });
    if (customerById?.active) {
      adminId = customerById.id;
    }
  }
  if (!adminId) {
    const adminByEmail = await prisma.adminUser.findFirst({
      where: {
        active: true,
        role: "client",
        email: { equals: tu.email, mode: "insensitive" },
      },
      select: { id: true },
    });
    adminId = adminByEmail?.id ?? null;
  }
  if (!adminId) {
    const customerByEmail = await prisma.customerUser.findFirst({
      where: {
        active: true,
        email: { equals: tu.email, mode: "insensitive" },
      },
      select: { id: true },
    });
    adminId = customerByEmail?.id ?? null;
  }

  const contactIds = new Set<string>();
  const contactEmails = new Set<string>();
  if (tu.email.trim()) contactEmails.add(tu.email.trim().toLowerCase());

  if (adminId) {
    const identity = await resolveLinkedTbosClientPortalIdentity(adminId);
    for (const id of identity.contactIds) contactIds.add(id);
    for (const email of identity.contactEmails) contactEmails.add(email);

    await ensureClientPortalContactLinks(ticketingUserId, [...contactEmails], [...contactIds]);

    const tbosActorIds = await resolveTbosClientUserIds(adminId);
    const approverProjects = await prisma.project.findMany({
      where: {
        status: "ACTIVE",
        timesheetApproverUserId: { in: tbosActorIds },
      },
      select: { id: true },
    });
    for (const row of approverProjects) projectIds.add(row.id);
  }

  if (
    tu.projectClientLink &&
    (tu.projectClientLink.portalAccess || tu.projectClientLink.canApproveTimesheets)
  ) {
    projectIds.add(tu.projectClientLink.projectId);
    contactIds.add(tu.projectClientLink.contactId);
  }

  if (contactEmails.size) {
    const contacts = await prisma.clientContact.findMany({
      where: {
        OR: [...contactEmails].map((email) => ({
          email: { equals: email, mode: "insensitive" as const },
        })),
      },
      select: { id: true },
    });
    for (const row of contacts) contactIds.add(row.id);
  }

  if (contactIds.size) {
    const byContact = await prisma.projectClientContact.findMany({
      where: {
        contactId: { in: [...contactIds] },
        OR: [...portalAccessOr],
        project: { status: "ACTIVE" },
      },
      select: { projectId: true },
    });
    for (const row of byContact) projectIds.add(row.projectId);
  }

  const byTicketingUserLinks = await prisma.projectClientContact.findMany({
    where: {
      ticketingUserId,
      OR: [...portalAccessOr],
      project: { status: "ACTIVE" },
    },
    select: { projectId: true, contactId: true },
  });
  for (const link of byTicketingUserLinks) {
    projectIds.add(link.projectId);
    contactIds.add(link.contactId);
  }
  if (adminId) {
    const byTbosAdminLinks = await prisma.projectClientContact.findMany({
      where: {
        ticketingUser: { tbosAdminUserId: adminId, role: TicketingUserRole.CLIENT, active: true },
        OR: [...portalAccessOr],
        project: { status: "ACTIVE" },
      },
      select: { projectId: true, contactId: true },
    });
    for (const link of byTbosAdminLinks) {
      projectIds.add(link.projectId);
      contactIds.add(link.contactId);
    }
  }
  for (const contactId of contactIds) {
    const siblings = await prisma.projectClientContact.findMany({
      where: {
        contactId,
        OR: [...portalAccessOr],
        project: { status: "ACTIVE" },
      },
      select: { projectId: true },
    });
    for (const row of siblings) projectIds.add(row.projectId);
  }

  if (projectIds.size === 0) return [];

  const { ensureSupportOrganizationForProject } = await import("../../lib/support-organization.js");
  for (const projectId of projectIds) {
    try {
      await ensureSupportOrganizationForProject(projectId);
    } catch {
      /* skip missing projects */
    }
  }

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
  if (scopeIds !== null && !scopeIds.includes(organizationId)) return false;
  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      active: true,
      projectId: { not: null },
      project: TICKETABLE_PROJECT_WHERE,
    },
    select: { id: true },
  });
  return !!org;
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
