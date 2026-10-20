import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@techbubble/database";
import type { TicketingAuthUser } from "../middleware/auth.js";
import { syncConsultantOrganizationsForTbosUser } from "../../lib/support-organization.js";
import { provisionClientPortalUser } from "../../lib/support-project.js";

const WORKSPACE_TBOS_ROLES = new Set(["client", "customer_support"]);

export function isWorkspaceTbosRole(role: string): boolean {
  return WORKSPACE_TBOS_ROLES.has(role.trim().toLowerCase());
}

async function resolveClientTicketingUser(
  adminUserId: string,
  email: string,
): Promise<TicketingAuthUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { mappedClientContactId: true, name: true, email: true },
  });

  const emailLower = email.trim().toLowerCase();
  const portalAccessOr = [{ portalAccess: true }, { canApproveTimesheets: true }];
  const link = await prisma.projectClientContact.findFirst({
    where: {
      project: { status: "ACTIVE" },
      OR: [
        ...(admin?.mappedClientContactId
          ? [{ contactId: admin.mappedClientContactId, OR: portalAccessOr }]
          : []),
        { contact: { email: { equals: emailLower, mode: "insensitive" } }, OR: portalAccessOr },
      ],
    },
    include: { ticketingUser: true, project: { select: { supportOrganization: { select: { id: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

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

  const byEmail = await prisma.ticketingUser.findFirst({
    where: { email: email.toLowerCase(), role: "CLIENT", active: true },
  });
  if (!byEmail) return null;
  return {
    id: byEmail.id,
    email: byEmail.email,
    role: "CLIENT",
    organizationId: byEmail.organizationId,
    consultantVerified: byEmail.consultantVerified,
    tbosRole: "client",
    tbosAdminUserId: adminUserId,
  };
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
