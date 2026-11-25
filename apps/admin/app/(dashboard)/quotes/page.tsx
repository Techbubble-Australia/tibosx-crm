"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  currency: string;
  totalAmount: number;
  client: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
  createdAt: string;
};

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export default function QuotesPage() {
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/crm/quotes")
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as Quote[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClientsOnlyGuard>
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quotes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Proposals and commercial quotes.</p>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            New quote
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Opportunity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No quotes yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/quotes/${row.id}`}
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {row.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        <Link href={`/quotes/${row.id}`} className="hover:underline">
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.client?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-400">
                        {formatMoney(row.currency, row.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.opportunity ? (
                          <Link
                            href={`/opportunities/${row.opportunity.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {row.opportunity.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
