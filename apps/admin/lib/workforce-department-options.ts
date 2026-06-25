import { adminFetch } from "@/lib/admin-api";
import { normalizeSiteContentPayload } from "@/lib/site-content-normalize";
import type { AboutPagePayload } from "@/components/site-content/AboutPageForm";

/**
 * Departments for Team member forms:
 * 1) Site content → About page → Workforce → Team tabs (order preserved, de-duped case-insensitively)
 * 2) Any `department` already on a team member (so legacy values stay selectable)
 * 3) Optional `currentDepartment` if not already included (e.g. edge-case before team list reflects)
 */
export async function fetchWorkforceDepartmentOptions(currentDepartment?: string): Promise<string[]> {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  try {
    const res = await adminFetch("/api/admin/site-content/about_page");
    if (res.ok) {
      const data = (await res.json()) as { data?: { payload?: unknown } };
      const payload = normalizeSiteContentPayload("about_page", data.data?.payload ?? {}) as AboutPagePayload;
      for (const tab of payload.workforce.tabs) {
        add(tab.department);
      }
    }
  } catch {
    // non-fatal
  }

  try {
    const teamRes = await adminFetch("/api/admin/team/admin/all");
    if (teamRes.ok) {
      const data = (await teamRes.json()) as { data?: { department?: string }[] };
      for (const m of data.data ?? []) {
        add(String(m.department ?? ""));
      }
    }
  } catch {
    // non-fatal
  }

  if (currentDepartment) add(currentDepartment);

  return out;
}
