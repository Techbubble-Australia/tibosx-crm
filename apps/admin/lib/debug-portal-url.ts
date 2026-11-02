/** Public debug ticket portal origin (SSO from TBOS admin dev banner). */
export function debugPortalPublicUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_DEBUG_PORTAL_URL?.trim() ||
    process.env.DEBUG_PORTAL_PUBLIC_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}
