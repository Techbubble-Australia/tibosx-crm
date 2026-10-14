import { prisma, type Prisma } from "@techbubble/database";
import { effectiveRoleList, isAdminRole } from "./admin-roles";

export async function assertMappedProfileAvailable(
  profileId: string,
  excludeUserId?: string,
): Promise<string | null> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!profile) return "Profile record not found";

  const taken = await prisma.adminUser.findFirst({
    where: {
      mappedProfileId: profileId,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, email: true },
  });
  if (taken) {
    return `Another user (${taken.email}) is already mapped to this profile`;
  }
  return null;
}

export async function ensureProjectMemberRole(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const user = await tx.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, additionalRoles: true },
  });
  if (!user) return;
  const effective = effectiveRoleList(user.role, user.additionalRoles);
  if (effective.includes("project_member")) return;

  const extra = Array.isArray(user.additionalRoles)
    ? user.additionalRoles.filter((r): r is string => typeof r === "string" && isAdminRole(r))
    : [];
  if (user.role !== "project_member" && !extra.includes("project_member")) {
    await tx.adminUser.update({
      where: { id: userId },
      data: { additionalRoles: [...extra, "project_member"] },
    });
  }
}

/** Apply profile mapping and link project members to this user. */
export async function applyMappedProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  profileId: string | null,
): Promise<void> {
  if (profileId) {
    await tx.projectMember.updateMany({
      where: { profileId },
      data: { adminUserId: userId },
    });
    await ensureProjectMemberRole(tx, userId);
  }
}
