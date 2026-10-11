import { prisma } from "@techbubble/database";

export type PortalOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  projectId: string | null;
  projectNumber: string | null;
  projectTitle: string | null;
};

/** Active SUPPORT projects only; one row per linked project (deduped). */
export async function listSupportPortalOrganizations(
  scopeOrganizationIds: string[] | null,
): Promise<PortalOrganizationRow[]> {
  const where: {
    active: boolean;
    id?: { in: string[] };
    project: { status: string; kind: string };
  } = {
    active: true,
    project: { status: "ACTIVE", kind: "SUPPORT" },
  };

  if (scopeOrganizationIds) {
    if (!scopeOrganizationIds.length) return [];
    where.id = { in: scopeOrganizationIds };
  }

  const rows = await prisma.organization.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      projectId: true,
      project: { select: { id: true, projectNumber: true, title: true } },
    },
  });

  const byProject = new Map<string, PortalOrganizationRow>();
  for (const row of rows) {
    const projectId = row.projectId ?? row.project?.id;
    if (!projectId) continue;
    if (byProject.has(projectId)) continue;
    byProject.set(projectId, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      projectId,
      projectNumber: row.project?.projectNumber ?? null,
      projectTitle: row.project?.title ?? null,
    });
  }

  return [...byProject.values()].sort((a, b) => a.name.localeCompare(b.name));
}
