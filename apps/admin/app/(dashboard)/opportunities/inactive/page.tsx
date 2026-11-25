import { redirect } from "next/navigation";

/** Legacy Inactive tab → wireframe List view. */
export default function InactiveOpportunitiesRedirect() {
  redirect("/opportunities/list");
}
