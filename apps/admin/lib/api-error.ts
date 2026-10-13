/** Turn admin API JSON errors (including Zod details) into text for alerts and inline messages. */
export function messageFromApiError(data: unknown, fallback = "Request failed"): string {
  if (!data || typeof data !== "object") return fallback;
  const payload = data as { error?: unknown; details?: unknown };
  const base = typeof payload.error === "string" && payload.error.trim() ? payload.error : fallback;

  if (!Array.isArray(payload.details) || payload.details.length === 0) {
    return base;
  }

  const lines = payload.details
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { path?: unknown; message?: unknown };
      const path = Array.isArray(row.path) ? row.path.map(String).join(".") : "";
      const message = typeof row.message === "string" ? row.message : "";
      if (!message) return null;
      return path ? `${path}: ${message}` : message;
    })
    .filter((line): line is string => Boolean(line));

  if (!lines.length) return base;
  if (base === "Validation error") return lines.join("\n");
  return `${base}\n\n${lines.join("\n")}`;
}
