export const CASE_STUDY_IMAGE_PLACEHOLDER = "/images/placeholder-case-study.svg";

/** Same-origin paths handled by `app/uploads/[...path]` — use `<img>` instead of `next/image` (optimizer breaks on 404 / dev). */
export function isUploadsProxyPath(src: string | null | undefined): boolean {
  return (src ?? "").trim().startsWith("/uploads/");
}

/**
 * Returns `/uploads/...` for any stored form: relative path or absolute URL pointing at uploads.
 */
function uploadsPublicPath(src: string): string | null {
  const t = src.trim();
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
 * Normalizes image URLs from CMS/API for Next/Image and <img>.
 * - Empty → local placeholder
 * - Any `/uploads/...` (or absolute URL whose path is `/uploads/...`) → same-origin `/uploads/...` (Next proxies to API)
 * - Other absolute http(s) → unchanged
 * - Other relative paths (e.g. /images/...) → unchanged
 */
export function resolveMediaUrl(src: string | null | undefined): string {
  const raw = (src ?? "").trim();
  if (!raw) {
    return CASE_STUDY_IMAGE_PLACEHOLDER;
  }

  const uploadPath = uploadsPublicPath(raw);
  if (uploadPath) {
    return uploadPath;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return raw;
}

/** Same as resolveMediaUrl but returns "" when missing (optional avatars, etc.). */
export function resolveOptionalMediaUrl(src: string | null | undefined): string {
  const raw = (src ?? "").trim();
  if (!raw) {
    return "";
  }

  const uploadPath = uploadsPublicPath(raw);
  if (uploadPath) {
    return uploadPath;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return raw;
}
