import { prisma } from "@techbubble/database";

export async function loadTimesheetEmailContext(timesheetId: string) {
  return prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: {
      memberUser: { select: { name: true, email: true } },
      project: {
        select: {
          projectNumber: true,
          title: true,
          projectManagerId: true,
          timesheetApproverUserId: true,
        },
      },
      opportunity: { select: { name: true, ownerId: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
      projectClientContact: {
        include: {
          contact: { select: { email: true } },
          ticketingUser: { select: { email: true } },
        },
      },
    },
  });
}

export function timesheetTargetLabel(row: {
  ticket?: { ticketNumber: string; subject: string } | null;
  project?: { projectNumber: string; title: string } | null;
  opportunity?: { name: string } | null;
}): string {
  if (row.ticket) return `${row.ticket.ticketNumber} — ${row.ticket.subject}`;
  if (row.project) return `${row.project.projectNumber} — ${row.project.title}`;
  return row.opportunity?.name ?? "Timesheet";
}

export async function resolveTimesheetApproverAdminEmails(timesheetId: string): Promise<string[]> {
  const row = await loadTimesheetEmailContext(timesheetId);
  if (!row) return [];

  const userIds = new Set<string>();
  if (row.opportunity?.ownerId) userIds.add(row.opportunity.ownerId);
  if (row.project?.timesheetApproverUserId) userIds.add(row.project.timesheetApproverUserId);
  if (row.project?.projectManagerId) userIds.add(row.project.projectManagerId);

  if (userIds.size === 0) return [];

  const users = await prisma.adminUser.findMany({
    where: { id: { in: [...userIds] }, active: true },
    select: { email: true },
  });
  return users.map((u) => u.email).filter(Boolean);
}
