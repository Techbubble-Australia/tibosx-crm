/** Strip trailing " (12)" count suffix from legacy tab labels. */
export function stripWorkforceTabLabelSuffix(label: string): string {
  return label.replace(/\s*\(\d+\)\s*$/, "").trim();
}

export type WorkforceTabCms = {
  /** Visitor-facing pill title on the About page. Falls back to {@link department} or the API department name. */
  label?: string;
  /** Exact Team member `Department` string (case-insensitive match on site). */
  department?: string;
  /** @deprecated Legacy layout field — ignored on save. */
  widthPx?: number;
  active: boolean;
};

/** After `normalizeWorkforceCmsTabs`, always `department`, `label`, and `active`. */
export type AboutWorkforceTabResolved = { department: string; label: string; active: boolean };

/** Pill label (often from CMS) + canonical Team `department` for member lookup. */
export type WorkforceDeptPill = {
  pillLabel: string;
  memberDeptKey: string;
};

/** Shown under Meet the Leadership — never as a workforce team tab. */
const WORKFORCE_EXCLUDED_DEPARTMENTS_LC = new Set(["leadership"]);

export function isWorkforceExcludedDepartment(department: string): boolean {
  return WORKFORCE_EXCLUDED_DEPARTMENTS_LC.has(department.trim().toLowerCase());
}

export function filterWorkforceDepartments(departments: readonly string[]): string[] {
  return departments.filter((d) => !isWorkforceExcludedDepartment(d));
}

function tabMatchKey(tab: WorkforceTabCms | AboutWorkforceTabResolved): string {
  const d = typeof tab.department === "string" ? tab.department.trim() : "";
  if (d) return d.toLowerCase();
  /** Legacy rows stored only `label` before `department` existed. */
  const legacy =
    "label" in tab && typeof (tab as WorkforceTabCms).label === "string" ? String((tab as WorkforceTabCms).label) : "";
  return stripWorkforceTabLabelSuffix(legacy).toLowerCase();
}

function tabDisplayLabel(tab: WorkforceTabCms | AboutWorkforceTabResolved): string {
  const label = "label" in tab && typeof tab.label === "string" ? tab.label.trim() : "";
  if (label) return label;
  const department = typeof tab.department === "string" ? tab.department.trim() : "";
  return department;
}

function tabUsesExplicitDepartment(tab: WorkforceTabCms | AboutWorkforceTabResolved): boolean {
  return Boolean(typeof tab.department === "string" && tab.department.trim());
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1]! === b[j - 1]! ? 0 : 1;
      dp[i]![j] = Math.min(
        (dp[i - 1]![j] as number) + 1,
        (dp[i]![j - 1] as number) + 1,
        (dp[i - 1]![j - 1] as number) + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/** Legacy / non-explicit tab: substring-style match only. */
function deptMatchesLegacyLabel(baseLc: string, apiLc: string): boolean {
  return apiLc === baseLc || apiLc.includes(baseLc) || baseLc.includes(apiLc);
}

/** Explicit CMS `department` row: exact, substring, or small edit distance vs API department. */
function deptMatchesExplicitInput(baseLc: string, apiLc: string): boolean {
  if (apiLc === baseLc) return true;
  if (apiLc.includes(baseLc) || baseLc.includes(apiLc)) return true;
  const n = Math.max(baseLc.length, apiLc.length);
  if (n === 0) return true;
  const limit = Math.max(2, Math.min(5, Math.floor(n * 0.15)));
  return levenshtein(baseLc, apiLc) <= limit;
}

/** Normalize JSON from CMS/API (legacy single-field rows → `department` + optional `label`). */
export function normalizeWorkforceCmsTabs(tabs: unknown): AboutWorkforceTabResolved[] {
  if (!Array.isArray(tabs)) return [];
  return tabs.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { department: "", label: "", active: false };
    }
    const t = raw as Record<string, unknown>;
    const rawLabel = typeof t.label === "string" ? t.label.trim() : "";
    const rawDepartment = typeof t.department === "string" ? t.department.trim() : "";
    const department = rawDepartment || stripWorkforceTabLabelSuffix(rawLabel);
    const label = rawDepartment ? rawLabel : "";
    return {
      department,
      label,
      active: Boolean(t.active),
    };
  });
}

/**
 * Workforce pills: **only** published API departments (`memberDeptKey` ∈ apiDepartments).
 * `pillLabel` is the CMS department text when the row matches that API bucket (so casing/typos can display as authored).
 */
export function orderedWorkforceDeptPills(
  cmsTabs: readonly (WorkforceTabCms | AboutWorkforceTabResolved)[] | undefined,
  apiDepartments: string[],
): WorkforceDeptPill[] {
  const sortedApi = filterWorkforceDepartments(apiDepartments).sort((a, b) => a.localeCompare(b));
  if (!cmsTabs?.length) {
    return sortedApi.map((d) => ({ pillLabel: d, memberDeptKey: d }));
  }

  const hasAnyActiveTab = cmsTabs.some((t) => t.active);
  if (!hasAnyActiveTab) {
    return sortedApi.map((d) => ({ pillLabel: d, memberDeptKey: d }));
  }

  const apiLcToCanonical = new Map<string, string>();
  for (const d of sortedApi) {
    apiLcToCanonical.set(d.trim().toLowerCase(), d);
  }

  const matched: WorkforceDeptPill[] = [];
  const usedMemberLc = new Set<string>();

  const findApiDeptForTab = (baseLc: string, explicit: boolean): string | undefined =>
    sortedApi.find((d) => {
      const dl = d.trim().toLowerCase();
      if (usedMemberLc.has(dl)) return false;
      return explicit ? deptMatchesExplicitInput(baseLc, dl) : deptMatchesLegacyLabel(baseLc, dl);
    });

  for (const tab of cmsTabs) {
    if (!tab.active) continue;
    const baseLc = tabMatchKey(tab);
    if (!baseLc) continue;
    const explicit = tabUsesExplicitDepartment(tab);
    const cmsDisplay = tabDisplayLabel(tab);

    const exact = explicit ? apiLcToCanonical.get(baseLc) : undefined;
    const found = exact ?? findApiDeptForTab(baseLc, explicit);
    if (!found) continue;

    const memLc = found.trim().toLowerCase();
    usedMemberLc.add(memLc);

    const pillLabel = cmsDisplay || found;
    matched.push({ pillLabel, memberDeptKey: found });
  }

  for (const d of sortedApi) {
    const lc = d.trim().toLowerCase();
    if (!usedMemberLc.has(lc)) {
      usedMemberLc.add(lc);
      matched.push({ pillLabel: d, memberDeptKey: d });
    }
  }
  return matched;
}

/** @deprecated Prefer {@link orderedWorkforceDeptPills} when you need CMS pill labels. */
export function orderedDepartmentsForAboutWorkforce(
  cmsTabs: readonly (WorkforceTabCms | AboutWorkforceTabResolved)[] | undefined,
  apiDepartments: string[],
): string[] {
  return orderedWorkforceDeptPills(cmsTabs, apiDepartments).map((p) => p.memberDeptKey);
}
