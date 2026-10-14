import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";

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
    return { projectManagementTimesheets: true, workspaceTimesheets: roles.includes("customer_support") };
  }

  const activeMembership = await prisma.projectMember.findFirst({
    where: { adminUserId: userId, project: { status: "ACTIVE" } },
    select: { id: true },
  });
  const projectManagementTimesheets = Boolean(activeMembership);

  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { email: true, mappedClientContactId: true },
  });
  const email = admin?.email?.trim().toLowerCase() ?? "";

  const approverLink = await prisma.projectClientContact.findFirst({
    where: {
      canApproveTimesheets: true,
      portalAccess: true,
      project: { status: "ACTIVE" },
      OR: [
        ...(admin?.mappedClientContactId ? [{ contactId: admin.mappedClientContactId }] : []),
        ...(email ? [{ contact: { email: { equals: email, mode: "insensitive" as const } } }] : []),
      ],
    },
    select: { id: true },
  });

  const workspaceTimesheets =
    roles.includes("customer_support") ||
    (roles.includes("client") && Boolean(approverLink)) ||
    Boolean(activeMembership);

  return { projectManagementTimesheets, workspaceTimesheets };
}
