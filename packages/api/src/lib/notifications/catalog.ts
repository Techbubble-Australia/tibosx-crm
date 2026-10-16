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
    id: "ticket.lifecycle",
    channel: "email",
    description: "Ticket status changes (resolved, awaiting client, closed).",
    implemented: false,
    triggers: ["POST /api/admin/workspace/tickets/:id/lifecycle"],
    env: ["RESEND_API_KEY", "MAIL_FROM", "ADMIN_PUBLIC_URL"],
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
