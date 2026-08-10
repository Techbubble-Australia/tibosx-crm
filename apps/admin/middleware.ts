import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { MFA_SETUP_REQUIRED_PURPOSE } from "@/lib/auth-constants";
import { defaultLandingPath } from "@/lib/admin-roles";

function jwtSecretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
  );
}

const MFA_SETUP_PATH = "/settings/security";

function isMfaSetupPath(pathname: string): boolean {
  return pathname === MFA_SETUP_PATH || pathname.startsWith(`${MFA_SETUP_PATH}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, jwtSecretKey());
        const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;
        if (purpose === MFA_SETUP_REQUIRED_PURPOSE) {
          return NextResponse.redirect(new URL(`${MFA_SETUP_PATH}?mfa=required`, request.url));
        }
        const role = typeof payload.role === "string" ? payload.role : "website";
        return NextResponse.redirect(new URL(defaultLandingPath(role), request.url));
      } catch {
        const res = NextResponse.next();
        res.cookies.delete(ADMIN_SESSION_COOKIE);
        return res;
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;
    if (purpose === MFA_SETUP_REQUIRED_PURPOSE && !isMfaSetupPath(pathname)) {
      return NextResponse.redirect(new URL(`${MFA_SETUP_PATH}?mfa=required`, request.url));
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Skip static assets, API routes, and uploaded files (filenames almost always contain a dot).
     * Also skip `/uploads/...` without an extension so those requests never hit auth middleware.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)",
  ],
};
