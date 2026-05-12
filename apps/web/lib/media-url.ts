import { getServerApiBaseUrl } from "@/lib/server-api";

export const CASE_STUDY_IMAGE_PLACEHOLDER = "/images/placeholder-case-study.svg";

/**
 * Normalizes image URLs from CMS/API for Next/Image and <img>.
 * - Empty → local placeholder
 * - Absolute http(s) → unchanged
 * - `/uploads/...` → prefixed with API origin (files are served by the API)
 */
function uploadsPath(s: string): string | null {
  if (s.startsWith("/uploads/")) return s;
  if (s.toLowerCase().startsWith("uploads/")) return `/${s}`;
  return null;
}

export function resolveMediaUrl(src: string | null | undefined): string {
  const s = (src ?? "").trim();
  if (!s) return CASE_STUDY_IMAGE_PLACEHOLDER;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const upload = uploadsPath(s);
  if (upload) {
    const base = getServerApiBaseUrl().replace(/\/$/, "");
    return `${base}${upload}`;
  }
  return s;
}

/** Same as resolveMediaUrl but returns "" when missing (optional avatars, etc.). */
export function resolveOptionalMediaUrl(src: string | null | undefined): string {
  const s = (src ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const upload = uploadsPath(s);
  if (upload) {
    const base = getServerApiBaseUrl().replace(/\/$/, "");
    return `${base}${upload}`;
  }
  return s;
}
