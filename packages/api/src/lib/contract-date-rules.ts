export type VariationDateInput = {
  id?: string;
  variationDate: Date | string;
  variationEndDate?: Date | string | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function validateContractDates(startDate: Date | string, endDate: Date | string | null | undefined): string | null {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return null;
  if (end <= start) return "End date must be after start date";
  return null;
}

export function validateVariationDates(
  variation: VariationDateInput,
  contractEndDate: Date | string | null | undefined,
  existingVariations: VariationDateInput[] = [],
): string | null {
  const start = toDate(variation.variationDate);
  const end = toDate(variation.variationEndDate);
  if (!start) return "Variation start date is required";
  if (end && end <= start) return "Variation end date must be after start date";

  const contractEnd = toDate(contractEndDate);
  const others = existingVariations
    .filter((row) => row.id !== variation.id)
    .map((row) => ({
      start: toDate(row.variationDate),
      end: toDate(row.variationEndDate),
    }))
    .filter((row) => row.start)
    .sort((a, b) => startOfDay(a.start!).getTime() - startOfDay(b.start!).getTime());

  if (others.length === 0) {
    if (contractEnd && start <= contractEnd) {
      return "Variation start date must be after the contract end date";
    }
    return null;
  }

  const previous = others[others.length - 1];
  if (!previous) return null;
  const previousEnd = previous.end ?? previous.start;
  if (previousEnd && start <= previousEnd) {
    return "Variation start date must be after the previous variation end date";
  }
  return null;
}
