import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";
import { resolveDebugPortalUser } from "../lib/debug-portal-user.js";

const router: IRouter = Router();

export const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;

const dateField = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.date().nullable().optional(),
);

const sprintBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.string().trim().max(2000).nullable().optional(),
  startDate: dateField,
  endDate: dateField,
  status: z.enum(SPRINT_STATUSES).optional(),
});

function serializeSprint(row: {
  id: string;
  name: string;
  goal: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  _count?: { tickets: number };
}) {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    ticketCount: row._count?.tickets ?? 0,
  };
}

async function requireAdmin(req: AuthRequest, res: Response): Promise<boolean> {
  const user = req.user?.id ? await resolveDebugPortalUser(req.user.id) : null;
  if (!user) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Only admins can manage sprints" });
    return false;
  }
  return true;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Only one sprint is active at a time; activating one completes the previous active sprint. */
async function completeOtherActiveSprints(tx: Tx, keepId: string) {
  await tx.debugSprint.updateMany({
    where: { status: "ACTIVE", id: { not: keepId } },
    data: { status: "COMPLETED" },
  });
}

function datesInvalid(startDate?: Date | null, endDate?: Date | null): boolean {
  return Boolean(startDate && endDate && endDate < startDate);
}

/** Active first, then planned, then completed; newest first within each. */
router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id || !(await resolveDebugPortalUser(req.user.id))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const rows = await prisma.debugSprint.findMany({
      orderBy: [
        { startDate: { sort: "asc", nulls: "last" } },
        { endDate: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
      include: { _count: { select: { tickets: true } } },
    });
    const rank: Record<string, number> = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };
    rows.sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3));
    res.json({ data: rows.map(serializeSprint) });
  } catch (error) {
    console.error("debug sprints list error:", error);
    res.status(500).json({ error: "Failed to load sprints" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const body = sprintBodySchema.parse(req.body);
    if (datesInvalid(body.startDate, body.endDate)) {
      return res.status(400).json({ error: "End date must be on or after the start date" });
    }
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.debugSprint.create({
        data: {
          name: body.name,
          goal: body.goal ?? null,
          startDate: body.startDate ?? null,
          endDate: body.endDate ?? null,
          status: body.status ?? "PLANNED",
        },
        include: { _count: { select: { tickets: true } } },
      });
      if (created.status === "ACTIVE") await completeOtherActiveSprints(tx, created.id);
      return created;
    });
    res.status(201).json({ data: serializeSprint(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug sprint create error:", error);
    res.status(500).json({ error: "Failed to create sprint" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const body = sprintBodySchema.partial().parse(req.body);
    const existing = await prisma.debugSprint.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Sprint not found" });
    const startDate = body.startDate !== undefined ? body.startDate : existing.startDate;
    const endDate = body.endDate !== undefined ? body.endDate : existing.endDate;
    if (datesInvalid(startDate, endDate)) {
      return res.status(400).json({ error: "End date must be on or after the start date" });
    }
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.debugSprint.update({
        where: { id: existing.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.goal !== undefined ? { goal: body.goal } : {}),
          ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
          ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
        include: { _count: { select: { tickets: true } } },
      });
      if (updated.status === "ACTIVE") await completeOtherActiveSprints(tx, updated.id);
      return updated;
    });
    res.json({ data: serializeSprint(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug sprint update error:", error);
    res.status(500).json({ error: "Failed to update sprint" });
  }
});

/** Deleting a sprint moves its tickets back to the backlog. */
const deleteSprintSchema = z.object({ confirmName: z.string() });

/**
 * Strict delete: admins only, never the active sprint, and the request must repeat the sprint's exact name.
 * Its tickets move to the backlog and each ticket's activity log records it.
 */
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const actor = (await resolveDebugPortalUser(req.user!.id))!;
    const parsed = deleteSprintSchema.safeParse(req.body ?? {});
    const existing = await prisma.debugSprint.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Sprint not found" });
    if (existing.status === "ACTIVE") {
      return res.status(409).json({
        error: "The active sprint can't be deleted. Set another sprint as active or mark this one Completed first.",
        code: "SPRINT_ACTIVE",
      });
    }
    if (!parsed.success || parsed.data.confirmName.trim() !== existing.name) {
      return res.status(400).json({
        error: `Type the sprint name "${existing.name}" exactly to confirm deletion.`,
        code: "CONFIRM_NAME_MISMATCH",
      });
    }

    const moved = await prisma.$transaction(async (tx) => {
      const tickets = await tx.debugCaptureTicket.findMany({ where: { sprintId: existing.id }, select: { id: true } });
      if (tickets.length) {
        await tx.debugCaptureTicketLog.createMany({
          data: tickets.map((t) => ({
            ticketId: t.id,
            action: "UPDATED",
            field: "sprint",
            oldValue: existing.name,
            newValue: "Backlog (sprint deleted)",
            actorUserId: actor.id,
            actorEmail: actor.email,
          })),
        });
      }
      await tx.debugSprint.delete({ where: { id: existing.id } });
      return tickets.length;
    });
    res.json({ message: "Deleted", data: { id: existing.id, ticketsMovedToBacklog: moved } });
  } catch (error) {
    console.error("debug sprint delete error:", error);
    res.status(500).json({ error: "Failed to delete sprint" });
  }
});

export { router as debugPortalSprintRoutes };
