import { prisma } from "@techbubble/database";
import { FALLBACK_PROFILE_LEVELS } from "./profile-levels";

/** Level names from settings (JobLevel table), with static fallback when empty. */
export async function getJobLevelNames(): Promise<string[]> {
  const rows = await prisma.jobLevel.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return rows.length > 0 ? rows.map((row) => row.name) : [...FALLBACK_PROFILE_LEVELS];
}
