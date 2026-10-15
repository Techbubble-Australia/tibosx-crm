import { SignJWT, jwtVerify } from "jose";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/session";
import {
  MFA_PENDING_PURPOSE,
  MFA_SETUP_REQUIRED_PURPOSE,
  PASSWORD_RESET_REQUIRED_PURPOSE,
} from "@/lib/auth-constants";

function jwtSecretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
  );
}

/** Re-issue a session JWT with a fresh expiry (same claims). */
export async function refreshAdminSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    const id = typeof payload.id === "string" ? payload.id : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = typeof payload.role === "string" ? payload.role : "website";
    if (!id || !email) return null;

    const purpose = typeof payload.purpose === "string" ? payload.purpose : undefined;
    if (purpose === MFA_PENDING_PURPOSE) return null;

    const additionalRoles = Array.isArray(payload.additionalRoles)
      ? payload.additionalRoles.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
      : [];

    const signer = new SignJWT({
      id,
      email,
      role,
      ...(additionalRoles.length ? { additionalRoles } : {}),
      ...(purpose ? { purpose } : {}),
    }).setProtectedHeader({ alg: "HS256" });

    if (purpose === MFA_SETUP_REQUIRED_PURPOSE || purpose === PASSWORD_RESET_REQUIRED_PURPOSE) {
      signer.setExpirationTime("2h");
    } else {
      signer.setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SEC}s`);
    }

    return await signer.sign(jwtSecretKey());
  } catch {
    return null;
  }
}
