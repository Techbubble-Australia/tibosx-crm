import { prisma } from "@techbubble/database";
import { sendTimesheetApprovalRequestEmail } from "./mail";

function portalBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TICKETING_PORTAL_URL ||
    process.env.TICKETING_PUBLIC_URL ||
    "http://localhost:3004"
  ).replace(/\/$/, "");
}

/** Notify client contact approver after a timesheet is submitted for their review. */
export async function notifyClientApproverOfSubmittedTimesheet(timesheetId: string) {
  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: {
      memberUser: { select: { name: true, email: true } },
      project: { select: { projectNumber: true, title: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
      projectClientContact: {
        include: {
          contact: { select: { email: true } },
          ticketingUser: { select: { email: true } },
        },
      },
    },
  });
  if (
    !timesheet ||
    timesheet.status !== "SUBMITTED" ||
    timesheet.approverKind !== "CLIENT_CONTACT" ||
    !timesheet.projectClientContact
  ) {
    return;
  }

  const to =
    timesheet.projectClientContact.ticketingUser?.email ||
    timesheet.projectClientContact.contact.email;
  if (!to) return;

  const memberName = timesheet.memberUser?.name || timesheet.memberUser?.email || "Team member";
  const targetLabel = timesheet.ticket
    ? `${timesheet.ticket.ticketNumber} — ${timesheet.ticket.subject}`
    : timesheet.project
      ? `${timesheet.project.projectNumber} — ${timesheet.project.title}`
      : "";

  try {
    await sendTimesheetApprovalRequestEmail({
      to,
      memberName,
      targetLabel,
      portalUrl: portalBaseUrl(),
    });
  } catch (err) {
    console.error("Timesheet approval request email failed:", to, err);
  }
}
