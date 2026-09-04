"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityStatus,
} from "@/lib/opportunity-status";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABELS,
  type OpportunityType,
} from "@/lib/opportunity-types";

interface OpportunityRow {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  location: string;
  type: OpportunityType;
  typeLabel: string;
  currency: string;
  amount: number;
  status: OpportunityStatus;
  comments: string;
  order: number;
}

function formatValue(row: OpportunityRow): string {
  return `${row.currency} ${new Intl.NumberFormat("en-US").format(row.amount)}`;
}

type OpportunitySortKey = "name" | "clientName" | "location" | "type" | "amount" | "status" | "order";
type SortDir = "asc" | "desc";

const inlineInputClass =
  "w-full min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
const inlineSelectClass =
  "w-full min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: OpportunitySortKey;
  activeKey: OpportunitySortKey;
  dir: SortDir;
  onSort: (key: OpportunitySortKey) => void;
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

export function OpportunitiesListPage() {
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId")?.trim() ?? "";
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<OpportunitySortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [typeDrafts, setTypeDrafts] = useState<Record<string, string>>({});
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});

  const filteredByClient = useMemo(() => {
    const list = clientIdFilter ? rows.filter((row) => row.clientId === clientIdFilter) : rows;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "order":
          cmp = (a.order ?? 0) - (b.order ?? 0);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "clientName":
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case "location":
          cmp = a.location.localeCompare(b.location);
          break;
        case "type":
          cmp = a.typeLabel.localeCompare(b.typeLabel);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, clientIdFilter, sortKey, sortDir]);

  function handleSort(key: OpportunitySortKey) {
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
    filteredByClient,
    (row) =>
      buildSearchHaystack([
        row.name,
        row.clientName,
        row.location,
        row.typeLabel,
        row.currency,
        row.amount,
        row.status,
        row.comments,
      ]),
    { initialPageSize: 100, pageSizeOptions: [25, 50, 100, 200] },
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

  async function patchListField(
    row: OpportunityRow,
    patch: Partial<{ name: string; type: OpportunityType; amount: number; status: OpportunityStatus }>,
  ) {
    try {
      const res = await adminFetch(`/api/admin/opportunities/${row.id}/list-fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data.data } : r)));
      return true;
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return false;
    }
  }

  function startEditName(row: OpportunityRow) {
    setEditingNameId(row.id);
    setNameDrafts((prev) => ({ ...prev, [row.id]: row.name }));
  }

  function cancelEditName(id: string) {
    setEditingNameId((current) => (current === id ? null : current));
    setNameDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveName(row: OpportunityRow) {
    const value = (nameDrafts[row.id] ?? "").trim();
    if (!value || value === row.name) {
      cancelEditName(row.id);
      return;
    }
    const ok = await patchListField(row, { name: value });
    if (ok) cancelEditName(row.id);
  }

  function startEditType(row: OpportunityRow) {
    setEditingTypeId(row.id);
    setTypeDrafts((prev) => ({ ...prev, [row.id]: row.type }));
  }

  function cancelEditType(id: string) {
    setEditingTypeId((current) => (current === id ? null : current));
    setTypeDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveType(row: OpportunityRow) {
    const value = typeDrafts[row.id] as OpportunityType;
    if (!value || value === row.type) {
      cancelEditType(row.id);
      return;
    }
    const ok = await patchListField(row, { type: value });
    if (ok) cancelEditType(row.id);
  }

  function startEditAmount(row: OpportunityRow) {
    setEditingAmountId(row.id);
    setAmountDrafts((prev) => ({ ...prev, [row.id]: String(row.amount) }));
  }

  function cancelEditAmount(id: string) {
    setEditingAmountId((current) => (current === id ? null : current));
    setAmountDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveAmount(row: OpportunityRow) {
    const raw = amountDrafts[row.id] ?? "";
    const amount = Number.parseFloat(raw);
    if (Number.isNaN(amount) || amount <= 0 || amount === row.amount) {
      cancelEditAmount(row.id);
      return;
    }
    const ok = await patchListField(row, { amount });
    if (ok) cancelEditAmount(row.id);
  }

  function startEditStatus(row: OpportunityRow) {
    setEditingStatusId(row.id);
    setStatusDrafts((prev) => ({ ...prev, [row.id]: row.status }));
  }

  function cancelEditStatus(id: string) {
    setEditingStatusId((current) => (current === id ? null : current));
    setStatusDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveStatus(row: OpportunityRow) {
    const value = statusDrafts[row.id] as OpportunityStatus;
    if (!value || value === row.status) {
      cancelEditStatus(row.id);
      return;
    }
    const ok = await patchListField(row, { status: value });
    if (ok) cancelEditStatus(row.id);
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
          href="/opportunities/new"
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
        placeholder="Search by name, client, type, location, status…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Location" sortKey="location" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Estimated Value" sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Comments</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredByClient.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No opportunities yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No opportunities match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => {
                const colors = OPPORTUNITY_STATUS_COLORS[row.status] ?? OPPORTUNITY_STATUS_COLORS.DRAFT;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-1">
                        {editingNameId === row.id ? (
                          <input
                            value={nameDrafts[row.id] ?? ""}
                            onChange={(e) => setNameDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            onBlur={() => void saveName(row)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") cancelEditName(row.id);
                            }}
                            autoFocus
                            className={inlineInputClass}
                            aria-label={`Edit name for ${row.name}`}
                          />
                        ) : (
                          <>
                            <span>{row.name}</span>
                            <button
                              type="button"
                              onClick={() => startEditName(row)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              aria-label={`Edit name for ${row.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <Link href={`/opportunities?clientId=${encodeURIComponent(row.clientId)}`} className="hover:underline">
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {editingTypeId === row.id ? (
                          <select
                            value={typeDrafts[row.id] ?? row.type}
                            onChange={(e) => setTypeDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            onBlur={() => void saveType(row)}
                            autoFocus
                            className={inlineSelectClass}
                            aria-label={`Edit type for ${row.name}`}
                          >
                            {OPPORTUNITY_TYPES.map((type) => (
                              <option key={type} value={type}>{OPPORTUNITY_TYPE_LABELS[type]}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <span>{row.typeLabel}</span>
                            <button
                              type="button"
                              onClick={() => startEditType(row)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              aria-label={`Edit type for ${row.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {editingAmountId === row.id ? (
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amountDrafts[row.id] ?? ""}
                            onChange={(e) => setAmountDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            onBlur={() => void saveAmount(row)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") cancelEditAmount(row.id);
                            }}
                            autoFocus
                            className={`${inlineInputClass} w-28`}
                            aria-label={`Edit estimated value for ${row.name}`}
                          />
                        ) : (
                          <>
                            <span>{formatValue(row)}</span>
                            <button
                              type="button"
                              onClick={() => startEditAmount(row)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              aria-label={`Edit estimated value for ${row.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {editingStatusId === row.id ? (
                          <select
                            value={statusDrafts[row.id] ?? row.status}
                            onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            onBlur={() => void saveStatus(row)}
                            autoFocus
                            className={inlineSelectClass}
                            aria-label={`Edit status for ${row.name}`}
                          >
                            {OPPORTUNITY_STATUSES.map((status) => (
                              <option key={status} value={status}>{OPPORTUNITY_STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                              {OPPORTUNITY_STATUS_LABELS[row.status]}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditStatus(row)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              aria-label={`Edit status for ${row.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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
