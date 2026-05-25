/** Strip trailing " (12)" count suffix from legacy tab labels. */
export function stripWorkforceTabLabelSuffix(label: string): string {
  return label.replace(/\s*\(\d+\)\s*$/, "").trim();
}

export type WorkforceTabCms = {
  /** Exact Team member `Department` string (case-insensitive match on site). */
  department?: string;
  /** @deprecated Legacy CMS label; use {@link department}. */
  label?: string;
  widthPx?: number;
  active: boolean;
};

function tabMatchKey(tab: WorkforceTabCms): string {
  const d = typeof tab.department === "string" ? tab.department.trim() : "";
  if (d) return d.toLowerCase();
  return stripWorkforceTabLabelSuffix(typeof tab.label === "string" ? tab.label : "").toLowerCase();
}

function tabUsesExplicitDepartment(tab: WorkforceTabCms): boolean {
  return Boolean(typeof tab.department === "string" && tab.department.trim());
}

/**
 * Order department pills using Site content → Workforce → Department tabs.
 * Tabs with `active: true` match API `department` (exact, case-insensitive) when `department` is set;
 * otherwise legacy `label` uses fuzzy match after stripping a trailing " (n)" count.
 */
export function orderedDepartmentsForAboutWorkforce(
  cmsTabs: WorkforceTabCms[] | undefined,
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
    const baseLc = tabMatchKey(tab);
    if (!baseLc) continue;
    const explicit = tabUsesExplicitDepartment(tab);
    const found = sortedApi.find(
      (d) =>
        !used.has(d) &&
        (() => {
          const dl = d.trim().toLowerCase();
          if (explicit) return dl === baseLc;
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
