import { redirect } from "next/navigation";

export default function LegacyJobSettingsPage() {
  redirect("/settings/categories");
}
