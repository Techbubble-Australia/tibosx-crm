import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma, TicketingUserRole } from "@techbubble/database";
import type { TicketingAuthUser } from "../middleware/auth.js";
import { syncConsultantOrganizationsForTbosUser } from "../../lib/support-organization.js";
import { provisionClientPortalUser } from "../../lib/support-project.js";
import { ensureClientPortalContactLinks } from "./client-timesheet-projects.js";
import { resolveLinkedTbosClientPortalIdentity, resolveTbosClientUserIds } from "./client-portal-identity.js";

const WORKSPACE_TBOS_ROLES = new Set(["client", "customer_support"]);

export function isWorkspaceTbosRole(role: string): boolean {
  return WORKSPACE_TBOS_ROLES.has(role.trim().toLowerCase());
}

async function resolveClientTicketingUser(
  adminUserId: string,
  email: string,
): Promise<TicketingAuthUser | null> {
  const identity = await resolveLinkedTbosClientPortalIdentity(adminUserId);
  const tbosActorIds = await resolveTbosClientUserIds(adminUserId);
  const portalAccessOr = [{ portalAccess: true }, { canApproveTimesheets: true }];
  const contactEmailFilters = identity.contactEmails.map((rowEmail) => ({
    contact: { email: { equals: rowEmail, mode: "insensitive" as const } },
  }));

  const linkClauses = [
    ...(identity.contactIds.length
      ? [{ contactId: { in: identity.contactIds }, OR: portalAccessOr }]
      : []),
    ...contactEmailFilters.map((filter) => ({ ...filter, OR: portalAccessOr })),
    {
      ticketingUser: { tbosAdminUserId: adminUserId, role: TicketingUserRole.CLIENT, active: true },
      OR: portalAccessOr,
    },
    {
      project: {
        status: "ACTIVE",
        kind: "SUPPORT",
        timesheetApproverUserId: { in: tbosActorIds },
      },
    },
  ];
  const link =
    linkClauses.length > 0
      ? await prisma.projectClientContact.findFirst({
          where: {
            project: { status: "ACTIVE" },
            OR: linkClauses,
          },
          include: {
            ticketingUser: true,
            project: { select: { supportOrganization: { select: { id: true } } } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : null;

  if (link) {
    let tu = link.ticketingUser;
    let orgId = link.project.supportOrganization?.id;
    if (!orgId) {
      const { ensureSupportOrganizationForProject } = await import("../../lib/support-organization.js");
      const org = await ensureSupportOrganizationForProject(link.projectId);
      orgId = org.id;
    }
    if ((!tu || tu.role !== "CLIENT" || !tu.active) && orgId) {
      await provisionClientPortalUser(link.id, orgId);
      const refreshed = await prisma.projectClientContact.findUnique({
        where: { id: link.id },
        include: { ticketingUser: true },
      });
      tu = refreshed?.ticketingUser ?? null;
    }
    if (tu?.active && tu.role === "CLIENT") {
      if (tu.tbosAdminUserId !== adminUserId) {
        await prisma.ticketingUser.updateMany({
          where: { tbosAdminUserId: adminUserId, id: { not: tu.id } },
          data: { tbosAdminUserId: null, tbosRole: null },
        });
      }
      await prisma.ticketingUser.update({
        where: { id: tu.id },
        data: { tbosAdminUserId: adminUserId, tbosRole: "client" },
      });
      return {
        id: tu.id,
        email: tu.email,
        role: "CLIENT",
        organizationId: tu.organizationId,
        consultantVerified: tu.consultantVerified,
        tbosRole: "client",
        tbosAdminUserId: adminUserId,
      };
    }
  }

  const emailsForLink = [...new Set([...identity.contactEmails, email.trim().toLowerCase()])];
  const existingClient = await prisma.ticketingUser.findFirst({
    where: {
      role: "CLIENT",
      active: true,
      OR: [
        { tbosAdminUserId: adminUserId },
        ...emailsForLink.map((rowEmail) => ({
          email: { equals: rowEmail, mode: "insensitive" as const },
        })),
      ],
    },
  });
  if (existingClient) {
    await ensureClientPortalContactLinks(existingClient.id, emailsForLink, identity.contactIds);
    if (existingClient.tbosAdminUserId !== adminUserId) {
      await prisma.ticketingUser.updateMany({
        where: { tbosAdminUserId: adminUserId, id: { not: existingClient.id } },
        data: { tbosAdminUserId: null, tbosRole: null },
      });
      await prisma.ticketingUser.update({
        where: { id: existingClient.id },
        data: { tbosAdminUserId: adminUserId, tbosRole: "client" },
      });
    }
    const afterLink = await prisma.projectClientContact.findFirst({
      where: {
        ticketingUserId: existingClient.id,
        OR: portalAccessOr,
        project: { status: "ACTIVE" },
      },
      select: { id: true },
    });
    if (afterLink) {
      return {
        id: existingClient.id,
        email: existingClient.email,
        role: "CLIENT",
        organizationId: existingClient.organizationId,
        consultantVerified: existingClient.consultantVerified,
        tbosRole: "client",
        tbosAdminUserId: adminUserId,
      };
    }
  }

  return null;
}

async function resolveConsultantTicketingUser(
  adminUserId: string,
  email: string,
  tbosRole: string,
): Promise<TicketingAuthUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { name: true, email: true, profilePhotoUrl: true },
  });
  const displayName =
    admin?.name?.trim() || admin?.email?.split("@")[0] || email.split("@")[0] || "Consultant";

  let consultant = await prisma.ticketingUser.findFirst({
    where: {
      role: "CONSULTANT",
      consultantVerified: true,
      OR: [{ tbosAdminUserId: adminUserId }, { email: email.toLowerCase() }],
    },
  });

  if (!consultant) {
    consultant = await prisma.ticketingUser.create({
      data: {
        email: email.toLowerCase(),
        name: displayName,
        profilePhotoUrl: admin?.profilePhotoUrl ?? null,
        passwordHash: await bcrypt.hash(randomUUID(), 10),
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: adminUserId,
        tbosRole,
      },
    });
  } else {
    consultant = await prisma.ticketingUser.update({
      where: { id: consultant.id },
      data: {
        tbosAdminUserId: consultant.tbosAdminUserId ?? adminUserId,
        tbosRole,
        name: displayName,
        profilePhotoUrl: admin?.profilePhotoUrl ?? consultant.profilePhotoUrl,
        consultantVerified: true,
        active: true,
      },
    });
  }

  await syncConsultantOrganizationsForTbosUser(adminUserId);

  return {
    id: consultant.id,
    email: consultant.email,
    role: "CONSULTANT",
    organizationId: consultant.organizationId,
    consultantVerified: consultant.consultantVerified,
    tbosRole,
    tbosAdminUserId: adminUserId,
  };
}

/** Map a TBOS admin user (client or customer support) to a ticketing portal identity. */
export async function resolveTicketingUserForWorkspace(
  adminUserId: string,
  email: string,
  tbosRole: string,
): Promise<TicketingAuthUser | null> {
  const role = tbosRole.trim().toLowerCase();
  if (role === "client") {
    return resolveClientTicketingUser(adminUserId, email);
  }
  if (role === "customer_support") {
    return resolveConsultantTicketingUser(adminUserId, email, role);
  }
  return null;
}
