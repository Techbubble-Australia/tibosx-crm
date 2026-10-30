import { z } from "zod";

export const EFFORT_PHASE_KEYS = [
  "effortAnalysis",
  "effortBuild",
  "effortTest",
  "effortDocument",
  "effortSupport",
] as const;

export type EffortPhaseKey = (typeof EFFORT_PHASE_KEYS)[number];

export const effortHoursInputSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? value : value.trim()))
  .refine((value) => value !== "", { message: "Estimated effort is required" })
  .transform((value) => {
    const normalized = typeof value === "number" ? String(value) : value.replace(",", ".");
    return Number.parseFloat(normalized);
  })
  .refine((value) => Number.isFinite(value) && value >= 0 && value <= 9999.99, {
    message: "Enter a valid number of hours (e.g. 8 or 08.00)",
  });

export const effortBreakdownSchema = z.object({
  effortAnalysis: effortHoursInputSchema.optional(),
  effortBuild: effortHoursInputSchema.optional(),
  effortTest: effortHoursInputSchema.optional(),
  effortDocument: effortHoursInputSchema.optional(),
  effortSupport: effortHoursInputSchema.optional(),
});

export function formatEffortHoursDisplay(hours: number): string {
  return hours.toFixed(2);
}

export function decimalToNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value.toString());
  return Number.isFinite(n) ? n : null;
}

export function sumEffortBreakdown(row: Partial<Record<EffortPhaseKey, number | null>>): number {
  return EFFORT_PHASE_KEYS.reduce((sum, key) => sum + (row[key] ?? 0), 0);
}

export function serializeTicketEffort(row: {
  estimatedEffortHours?: { toString(): string } | number | null;
  effortAnalysis?: { toString(): string } | number | null;
  effortBuild?: { toString(): string } | number | null;
  effortTest?: { toString(): string } | number | null;
  effortDocument?: { toString(): string } | number | null;
  effortSupport?: { toString(): string } | number | null;
}) {
  const breakdown = {
    effortAnalysis: decimalToNumber(row.effortAnalysis ?? null),
    effortBuild: decimalToNumber(row.effortBuild ?? null),
    effortTest: decimalToNumber(row.effortTest ?? null),
    effortDocument: decimalToNumber(row.effortDocument ?? null),
    effortSupport: decimalToNumber(row.effortSupport ?? null),
  };
  const breakdownTotal = sumEffortBreakdown(breakdown);
  return {
    estimatedEffortHours: decimalToNumber(row.estimatedEffortHours ?? null),
    effortBreakdown: breakdown,
    effortBreakdownTotal: breakdownTotal > 0 ? breakdownTotal : null,
  };
}
