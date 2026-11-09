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
import { effectiveRoleList } from "../admin-roles";

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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function debugTicketUrl(id: string): string | null {
  const base = process.env.DEBUG_PORTAL_PUBLIC_URL?.trim().replace(/\/$/, "");
  return base ? `${base}/tickets/${id}` : null;
}

async function debugStatusLabel(key: string): Promise<string> {
  const row = await prisma.debugTicketStatus.findUnique({ where: { key }, select: { label: true } });
  return row?.label ?? key.replace(/_/g, " ").toLowerCase();
}

/** Active TBOS users with the admin role (primary or additional) — they manage the debug portal. */
async function debugPortalAdminEmails(): Promise<string[]> {
  const users = await prisma.adminUser.findMany({
    where: { active: true },
    select: { email: true, role: true, additionalRoles: true },
  });
  return users
    .filter((u) => effectiveRoleList(u.role, u.additionalRoles).includes("admin"))
    .map((u) => u.email.toLowerCase());
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

    const link = supportTicketAdminUrl(ticket.id);
    const body = `New ticket created: ${ticket.subject}\n\nTo know more click link below:\n${link}`;
    const bodyHtml = `<p>New ticket created: <strong>${ticket.subject.replace(/</g, "&lt;")}</strong></p><p>To know more click link below:<br/><a href="${link}">${link}</a></p>`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.created", to, () =>
        sendSupportTicketNotificationEmail({
          to,
          headerTitle: "Ticket created!",
          subjectLine: "Ticket created",
          body,
          bodyHtml,
          greeting: "Hi Team,",
        }),
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

    const preview = message.body.length > 280 ? `${message.body.slice(0, 280)}…` : message.body;
    const author = message.author.name || message.author.email;
    const ticketUrl = workspaceTicketUrl(ticket.id);
    const body = `${author} wrote:\n\n${preview}\n\nView ticket: ${ticketUrl}`;
    const bodyHtml = `<p><strong>${author}</strong> wrote on ticket <strong>${ticket.ticketNumber}</strong>:</p><p style="white-space:pre-wrap;">${preview.replace(/</g, "&lt;")}</p><p><a href="${ticketUrl}">View ticket</a></p>`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.message", to, () =>
        sendSupportTicketNotificationEmail({
          to,
          headerTitle: "Ticket updated!",
          subjectLine: `Reply on ${ticket.ticketNumber}`,
          body,
          bodyHtml,
          greeting: "Hi Team,",
        }),
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

    const ticketUrl = workspaceTicketUrl(ticket.id);
    const body = `Ticket ${ticket.ticketNumber} — ${ticket.subject}\n\nStatus changed from ${formatTicketStatusLabel(oldStatus)} to ${formatTicketStatusLabel(newStatus)}.\n\n${ticketUrl}`;
    const bodyHtml = `<p>Ticket <strong>${ticket.ticketNumber}</strong> — <strong>${ticket.subject.replace(/</g, "&lt;")}</strong></p><p>Status changed from <strong>${formatTicketStatusLabel(oldStatus)}</strong> to <strong>${formatTicketStatusLabel(newStatus)}</strong>.</p><p><a href="${ticketUrl}">View ticket</a></p>`;

    for (const to of recipients) {
      await sendEmailIfEnabled("ticket.status.changed", to, () =>
        sendSupportTicketNotificationEmail({
          to,
          headerTitle: "Ticket status updated!",
          subjectLine: "Ticket status updated",
          body,
          bodyHtml,
          greeting: "Hi Team,",
        }),
      );
    }
  },

  async "debug_ticket.created"({ ticketId }) {
    const ticket = await prisma.debugCaptureTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;
    const statusLabel = await debugStatusLabel(ticket.status);
    const link = debugTicketUrl(ticket.id);
    const summary = ticket.userDescription.length > 400 ? `${ticket.userDescription.slice(0, 400)}…` : ticket.userDescription;
    const kind = ticket.type === "ENHANCEMENT" ? "enhancement" : "bug";
    const title = ticket.title?.trim() ?? "";
    const body = [
      `${ticket.reporterEmail} reported a new ${kind}: ${ticket.ticketId} (${statusLabel}).`,
      "",
      ...(title ? [title, ""] : []),
      summary,
      link ? `\nView ticket: ${link}` : "",
    ].join("\n");
    const bodyHtml = `<p><strong>${escapeHtml(ticket.reporterEmail)}</strong> reported a new ${kind}: <strong>${ticket.ticketId}</strong> (${escapeHtml(statusLabel)}).</p>${title ? `<p><strong>${escapeHtml(title)}</strong></p>` : ""}<p style="white-space:pre-wrap;">${escapeHtml(summary)}</p>${link ? `<p><a href="${escapeHtml(link)}">View ticket in the debug portal</a></p>` : ""}`;

    const recipients = new Set([...(await debugPortalAdminEmails()), ticket.reporterEmail.toLowerCase()]);
    for (const to of recipients) {
      await sendEmailIfEnabled("debug_ticket.created", to, () =>
        sendSupportTicketNotificationEmail({
          to,
          headerTitle: "New debug ticket!",
          subjectLine: `New debug ticket ${ticket.ticketId}${title ? `: ${title}` : ""}`,
          body,
          bodyHtml,
          greeting: "Hi Team,",
        }),
      );
    }
  },

  async "debug_ticket.status.changed"({ ticketId, oldStatus, newStatus, actorEmail }) {
    const ticket = await prisma.debugCaptureTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;
    const to = ticket.reporterEmail.toLowerCase();
    if (actorEmail && actorEmail.toLowerCase() === to) return;
    const [from, next] = await Promise.all([debugStatusLabel(oldStatus), debugStatusLabel(newStatus)]);
    const link = debugTicketUrl(ticket.id);
    const by = actorEmail ? ` by ${actorEmail}` : "";
    const named = ticket.title?.trim() ? ` "${ticket.title.trim()}"` : "";
    const body = `Your ticket ${ticket.ticketId}${named} moved from ${from} to ${next}${by}.${link ? `\n\nView ticket: ${link}` : ""}`;
    const bodyHtml = `<p>Your ticket <strong>${ticket.ticketId}</strong>${escapeHtml(named)} moved from <strong>${escapeHtml(from)}</strong> to <strong>${escapeHtml(next)}</strong>${escapeHtml(by)}.</p>${link ? `<p><a href="${escapeHtml(link)}">View ticket in the debug portal</a></p>` : ""}`;
    await sendEmailIfEnabled("debug_ticket.status.changed", to, () =>
      sendSupportTicketNotificationEmail({
        to,
        headerTitle: "Debug ticket status updated!",
        subjectLine: `${ticket.ticketId} is now ${next}`,
        body,
        bodyHtml,
        greeting: "Hello,",
      }),
    );
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
