export type UsersListTab = "active" | "inactive";

export function usersListTabFromPath(pathname: string): UsersListTab {
  if (pathname.includes("/inactive")) return "inactive";
  return "active";
}

export function usersListHref(tab: UsersListTab): string {
  return tab === "inactive" ? "/users/inactive" : "/users/active";
}
