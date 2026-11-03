import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Clearing project estimates on ${host || "(unknown host)"}…`);
  const before = await prisma.projectEstimate.count();
  const result = await prisma.projectEstimate.deleteMany({});
  console.log(`Deleted ${result.count} estimate rows (had ${before}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
