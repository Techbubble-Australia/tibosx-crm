import type { TicketPriority, TicketStatus, TicketType } from "@techbubble/database";

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
  organization?: { id: string; name: string; slug: string };
  project?: { projectNumber: string; title: string } | null;
  createdBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
}) {
  const projectLabel =
    row.project?.projectNumber && row.project?.title
      ? `${row.project.projectNumber} — ${row.project.title}`
      : null;
  return {
    id: row.id,
    ticketNumber: row.ticketNumber,
    organizationId: row.organizationId,
    organization: row.organization,
    projectLabel,
    type: row.type,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    description: row.description,
    resolutionNotes: row.resolutionNotes ?? null,
    createdById: row.createdById,
    createdBy: row.createdBy,
    assignedToId: row.assignedToId,
    assignedTo: row.assignedTo,
    updatedBy: row.updatedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

export const ticketDetailIncludes = {
  organization: { select: { id: true, name: true, slug: true } },
  project: { select: { projectNumber: true, title: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} as const;
