"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/contract-status";
import { CONTRACT_TYPE_LABELS, type ContractType } from "@/lib/contract-types";

interface ContractRow {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  type: ContractType;
  typeLabel: string;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  currency: string;
  contractValue: number;
  totalVariation: number;
  consumed: number;
  remaining: number;
}

type SortKey = "contractNumber" | "title" | "clientName" | "type" | "status" | "contractValue";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
    >
      {label}
      {active ? (dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null}
    </button>
  );
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ContractsListPage() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("contractNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "contractNumber":
          cmp = a.contractNumber.localeCompare(b.contractNumber);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "clientName":
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case "type":
          cmp = a.typeLabel.localeCompare(b.typeLabel);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "contractValue":
          cmp = a.contractValue - b.contractValue;
          break;
      }
      if (cmp === 0) cmp = a.contractNumber.localeCompare(b.contractNumber);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, sortKey, sortDir]);

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
  } = useListView(
    sortedRows,
    (row) =>
      buildSearchHaystack([
        row.contractNumber,
        row.title,
        row.clientName,
        row.typeLabel,
        row.status,
        row.currency,
        row.contractValue,
        row.remaining,
      ]),
    { initialPageSize: 100, pageSizeOptions: [25, 50, 100, 200] },
  );

  useEffect(() => {
    void fetchRows();
  }, []);

  async function fetchRows() {
    setIsLoading(true);
    try {
      const res = await adminFetch("/api/admin/contracts");
      const data = await res.json();
      setRows((data.data ?? []) as ContractRow[]);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this contract?")) return;
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting contract:", error);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contracts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage client contracts, variations, and financials.</p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add Contract
        </Link>
      </div>

      <AdminSearchField
        id="contract-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by number, title, client, status…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Number" sortKey="contractNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Start</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">End</th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Contract value" sortKey="contractValue" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Remaining</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No contracts yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No contracts match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => {
                const colors = CONTRACT_STATUS_COLORS[row.status] ?? CONTRACT_STATUS_COLORS.DRAFT;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.contractNumber}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.clientName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.typeLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                        {CONTRACT_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.endDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.contractValue)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.remaining)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/contracts/${row.id}`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white">
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
        {rows.length > 0 ? (
          <TablePagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </div>
    </div>
  );
}
