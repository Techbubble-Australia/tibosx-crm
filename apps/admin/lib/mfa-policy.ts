/**
 * Keep in sync with packages/api/src/lib/mfa-policy.ts.
 * Staging defaults MFA off for every account (password-only login).
 */
export function isMfaEnforcementDisabled(): boolean {
  const explicit = process.env.MFA_DISABLED?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1" || explicit === "yes") return true;
  if (explicit === "false" || explicit === "0" || explicit === "no") return false;

  const appEnv = (process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? "staging")
    .trim()
    .toLowerCase();
  return appEnv === "staging" || appEnv === "stage";
}
