import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";
import { listActiveProjectMembershipsForUser } from "./project-member-resolution";

export type TimesheetAccessFlags = {
  projectManagementTimesheets: boolean;
  workspaceTimesheets: boolean;
};

export async function getTimesheetAccessForUser(
  userId: string,
  primaryRole: string,
  additionalRoles: unknown,
): Promise<TimesheetAccessFlags> {
  const roles = effectiveRoleList(primaryRole, additionalRoles);
  if (roles.some((r) => r === "admin" || r === "project_manager" || r === "project_member")) {
    return { projectManagementTimesheets: true, workspaceTimesheets: false };
  }

  const memberships = await listActiveProjectMembershipsForUser(userId);
  const projectManagementTimesheets = memberships.length > 0;

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { email: true, mappedClientContactId: true },
  });
  const email = admin?.email?.trim().toLowerCase() ?? "";

  const approverLink = await prisma.projectClientContact.findFirst({
    where: {
      canApproveTimesheets: true,
      project: { status: "ACTIVE" },
      OR: [
        ...(admin?.mappedClientContactId ? [{ contactId: admin.mappedClientContactId }] : []),
        ...(email ? [{ contact: { email: { equals: email, mode: "insensitive" as const } } }] : []),
      ],
    },
    select: { id: true },
  });

  const workspaceTimesheets =
    roles.includes("client") && !roles.includes("customer_support") && Boolean(approverLink);

  return { projectManagementTimesheets, workspaceTimesheets };
}

/** Timesheets a TBOS client user may view as the assigned client approver. */
export async function timesheetClientApproverWhere(
  adminUserId: string,
): Promise<{ approverKind: "CLIENT_CONTACT"; projectClientContactId: { in: string[] } } | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { email: true, mappedClientContactId: true },
  });
  if (!admin) return null;
  const email = admin.email?.trim().toLowerCase() ?? "";
  const contacts = await prisma.projectClientContact.findMany({
    where: {
      canApproveTimesheets: true,
      OR: [
        ...(admin.mappedClientContactId ? [{ contactId: admin.mappedClientContactId }] : []),
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
