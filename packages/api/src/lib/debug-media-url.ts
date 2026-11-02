/** Resolve stored upload paths to a fetchable absolute URL for agents and clients. */
export function resolveDebugCaptureMediaUrl(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;

  const apiPublic = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  const port = process.env.PORT || "3001";
  const fallbackBase = `http://127.0.0.1:${port}`;

  function absoluteFromPath(pathname: string): string {
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const base =
      apiPublic && (apiPublic.startsWith("http://") || apiPublic.startsWith("https://"))
        ? apiPublic
        : fallbackBase;
    return `${base}${path}`;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        return absoluteFromPath(`${parsed.pathname}${parsed.search}`);
      }
    } catch {
      return raw;
    }
    return raw;
  }

  if (raw.startsWith("/uploads/")) return absoluteFromPath(raw);
  if (raw.toLowerCase().startsWith("uploads/")) return absoluteFromPath(`/${raw}`);

  return null;
}

export function screenshotUrlFromTicket(row: {
  screenshotUrl: string | null;
  fullPayload: unknown;
}): string | null {
  const direct = resolveDebugCaptureMediaUrl(row.screenshotUrl);
  if (direct) return direct;
  if (row.fullPayload && typeof row.fullPayload === "object" && !Array.isArray(row.fullPayload)) {
    const shot = (row.fullPayload as Record<string, unknown>).screenshotUrl;
    if (typeof shot === "string") return resolveDebugCaptureMediaUrl(shot);
  }
  return null;
}
