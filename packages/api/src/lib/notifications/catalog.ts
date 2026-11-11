export type NotificationChannel = "email";

export type NotificationCatalogEntry = {
  id: string;
  channel: NotificationChannel;
  description: string;
  /** Wired through `notify()` and sends when Resend is configured. */
  implemented: boolean;
  /** Primary code paths that trigger this notification. */
  triggers: string[];
  env?: string[];
};

/**
 * Inventory of transactional notifications. Keep in sync when adding `notify()` handlers.
 */
export const NOTIFICATION_CATALOG: NotificationCatalogEntry[] = [
  {
    id: "auth.password_reset",
    channel: "email",
    description: "Password reset link for TBOS admin users.",
    implemented: true,
    triggers: ["POST /api/admin/auth/forgot-password"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "user.invited",
    channel: "email",
    description: "New TBOS user invite with temporary password.",
    implemented: true,
    triggers: [
      "POST /api/admin/users",
      "POST /api/admin/clients (portal user)",
      "POST /api/admin/projects/:id/members",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "careers.application",
    channel: "email",
    description: "New career application to HR inbox.",
    implemented: true,
    triggers: ["POST /api/careers/apply"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "CAREERS_HR_EMAIL", "PUBLIC_WEB_URL"],
  },
  {
    id: "contact.submitted",
    channel: "email",
    description: "Website contact form submission to sales/ops inbox.",
    implemented: true,
    triggers: ["POST /api/contact"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "CONTACT_NOTIFICATION_EMAIL"],
  },
  {
    id: "ticket.created",
    channel: "email",
    description: "New support ticket assigned to project support group members.",
    implemented: true,
    triggers: [
      "POST /api/admin/workspace/tickets",
      "POST /api/admin/ticketing/tickets (TBOS)",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "ticket.message",
    channel: "email",
    description: "New public reply on a ticket (client ↔ consultant).",
    implemented: true,
    triggers: ["POST /api/admin/workspace/tickets/:id/messages"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "timesheet.submitted.client",
    channel: "email",
    description: "Timesheet submitted for client contact approval (support portal).",
    implemented: true,
    triggers: ["POST /api/admin/timesheets/submit (CLIENT_CONTACT approver)"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "timesheet.submitted.approver",
    channel: "email",
    description: "Timesheet submitted for PM / designated approver review.",
    implemented: true,
    triggers: ["POST /api/admin/timesheets/submit (PM or delivery project)"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "timesheet.approved",
    channel: "email",
    description: "Timesheet approved — notify submitting member.",
    implemented: true,
    triggers: [
      "POST /api/admin/timesheets/:id/approve",
      "POST /api/admin/workspace/timesheets/:id/approve (client)",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "timesheet.rejected",
    channel: "email",
    description: "Timesheet rejected — notify member with reason.",
    implemented: true,
    triggers: [
      "POST /api/admin/timesheets/:id/reject",
      "POST /api/admin/workspace/timesheets/:id/reject (client)",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "timesheet.reminder",
    channel: "email",
    description:
      "Reminder to submit the month's timesheet — sent on the last 2 business days of each month (9am Sydney) to internal members of Active projects who haven't submitted yet.",
    implemented: true,
    triggers: ["Scheduled job: timesheet reminders (API process)"],
    env: ["RESEND_API_KEY", "ADMIN_PUBLIC_URL", "TIMESHEET_REMINDERS_ENABLED (optional)"],
  },
  {
    id: "ticket.status.changed",
    channel: "email",
    description: "Ticket status updated (open, in progress, resolved, closed, etc.).",
    implemented: true,
    triggers: [
      "POST /api/admin/workspace/tickets/:id/lifecycle",
      "POST /api/admin/tbos/tickets/:id/lifecycle",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
  {
    id: "debug_ticket.created",
    channel: "email",
    description: "New debug portal ticket — sent to portal admins and a confirmation to the reporter.",
    implemented: true,
    triggers: ["POST /api/debug-portal/tickets", "POST /api/admin/debug-capture-tickets"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "DEBUG_PORTAL_PUBLIC_URL"],
  },
  {
    id: "debug_ticket.status.changed",
    channel: "email",
    description: "Debug ticket moved to another status — sent to the reporter (unless they moved it).",
    implemented: true,
    triggers: [
      "PATCH /api/debug-portal/tickets/:id",
      "PATCH /api/debug-portal/tickets/bulk-status",
      "PATCH /api/debug-portal/agent/tickets/:id/status",
    ],
    env: ["RESEND_API_KEY", "MAIL_FROM", "DEBUG_PORTAL_PUBLIC_URL"],
  },
  {
    id: "contract.expiring",
    channel: "email",
    description: "Contract approaching or past end date.",
    implemented: false,
    triggers: ["Scheduled job: expirePastDueContracts"],
    env: ["RESEND_API_KEY", "MAIL_FROM"],
  },
  {
    id: "credential.template_signature",
    channel: "email",
    description: "Agreement / credential template sent for signature.",
    implemented: false,
    triggers: ["Credential template assign / send flows"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
  },
];

export function getNotificationCatalog() {
  return NOTIFICATION_CATALOG;
}
