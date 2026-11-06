/**
 * Clear authenticator enrollments on the DEVELOPMENT database so every user sets up MFA again
 * with the DEV.TIBOSX.AI authenticator entry. Use after a prod→dev copy left production secrets in dev.
 *
 * Usage (DATABASE_URL must point at the dev database):
 *   CONFIRM_RESET_DEV_MFA=1 pnpm --filter @techbubble/database db:reset-dev-mfa
 */
import { PrismaClient } from "@prisma/client";

const MFA_RESET = { mfaEnabled: true, totpSecretEnc: null, mfaEnrolledAt: null } as const;

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown host)";
  if (process.env.CONFIRM_RESET_DEV_MFA !== "1") {
    console.error(`Refusing to run without CONFIRM_RESET_DEV_MFA=1. Target database: ${host}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log(`Resetting MFA enrollments on ${host}…`);
    const admins = await prisma.adminUser.updateMany({ where: { totpSecretEnc: { not: null } }, data: MFA_RESET });
    const customers = await prisma.customerUser.updateMany({ where: { totpSecretEnc: { not: null } }, data: MFA_RESET });
    console.log(
      `Cleared ${admins.count} internal and ${customers.count} customer authenticator enrollment(s). ` +
        "Users will scan a new DEV.TIBOSX.AI QR code on their next dev login.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
