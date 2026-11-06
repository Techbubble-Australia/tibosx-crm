import { prisma } from "@techbubble/database";

/** New tickets land in the active sprint; with no active sprint they stay in the backlog (null). */
export async function activeDebugSprintId(): Promise<string | null> {
  const active = await prisma.debugSprint.findFirst({
    where: { status: "ACTIVE" },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  return active?.id ?? null;
}
