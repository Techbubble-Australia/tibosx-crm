/** Main TBOS API (support ticketing is mounted under /api/ticketing and /api/admin/ticketing). */
export function supportApiBase(): string {
  const raw =
    process.env.API_URL?.trim() ||
    process.env.TICKETING_API_URL?.trim() ||
    "http://127.0.0.1:3001";
  return raw.replace(/\/$/, "");
}
