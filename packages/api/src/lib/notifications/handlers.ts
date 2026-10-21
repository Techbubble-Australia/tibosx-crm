import { prisma } from "@techbubble/database";
import {
  sendContactFormNotificationEmail,
  sendSupportTicketNotificationEmail,
  sendTimesheetApprovalRequestEmail,
  sendTimesheetMemberDecisionEmail,
  sendTimesheetPmApprovalRequestEmail,
} from "../mail";
import { supportTicketAdminUrl, timesheetAdminUrl, workspaceTicketUrl, workspaceTimesheetsUrl } from "../tbos-public-url";
import type { NotificationPayloads } from "./types";
import {
  loadTimesheetEmailContext,
  resolveTimesheetSubmissionApproverEmails,
  timesheetTargetLabel,
} from "./timesheet-email";
import {
  resolveProjectTicketNotificationEmails,
  resolveTicketProjectIdForNotifications,
} from "./ticket-email-recipients";
import { sendEmailIfEnabled } from "./send-if-enabled";

const TICKET_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PENDING_CLIENT: "Awaiting client info",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function formatTicketStatusLabel(status: string): string {
  return TICKET_STATUS_LABELS[status] ?? status.replace(/_/g, " ").toLowerCase();
}

function contactNotificationEmail(): string {
  return (
    process.env.CONTACT_NOTIFICATION_EMAIL?.trim() ||
    process.env.CAREERS_HR_EMAIL?.trim() ||
    "hr@techbubble.com.au"
  );
}

export const notificationHandlers: {
  [K in keyof NotificationPayloads]: (payload: NotificationPayloads[K]) => Promise<void>;
} = {
  async "timesheet.submitted.client"({ timesheetId }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
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
    await sendEmailIfEnabled("timesheet.submitted.client", to, () =>
      sendTimesheetApprovalRequestEmail({
        to,
        memberName,
        targetLabel: timesheetTargetLabel(timesheet),
        portalUrl: workspaceTimesheetsUrl(),
      }),
    );
  },

  async "timesheet.submitted.approver"({ timesheetId }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    if (!timesheet || timesheet.status !== "SUBMITTED") return;
    if (timesheet.approverKind === "CLIENT_CONTACT") return;

    const recipients = await resolveTimesheetSubmissionApproverEmails(timesheetId);
    if (!recipients.length) return;

    const memberName = timesheet.memberUser?.name || timesheet.memberUser?.email || "Team member";
    const targetLabel = timesheetTargetLabel(timesheet);
    const reviewUrl = timesheetAdminUrl(timesheetId);

    for (const to of recipients) {
      await sendEmailIfEnabled("timesheet.submitted.approver", to, () =>
        sendTimesheetPmApprovalRequestEmail({
          to,
          memberName,
          targetLabel,
          reviewUrl,
        }),
      );
    }
  },

  async "timesheet.approved"({ timesheetId }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    const to = timesheet?.memberUser?.email;
    if (!timesheet || !to || timesheet.status !== "APPROVED") return;

    await sendEmailIfEnabled("timesheet.approved", to, () =>
      sendTimesheetMemberDecisionEmail({
        to,
        memberName: timesheet.memberUser?.name || timesheet.memberUser?.email || "there",
        decision: "approved",
        targetLabel: timesheetTargetLabel(timesheet),
        reviewUrl: timesheetAdminUrl(timesheetId),
      }),
    );
  },

  async "timesheet.rejected"({ timesheetId, reason }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    const to = timesheet?.memberUser?.email;
    if (!timesheet || !to) return;

    await sendEmailIfEnabled("timesheet.rejected", to, () =>
      sendTimesheetMemberDecisionEmail({
        to,
        memberName: timesheet.memberUser?.name || timesheet.memberUser?.email || "there",
        decision: "rejected",
        targetLabel: timesheetTargetLabel(timesheet),
        reason,
        reviewUrl: timesheetAdminUrl(timesheetId),
      }),
    );
  },

  async "ticket.created"({ ticketId }) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        project: { select: { projectNumber: true, title: true } },
      },
    });
    const projectId = ticket ? await resolveTicketProjectIdForNotifications(ticketId) : null;
    if (!ticket || !projectId) return;

    const recipients = await resolveProjectTicketNotificationEmails(projectId);
    if (!recipients.length) return;

    const subject = `[${ticket.ticketNumber}] ${ticket.subject}`;
    const link = supportTicketAdminUrl(ticket.id);
    const body = `New ticket created: ${ticket.subject}\n\nTo know more click link below:\n${link}`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.created", to, () =>
        sendSupportTicketNotificationEmail({ to, subject, body }),
      );
    }
  },

  async "ticket.message"({ ticketId, messageId }) {
    const message = await prisma.ticketMessage.findUnique({
      where: { id: messageId },
      include: {
        author: { select: { role: true, name: true, email: true } },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            projectId: true,
          },
        },
      },
    });
    if (!message || message.ticketId !== ticketId || message.isInternal) return;

    const ticket = message.ticket;
    const exclude = [message.author.email];
    const projectId = await resolveTicketProjectIdForNotifications(ticketId);
    const recipients = projectId
      ? await resolveProjectTicketNotificationEmails(projectId, { excludeEmails: exclude })
      : [];

    if (!recipients.length) return;

    const subject = `Re: [${ticket.ticketNumber}] ${ticket.subject}`;
    const preview = message.body.length > 280 ? `${message.body.slice(0, 280)}…` : message.body;
    const body = `${message.author.name || message.author.email} wrote:\n\n${preview}\n\nView ticket: ${workspaceTicketUrl(ticket.id)}`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.message", to, () =>
        sendSupportTicketNotificationEmail({ to, subject, body }),
      );
    }
  },

  async "ticket.status.changed"({ ticketId, oldStatus, newStatus, actorEmail }) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { project: { select: { projectNumber: true, title: true } } },
    });
    const projectId = ticket ? await resolveTicketProjectIdForNotifications(ticketId) : null;
    if (!ticket || !projectId) return;

    const recipients = await resolveProjectTicketNotificationEmails(projectId, {
      excludeEmails: actorEmail ? [actorEmail] : [],
    });
    if (!recipients.length) return;

    const subject = `[${ticket.ticketNumber}] Status: ${formatTicketStatusLabel(newStatus)}`;
    const body = `Ticket ${ticket.ticketNumber} — ${ticket.subject}\n\nStatus changed from ${formatTicketStatusLabel(oldStatus)} to ${formatTicketStatusLabel(newStatus)}.\n\n${workspaceTicketUrl(ticket.id)}`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.status.changed", to, () =>
        sendSupportTicketNotificationEmail({ to, subject, body }),
      );
    }
  },

  async "contact.submitted"({ submissionId }) {
    const row = await prisma.contactSubmission.findUnique({ where: { id: submissionId } });
    if (!row) return;

    const to = contactNotificationEmail();
    await sendEmailIfEnabled("contact.submitted", to, () =>
      sendContactFormNotificationEmail({
        to,
        submission: {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          company: row.company,
          interest: row.interest,
          country: row.country,
          message: row.message,
        },
      }),
    );
  },
};
