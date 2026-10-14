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

  const rows = await prisma.project.findMany({
    where: {
      status: "ACTIVE",
      supportOrganization: {
        active: true,
        ...orgScope,
      },
    },
    orderBy: { projectNumber: "asc" },
    select: {
      id: true,
      projectNumber: true,
      title: true,
      supportOrganization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return rows
    .filter((row) => row.supportOrganization)
    .map((row) => ({
      id: row.supportOrganization!.id,
      name: `${row.projectNumber} — ${row.title}`,
      slug: row.supportOrganization!.slug,
      projectId: row.id,
      projectNumber: row.projectNumber,
      projectTitle: row.title,
    }));
}
