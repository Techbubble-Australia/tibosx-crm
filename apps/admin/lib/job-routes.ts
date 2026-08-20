/** True for any TBOS job listings route (/jobs, /jobs/active, /jobs/[id], etc.). */
export function isJobListingsPath(pathname: string): boolean {
  return pathname === "/jobs" || pathname.startsWith("/jobs/");
}

export function isCareerApplicationsPath(pathname: string): boolean {
  return pathname === "/career-applications" || pathname.startsWith("/career-applications/");
}

export type JobsNavTab = "active" | "inactive";

export function jobsNavTabFromPath(pathname: string, tabParam: string | null): JobsNavTab {
  if (pathname === "/jobs/inactive" || tabParam === "inactive") {
    return "inactive";
  }
  return "active";
}

/** @deprecated Use jobsNavTabFromPath for full tab set. */
export function jobListingsTabFromPath(pathname: string, tabParam: string | null): "active" | "inactive" {
  const tab = jobsNavTabFromPath(pathname, tabParam);
  return tab === "inactive" ? "inactive" : "active";
}

export function jobListHref(tab: "active" | "inactive"): string {
  return tab === "inactive" ? "/jobs/inactive" : "/jobs/active";
}

export function jobEditHref(jobId: string, tab: "active" | "inactive"): string {
  return tab === "inactive" ? `/jobs/${jobId}?tab=inactive` : `/jobs/${jobId}?tab=active`;
}
