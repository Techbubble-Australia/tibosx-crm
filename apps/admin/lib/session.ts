import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/** Idle timeout and session cookie/JWT lifetime (seconds). Keep in sync with packages/api `lib/session.ts`. */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60;

export const ADMIN_INACTIVITY_MS = ADMIN_SESSION_MAX_AGE_SEC * 1000;

export function adminSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  };
}
