"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { OpportunitiesListPage } from "@/components/opportunities/OpportunitiesListPage";
import { OpportunitiesShell } from "@/components/opportunities/OpportunitiesShell";
import { adminFetch } from "@/lib/admin-api";
import { formatCrmMoney } from "@/lib/crm-format";

type Opp = { amount: number; currency: string; probability: number | null; active: boolean; stageType: string | null };

export default function OpportunitiesListRoutePage() {
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
    return `${open.length} open · ${formatCrmMoney(pipeline, currency)} · weighted ${formatCrmMoney(weighted, currency)}`;
  }, [rows]);

  return (
    <OpportunitiesShell summary={summary}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        }
      >
        <OpportunitiesListPage embedded />
      </Suspense>
    </OpportunitiesShell>
  );
}
