import crypto from "crypto";

/** Must match packages/api JWT fingerprint when API_URL points at that API. */
export function jwtSecretFingerprint(): string {
  const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  return crypto.createHash("sha256").update(secret).digest("hex").slice(0, 12);
}
