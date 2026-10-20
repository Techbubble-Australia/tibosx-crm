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

/** Designated timesheet approver only (client contact or TBOS approver user). */
export async function resolveTimesheetSubmissionApproverEmails(timesheetId: string): Promise<string[]> {
  const row = await loadTimesheetEmailContext(timesheetId);
  if (!row) return [];

  if (row.approverKind === "CLIENT_CONTACT" && row.projectClientContact) {
    const to =
      row.projectClientContact.ticketingUser?.email?.trim() ||
      row.projectClientContact.contact.email?.trim();
    return to ? [to] : [];
  }

  const approverId = row.project?.timesheetApproverUserId;
  if (!approverId) return [];

  const user = await prisma.adminUser.findFirst({
    where: { id: approverId, active: true },
    select: { email: true },
  });
  return user?.email ? [user.email] : [];
}
