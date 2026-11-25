export type OpportunityNavTab = "board" | "list" | "forecast";

/** Wireframe tabs: Board | List | Forecast (replaces Active/Inactive). */
export function opportunitiesNavTabFromPath(pathname: string, search?: string): OpportunityNavTab {
  if (pathname.includes("/forecast")) return "forecast";
  if (pathname.includes("/list") || pathname.includes("/active") || pathname.includes("/inactive")) {
    return "list";
  }
  if (pathname === "/opportunities" || pathname === "/opportunities/") return "board";
  if (search?.includes("tab=list")) return "list";
  if (search?.includes("tab=forecast")) return "forecast";
  return "board";
}
