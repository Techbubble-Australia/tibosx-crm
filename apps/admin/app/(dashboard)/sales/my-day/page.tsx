"use client";

/**
 * My day — wireframe PDF page 2.
 * Sales Home for CRM users; not a Sales nav item (Dashboard stays pipeline KPIs).
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { MyDayPanel } from "@/components/sales/MyDayPanel";

function todayLabel() {
  return new Date().toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function MyDayPage() {
  const router = useRouter();
  const dateLabel = useMemo(() => todayLabel(), []);
  const [busy] = useState(false);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">My day</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => router.push("/opportunities")}
            className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Activity
          </button>
        </div>

        <MyDayPanel variant="full" />
      </div>
    </ClientsOnlyGuard>
  );
}
