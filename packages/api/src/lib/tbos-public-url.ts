/** Public TBOS admin origin for links in emails (workspace, support tickets). */
export function tbosAdminPublicBase(): string {
  return (
    process.env.ADMIN_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    process.env.TBOS_PUBLIC_URL ||
    "http://localhost:3002"
  ).replace(/\/$/, "");
}

/** Ensures password-reset and invite links have a usable host (throws if misconfigured). */
export function assertTbosAdminPublicBaseForEmail(): void {
  const base = tbosAdminPublicBase();
  let parsed: URL;
  try {
    parsed = new URL(base.includes("://") ? base : `https://${base}`);
  } catch {
    throw new Error(
      "ADMIN_PUBLIC_URL is invalid. Set the public TBOS admin URL on the API service (e.g. https://tibosx.ai.techbubble.net.au).",
    );
  }
  if (!parsed.hostname) {
    throw new Error(
      "ADMIN_PUBLIC_URL is missing a hostname. Set the full public TBOS admin URL on the API service.",
    );
  }
}

export function workspaceTimesheetsUrl(): string {
  return `${tbosAdminPublicBase()}/workspace/timesheets/submitted`;
}

export function workspaceTicketUrl(ticketId: string): string {
  return `${tbosAdminPublicBase()}/workspace/tickets/${ticketId}`;
}

export function supportTicketAdminUrl(ticketId: string): string {
  return `${tbosAdminPublicBase()}/support-tickets/${ticketId}`;
}

export function timesheetAdminUrl(timesheetId: string): string {
  return `${tbosAdminPublicBase()}/timesheets/${timesheetId}`;
}
