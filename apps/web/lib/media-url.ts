/**
 * Base URL reachable by the browser for files served by the Express API (`/uploads/*`).
 * Prefer NEXT_PUBLIC_API_URL so SSR output matches what visitors can load (API_URL may be internal).
 */
export function getPublicApiBaseUrlForMedia(): string {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
}

export const CASE_STUDY_IMAGE_PLACEHOLDER = "/images/placeholder-case-study.svg";

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
 * - Any `/uploads/...` (or absolute URL whose path is `/uploads/...`) → `{public API base}{path}`
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
    return `${getPublicApiBaseUrlForMedia()}${uploadPath}`;
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
    return `${getPublicApiBaseUrlForMedia()}${uploadPath}`;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return raw;
}
