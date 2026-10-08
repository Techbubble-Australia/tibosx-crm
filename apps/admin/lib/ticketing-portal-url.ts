/** Portal origin for SSO redirects (no path; strips accidental `/login`). */
export function normalizeTicketingPortalUrl(raw: string | undefined): string {
  const base = (raw || "http://localhost:3004").replace(/\/$/, "");
  return base.replace(/\/login$/i, "");
}
