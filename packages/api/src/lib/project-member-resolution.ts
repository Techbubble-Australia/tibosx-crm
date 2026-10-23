import { prisma, type Prisma } from "@techbubble/database";

export async function projectMemberWhereForUser(userId: string): Promise<Prisma.ProjectMemberWhereInput> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { mappedProfileId: true },
  });
  const or: Prisma.ProjectMemberWhereInput[] = [{ adminUserId: userId }];
  if (user?.mappedProfileId) {
    or.push({ profileId: user.mappedProfileId });
  }
  return { OR: or };
}

/** Active project memberships for timesheets, linking adminUserId when matched by profile. */
export async function listActiveProjectMembershipsForUser(userId: string) {
  const whereMember = await projectMemberWhereForUser(userId);
  const rows = await prisma.projectMember.findMany({
    where: { ...whereMember, project: { status: "ACTIVE" } },
    include: {
      project: {
        select: { id: true, title: true, projectNumber: true, kind: true, startDate: true, endDate: true },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
  });

  for (const row of rows) {
    if (!row.adminUserId) {
      await prisma.projectMember
        .update({
          where: { id: row.id },
          data: { adminUserId: userId },
        })
        .catch(() => undefined);
    }
  }

  return rows;
}

export async function userHasActiveProjectMembership(userId: string, projectId: string): Promise<boolean> {
  const whereMember = await projectMemberWhereForUser(userId);
  const row = await prisma.projectMember.findFirst({
    where: { ...whereMember, projectId, project: { status: "ACTIVE" } },
    select: { id: true },
  });
  return Boolean(row);
}
