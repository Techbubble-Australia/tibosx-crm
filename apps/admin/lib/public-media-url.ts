/** Trim and strip a single pair of wrapping quotes (paste/import glitch). */
function normalizeMediaInput(src: string): string {
  let t = src.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Normalizes a stored path to `/uploads/...` when possible.
 */
function toUploadsPath(u: string): string | null {
  const t = normalizeMediaInput(u);
  if (!t) return null;
  if (t.startsWith("/uploads/")) return t;
  if (t.toLowerCase().startsWith("uploads/")) return `/${t}`;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const parsed = new URL(t);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * URL for `<img src>` in the admin app (browser).
 *
 * Always uses **same-origin** `/uploads/...` for stored upload paths so:
 * - No mixed-content (https admin → http API),
 * - No dependency on `NEXT_PUBLIC_API_URL` for previews,
 * - `app/uploads/[...path]` proxies to `API_URL` on the server.
 *
 * Absolute `http(s)` URLs that are not under `/uploads/` are returned unchanged.
 */
export function resolveAdminMediaPreviewUrl(url: string): string {
  const raw = normalizeMediaInput(url ?? "");
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const asPath = toUploadsPath(raw);
    if (asPath && typeof window !== "undefined") {
      return `${window.location.origin}${asPath}`;
    }
    return raw;
  }

  const uploadsPath = toUploadsPath(raw);
  const path = uploadsPath ?? (raw.startsWith("/") ? raw : `/${raw}`);

  if (!path.startsWith("/uploads/")) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}
