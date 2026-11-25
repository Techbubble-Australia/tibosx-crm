"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type SavedReport = {
  id: string;
  name: string;
  kind?: string;
  owner?: string;
  schedule?: string;
};

type ReportsData = {
  tiles: {
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    winRate: number;
    pipelineValue: number;
    wonValue: number;
    newLeads: number;
  };
  winRateBySource: Array<{ source: string; total: number; converted: number; rate: number }>;
  lostReasons: Array<{ reason: string; count: number }>;
  stageConversion: Array<{ stageId: string; name: string; stageType: string; count: number }>;
  savedReports?: SavedReport[];
};

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function ReportCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {hasRows ? <ul className="space-y-2 text-sm">{children}</ul> : <p className="text-sm text-gray-400">{empty}</p>}
    </section>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className="tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
    </li>
  );
}

export default function SalesReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    void adminFetch("/api/admin/crm/reports")
      .then((res) => res.json())
      .then((body) => setData((body.data ?? null) as ReportsData | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stageRows = useMemo(() => {
    const stages = data?.stageConversion ?? [];
    return stages.map((row, index) => {
      const next = stages[index + 1];
      let conversionLabel = "—";
      if (next && row.count > 0) {
        conversionLabel = `${Math.min(100, Math.round((next.count / row.count) * 100))}%`;
      } else if (next && row.count === 0) {
        conversionLabel = "—";
      }
      return {
        ...row,
        toLabel: next ? `${row.name} to ${next.name}` : row.name,
        conversionLabel: next ? conversionLabel : null,
      };
    });
  }, [data]);

  const savedReports = data?.savedReports ?? [];

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reports</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built-in reports plus saved custom reports
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Report
          </button>
        </div>

        {loading || !data ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              <ReportCard title="Win rate by source" empty="No lead source data.">
                {data.winRateBySource.map((row) => (
                  <ReportRow key={row.source} label={row.source} value={pct(row.rate)} />
                ))}
              </ReportCard>

              {/* API returns all-time lost reasons; wireframe title says 90 days. TODO: filter server-side. */}
              <ReportCard title="Lost reasons, 90 days" empty="No lost deals.">
                {data.lostReasons.map((row) => (
                  <ReportRow key={row.reason} label={row.reason} value={row.count} />
                ))}
              </ReportCard>

              <ReportCard title="Stage conversion" empty="No stages configured.">
                {stageRows
                  .filter((row) => row.conversionLabel != null)
                  .map((row) => (
                    <ReportRow
                      key={`${row.stageId}-conv`}
                      label={row.toLabel}
                      value={row.conversionLabel}
                    />
                  ))}
              </ReportCard>
            </div>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Saved report</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {savedReports.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                          No saved reports yet.
                        </td>
                      </tr>
                    ) : (
                      savedReports.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.name}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.owner ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {row.schedule ?? (row.kind === "built_in" ? "Built-in" : "None")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {showReportModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Custom report</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Custom report builder is coming soon. You can still use the built-in reports above.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    appAlert("Custom reports are coming soon.");
                  }}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ClientsOnlyGuard>
  );
}
