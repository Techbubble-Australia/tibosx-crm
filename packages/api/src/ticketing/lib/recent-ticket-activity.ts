type AuditRow = {
  ticketId: string;
  ticket: { id: string; ticketNumber: string; subject: string };
  action: string;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

/** One row per ticket — the most recent audit event. */
export function latestActivityPerTicket(logs: AuditRow[], limit = 12) {
  const seen = new Set<string>();
  const out: AuditRow[] = [];
  for (const row of logs) {
    if (seen.has(row.ticketId)) continue;
    seen.add(row.ticketId);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

export function serializeTicketActivityRow(row: AuditRow) {
  return {
    id: row.ticket.id,
    action: row.action,
    ticketNumber: row.ticket.ticketNumber,
    subject: row.ticket.subject,
    createdAt: row.createdAt.toISOString(),
    actorName: row.actor?.name || row.actor?.email || "",
  };
}
