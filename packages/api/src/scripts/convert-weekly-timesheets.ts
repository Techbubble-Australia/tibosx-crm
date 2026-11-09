/**
 * Preview (default), rehearse, or apply the weekly → monthly timesheet conversion.
 * The API also applies it automatically on start, so --apply is only needed to run it ahead of a deploy.
 *
 *   pnpm --filter @techbubble/api timesheets:convert-monthly             # dry run (no writes)
 *   pnpm --filter @techbubble/api timesheets:convert-monthly --rehearse  # write, verify, roll back
 *   pnpm --filter @techbubble/api timesheets:convert-monthly --apply     # write
 */
import "dotenv/config";
import { prisma } from "@techbubble/database";
import { convertWeeklyTimesheetsToMonthly } from "../lib/timesheet-weekly-conversion.js";

async function main() {
  const apply = process.argv.includes("--apply");
  const rehearse = process.argv.includes("--rehearse");
  const summary = await convertWeeklyTimesheetsToMonthly(rehearse ? { rehearse: true } : { dryRun: !apply });
  if (!summary) {
    console.log("Another conversion is running; nothing done.");
    return;
  }
  if (!summary.weeklySheets) {
    console.log("No weekly timesheets left — nothing to convert.");
    return;
  }
  const users = await prisma.adminUser.findMany({
    where: { id: { in: [...new Set(summary.months.map((m) => m.memberUserId))] } },
    select: { id: true, email: true },
  });
  const projects = await prisma.project.findMany({
    where: { id: { in: summary.months.map((m) => m.projectId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, projectNumber: true },
  });
  const email = new Map(users.map((u) => [u.id, u.email]));
  const number = new Map(projects.map((p) => [p.id, p.projectNumber]));
  console.table(
    summary.months
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        member: email.get(m.memberUserId) ?? m.memberUserId,
        project: m.projectId ? number.get(m.projectId) ?? m.projectId : "(no project)",
        month: m.month,
        status: m.status,
        weeks: m.sourceCount,
        hours: m.hours,
      })),
  );
  console.log(
    `${apply ? "Converted" : rehearse ? "Rehearsed (rolled back)" : "Would convert"} ${summary.weeklySheets} weekly timesheets into ${summary.monthlySheets} monthly timesheets.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
