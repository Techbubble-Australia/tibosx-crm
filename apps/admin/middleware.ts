import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import {
  MFA_SETUP_REQUIRED_PURPOSE,
  PASSWORD_RESET_REQUIRED_PURPOSE,
} from "@/lib/auth-constants";
import { defaultLandingPath, isExternalLandingPath } from "@/lib/admin-roles";

function jwtSecretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
  );
}

const LOGIN_PATH = "/login";
const FORGOT_PASSWORD_PATH = "/forgot-password";
const RESET_PASSWORD_PATH = "/reset-password";
const CHANGE_PASSWORD_PATH = "/change-password";
const MFA_SETUP_PATH = "/mfa-setup";

const PUBLIC_UNAUTHENTICATED_PATHS = [LOGIN_PATH, FORGOT_PASSWORD_PATH, RESET_PASSWORD_PATH];

const SESSION_AUTH_PATHS = [CHANGE_PASSWORD_PATH, MFA_SETUP_PATH];

function isPublicUnauthenticatedPath(pathname: string): boolean {
  return PUBLIC_UNAUTHENTICATED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isSessionAuthPath(pathname: string): boolean {
  return SESSION_AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, pathname: string) {
  if (isExternalLandingPath(pathname)) {
    return NextResponse.redirect(pathname);
  }
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (isPublicUnauthenticatedPath(pathname)) {
    if (pathname.startsWith(FORGOT_PASSWORD_PATH) || pathname.startsWith(RESET_PASSWORD_PATH)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.next();
    }
    try {
      const { payload } = await jwtVerify(token, jwtSecretKey());
      const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;
      if (purpose === PASSWORD_RESET_REQUIRED_PURPOSE) {
        return redirectTo(request, CHANGE_PASSWORD_PATH);
      }
      if (purpose === MFA_SETUP_REQUIRED_PURPOSE) {
        return redirectTo(request, MFA_SETUP_PATH);
      }
      const role = typeof payload.role === "string" ? payload.role : "website";
      return redirectTo(request, defaultLandingPath(role));
    } catch {
      const res = NextResponse.next();
      res.cookies.delete(ADMIN_SESSION_COOKIE);
      return res;
    }
  }

  if (isSessionAuthPath(pathname)) {
    if (!token) {
      return redirectTo(request, LOGIN_PATH);
    }
    try {
      const { payload } = await jwtVerify(token, jwtSecretKey());
      const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;

      if (pathname.startsWith(CHANGE_PASSWORD_PATH)) {
        if (purpose === PASSWORD_RESET_REQUIRED_PURPOSE) {
          return NextResponse.next();
        }
        if (purpose === MFA_SETUP_REQUIRED_PURPOSE) {
          return redirectTo(request, MFA_SETUP_PATH);
        }
        const role = typeof payload.role === "string" ? payload.role : "website";
        return redirectTo(request, defaultLandingPath(role));
      }

      if (pathname.startsWith(MFA_SETUP_PATH)) {
        if (purpose === MFA_SETUP_REQUIRED_PURPOSE) {
          return NextResponse.next();
        }
        if (purpose === PASSWORD_RESET_REQUIRED_PURPOSE) {
          return redirectTo(request, CHANGE_PASSWORD_PATH);
        }
        const role = typeof payload.role === "string" ? payload.role : "website";
        return redirectTo(request, defaultLandingPath(role));
      }

      return NextResponse.next();
    } catch {
      return redirectTo(request, LOGIN_PATH);
    }
  }

  if (!token) {
    return redirectTo(request, LOGIN_PATH);
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;

    if (purpose === PASSWORD_RESET_REQUIRED_PURPOSE) {
      return redirectTo(request, CHANGE_PASSWORD_PATH);
    }
    if (purpose === MFA_SETUP_REQUIRED_PURPOSE) {
      return redirectTo(request, MFA_SETUP_PATH);
    }

    const role = typeof payload.role === "string" ? payload.role : "website";

    if (role === "client" && !purpose) {
      return redirectTo(request, defaultLandingPath("client"));
    }

    if (pathname.startsWith("/settings/security")) {
      const mfa = request.nextUrl.searchParams.get("mfa");
      const reset = request.nextUrl.searchParams.get("reset");
      if (mfa === "required") {
        return redirectTo(request, MFA_SETUP_PATH);
      }
      if (reset === "required") {
        return redirectTo(request, CHANGE_PASSWORD_PATH);
      }
    }

    if (
      pathname.startsWith("/settings") &&
      !pathname.startsWith("/settings/profile") &&
      role !== "admin"
    ) {
      return redirectTo(request, defaultLandingPath(role));
    }

    return NextResponse.next();
  } catch {
    const res = redirectTo(request, LOGIN_PATH);
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)",
  ],
};
