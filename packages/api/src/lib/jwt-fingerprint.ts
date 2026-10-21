import crypto from "crypto";

/** Short hash to verify admin + API use the same JWT_SECRET without exposing the secret. */
export function jwtSecretFingerprint(): string {
  const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  return crypto.createHash("sha256").update(secret).digest("hex").slice(0, 12);
}
