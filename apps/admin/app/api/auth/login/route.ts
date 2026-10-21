import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { jwtSecretFingerprint } from "@/lib/jwt-fingerprint";
import { adminSessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    try {
      const checkRes = await fetch(`${apiUrl.replace(/\/$/, "")}/api/auth/link-check`, {
        cache: "no-store",
      });
      const check = (await checkRes.json().catch(() => ({}))) as {
        data?: {
          jwtSecretFingerprint?: string;
          bootstrapUserExists?: boolean;
          bootstrapEmail?: string;
        };
      };
      const apiFp = check.data?.jwtSecretFingerprint ?? "unreachable";
      const adminFp = jwtSecretFingerprint();
      console.warn("[admin login] API rejected credentials", {
        apiUrl,
        loginHttpStatus: res.status,
        jwtFingerprintsMatch: apiFp !== "unreachable" && adminFp === apiFp,
        adminJwtFingerprint: adminFp,
        apiJwtFingerprint: apiFp,
        bootstrapEmail: check.data?.bootstrapEmail,
        bootstrapUserExists: check.data?.bootstrapUserExists,
      });
    } catch (linkErr) {
      console.warn("[admin login] Could not reach API link-check", { apiUrl, linkErr });
    }
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Login failed" },
      { status: res.status },
    );
  }

  if (data?.data?.requiresMfa && typeof data?.data?.mfaToken === "string") {
    return NextResponse.json({
      requiresMfa: true,
      mfaToken: data.data.mfaToken,
      user: data.data.user,
    });
  }

  if (data?.data?.requiresPasswordReset && typeof data?.data?.token === "string") {
    const response = NextResponse.json({
      requiresPasswordReset: true,
      user: data.data.user,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, data.data.token, adminSessionCookieOptions());
    return response;
  }

  if (data?.data?.requiresMfaSetup && typeof data?.data?.token === "string") {
    const response = NextResponse.json({
      requiresMfaSetup: true,
      user: data.data.user,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, data.data.token, adminSessionCookieOptions());
    return response;
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid login response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: data.data.user });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
