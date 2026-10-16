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
  resolveTimesheetApproverAdminEmails,
  timesheetTargetLabel,
} from "./timesheet-email";

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
    await sendTimesheetApprovalRequestEmail({
      to,
      memberName,
      targetLabel: timesheetTargetLabel(timesheet),
      portalUrl: workspaceTimesheetsUrl(),
    });
  },

  async "timesheet.submitted.approver"({ timesheetId }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    if (!timesheet || timesheet.status !== "SUBMITTED") return;
    if (timesheet.approverKind === "CLIENT_CONTACT") return;

    const recipients = await resolveTimesheetApproverAdminEmails(timesheetId);
    if (!recipients.length) return;

    const memberName = timesheet.memberUser?.name || timesheet.memberUser?.email || "Team member";
    const targetLabel = timesheetTargetLabel(timesheet);
    const reviewUrl = timesheetAdminUrl(timesheetId);

    for (const to of recipients) {
      await sendTimesheetPmApprovalRequestEmail({
        to,
        memberName,
        targetLabel,
        reviewUrl,
      });
    }
  },

  async "timesheet.approved"({ timesheetId }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    const to = timesheet?.memberUser?.email;
    if (!timesheet || !to || timesheet.status !== "APPROVED") return;

    await sendTimesheetMemberDecisionEmail({
      to,
      memberName: timesheet.memberUser?.name || timesheet.memberUser?.email || "there",
      decision: "approved",
      targetLabel: timesheetTargetLabel(timesheet),
      reviewUrl: timesheetAdminUrl(timesheetId),
    });
  },

  async "timesheet.rejected"({ timesheetId, reason }) {
    const timesheet = await loadTimesheetEmailContext(timesheetId);
    const to = timesheet?.memberUser?.email;
    if (!timesheet || !to) return;

    await sendTimesheetMemberDecisionEmail({
      to,
      memberName: timesheet.memberUser?.name || timesheet.memberUser?.email || "there",
      decision: "rejected",
      targetLabel: timesheetTargetLabel(timesheet),
      reason,
      reviewUrl: timesheetAdminUrl(timesheetId),
    });
  },

  async "ticket.created"({ ticketId }) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        organization: true,
        assignedTo: { select: { email: true, name: true } },
        project: { select: { projectNumber: true, title: true } },
      },
    });
    if (!ticket?.projectId) return;

    const group = await prisma.projectSupportGroup.findUnique({
      where: { projectId: ticket.projectId },
      include: {
        members: {
          include: {
            ticketingUser: { select: { email: true } },
            adminUser: { select: { email: true } },
          },
        },
      },
    });
    if (!group) return;

    const recipients = new Set<string>();
    for (const m of group.members) {
      const email = m.ticketingUser?.email || m.adminUser?.email;
      if (email) recipients.add(email);
    }
    if (ticket.assignedTo?.email) recipients.add(ticket.assignedTo.email);

    const subject = `[${ticket.ticketNumber}] ${ticket.subject}`;
    const body = `New support case on ${ticket.project?.projectNumber ?? "project"}: ${ticket.subject}\n\n${supportTicketAdminUrl(ticket.id)}`;

    for (const to of recipients) {
      await sendSupportTicketNotificationEmail({ to, subject, body });
    }
  },

  async "ticket.message"({ ticketId, messageId }) {
    const message = await prisma.ticketMessage.findUnique({
      where: { id: messageId },
      include: {
        author: { select: { role: true, name: true, email: true } },
        ticket: {
          include: {
            createdBy: { select: { email: true, name: true, role: true } },
            assignedTo: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!message || message.ticketId !== ticketId || message.isInternal) return;

    const ticket = message.ticket;
    const authorRole = message.author.role;
    const recipients = new Set<string>();

    if (authorRole === "CLIENT") {
      if (ticket.assignedTo?.email) recipients.add(ticket.assignedTo.email);
    } else if (authorRole === "CONSULTANT") {
      if (ticket.createdBy?.role === "CLIENT" && ticket.createdBy.email) {
        recipients.add(ticket.createdBy.email);
      }
    }

    recipients.delete(message.author.email);

    if (!recipients.size) return;

    const subject = `Re: [${ticket.ticketNumber}] ${ticket.subject}`;
    const preview = message.body.length > 280 ? `${message.body.slice(0, 280)}…` : message.body;
    const body = `${message.author.name || message.author.email} wrote:\n\n${preview}\n\nView ticket: ${workspaceTicketUrl(ticket.id)}`;

    for (const to of recipients) {
      await sendSupportTicketNotificationEmail({ to, subject, body });
    }
  },

  async "contact.submitted"({ submissionId }) {
    const row = await prisma.contactSubmission.findUnique({ where: { id: submissionId } });
    if (!row) return;

    await sendContactFormNotificationEmail({
      to: contactNotificationEmail(),
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
    });
  },
};
