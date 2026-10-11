import { redirect } from "next/navigation";

/** Legacy URL — always land on dashboard. */
export default function ConsultantLegacyPage() {
  redirect("/dashboard");
}
