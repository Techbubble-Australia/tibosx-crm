export type OpportunityListTab = "active" | "inactive";

export function opportunitiesNavTabFromPath(pathname: string): OpportunityListTab {
  if (pathname.includes("/inactive")) return "inactive";
  return "active";
}
