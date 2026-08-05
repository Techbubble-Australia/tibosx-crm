function normalizeTaxonomyValue(value?: string | null): string {
  return (value ?? "").trim();
}

function taxonomyValuesEqual(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

export type JobCategoryTechnologyParts = {
  category: string;
  technology: string;
  sameValue: boolean;
};

export function getJobCategoryTechnologyParts(
  category?: string | null,
  technology?: string | null,
): JobCategoryTechnologyParts {
  const cat = normalizeTaxonomyValue(category);
  const tech = normalizeTaxonomyValue(technology);
  return {
    category: cat,
    technology: tech,
    sameValue: Boolean(cat && tech && taxonomyValuesEqual(cat, tech)),
  };
}

/** One-line summary for eyebrows and compact meta rows. */
export function formatJobCategoryTechnology(
  category?: string | null,
  technology?: string | null,
): string {
  const { category: cat, technology: tech, sameValue } = getJobCategoryTechnologyParts(category, technology);

  if (cat && tech) {
    if (sameValue) {
      return `Category: ${cat} · Technology: ${tech}`;
    }
    return `${cat} · ${tech}`;
  }

  return cat || tech;
}
