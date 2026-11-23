"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { formatClientPhone } from "@/lib/phone-country-codes";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  type ClientStatus,
} from "@/lib/client-status";

export interface ClientRow {
  id: string;
  name: string;
  website: string;
  country: string;
  order: number;
  status: ClientStatus;
  opportunityCount?: number;
  contacts?: { name: string; email: string; phoneCountryCode: string; phoneNumber: string }[];
}

type Props = {
  statusFilter: ClientStatus;
  heading: string;
  description: string;
};

type ClientSortKey = "name" | "country" | "opportunityCount" | "status";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: ClientSortKey;
  activeKey: ClientSortKey;
  dir: SortDir;
  onSort: (key: ClientSortKey) => void;
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

export function ClientsListPage({ statusFilter, heading, description }: Props) {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<ClientSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Fetch before sort memos so a throw mid-sort can't skip later hooks (React #310).
  useEffect(() => {
    void fetchRows();
  }, [statusFilter]);

  const statusFiltered = useMemo(() => {
    const list = rows.filter((row) => row.status === statusFilter);
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name ?? "").localeCompare(b.name ?? "");
          break;
        case "country":
          cmp = (a.country ?? "").localeCompare(b.country ?? "");
          break;
        case "opportunityCount":
          cmp = (a.opportunityCount ?? 0) - (b.opportunityCount ?? 0);
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
      }
      if (cmp === 0) cmp = (a.name ?? "").localeCompare(b.name ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, statusFilter, sortKey, sortDir]);

  function handleSort(key: ClientSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

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
    statusFiltered,
    (row) =>
      buildSearchHaystack([
        row.name,
        row.website,
        row.country,
        row.status,
        row.opportunityCount,
        ...(row.contacts ?? []).flatMap((c) => [
          c.name,
          c.email,
          formatClientPhone(c.phoneCountryCode, c.phoneNumber),
        ]),
      ]),
    { initialPageSize: 100, pageSizeOptions: [25, 50, 100, 200] },
  );

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/clients");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(id: string) {
    if (!(await appConfirm("Delete this client?"))) return;
    try {
      const res = await adminFetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        appAlert((err as { error?: string }).error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <Link
          href={statusFilter === "PROSPECT" ? "/clients/new?prospect=1" : "/clients/new"}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          {statusFilter === "PROSPECT" ? "Add Prospect" : "Add Client"}
        </Link>
      </div>

      <AdminSearchField
        id="client-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by client name…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Country" sortKey="country" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Contacts</th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Opportunities" sortKey="opportunityCount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {statusFiltered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No clients in this tab yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No clients match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => {
                const colors = CLIENT_STATUS_COLORS[row.status] ?? CLIENT_STATUS_COLORS.ACTIVE;
                const oppCount = row.opportunityCount ?? 0;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/clients/${row.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.country}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.contacts?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      {oppCount > 0 ? (
                        <Link
                          href={`/opportunities/active?clientId=${encodeURIComponent(row.id)}`}
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {oppCount}
                        </Link>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
                      >
                        {CLIENT_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void deleteRow(row.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
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
        {statusFiltered.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>
    </div>
  );
}
