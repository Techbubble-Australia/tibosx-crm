export type OpportunityNavTab = "board" | "active" | "inactive";

export function opportunitiesNavTabFromPath(pathname: string, search?: string): OpportunityNavTab {
  if (pathname === "/opportunities" || pathname === "/opportunities/") return "board";
  if (pathname.includes("/inactive")) return "inactive";
  if (pathname.includes("/active")) return "active";
  if (search?.includes("tab=board")) return "board";
  return "active";
}
