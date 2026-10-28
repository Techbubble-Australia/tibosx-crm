import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";
import { listActiveProjectMembershipsForUser } from "./project-member-resolution";

export type TimesheetAccessFlags = {
  projectManagementTimesheets: boolean;
  workspaceTimesheets: boolean;
  /** User has an active project assignment and can create/submit their own timesheets. */
  canLogOwnTimesheets: boolean;
};

export async function getTimesheetAccessForUser(
  userId: string,
  primaryRole: string,
  additionalRoles: unknown,
): Promise<TimesheetAccessFlags> {
  const roles = effectiveRoleList(primaryRole, additionalRoles);
  if (roles.some((r) => r === "admin" || r === "project_manager" || r === "project_member")) {
    const memberships = await listActiveProjectMembershipsForUser(userId);
    return {
      projectManagementTimesheets: true,
      workspaceTimesheets: false,
      canLogOwnTimesheets: memberships.length > 0,
    };
  }

  const memberships = await listActiveProjectMembershipsForUser(userId);
  const projectManagementTimesheets = memberships.length > 0;

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { email: true, mappedClientContactId: true },
  });
  const customer = admin
    ? null
    : await prisma.customerUser.findUnique({
        where: { id: userId },
        select: { email: true, mappedClientContactId: true },
      });
  const email = (admin?.email ?? customer?.email)?.trim().toLowerCase() ?? "";
  const mappedClientContactId = admin?.mappedClientContactId ?? customer?.mappedClientContactId ?? null;

  const approverLink = await prisma.projectClientContact.findFirst({
    where: {
      canApproveTimesheets: true,
      project: { status: "ACTIVE" },
      OR: [
        ...(mappedClientContactId ? [{ contactId: mappedClientContactId }] : []),
        ...(email ? [{ contact: { email: { equals: email, mode: "insensitive" as const } } }] : []),
      ],
    },
    select: { id: true },
  });

  const workspaceTimesheets =
    roles.includes("client") && !roles.includes("customer_support") && Boolean(approverLink);

  return { projectManagementTimesheets, workspaceTimesheets, canLogOwnTimesheets: false };
}

/** Timesheets a TBOS client user may view as the assigned client approver. */
export async function timesheetClientApproverWhere(
  adminUserId: string,
): Promise<{ approverKind: "CLIENT_CONTACT"; projectClientContactId: { in: string[] } } | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { email: true, mappedClientContactId: true },
  });
  const customer = admin
    ? null
    : await prisma.customerUser.findUnique({
        where: { id: adminUserId },
        select: { email: true, mappedClientContactId: true },
      });
  const email = (admin?.email ?? customer?.email)?.trim().toLowerCase() ?? "";
  const mappedClientContactId = admin?.mappedClientContactId ?? customer?.mappedClientContactId ?? null;
  if (!email && !mappedClientContactId) return null;
  const contacts = await prisma.projectClientContact.findMany({
    where: {
      canApproveTimesheets: true,
      OR: [
        ...(mappedClientContactId ? [{ contactId: mappedClientContactId }] : []),
        ...(email ? [{ contact: { email: { equals: email, mode: "insensitive" as const } } }] : []),
      ],
    },
    select: { id: true },
  });
  if (!contacts.length) return null;
  return {
    approverKind: "CLIENT_CONTACT",
    projectClientContactId: { in: contacts.map((c) => c.id) },
  };
}
