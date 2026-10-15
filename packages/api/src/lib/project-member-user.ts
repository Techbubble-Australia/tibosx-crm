import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";
import { ensureProjectMemberRole } from "./admin-user-profile-map";

const credentialMemberInclude = {
  project: { select: { id: true, title: true, projectNumber: true } },
  credentialTemplate: true,
} as const;

export function hasEffectiveProjectMemberRole(primary: string, additional?: unknown): boolean {
  return effectiveRoleList(primary, additional).includes("project_member");
}

export async function userHasProjectMembership(userId: string): Promise<boolean> {
  const row = await prisma.projectMember.findFirst({
    where: { adminUserId: userId },
    select: { id: true },
  });
  return Boolean(row);
}

export async function userQualifiesForMemberOnboarding(
  userId: string,
  primary: string,
  additional?: unknown,
): Promise<boolean> {
  if (hasEffectiveProjectMemberRole(primary, additional)) return true;
  if (await userHasProjectMembership(userId)) return true;
  const member = await findCredentialProjectMemberForUser(userId);
  return Boolean(member?.credentialTemplateId);
}

/** Link project member + ensure project_member role before onboarding checks (e.g. first login). */
export async function prepareMemberOnboardingForUser(userId: string): Promise<void> {
  const member = await findCredentialProjectMemberForUser(userId);
  if (!member?.credentialTemplateId) return;
  await prisma.$transaction(async (tx) => {
    await ensureProjectMemberRole(tx, userId);
  });
}

/** Project member row with agreement template, linked by admin user or mapped profile. */
export async function findCredentialProjectMemberForUser(userId: string) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { mappedProfileId: true },
  });

  let member = await prisma.projectMember.findFirst({
    where: { adminUserId: userId, credentialTemplateId: { not: null } },
    orderBy: { updatedAt: "desc" },
    include: credentialMemberInclude,
  });

  if (!member && user?.mappedProfileId) {
    member = await prisma.projectMember.findFirst({
      where: { profileId: user.mappedProfileId, credentialTemplateId: { not: null } },
      orderBy: { updatedAt: "desc" },
      include: credentialMemberInclude,
    });
    if (member && !member.adminUserId) {
      await prisma.projectMember.update({
        where: { id: member.id },
        data: { adminUserId: userId },
      });
    }
  }

  return member;
}
