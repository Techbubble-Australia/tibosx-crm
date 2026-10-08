import bcrypt from "bcryptjs";
import { prisma } from "./client";

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "acme-demo" },
    update: { name: "Acme Demo Corp" },
    create: { name: "Acme Demo Corp", slug: "acme-demo" },
  });

  const clientPassword = await bcrypt.hash(process.env.TICKETING_SEED_CLIENT_PASSWORD || "ClientDemo123!", 10);
  await prisma.ticketingUser.upsert({
    where: { email: "client@acme-demo.example" },
    update: {},
    create: {
      email: "client@acme-demo.example",
      passwordHash: clientPassword,
      name: "Acme Client User",
      role: "CLIENT",
      organizationId: org.id,
    },
  });

  const consultantEmail = process.env.TICKETING_SEED_CONSULTANT_EMAIL || "consultant@techbubble.com.au";
  const consultantPassword = await bcrypt.hash(
    process.env.TICKETING_SEED_CONSULTANT_PASSWORD || "ConsultantDemo123!",
    10,
  );
  const consultant = await prisma.ticketingUser.upsert({
    where: { email: consultantEmail },
    update: { consultantVerified: true, tbosRole: "sales" },
    create: {
      email: consultantEmail,
      passwordHash: consultantPassword,
      name: "Support Consultant",
      role: "CONSULTANT",
      consultantVerified: true,
      tbosRole: "sales",
    },
  });

  await prisma.consultantOrganization.upsert({
    where: {
      consultantId_organizationId: { consultantId: consultant.id, organizationId: org.id },
    },
    update: {},
    create: { consultantId: consultant.id, organizationId: org.id },
  });

  console.log("Support ticketing seed complete:", { organizationId: org.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
