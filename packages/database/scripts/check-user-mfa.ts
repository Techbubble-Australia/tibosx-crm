import { PrismaClient } from "@prisma/client";

const email = process.argv[2] || "jeet@techbubble.com.au";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown)";
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.adminUser.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        role: true,
        mfaEnabled: true,
        totpSecretEnc: true,
        mfaEnrolledAt: true,
        active: true,
      },
    });
    const customer = await prisma.customerUser.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        totpSecretEnc: true,
        mfaEnrolledAt: true,
        active: true,
      },
    });
    console.log(JSON.stringify({
      host,
      email,
      admin: admin
        ? {
            ...admin,
            totpSecretEnc: admin.totpSecretEnc ? "[set]" : null,
            mfaEnrolledAt: admin.mfaEnrolledAt,
          }
        : null,
      customer: customer
        ? {
            ...customer,
            totpSecretEnc: customer.totpSecretEnc ? "[set]" : null,
            mfaEnrolledAt: customer.mfaEnrolledAt,
          }
        : null,
      stillOn: {
        admins: await prisma.adminUser.count({
          where: { OR: [{ mfaEnabled: true }, { totpSecretEnc: { not: null } }] },
        }),
        customers: await prisma.customerUser.count({
          where: { OR: [{ mfaEnabled: true }, { totpSecretEnc: { not: null } }] },
        }),
      },
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
