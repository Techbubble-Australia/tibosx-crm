import { createHash, randomBytes } from "crypto";

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
