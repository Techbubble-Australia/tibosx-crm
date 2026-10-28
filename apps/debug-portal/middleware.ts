import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { DEBUG_PORTAL_SESSION_COOKIE } from "@/lib/auth-cookie";

function jwtSecretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
  );
}

const LOGIN = "/login";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function hasAdminRole(role: string, additionalRoles: unknown): boolean {
  if (role === "admin") return true;
  if (!Array.isArray(additionalRoles)) return false;
  return additionalRoles.includes("admin");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(DEBUG_PORTAL_SESSION_COOKIE)?.value;

  if (pathname.startsWith("/login")) {
    if (!token) return NextResponse.next();
    try {
      const { payload } = await jwtVerify(token, jwtSecretKey());
      const role = typeof payload.role === "string" ? payload.role : "";
      const additionalRoles = payload.additionalRoles;
      if (hasAdminRole(role, additionalRoles)) {
        return redirectTo(request, "/tickets");
      }
    } catch {
      const res = NextResponse.next();
      res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!token) {
    return redirectTo(request, LOGIN);
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;
    if (purpose) {
      const res = redirectTo(request, LOGIN);
      res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
      return res;
    }
    const role = typeof payload.role === "string" ? payload.role : "";
    if (!hasAdminRole(role, payload.additionalRoles)) {
      const res = redirectTo(request, LOGIN);
      res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  } catch {
    const res = redirectTo(request, LOGIN);
    res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
