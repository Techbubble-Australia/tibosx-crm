import { prisma, type Prisma } from "@techbubble/database";

export type PortalOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  projectId: string | null;
  projectNumber: string | null;
  projectTitle: string | null;
};

/** Active portal orgs: standalone orgs or orgs linked to an ACTIVE TBOS project. */
export function supportPortalOrganizationWhere(
  scopeOrganizationIds?: string[],
): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {
    active: true,
    OR: [{ projectId: null }, { project: { status: "ACTIVE" } }],
  };
  if (scopeOrganizationIds) {
    if (!scopeOrganizationIds.length) {
      return { id: { in: [] } };
    }
    where.id = { in: scopeOrganizationIds };
  }
  return where;
}

export async function listSupportPortalOrganizations(
  scopeOrganizationIds: string[] | null,
): Promise<PortalOrganizationRow[]> {
  const where = supportPortalOrganizationWhere(
    scopeOrganizationIds === null ? undefined : scopeOrganizationIds,
  );

  const rows = await prisma.organization.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      projectId: true,
      project: { select: { id: true, projectNumber: true, title: true, status: true } },
    },
  });

  const byProject = new Map<string, PortalOrganizationRow>();
  const standalone: PortalOrganizationRow[] = [];

  for (const row of rows) {
    const projectId = row.projectId ?? row.project?.id;
    const entry: PortalOrganizationRow = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      projectId: projectId ?? null,
      projectNumber: row.project?.projectNumber ?? null,
      projectTitle: row.project?.title ?? null,
    };
    if (!projectId) {
      standalone.push(entry);
      continue;
    }
    if (byProject.has(projectId)) continue;
    byProject.set(projectId, entry);
  }

  return [...standalone, ...byProject.values()].sort((a, b) => a.name.localeCompare(b.name));
}
