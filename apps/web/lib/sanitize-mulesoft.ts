/**
 * Replace legacy MuleSoft branding with Microsoft in CMS JSON payloads.
 * Handles stale SiteContent rows until DB migration runs.
 */

function sanitizeString(value: string): string {
  const trimmed = value.trim();
  if (/^mule\s*soft$/i.test(trimmed)) return "Microsoft";
  if (trimmed === "mulesoft") return "microsoft";
  return value.replace(/mule\s*soft/gi, "Microsoft");
}

export function sanitizeMuleSoftInValue<T>(value: T): T {
  if (typeof value === "string") {
    return (/mule\s*soft/i.test(value) ? sanitizeString(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMuleSoftInValue(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const nextKey = key === "mulesoft" ? "microsoft" : key;
      out[nextKey] = sanitizeMuleSoftInValue(nested);
    }
    return out as T;
  }
  return value;
}
