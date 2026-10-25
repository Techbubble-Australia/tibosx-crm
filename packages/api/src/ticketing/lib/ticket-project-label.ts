import { prisma } from "@techbubble/database";

export function formatTicketProjectLabel(project: {
  projectNumber: string;
  title: string;
} | null | undefined): string | null {
  if (!project) return null;
  if (project.projectNumber && project.title) {
    return `${project.projectNumber} — ${project.title}`;
  }
  return project.title?.trim() || null;
}

type TicketProjectRow = {
  projectId?: string | null;
  organization?: { projectId?: string | null; project?: { projectNumber: string; title: string } | null } | null;
  project?: { projectNumber: string; title: string } | null;
};

export async function enrichTicketsProjectLabels<T extends TicketProjectRow>(
  rows: T[],
): Promise<Array<T & { project?: { projectNumber: string; title: string } | null }>> {
  const missingIds = new Set<string>();
  for (const row of rows) {
    if (formatTicketProjectLabel(row.organization?.project ?? row.project ?? null)) continue;
    const pid = row.projectId ?? row.organization?.projectId ?? null;
    if (pid) missingIds.add(pid);
  }
  if (!missingIds.size) return rows;

  const projects = await prisma.project.findMany({
    where: { id: { in: [...missingIds] } },
    select: { id: true, projectNumber: true, title: true },
  });
  const byId = new Map(projects.map((p) => [p.id, p]));

  return rows.map((row) => {
    const direct = row.organization?.project ?? row.project ?? null;
    if (formatTicketProjectLabel(direct)) return row;
    const pid = row.projectId ?? row.organization?.projectId ?? null;
    const resolved = pid ? byId.get(pid) ?? null : null;
    if (!resolved) return row;
    return { ...row, project: resolved };
  });
}
