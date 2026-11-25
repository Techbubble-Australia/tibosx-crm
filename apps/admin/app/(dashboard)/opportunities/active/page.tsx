import { redirect } from "next/navigation";

/** Legacy Active tab → wireframe List view. */
export default function ActiveOpportunitiesRedirect() {
  redirect("/opportunities/list");
}
