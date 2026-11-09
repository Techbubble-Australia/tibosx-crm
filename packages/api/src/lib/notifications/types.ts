export type NotificationPayloads = {
  "timesheet.submitted.client": { timesheetId: string };
  "timesheet.submitted.approver": { timesheetId: string };
  "timesheet.approved": { timesheetId: string };
  "timesheet.rejected": { timesheetId: string; reason: string };
  "ticket.created": { ticketId: string };
  "ticket.message": { ticketId: string; messageId: string };
  "ticket.status.changed": {
    ticketId: string;
    oldStatus: string;
    newStatus: string;
    actorEmail?: string;
  };
  "contact.submitted": { submissionId: string };
  "debug_ticket.created": { ticketId: string };
  "debug_ticket.status.changed": {
    ticketId: string;
    oldStatus: string;
    newStatus: string;
    actorEmail?: string;
  };
};

export type NotificationEvent = keyof NotificationPayloads;
