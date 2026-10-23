import { prisma } from "@techbubble/database";
import { sessionAuthUser } from "./admin-session-token.js";

const customerMfaSelect = {
  id: true,
  email: true,
  active: true,
  mfaEnabled: true,
  totpSecretEnc: true,
  mfaEnrolledAt: true,
  passwordNeedsReset: true,
  passwordHash: true,
};

const adminMfaSelect = {
  id: true,
  email: true,
  role: true,
  additionalRoles: true,
  active: true,
  mfaEnabled: true,
  totpSecretEnc: true,
  mfaEnrolledAt: true,
  passwordNeedsReset: true,
  passwordHash: true,
};

export type MfaCustomer = Awaited<
  ReturnType<typeof prisma.customerUser.findUnique<{ where: { id: string }; select: typeof customerMfaSelect }>>
>;

export type MfaAdmin = NonNullable<
  Awaited<ReturnType<typeof prisma.adminUser.findUnique<{ where: { id: string }; select: typeof adminMfaSelect }>>>
>;

export type MfaAccount =
  | { kind: "customer"; user: NonNullable<MfaCustomer> }
  | { kind: "admin"; user: MfaAdmin };

export async function findMfaAccountById(userId: string): Promise<MfaAccount | null> {
  const customer = await prisma.customerUser.findUnique({
    where: { id: userId },
    select: customerMfaSelect,
  });
  if (customer) {
    return { kind: "customer", user: customer };
  }
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: adminMfaSelect,
  });
  if (admin) {
    return { kind: "admin", user: admin };
  }
  return null;
}

export function mfaSessionUser(account: MfaAccount) {
  if (account.kind === "customer") {
    return { id: account.user.id, email: account.user.email, role: "client" as const };
  }
  return sessionAuthUser(account.user);
}

/** Keep mirrored client AdminUser MFA fields aligned with the portal CustomerUser record. */
export async function syncClientAdminMfa(
  customerUserId: string,
  data: {
    mfaEnabled?: boolean;
    totpSecretEnc?: string | null;
    mfaEnrolledAt?: Date | null;
  },
) {
  await prisma.adminUser.updateMany({
    where: { id: customerUserId, role: "client" },
    data,
  });
}
