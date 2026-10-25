import type { TicketPriority, TicketStatus, TicketType } from "@techbubble/database";

function ticketingUserLabel(user?: { name: string; email: string } | null) {
  if (!user) return null;
  const name = user.name?.trim() || user.email;
  return { ...user, name };
}

export function serializeTicketRow(row: {
  id: string;
  ticketNumber: string;
  organizationId: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  createdById: string;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  resolutionNotes?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    projectId?: string | null;
    project?: { projectNumber: string; title: string } | null;
  };
  projectId?: string | null;
  project?: { projectNumber: string; title: string } | null;
  createdBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
  updatedById?: string | null;
}) {
  const linkedProject = row.organization?.project ?? row.project ?? null;
  const projectLabel =
    linkedProject?.projectNumber && linkedProject?.title
      ? `${linkedProject.projectNumber} — ${linkedProject.title}`
      : linkedProject?.title
        ? linkedProject.title
        : null;
  const projectId = row.projectId ?? row.organization?.projectId ?? null;
  const updatedBy = ticketingUserLabel(row.updatedBy);
  const createdBy = ticketingUserLabel(row.createdBy);
  const assignedTo = row.assignedTo ? ticketingUserLabel(row.assignedTo) : null;
  return {
    id: row.id,
    ticketNumber: row.ticketNumber,
    organizationId: row.organizationId,
    organization: row.organization,
    projectLabel,
    projectId,
    type: row.type,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    description: row.description,
    resolutionNotes: row.resolutionNotes ?? null,
    createdById: row.createdById,
    createdBy,
    assignedToId: row.assignedToId,
    assignedTo,
    updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

export const ticketDetailIncludes = {
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      projectId: true,
      project: { select: { projectNumber: true, title: true } },
    },
  },
  project: { select: { projectNumber: true, title: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} as const;
