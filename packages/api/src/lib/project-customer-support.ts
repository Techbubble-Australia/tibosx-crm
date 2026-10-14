import { prisma } from "@techbubble/database";
import { parseAdditionalRoles } from "./admin-roles";
import { syncProjectClientContacts } from "./support-project";

export async function grantCustomerSupportRoleToProjectMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId, adminUserId: { not: null } },
    select: { adminUserId: true },
  });
  const userIds = [...new Set(members.map((m) => m.adminUserId).filter((id): id is string => Boolean(id)))];
  for (const userId of userIds) {
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { role: true, additionalRoles: true },
    });
    if (!user) continue;
    const extra = parseAdditionalRoles(user.additionalRoles);
    if (extra.includes("customer_support")) continue;
    await prisma.adminUser.update({
      where: { id: userId },
      data: { additionalRoles: [...extra, "customer_support"] },
    });
  }
}

export async function applyProjectCustomerSupportSettings(
  projectId: string,
  enabled: boolean,
  contacts: Array<{ contactId: string; portalAccess: boolean; canApproveTimesheets: boolean }>,
) {
  if (!enabled) {
    await prisma.project.update({
      where: { id: projectId },
      data: { kind: "DELIVERY" },
    });
    return;
  }

  if (!contacts.some((c) => c.portalAccess)) {
    throw new Error("CLIENT_ACCESS_REQUIRED");
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { kind: "SUPPORT" },
  });
  await syncProjectClientContacts(projectId, contacts);
  await grantCustomerSupportRoleToProjectMembers(projectId);
}
