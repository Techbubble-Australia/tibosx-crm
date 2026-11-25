"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

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
};

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function SalesReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/crm/reports")
      .then((res) => res.json())
      .then((body) => setData((body.data ?? null) as ReportsData | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Win rate, lost reasons, and stage conversion.
          </p>
        </div>

        {loading || !data ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <Tile label="Open deals" value={data.tiles.openDeals} />
              <Tile label="Won deals" value={data.tiles.wonDeals} />
              <Tile label="Lost deals" value={data.tiles.lostDeals} />
              <Tile label="Win rate" value={pct(data.tiles.winRate)} />
              <Tile label="Pipeline value" value={money(data.tiles.pipelineValue)} />
              <Tile label="Won value" value={money(data.tiles.wonValue)} />
              <Tile label="New leads" value={data.tiles.newLeads} />
            </div>

            <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Win rate by source</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Source</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Converted</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.winRateBySource.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                          No lead source data.
                        </td>
                      </tr>
                    ) : (
                      data.winRateBySource.map((row) => (
                        <tr key={row.source}>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.source}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-gray-600">{row.total}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-gray-600">{row.converted}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-gray-600">{pct(row.rate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lost reasons</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Reason</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.lostReasons.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                            No lost deals.
                          </td>
                        </tr>
                      ) : (
                        data.lostReasons.map((row) => (
                          <tr key={row.reason}>
                            <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.reason}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-gray-600">{row.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Stage conversion</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Stage</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Deals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.stageConversion.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                            No stages configured.
                          </td>
                        </tr>
                      ) : (
                        data.stageConversion.map((row) => (
                          <tr key={row.stageId}>
                            <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.name}</td>
                            <td className="px-4 py-2 text-gray-600">{row.stageType}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-gray-600">{row.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
