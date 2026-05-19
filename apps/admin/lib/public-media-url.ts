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

/** When set at build time, browser loads `/uploads/*` from the public API (avoids Next proxy / disk issues). */
function absoluteUploadsFromPublicEnv(uploadPath: string): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    return null;
  }
  if (base.startsWith("http:") && process.env.NODE_ENV === "production") {
    return null;
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:" && base.startsWith("http:")) {
    return null;
  }
  return `${base}${uploadPath}`;
}

function sameOriginUploadsPath(uploadPath: string): string {
  if (typeof window === "undefined") {
    return uploadPath;
  }
  return `${window.location.origin}${uploadPath}`;
}

/**
 * URL for `<img src>` in the admin app.
 *
 * For stored `/uploads/...` paths: uses {@link process.env.NEXT_PUBLIC_API_URL} when set at **build** time
 * (recommended on Docker/Railway); otherwise same-origin `/uploads/...` (proxied by Next to `API_URL`).
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
    if (asPath) {
      const fromEnv = absoluteUploadsFromPublicEnv(asPath);
      if (fromEnv) return fromEnv;
      return sameOriginUploadsPath(asPath);
    }
    return raw;
  }

  const uploadsPath = toUploadsPath(raw);
  const path = uploadsPath ?? (raw.startsWith("/") ? raw : `/${raw}`);

  if (!path.startsWith("/uploads/")) {
    return path;
  }

  const fromEnv = absoluteUploadsFromPublicEnv(path);
  if (fromEnv) return fromEnv;
  return sameOriginUploadsPath(path);
}
