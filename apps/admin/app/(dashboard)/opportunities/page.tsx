"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { OpportunitiesBoard } from "@/components/opportunities/OpportunitiesBoard";
import { adminFetch } from "@/lib/admin-api";
import { formatCrmMoney } from "@/lib/crm-format";

type Opp = { amount: number; currency: string; probability: number | null; active: boolean; stageType: string | null };

export default function OpportunitiesIndexPage() {
  const [rows, setRows] = useState<Opp[]>([]);

  useEffect(() => {
    void adminFetch("/api/admin/opportunities?active=true")
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as Opp[]))
      .catch(console.error);
  }, []);

  const summary = useMemo(() => {
    const open = rows.filter((r) => r.active && r.stageType !== "won" && r.stageType !== "lost");
    const pipeline = open.reduce((s, r) => s + r.amount, 0);
    const weighted = open.reduce((s, r) => s + r.amount * ((r.probability ?? 0) / 100), 0);
    const currency = open[0]?.currency || "AUD";
    return { count: open.length, pipeline, weighted, currency };
  }, [rows]);

  function money(n: number) {
    return formatCrmMoney(n, summary.currency);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunities</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {summary.count} open · {money(summary.pipeline)} · weighted {money(summary.weighted)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/crm/import-export?entity=opportunities"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-gray-600 dark:bg-gray-900"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href="/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Opportunity
          </Link>
        </div>
      </div>
      <OpportunitiesBoard />
    </div>
  );
}
