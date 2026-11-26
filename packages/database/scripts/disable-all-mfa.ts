/**
 * Turn MFA off for every AdminUser and CustomerUser (clear secrets + flags).
 *
 * Usage:
 *   CONFIRM_DISABLE_ALL_MFA=1 pnpm --filter @techbubble/database exec tsx scripts/disable-all-mfa.ts
 */
import { PrismaClient } from "@prisma/client";

const MFA_OFF = { mfaEnabled: false, totpSecretEnc: null, mfaEnrolledAt: null } as const;

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown host)";
  if (process.env.CONFIRM_DISABLE_ALL_MFA !== "1") {
    console.error(`Refusing to run without CONFIRM_DISABLE_ALL_MFA=1. Target database: ${host}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log(`Disabling MFA for all users on ${host}…`);
    const admins = await prisma.adminUser.updateMany({ data: MFA_OFF });
    const customers = await prisma.customerUser.updateMany({ data: MFA_OFF });
    console.log(
      `Updated ${admins.count} internal and ${customers.count} customer user(s). MFA is off for everyone.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
