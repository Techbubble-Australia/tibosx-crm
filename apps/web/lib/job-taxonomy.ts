function normalizeTaxonomyValue(value?: string | null): string {
  return (value ?? "").trim();
}

/** One-line category · technology for job cards and detail eyebrows. */
export function formatJobCategoryTechnology(
  category?: string | null,
  technology?: string | null,
): string {
  const cat = normalizeTaxonomyValue(category);
  const tech = normalizeTaxonomyValue(technology);

  if (cat && tech) {
    return `${cat} - ${tech}`;
  }

  return cat || tech;
}
