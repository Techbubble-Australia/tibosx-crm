import { TicketStatus } from "@techbubble/database";
import {
  effortBreakdownSchema,
  effortHoursInputSchema,
  formatEffortHoursDisplay,
  serializeTicketEffort,
  type EffortPhaseKey,
} from "./ticket-effort.js";
import { logTicketAudit } from "./ticket-audit.js";
import { prisma } from "@techbubble/database";
import { z } from "zod";

export const estimatedEffortBodySchema = z.object({
  estimatedEffortHours: effortHoursInputSchema,
});

export function ticketIsInProgress(status: TicketStatus | string): boolean {
  return status === TicketStatus.IN_PROGRESS;
}

export async function applyEstimatedEffortHours(
  ticketId: string,
  actorId: string,
  hours: number,
  previousHours: number | null,
) {
  const display = formatEffortHoursDisplay(hours);
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { estimatedEffortHours: hours, updatedById: actorId },
  });
  await logTicketAudit(ticketId, actorId, "ESTIMATED_EFFORT", {
    field: "estimatedEffortHours",
    oldValue: previousHours != null ? formatEffortHoursDisplay(previousHours) : undefined,
    newValue: display,
    metadata: { hours: display },
  });
}

export async function applyEffortBreakdown(
  ticketId: string,
  actorId: string,
  parsed: z.infer<typeof effortBreakdownSchema>,
  existing: ReturnType<typeof serializeTicketEffort>,
) {
  const data: Partial<Record<EffortPhaseKey, number | null>> = {};
  for (const key of ["effortAnalysis", "effortBuild", "effortTest", "effortDocument", "effortSupport"] as const) {
    if (parsed[key] !== undefined) data[key] = parsed[key] ?? null;
  }
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { ...data, updatedById: actorId },
  });
  const next = serializeTicketEffort({
    estimatedEffortHours: existing.estimatedEffortHours,
    effortAnalysis: data.effortAnalysis ?? existing.effortBreakdown.effortAnalysis,
    effortBuild: data.effortBuild ?? existing.effortBreakdown.effortBuild,
    effortTest: data.effortTest ?? existing.effortBreakdown.effortTest,
    effortDocument: data.effortDocument ?? existing.effortBreakdown.effortDocument,
    effortSupport: data.effortSupport ?? existing.effortBreakdown.effortSupport,
  });
  if (next.effortBreakdownTotal !== existing.effortBreakdownTotal) {
    await logTicketAudit(ticketId, actorId, "UPDATED", {
      field: "effortBreakdown",
      oldValue:
        existing.effortBreakdownTotal != null
          ? formatEffortHoursDisplay(existing.effortBreakdownTotal)
          : undefined,
      newValue:
        next.effortBreakdownTotal != null
          ? formatEffortHoursDisplay(next.effortBreakdownTotal)
          : undefined,
    });
  }
  return next;
}
