import { prisma } from "@techbubble/database";

/** Project IDs a portal client can view timesheets for (org link + project client contacts). */
export async function resolveClientTimesheetProjectIds(
  ticketingUserId: string,
  organizationId: string | null,
): Promise<string[]> {
  const ids = new Set<string>();

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { projectId: true },
    });
    if (org?.projectId) ids.add(org.projectId);
  }

  const links = await prisma.projectClientContact.findMany({
    where: { ticketingUserId },
    select: { projectId: true },
  });
  for (const link of links) {
    ids.add(link.projectId);
  }

  return [...ids];
}
