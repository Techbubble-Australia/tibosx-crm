function trimEnvUrl(name: string): string | null {
  const v = process.env[name]?.trim().replace(/\/$/, "") ?? "";
  if (!v.startsWith("http://") && !v.startsWith("https://")) return null;
  if (/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/i.test(v)) {
    return null;
  }
  return v;
}

/** Normalizes stored values to a path like `/uploads/image-….png`. */
export function normalizeUploadPath(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;

  if (raw.startsWith("/uploads/")) return raw;
  if (raw.toLowerCase().startsWith("uploads/")) return `/${raw}`;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export type AgentScreenshotUrls = {
  relativePath: string | null;
  /** Best URL for external agents (debug portal proxy preferred). */
  publicUrl: string | null;
  portalUrl: string | null;
  apiUrl: string | null;
};

/**
 * Builds fetchable HTTPS URLs for ticket screenshots.
 * Prefers DEBUG_PORTAL_PUBLIC_URL (proxies /uploads to the API) so agents using the debug-web API base can load images.
 */
export function resolveAgentScreenshotUrls(stored: string | null | undefined): AgentScreenshotUrls {
  const relativePath = normalizeUploadPath(stored);
  if (!relativePath) {
    return { relativePath: null, publicUrl: null, portalUrl: null, apiUrl: null };
  }

  const portalBase = trimEnvUrl("DEBUG_PORTAL_PUBLIC_URL");
  const apiBase = trimEnvUrl("API_PUBLIC_URL");
  const adminBase = trimEnvUrl("ADMIN_PUBLIC_URL");

  const portalUrl = portalBase ? `${portalBase}${relativePath}` : null;
  const apiUrl = apiBase ? `${apiBase}${relativePath}` : null;
  const adminUrl = adminBase ? `${adminBase}${relativePath}` : null;

  const publicUrl = portalUrl ?? apiUrl ?? adminUrl;

  return { relativePath, publicUrl, portalUrl, apiUrl: apiUrl ?? adminUrl };
}

/** @deprecated Prefer resolveAgentScreenshotUrls — kept for brief markdown helper. */
export function resolveDebugCaptureMediaUrl(url: string | null | undefined): string | null {
  return resolveAgentScreenshotUrls(url).publicUrl;
}

export function screenshotUrlFromTicket(row: {
  screenshotUrl: string | null;
  fullPayload: unknown;
}): string | null {
  const direct = resolveAgentScreenshotUrls(row.screenshotUrl).publicUrl;
  if (direct) return direct;
  if (row.fullPayload && typeof row.fullPayload === "object" && !Array.isArray(row.fullPayload)) {
    const shot = (row.fullPayload as Record<string, unknown>).screenshotUrl;
    if (typeof shot === "string") return resolveAgentScreenshotUrls(shot).publicUrl;
  }
  return null;
}

export function screenshotPathsFromTicket(row: {
  screenshotUrl: string | null;
  fullPayload: unknown;
}): AgentScreenshotUrls {
  const fromColumn = resolveAgentScreenshotUrls(row.screenshotUrl);
  if (fromColumn.relativePath) return fromColumn;
  if (row.fullPayload && typeof row.fullPayload === "object" && !Array.isArray(row.fullPayload)) {
    const shot = (row.fullPayload as Record<string, unknown>).screenshotUrl;
    if (typeof shot === "string") return resolveAgentScreenshotUrls(shot);
  }
  return fromColumn;
}
