"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { getSortedCountryOptions } from "@/lib/country-flags";
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
  contactId: string | null;
  contactName: string;
  ownerId: string | null;
  ownerName: string;
  currency: string;
  amount: number;
  status: OpportunityStatus;
  comments: string;
  order: number;
  active: boolean;
  activeJobsCount: number;
}

type ContactOption = { id: string; name: string; email: string };

type Props = {
  activeFilter: boolean;
};

function formatValue(row: OpportunityRow): string {
  return `${row.currency} ${new Intl.NumberFormat("en-US").format(row.amount)}`;
}

type OpportunitySortKey = "name" | "clientName" | "location" | "type" | "amount" | "status" | "order" | "ownerName";
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

function InlineEditableCell({
  label,
  editing,
  onEdit,
  editControl,
  children,
}: {
  label: string;
  editing: boolean;
  onEdit: () => void;
  editControl: React.ReactNode;
  children: React.ReactNode;
}) {
  if (editing) return editControl;
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label={label}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function OpportunitiesListPage({ activeFilter }: Props) {
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId")?.trim() ?? "";
  const listTab = activeFilter ? "active" : "inactive";
  const countryOptions = useMemo(() => getSortedCountryOptions(), []);
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<OpportunitySortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [typeDrafts, setTypeDrafts] = useState<Record<string, string>>({});
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({});
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>({});
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [contactsByClient, setContactsByClient] = useState<Record<string, ContactOption[]>>({});

  const filteredByClient = useMemo(() => {
    const list = [...(clientIdFilter ? rows.filter((row) => row.clientId === clientIdFilter) : rows)];
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
        case "ownerName":
          cmp = a.ownerName.localeCompare(b.ownerName);
          break;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, clientIdFilter, sortKey, sortDir]);

  const cardScopeRows = useMemo(() => {
    if (!selectedClient) return filteredByClient;
    return filteredByClient.filter((row) => row.clientName === selectedClient);
  }, [filteredByClient, selectedClient]);

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
    viewMode === "card" && selectedClient ? cardScopeRows : filteredByClient,
    (row) =>
      buildSearchHaystack([
        row.name,
        row.clientName,
        row.location,
        row.typeLabel,
        row.contactName,
        row.ownerName,
        row.currency,
        row.amount,
        row.status,
        row.comments,
      ]),
    { initialPageSize: 100, pageSizeOptions: [25, 50, 100, 200] },
  );

  const groupedByClient = useMemo(() => {
    const map = new Map<string, OpportunityRow[]>();
    for (const row of filteredByClient) {
      const list = map.get(row.clientName) ?? [];
      list.push(row);
      map.set(row.clientName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredByClient]);

  useEffect(() => {
    setSelectedClient(null);
  }, [search, viewMode, activeFilter, clientIdFilter]);

  useEffect(() => {
    if (clientIdFilter && clientName) {
      setSelectedClient(clientName);
    }
  }, [clientIdFilter, clientName]);

  useEffect(() => {
    void fetchRows();
  }, [clientIdFilter, activeFilter]);

  async function loadContactsForClient(clientId: string) {
    if (contactsByClient[clientId]) return contactsByClient[clientId];
    try {
      const res = await adminFetch(`/api/admin/clients/${clientId}`);
      const data = await res.json();
      const list = ((data.data?.contacts ?? []) as ContactOption[]).filter((c) => c.id && c.name);
      setContactsByClient((prev) => ({ ...prev, [clientId]: list }));
      return list;
    } catch {
      return [];
    }
  }

  async function fetchRows() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("active", activeFilter ? "true" : "false");
      if (clientIdFilter) params.set("clientId", clientIdFilter);
      const res = await adminFetch(`/api/admin/opportunities?${params.toString()}`);
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
    patch: Partial<{
      name: string;
      type: OpportunityType;
      location: string;
      amount: number;
      status: OpportunityStatus;
      contactId: string | null;
      active: boolean;
    }>,
  ) {
    try {
      const res = await adminFetch(`/api/admin/opportunities/${row.id}/list-fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const updated = data.data as OpportunityRow;
      setRows((prev) => {
        if (activeFilter && (updated.active === false || updated.status === "REJECTED")) {
          return prev.filter((r) => r.id !== row.id);
        }
        if (!activeFilter && updated.active !== false) {
          return prev.filter((r) => r.id !== row.id);
        }
        return prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r));
      });
      return true;
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return false;
    }
  }

  async function toggleActive(row: OpportunityRow) {
    const ok = await patchListField(row, { active: !row.active });
    if (ok) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
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

  async function startEditLocation(row: OpportunityRow) {
    setEditingLocationId(row.id);
    setLocationDrafts((prev) => ({ ...prev, [row.id]: row.location }));
  }

  function cancelEditLocation(id: string) {
    setEditingLocationId((current) => (current === id ? null : current));
    setLocationDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveLocation(row: OpportunityRow) {
    const value = (locationDrafts[row.id] ?? "").trim();
    if (!value || value === row.location) {
      cancelEditLocation(row.id);
      return;
    }
    const ok = await patchListField(row, { location: value });
    if (ok) cancelEditLocation(row.id);
  }

  async function startEditContact(row: OpportunityRow) {
    await loadContactsForClient(row.clientId);
    setEditingContactId(row.id);
    setContactDrafts((prev) => ({ ...prev, [row.id]: row.contactId ?? "" }));
  }

  function cancelEditContact(id: string) {
    setEditingContactId((current) => (current === id ? null : current));
    setContactDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveContact(row: OpportunityRow) {
    const value = contactDrafts[row.id] ?? "";
    const nextId = value || null;
    if (nextId === (row.contactId ?? null)) {
      cancelEditContact(row.id);
      return;
    }
    const ok = await patchListField(row, { contactId: nextId });
    if (ok) cancelEditContact(row.id);
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
    if (!(await appConfirm("Delete this opportunity?"))) return;
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    }
  }

  function clientFilterHref(clientId: string) {
    return `/opportunities/${listTab}?clientId=${encodeURIComponent(clientId)}`;
  }

  function activeJobsHref(row: OpportunityRow) {
    const params = new URLSearchParams();
    params.set("clientId", row.clientId);
    if (row.location) params.set("country", row.location);
    params.set("opportunityId", row.id);
    return `/jobs/active?${params.toString()}`;
  }

  function resolveStatus(status: string): OpportunityStatus {
    if ((OPPORTUNITY_STATUSES as readonly string[]).includes(status)) {
      return status as OpportunityStatus;
    }
    const match = OPPORTUNITY_STATUSES.find(
      (key) => OPPORTUNITY_STATUS_LABELS[key].toLowerCase() === status.trim().toLowerCase(),
    );
    return match ?? "DRAFT";
  }

  function renderTableRow(row: OpportunityRow) {
    const statusKey = resolveStatus(row.status);
    const colors = OPPORTUNITY_STATUS_COLORS[statusKey] ?? OPPORTUNITY_STATUS_COLORS.DRAFT;
    const contacts = contactsByClient[row.clientId] ?? [];
    return (
      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-4 py-3 font-medium">
          <Link
            href={`/opportunities/${row.id}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {row.name}
          </Link>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <Link href={clientFilterHref(row.clientId)} className="hover:underline">
            {row.clientName}
          </Link>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <InlineEditableCell
            label={`Edit contact for ${row.name}`}
            editing={editingContactId === row.id}
            onEdit={() => void startEditContact(row)}
            editControl={
              <select
                value={contactDrafts[row.id] ?? ""}
                onChange={(e) => setContactDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                onBlur={() => void saveContact(row)}
                autoFocus
                className={inlineSelectClass}
                aria-label={`Edit contact for ${row.name}`}
              >
                <option value="">None</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            }
          >
            <span>{row.contactName || "—"}</span>
          </InlineEditableCell>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.ownerName || "—"}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <InlineEditableCell
            label={`Edit type for ${row.name}`}
            editing={editingTypeId === row.id}
            onEdit={() => startEditType(row)}
            editControl={
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
            }
          >
            <span>{row.typeLabel}</span>
          </InlineEditableCell>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <InlineEditableCell
            label={`Edit location for ${row.name}`}
            editing={editingLocationId === row.id}
            onEdit={() => void startEditLocation(row)}
            editControl={
              <select
                value={locationDrafts[row.id] ?? row.location}
                onChange={(e) => setLocationDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                onBlur={() => void saveLocation(row)}
                autoFocus
                className={inlineSelectClass}
                aria-label={`Edit location for ${row.name}`}
              >
                <option value="">Select country…</option>
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.name}>{country.flag} {country.name}</option>
                ))}
              </select>
            }
          >
            <span>{row.location || "—"}</span>
          </InlineEditableCell>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          {(row.activeJobsCount ?? 0) > 0 ? (
            <Link href={activeJobsHref(row)} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              {row.activeJobsCount}
            </Link>
          ) : (
            "0"
          )}
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
          <InlineEditableCell
            label={`Edit estimated value for ${row.name}`}
            editing={editingAmountId === row.id}
            onEdit={() => startEditAmount(row)}
            editControl={
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
            }
          >
            <span>{formatValue(row)}</span>
          </InlineEditableCell>
        </td>
        <td className="px-4 py-3">
          <InlineEditableCell
            label={`Edit status for ${row.name}`}
            editing={editingStatusId === row.id}
            onEdit={() => startEditStatus(row)}
            editControl={
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
            }
          >
            <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
              {OPPORTUNITY_STATUS_LABELS[statusKey]}
            </span>
          </InlineEditableCell>
        </td>
        <td className="max-w-[240px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={row.comments || undefined}>
          {row.comments || "—"}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleActive(row)}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              title={activeFilter ? "Mark inactive" : "Mark active"}
            >
              {activeFilter ? "Deactivate" : "Activate"}
            </button>
            <button type="button" onClick={() => void deleteRow(row.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeFilter ? "Active opportunities" : "Inactive opportunities"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clientIdFilter && clientName
              ? `Showing opportunities for ${clientName}.`
              : activeFilter
                ? "Opportunities currently being pursued."
                : "Archived opportunities no longer being pursued."}
          </p>
          {clientIdFilter ? (
            <Link href={`/opportunities/${listTab}`} className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Show all opportunities
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Add Opportunity
          </Link>
        </div>
      </div>

      <AdminSearchField
        id="opportunity-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, client, type, location, contact, status…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Contact</th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Owner" sortKey="ownerName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Location" sortKey="location" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Active jobs</th>
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
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    No {activeFilter ? "active" : "inactive"} opportunities yet.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">No opportunities match your search.</td>
                </tr>
              ) : (
                paginated.map((row) => renderTableRow(row))
              )}
            </tbody>
          </table>
          {filteredByClient.length > 0 ? (
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
                {cardScopeRows.length} opportunit{cardScopeRows.length !== 1 ? "ies" : "y"}
              </span>
            </div>
            {cardScopeRows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No opportunities for this client.</p>
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
          {filteredByClient.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No {activeFilter ? "active" : "inactive"} opportunities.
            </div>
          ) : totalItems === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No opportunities match your search.
            </div>
          ) : groupedByClient.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No clients with opportunities on this tab.
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
                    {items.length} opportunit{items.length !== 1 ? "ies" : "y"}
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
