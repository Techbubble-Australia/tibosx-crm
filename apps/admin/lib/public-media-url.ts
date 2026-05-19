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
 * Best-effort URL for `<img src>` in the admin app (client-side).
 *
 * - Avoids **mixed content**: if the page is `https:` and `NEXT_PUBLIC_API_URL` is `http:`, we use
 *   same-origin `/uploads/...` so the Next proxy (server-side fetch to `API_URL`) serves bytes over HTTPS.
 * - When protocols match, we can load directly from the public API origin (one less hop).
 */
export function resolveAdminMediaPreviewUrl(url: string): string {
  const raw = normalizeMediaInput(url ?? "");
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const asPath = toUploadsPath(raw);
    if (asPath && typeof window !== "undefined") {
      const pageProto = window.location.protocol;
      try {
        const assetProto = new URL(raw).protocol;
        if (assetProto !== pageProto) {
          return `${window.location.origin}${asPath}`;
        }
      } catch {
        /* fall through */
      }
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

  const pageProto = window.location.protocol;
  const pub = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (pub) {
    try {
      const apiProto = new URL(pub).protocol;
      if (apiProto === pageProto) {
        return `${pub}${path}`;
      }
    } catch {
      /* ignore invalid NEXT_PUBLIC_API_URL */
    }
  }

  return `${window.location.origin}${path}`;
}
