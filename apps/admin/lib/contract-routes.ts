export type ContractListTab = "active" | "inactive";

export function contractsNavTabFromPath(pathname: string): ContractListTab {
  if (pathname.includes("/inactive")) return "inactive";
  return "active";
}
