"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/contract-status";
import { CONTRACT_ACTIVE_STATUSES, CONTRACT_INACTIVE_STATUSES } from "@/lib/contract-groups";
import { CONTRACT_TYPES, CONTRACT_TYPE_LABELS, type ContractType } from "@/lib/contract-types";

const filterInputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

interface ContractRow {
  id: string;
  contractNumber: string;
  title: string;
  isIncomplete?: boolean;
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
  ownerId: string | null;
  ownerName: string;
  latestVariationStartDate?: string | null;
  latestVariationEndDate?: string | null;
}

type SortKey = "contractNumber" | "title" | "clientName" | "type" | "status" | "contractValue" | "ownerName";
type SortDir = "asc" | "desc";

type Props = {
  activeFilter: boolean;
};

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
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ContractsListPage({ activeFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId")?.trim() ?? "";
  const typeFilter = searchParams.get("type")?.trim() ?? "";
  const statusFilter = searchParams.get("status")?.trim() ?? "";
  const expiringFilter = searchParams.get("expiring")?.trim() ?? "";
  const listTab = activeFilter ? "active" : "inactive";
  const statusOptions = activeFilter ? CONTRACT_ACTIVE_STATUSES : CONTRACT_INACTIVE_STATUSES;
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("contractNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Effects first so a throw in a later memo can't change the hook count (React #310).
  useEffect(() => {
    void adminFetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => setClients((data.data ?? []) as Array<{ id: string; name: string }>))
      .catch(console.error);
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [activeFilter, clientIdFilter, typeFilter, statusFilter, expiringFilter]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "contractNumber":
          cmp = (a.contractNumber ?? "").localeCompare(b.contractNumber ?? "");
          break;
        case "title":
          cmp = (a.title ?? "").localeCompare(b.title ?? "");
          break;
        case "clientName":
          cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
          break;
        case "type":
          cmp = (a.typeLabel ?? "").localeCompare(b.typeLabel ?? "");
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
        case "contractValue":
          cmp = (a.contractValue ?? 0) - (b.contractValue ?? 0);
          break;
        case "ownerName":
          cmp = (a.ownerName ?? "").localeCompare(b.ownerName ?? "");
          break;
      }
      if (cmp === 0) cmp = (a.contractNumber ?? "").localeCompare(b.contractNumber ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const cardScopeRows = useMemo(() => {
    if (!selectedClient) return sortedRows;
    return sortedRows.filter((row) => (row.clientName ?? "") === selectedClient);
  }, [sortedRows, selectedClient]);

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
    viewMode === "card" && selectedClient ? cardScopeRows : sortedRows,
    (row) =>
      buildSearchHaystack([
        row.contractNumber,
        row.title,
        row.clientName,
        row.typeLabel,
        row.status,
        row.ownerName,
        row.currency,
        row.contractValue,
        row.consumed,
      ]),
    { initialPageSize: 100, pageSizeOptions: [25, 50, 100, 200] },
  );

  useEffect(() => {
    setSelectedClient(null);
  }, [search, viewMode, activeFilter]);

  const groupedByClient = useMemo(() => {
    const map = new Map<string, ContractRow[]>();
    for (const row of sortedRows) {
      const key = row.clientName?.trim() || "Unknown client";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sortedRows]);

  function updateFilters(next: { clientId?: string; type?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    if (next.clientId !== undefined) setOrDelete("clientId", next.clientId);
    if (next.type !== undefined) setOrDelete("type", next.type);
    if (next.status !== undefined) setOrDelete("status", next.status);
    // Drop legacy date filters if still present in the URL.
    ["startDateFrom", "startDateTo", "endDateFrom", "endDateTo"].forEach((key) => params.delete(key));
    router.push(`?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ["clientId", "type", "status", "startDateFrom", "startDateTo", "endDateFrom", "endDateTo"].forEach((key) =>
      params.delete(key),
    );
    router.push(`?${params.toString()}`);
  }

  async function fetchRows() {
    setIsLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      params.set("tab", listTab);
      if (clientIdFilter) params.set("clientId", clientIdFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (expiringFilter) params.set("expiring", expiringFilter);
      const res = await adminFetch(`/api/admin/contracts?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as { data?: ContractRow[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to load contracts");
      }
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load contracts");
      setRows([]);
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
    if (!(await appConfirm("Delete this contract?"))) return;
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Error deleting contract:", error);
    }
  }

  function renderTableRow(row: ContractRow) {
    const colors = CONTRACT_STATUS_COLORS[row.status] ?? CONTRACT_STATUS_COLORS.DRAFT;
    return (
      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center gap-2">
            {row.isIncomplete ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title="Incomplete contract data" />
            ) : null}
            {row.contractNumber}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
          <Link href={`/contracts/${row.id}`} className="hover:text-blue-600 hover:underline dark:hover:text-blue-400">
            {row.title}
          </Link>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.clientName}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.typeLabel}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
            {CONTRACT_STATUS_LABELS[row.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.ownerName || "—"}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.startDate)}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.endDate)}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          {formatDate(row.latestVariationStartDate ?? null)}
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          {formatDate(row.latestVariationEndDate ?? null)}
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.contractValue)}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.totalVariation)}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.consumed)}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.remaining)}</td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <button type="button" onClick={() => void deleteRow(row.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (isLoading && rows.length === 0 && !loadError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      {loadError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void fetchRows()}
            disabled={isLoading}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/40"
          >
            {isLoading ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : null}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeFilter ? "Active contracts" : "Inactive contracts"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeFilter
              ? "Draft and active client contracts."
              : "Expired and terminated contracts."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Add Contract
          </Link>
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Client</label>
            <select
              value={clientIdFilter}
              onChange={(e) => updateFilters({ clientId: e.target.value })}
              className={filterInputClass}
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => updateFilters({ type: e.target.value })}
              className={filterInputClass}
            >
              <option value="">All types</option>
              {CONTRACT_TYPES.map((type) => (
                <option key={type} value={type}>{CONTRACT_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className={filterInputClass}
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {CONTRACT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <AdminSearchField
        id="contract-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by number, title, client, owner, status…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[1200px] text-sm">
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
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Owner" sortKey="ownerName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Start</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">End</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Variation start
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Variation end
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Contract value" sortKey="contractValue" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Total variation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Consumed</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Remaining</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-400">
                    No {activeFilter ? "active" : "inactive"} contracts yet.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-400">No contracts match your search.</td>
                </tr>
              ) : (
                paginated.map((row) => renderTableRow(row))
              )}
            </tbody>
          </table>
          {rows.length > 0 ? (
            <TablePagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
          ) : null}
        </div>
      ) : selectedClient ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedClient(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← All clients
          </button>
          <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedClient}</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {cardScopeRows.length} contract{cardScopeRows.length !== 1 ? "s" : ""}
              </span>
            </div>
            {cardScopeRows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No contracts for this client.</p>
            ) : (
              <table className="w-full min-w-[1200px] text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cardScopeRows.map((row) => renderTableRow(row))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No {activeFilter ? "active" : "inactive"} contracts.
            </div>
          ) : totalItems === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No contracts match your search.
            </div>
          ) : groupedByClient.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No clients with contracts on this tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupedByClient.map(([client, items]) => (
                <button
                  key={client}
                  type="button"
                  onClick={() => setSelectedClient(client)}
                  className="rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{client}</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {items.length} contract{items.length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
