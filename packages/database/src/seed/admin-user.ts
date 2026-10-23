import bcrypt from "bcryptjs";
import { prisma } from "../client";

const SALT_ROUNDS = 12;

/**
 * Creates or updates the initial admin user when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set.
 * Run via `pnpm --filter @techbubble/database db:seed` or `db:seed-admin`.
 */
export async function seedAdminUser(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      "⏭️  Skipping admin user seed (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in packages/database/.env)",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "admin",
      active: true,
      name: "Admin",
      passwordNeedsReset: false,
      mfaEnabled: false,
      totpSecretEnc: null,
      mfaEnrolledAt: null,
      profileOnboardingRequiredAt: null,
      requireProfileAfterFirstLogin: false,
      profileKycStatus: "COMPLETE",
    },
    update: {
      passwordHash,
      role: "admin",
      active: true,
      requireProfileAfterFirstLogin: false,
      profileKycStatus: "COMPLETE",
    },
  });

  console.log(`✅ Admin user seeded: ${email}`);
}
