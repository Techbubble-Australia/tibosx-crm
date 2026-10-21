import bcrypt from "bcryptjs";
import { prisma } from "./client";

const SALT_ROUNDS = 12;

/** Email for the first super-admin (from env). Login skips MFA and onboarding gates. */
export function getBootstrapAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "admin@techbubble.com").trim().toLowerCase();
}

export function isBootstrapSuperAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === getBootstrapAdminEmail();
}

/**
 * Ensures the bootstrap admin exists with password from ADMIN_PASSWORD.
 * Safe to call on API startup and during db seed.
 */
export async function ensureBootstrapAdminUser(): Promise<void> {
  const email = getBootstrapAdminEmail();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "admin",
      active: true,
      name: "Bootstrap Admin",
      passwordNeedsReset: false,
      mfaEnabled: false,
      totpSecretEnc: null,
      mfaEnrolledAt: null,
      profileOnboardingRequiredAt: null,
    },
    update: {
      passwordHash,
      role: "admin",
      active: true,
      passwordNeedsReset: false,
      mfaEnabled: false,
      totpSecretEnc: null,
      mfaEnrolledAt: null,
      profileOnboardingRequiredAt: null,
    },
  });
}
