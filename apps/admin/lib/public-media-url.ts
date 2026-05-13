/**
 * Absolute URL for <img> previews in admin when stored value is a portable `/uploads/...` path.
 */
export function resolveAdminMediaPreviewUrl(url: string): string {
  const u = (url ?? "").trim();
  if (!u) {
    return "";
  }
  if (u.startsWith("http://") || u.startsWith("https://")) {
    return u;
  }
  if (u.startsWith("/uploads/")) {
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
    return `${base}${u}`;
  }
  return u;
}
