export function parseTicketingApiErrorBody(
  status: number,
  rawText: string,
  parsed: unknown,
): string {
  if (parsed && typeof parsed === "object" && parsed !== null) {
    const err = (parsed as { error?: unknown; message?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
    const msg = (parsed as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }

  if (status === 404) {
    return `Support API route not found (HTTP 404). Set API_URL to the main TBOS API and ensure /api/ticketing/auth/tbos-sso is deployed.`;
  }
  if (status === 401) {
    return "Invalid TBOS session for SSO. Ensure JWT_SECRET on admin matches packages/api, then log out and back into TBOS.";
  }
  if (status === 403) {
    return "Your TBOS role is not allowed for the support portal (default: admin, sales).";
  }
  if (rawText.trim() && !rawText.trim().startsWith("<")) {
    return rawText.trim().slice(0, 200);
  }
  return `Support portal SSO failed (HTTP ${status}). Check main API deploy logs.`;
}
