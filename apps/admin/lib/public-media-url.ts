/**
 * URL for `<img src>` previews in admin.
 * `/uploads/...` stays same-origin so `app/uploads/[...path]` can proxy to the API (avoids relying on
 * `NEXT_PUBLIC_API_URL` in the browser, which is often unset or wrong in Docker/production).
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
    return u;
  }
  return u;
}
