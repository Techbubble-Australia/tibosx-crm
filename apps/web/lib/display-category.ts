export const UNCATEGORIZED_LABEL = "Uncategorized";

export function isUncategorized(value: string | null | undefined): boolean {
  return !value?.trim();
}

/** User-facing category label; empty values become "Uncategorized". */
export function displayCategory(value: string | null | undefined): string {
  return isUncategorized(value) ? UNCATEGORIZED_LABEL : value!.trim();
}

/** Uppercase pill/badge label for category chips. */
export function displayCategoryPill(value: string | null | undefined): string {
  return displayCategory(value).toUpperCase();
}
