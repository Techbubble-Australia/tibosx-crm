import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/support-ticket-labels";

export type TicketAuditRow = {
  id: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor?: { name?: string | null } | null;
};

function labelForField(field: string, value: string): string {
  if (field === "status") return TICKET_STATUS_LABELS[value] ?? value;
  if (field === "priority") return TICKET_PRIORITY_LABELS[value] ?? value;
  if (field === "type") return TICKET_TYPE_LABELS[value] ?? value;
  return value;
}

export function formatTicketAuditLine(log: TicketAuditRow): string {
  const actor = log.actor?.name ? ` · ${log.actor.name}` : "";
  if (log.action === "MESSAGE_ADDED") return `Message added${actor}`;
  if (log.action === "ATTACHMENT_ADDED") return `Attachment added${actor}`;
  if (log.action === "CREATED") return `Ticket created${actor}`;
  if (log.action === "UPDATED" && log.field) {
    const fieldLabel =
      log.field === "status"
        ? "Status"
        : log.field === "priority"
          ? "Priority"
          : log.field === "type"
            ? "Type"
            : log.field === "assignedToId"
              ? "Assigned to"
              : log.field === "description"
                ? "Description"
                : log.field === "subject"
                  ? "Subject"
                  : log.field;
    if (log.field === "description") return `${fieldLabel} updated${actor}`;
    const fromEmpty =
      log.field === "assignedToId" && (!log.oldValue || log.oldValue === "null");
    const toEmpty =
      log.field === "assignedToId" && (!log.newValue || log.newValue === "null");
    const from = fromEmpty
      ? "Unassigned"
      : log.oldValue
        ? labelForField(log.field, log.oldValue)
        : log.field === "assignedToId"
          ? "Unassigned"
          : "—";
    const to = toEmpty
      ? "Unassigned"
      : log.newValue
        ? labelForField(log.field, log.newValue)
        : log.field === "assignedToId"
          ? "Unassigned"
          : "—";
    return `${fieldLabel} changed from ${from} to ${to}${actor}`;
  }
  const action = log.action.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action}${actor}`;
}
