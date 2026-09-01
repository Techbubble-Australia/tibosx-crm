"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Pencil, GripVertical } from "lucide-react";
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

export function ClientsListPage({ statusFilter, heading, description }: Props) {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
  const [dragOverClientId, setDragOverClientId] = useState<string | null>(null);

  const statusFiltered = useMemo(
    () =>
      rows
        .filter((row) => row.status === statusFilter)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [rows, statusFilter],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paginated,
    totalItems,
    totalSourceItems,
  } = useListView(statusFiltered, (row) =>
    buildSearchHaystack([
      row.name,
      row.website,
      row.country,
      row.order,
      row.status,
      row.opportunityCount,
      ...(row.contacts ?? []).flatMap((c) => [
        c.name,
        c.email,
        formatClientPhone(c.phoneCountryCode, c.phoneNumber),
      ]),
    ]),
  );

  const canDragReorder = !search.trim();

  useEffect(() => {
    void fetchRows();
  }, []);

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
    if (!confirm("Delete this client?")) return;
    try {
      const res = await adminFetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  }

  function startEditOrder(row: ClientRow) {
    setEditingOrderId(row.id);
    setOrderDrafts((prev) => ({ ...prev, [row.id]: String(row.order ?? 0) }));
  }

  function cancelEditOrder(clientId: string) {
    setEditingOrderId((current) => (current === clientId ? null : current));
    setOrderDrafts((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  }

  async function saveOrder(row: ClientRow) {
    const raw = orderDrafts[row.id] ?? String(row.order ?? 0);
    const order = Number.parseInt(raw, 10);
    if (Number.isNaN(order)) {
      cancelEditOrder(row.id);
      return;
    }
    if (order === row.order) {
      cancelEditOrder(row.id);
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/clients/${row.id}/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, order } : r)));
        cancelEditOrder(row.id);
      }
    } catch (error) {
      console.error("Error updating client order:", error);
    }
  }

  async function persistClientOrder(orderedIds: string[]) {
    const orderMap = new Map(orderedIds.map((id, index) => [id, index + 1]));
    setRows((prev) =>
      prev.map((row) =>
        orderMap.has(row.id) ? { ...row, order: orderMap.get(row.id)! } : row,
      ),
    );
    try {
      await adminFetch("/api/admin/clients/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (error) {
      console.error("Error reordering clients:", error);
      void fetchRows();
    }
  }

  function handleDragStart(clientId: string) {
    if (!canDragReorder) return;
    setDraggingClientId(clientId);
  }

  function handleDragOver(event: React.DragEvent, clientId: string) {
    if (!canDragReorder || !draggingClientId) return;
    event.preventDefault();
    setDragOverClientId(clientId);
  }

  function handleDrop(targetClientId: string) {
    if (!canDragReorder || !draggingClientId || draggingClientId === targetClientId) {
      setDraggingClientId(null);
      setDragOverClientId(null);
      return;
    }
    const ids = filtered.map((row) => row.id);
    const fromIndex = ids.indexOf(draggingClientId);
    const toIndex = ids.indexOf(targetClientId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingClientId(null);
      setDragOverClientId(null);
      return;
    }
    const nextIds = [...ids];
    nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, draggingClientId);
    setDraggingClientId(null);
    setDragOverClientId(null);
    void persistClientOrder(nextIds);
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
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add Client
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

      {canDragReorder && statusFiltered.length > 1 ? (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Drag clients using the grip icon in the Order column to reorder.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Order</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Contacts</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Opportunities</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {statusFiltered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No clients in this tab yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No clients match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => {
                const colors = CLIENT_STATUS_COLORS[row.status] ?? CLIENT_STATUS_COLORS.ACTIVE;
                const oppCount = row.opportunityCount ?? 0;
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      dragOverClientId === row.id ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    } ${draggingClientId === row.id ? "opacity-60" : ""}`}
                    onDragOver={(e) => handleDragOver(e, row.id)}
                    onDrop={() => handleDrop(row.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canDragReorder ? (
                          <button
                            type="button"
                            draggable
                            onDragStart={() => handleDragStart(row.id)}
                            onDragEnd={() => {
                              setDraggingClientId(null);
                              setDragOverClientId(null);
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            aria-label={`Drag to reorder ${row.name}`}
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                        <div className="flex items-center gap-1">
                          {editingOrderId === row.id ? (
                            <input
                              type="number"
                              value={orderDrafts[row.id] ?? String(row.order ?? 0)}
                              onChange={(e) =>
                                setOrderDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                              }
                              onBlur={() => void saveOrder(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  cancelEditOrder(row.id);
                                }
                              }}
                              autoFocus
                              className="w-16 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                              aria-label={`Edit order for ${row.name}`}
                            />
                          ) : (
                            <>
                              <span className="text-gray-600 dark:text-gray-400">{row.order ?? 0}</span>
                              <button
                                type="button"
                                onClick={() => startEditOrder(row)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                aria-label={`Edit order for ${row.name}`}
                                title="Edit order"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.country}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.contacts?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      {oppCount > 0 ? (
                        <Link
                          href={`/opportunities?clientId=${encodeURIComponent(row.id)}`}
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
                        <Link
                          href={`/clients/${row.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
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
