/** Strip trailing " (12)" count suffix from admin tab labels. */
export function stripWorkforceTabLabelSuffix(label: string): string {
  return label.replace(/\s*\(\d+\)\s*$/, "").trim();
}

/**
 * Order department pills using Site content → Workforce → Department tabs.
 * Tabs with `active: true` are matched to API departments (label vs department string, fuzzy).
 * Any API departments not matched by an active tab are appended (sorted) so nothing disappears.
 */
export function orderedDepartmentsForAboutWorkforce(
  cmsTabs: { label: string; active: boolean }[] | undefined,
  apiDepartments: string[],
): string[] {
  const sortedApi = [...apiDepartments].sort((a, b) => a.localeCompare(b));
  if (!cmsTabs?.length) return sortedApi;

  const hasAnyActiveTab = cmsTabs.some((t) => t.active);
  if (!hasAnyActiveTab) return sortedApi;

  const matched: string[] = [];
  const used = new Set<string>();

  for (const tab of cmsTabs) {
    if (!tab.active) continue;
    const base = stripWorkforceTabLabelSuffix(tab.label);
    if (!base) continue;
    const baseLc = base.toLowerCase();
    const found = sortedApi.find(
      (d) =>
        !used.has(d) &&
        (() => {
          const dl = d.trim().toLowerCase();
          return dl === baseLc || dl.includes(baseLc) || baseLc.includes(dl);
        })(),
    );
    if (found) {
      matched.push(found);
      used.add(found);
    }
  }

  for (const d of sortedApi) {
    if (!used.has(d)) matched.push(d);
  }
  return matched;
}
