"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import {
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityStatus,
} from "@/lib/opportunity-status";

interface OpportunityRow {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  currency: string;
  amount: number;
  status: OpportunityStatus;
  comments: string;
  order: number;
}

function formatValue(row: OpportunityRow): string {
  return `${row.currency} ${new Intl.NumberFormat("en-US").format(row.amount)}`;
}

export function OpportunitiesListPage() {
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId")?.trim() ?? "";
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredByClient = useMemo(() => {
    if (!clientIdFilter) return rows;
    return rows.filter((row) => row.clientId === clientIdFilter);
  }, [rows, clientIdFilter]);

  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalItems,
    totalSourceItems,
  } = useListView(filteredByClient, (row) =>
    buildSearchHaystack([row.name, row.clientName, row.currency, row.amount, row.status, row.comments]),
  );

  useEffect(() => {
    void fetchRows();
  }, [clientIdFilter]);

  async function fetchRows() {
    setIsLoading(true);
    try {
      const query = clientIdFilter ? `?clientId=${encodeURIComponent(clientIdFilter)}` : "";
      const res = await adminFetch(`/api/admin/opportunities${query}`);
      const data = await res.json();
      const list = (data.data ?? []) as OpportunityRow[];
      setRows(list);
      if (clientIdFilter && list[0]?.clientName) {
        setClientName(list[0].clientName);
      } else if (clientIdFilter) {
        const clientRes = await adminFetch(`/api/admin/clients/${clientIdFilter}`);
        const clientData = await clientRes.json();
        setClientName(clientData.data?.name ?? "");
      } else {
        setClientName("");
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this opportunity?")) return;
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunities</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clientIdFilter && clientName
              ? `Showing opportunities for ${clientName}.`
              : "Track sales opportunities linked to clients."}
          </p>
          {clientIdFilter ? (
            <Link href="/opportunities" className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Show all opportunities
            </Link>
          ) : null}
        </div>
        <Link
          href={clientIdFilter ? `/opportunities/new?clientId=${encodeURIComponent(clientIdFilter)}` : "/opportunities/new"}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add Opportunity
        </Link>
      </div>

      <AdminSearchField
        id="opportunity-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, client, status…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Client</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Total Value</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Comments</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredByClient.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No opportunities yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No opportunities match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => {
                const colors = OPPORTUNITY_STATUS_COLORS[row.status] ?? OPPORTUNITY_STATUS_COLORS.DRAFT;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <Link href={`/opportunities?clientId=${encodeURIComponent(row.clientId)}`} className="hover:underline">
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatValue(row)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                        {OPPORTUNITY_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={row.comments || undefined}>
                      {row.comments || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/opportunities/${row.id}`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button type="button" onClick={() => void deleteRow(row.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filteredByClient.length > 0 ? (
          <TablePagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </div>
    </div>
  );
}
