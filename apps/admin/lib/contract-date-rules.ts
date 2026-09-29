export type VariationDateInput = {
  id?: string;
  variationDate: string;
  variationEndDate?: string | null;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function validateContractDates(startDate: string, endDate: string | null | undefined): string | null {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return null;
  if (end <= start) return "End date must be after start date";
  return null;
}

export function validateVariationDates(
  variation: VariationDateInput,
  contractStartDate: string | null | undefined,
  existingVariations: VariationDateInput[] = [],
): string | null {
  const start = toDate(variation.variationDate);
  const end = toDate(variation.variationEndDate);
  if (!start) return "Variation start date is required";
  if (end && end <= start) return "Variation end date must be after start date";

  const contractStart = toDate(contractStartDate);
  if (contractStart && start < startOfDay(contractStart)) {
    return "Variation start date cannot be earlier than the contract start date";
  }

  const others = existingVariations
    .filter((row) => row.id !== variation.id)
    .map((row) => ({
      start: toDate(row.variationDate),
      end: toDate(row.variationEndDate),
    }))
    .filter((row) => row.start)
    .sort((a, b) => startOfDay(a.start!).getTime() - startOfDay(b.start!).getTime());

  if (others.length === 0) return null;

  const previous = others[others.length - 1];
  if (!previous) return null;
  const previousEnd = previous.end ?? previous.start;
  if (previousEnd && start <= previousEnd) {
    return "Variation start date must be after the previous variation end date";
  }
  return null;
}
