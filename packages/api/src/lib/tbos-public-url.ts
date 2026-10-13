/** Public TBOS admin origin for links in emails (workspace, support tickets). */
export function tbosAdminPublicBase(): string {
  return (
    process.env.ADMIN_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    process.env.TBOS_PUBLIC_URL ||
    "http://localhost:3002"
  ).replace(/\/$/, "");
}

export function workspaceTimesheetsUrl(): string {
  return `${tbosAdminPublicBase()}/workspace/timesheets`;
}

export function workspaceTicketUrl(ticketId: string): string {
  return `${tbosAdminPublicBase()}/workspace/tickets/${ticketId}`;
}

export function supportTicketAdminUrl(ticketId: string): string {
  return `${tbosAdminPublicBase()}/support-tickets/${ticketId}`;
}
