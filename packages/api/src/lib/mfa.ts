import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { generateSecret, generateURI, verify } from "otplib";

const ALGO = "aes-256-gcm";
const DEFAULT_MFA_ISSUER = "TIBOSX.AI";
const DEV_MFA_ISSUER = "DEV.TIBOSX.AI";

/** Issuer in authenticator apps (otpauth). Dev uses a distinct name so prod and dev QR codes do not collide. */
export function mfaIssuerName(): string {
  const explicit = process.env.MFA_ISSUER_NAME?.trim();
  if (explicit) return explicit;
  const env = (process.env.ENV ?? process.env.TBOS_ENV ?? "").trim().toLowerCase();
  if (env === "development") return DEV_MFA_ISSUER;
  return DEFAULT_MFA_ISSUER;
}

function deriveEncryptionKey(): Buffer {
  const material = process.env.MFA_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-only-mfa-key";
  return scryptSync(material, "admin-mfa-totp-v1", 32);
}

export function encryptTotpSecret(secret: string): string {
  const key = deriveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptTotpSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = deriveEncryptionKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function createTotpEnrollment(email: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: mfaIssuerName(),
    label: email,
    secret,
  });
  return { secret, otpauthUrl };
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const result = await verify({ secret, token: normalized });
  return Boolean(result.valid);
}

export async function verifyUserTotpCode(totpSecretEnc: string | null | undefined, code: string): Promise<boolean> {
  if (!totpSecretEnc) {
    return false;
  }
  try {
    const secret = decryptTotpSecret(totpSecretEnc);
    return verifyTotpCode(secret, code);
  } catch {
    return false;
  }
}
