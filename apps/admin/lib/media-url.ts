/** Normalize stored upload paths for same-origin links in admin (proxied to API via /uploads/* route). */

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

function uploadsPublicPath(src: string): string | null {
  const t = normalizeMediaInput(src);
  if (t.startsWith("/uploads/")) {
    return t;
  }
  if (t.toLowerCase().startsWith("uploads/")) {
    return `/${t}`;
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (u.pathname.startsWith("/uploads/")) {
        return u.pathname;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolves document/upload hrefs for admin links.
 * Prefer same-origin `/uploads/...` (Next proxy → API). Falls back to API base when configured.
 */
export function resolveDocumentHref(src: string | null | undefined): string {
  const raw = normalizeMediaInput(src ?? "");
  if (!raw) return "#";

  const uploadPath = uploadsPublicPath(raw);
  if (uploadPath) {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
    if (base.startsWith("https://") || (base.startsWith("http://") && process.env.NODE_ENV !== "production")) {
      return `${base}${uploadPath}`;
    }
    return uploadPath;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function resolveDocumentFileName(src: string | null | undefined, fallbackIndex: number): string {
  const href = resolveDocumentHref(src);
  if (href === "#") return `Document ${fallbackIndex}`;
  const segment = href.split("/").pop()?.split("?")[0]?.trim();
  if (!segment) return `Document ${fallbackIndex}`;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
