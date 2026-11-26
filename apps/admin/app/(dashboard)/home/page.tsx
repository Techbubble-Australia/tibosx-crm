"use client";

import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { HomeWidgets } from "@/components/home/HomeWidgets";

/** TIBOSX CRM Screens – 1 Home (widgets). */
export default function HomePage() {
  return (
    <ClientsOnlyGuard>
      <HomeWidgets />
    </ClientsOnlyGuard>
  );
}
