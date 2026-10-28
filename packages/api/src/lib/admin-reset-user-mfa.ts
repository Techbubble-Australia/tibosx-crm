import { prisma } from "@techbubble/database";
import { syncClientAdminMfa } from "./mfa-account.js";

const mfaResetData = {
  mfaEnabled: true,
  totpSecretEnc: null,
  mfaEnrolledAt: null,
} as const;

export type AdminMfaResetResult = {
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
  hadEnrollment: boolean;
};

/** Clear authenticator enrollment; user must set up MFA again on next sign-in. */
export async function resetMfaForAdminUser(adminUserId: string): Promise<AdminMfaResetResult | null> {
  const existing = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { id: true, mfaEnrolledAt: true, totpSecretEnc: true },
  });
  if (!existing) return null;

  const hadEnrollment = Boolean(existing.totpSecretEnc || existing.mfaEnrolledAt);

  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: mfaResetData,
  });

  return {
    mfaEnabled: true,
    mfaEnrolledAt: null,
    hadEnrollment,
  };
}

export async function resetMfaForCustomerUser(customerUserId: string): Promise<AdminMfaResetResult | null> {
  const existing = await prisma.customerUser.findUnique({
    where: { id: customerUserId },
    select: { id: true, email: true, mfaEnrolledAt: true, totpSecretEnc: true },
  });
  if (!existing) return null;

  const hadEnrollment = Boolean(existing.totpSecretEnc || existing.mfaEnrolledAt);

  await prisma.customerUser.update({
    where: { id: customerUserId },
    data: mfaResetData,
  });

  await syncClientAdminMfa(customerUserId, mfaResetData);

  await prisma.adminUser.updateMany({
    where: {
      role: "client",
      OR: [{ id: customerUserId }, { email: { equals: existing.email, mode: "insensitive" } }],
    },
    data: mfaResetData,
  });

  return {
    mfaEnabled: true,
    mfaEnrolledAt: null,
    hadEnrollment,
  };
}
