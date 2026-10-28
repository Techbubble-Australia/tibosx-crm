import { prisma } from "@techbubble/database";

export type PortalOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  projectId: string | null;
  projectNumber: string | null;
  projectTitle: string | null;
};

/**
 * One row per ACTIVE TBOS project that has an enabled support portal org.
 * Orphan orgs (no project / deleted project) are excluded so the create-ticket list
 * matches the Projects module.
 */
export async function listSupportPortalOrganizations(
  scopeOrganizationIds: string[] | null,
): Promise<PortalOrganizationRow[]> {
  const orgScope =
    scopeOrganizationIds === null
      ? {}
      : scopeOrganizationIds.length
        ? { id: { in: scopeOrganizationIds } }
        : { id: { in: [] as string[] } };

  const orgs = await prisma.organization.findMany({
    where: {
      active: true,
      projectId: { not: null },
      project: { status: "ACTIVE" },
      ...orgScope,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      project: {
        select: { id: true, projectNumber: true, title: true },
      },
    },
  });

  return orgs
    .filter((row) => row.project)
    .map((row) => ({
      id: row.id,
      name: `${row.project!.projectNumber} — ${row.project!.title}`,
      slug: row.slug,
      projectId: row.project!.id,
      projectNumber: row.project!.projectNumber,
      projectTitle: row.project!.title,
    }));
}
