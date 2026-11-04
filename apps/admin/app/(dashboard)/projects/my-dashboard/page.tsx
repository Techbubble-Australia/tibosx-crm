import { redirect } from "next/navigation";

export default function LegacyMemberDashboardRedirect() {
  redirect("/my-workspace");
}
