const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  if (!process.env.DATABASE_URL.includes("junction.proxy.rlwy.net")) throw new Error("Not the dev DB");
  const applied = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE migration_name LIKE '20261113%' ORDER BY migration_name`,
  );
  console.log(applied);
  const links = await prisma.$queryRawUnsafe(
    `SELECT p."projectNumber", c.name, pcc."portalAccess", pcc."canApproveTimesheets", pcc."clientWorkspaceAccess"
     FROM "ProjectClientContact" pcc JOIN "Project" p ON p.id = pcc."projectId" JOIN "ClientContact" c ON c.id = pcc."contactId"
     ORDER BY c.name, p."projectNumber"`,
  ).catch((e) => e.message.slice(0, 160));
  console.log(links);
  await prisma.$disconnect();
})();
