"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { formatCrmMoney } from "@/lib/crm-format";
import { accountingPill, formatDayMonth, invoicePeriod, invoiceStatusChip } from "@/lib/invoice-display";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_LABELS,
  type ContractInvoiceStatus,
} from "@/lib/contract-invoice-status";

type InvoiceRow = {
  id: string;
  contractId: string;
  contractNumber: string;
  contractTitle: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  status: ContractInvoiceStatus;
  currency: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  fileUrl: string | null;
  accountingSyncStatus?: string;
  accountingProvider?: string | null;
};

type ClientOption = { id: string; name: string };

type SortKey = "dueDate" | "issueDate" | "invoiceNumber" | "clientName" | "totalAmount" | "status";

function formatMoney(currency: string, amount: number) {
  return formatCrmMoney(amount, currency);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function monthKey(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const filterSelectClass =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

function invoiceDetailHref(row: InvoiceRow) {
  return `/invoices/${row.id}`;
}

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
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    >
      {label}
      {active ? (dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null}
    </button>
  );
}

export default function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [clientFilter, setClientFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [monthFilter, setMonthFilter] = useState("");
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);

  async function patchInvoice(
    row: InvoiceRow,
    body: { status?: ContractInvoiceStatus; dueDate?: string },
  ) {
    setUpdatingInvoiceId(row.id);
    try {
      const res = await adminFetch(`/api/admin/contracts/${row.contractId}/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          ...(body.dueDate ? { dueDate: body.dueDate } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to update invoice");
      }
      const updated = data.data as InvoiceRow;
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: updated.status ?? item.status,
                dueDate: updated.dueDate ?? item.dueDate,
              }
            : item,
        ),
      );
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to update invoice");
    } finally {
      setUpdatingInvoiceId(null);
    }
  }

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    void adminFetch("/api/admin/invoices/clients")
      .then((res) => res.json())
      .then((data) => setClients((data.data ?? []) as ClientOption[]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (clientFilter) params.set("clientId", clientFilter);
    params.set("sortBy", sortKey);
    params.set("sortDir", sortDir);
    void adminFetch(`/api/admin/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as InvoiceRow[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientFilter, sortKey, sortDir]);

  const monthOptions = useMemo(
    () => [...new Set(rows.map((row) => monthKey(row.issueDate)).filter(Boolean))].sort().reverse(),
    [rows],
  );

  // KPIs summarise the client + month scope; status / overdue filters only narrow the table.
  const scopeRows = useMemo(
    () => (monthFilter ? rows.filter((row) => monthKey(row.issueDate) === monthFilter) : rows),
    [rows, monthFilter],
  );

  const filteredRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scopeRows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (dueFilter === "overdue") {
        return row.status === "AWAITING_PAYMENT" && new Date(row.dueDate) < today;
      }
      return true;
    });
  }, [scopeRows, statusFilter, dueFilter]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalItems,
  } = useListView(
    filteredRows,
    (row) =>
      buildSearchHaystack([
        row.invoiceNumber,
        row.clientName,
        row.contractNumber,
        row.contractTitle,
        row.description,
        row.reference,
        row.status,
      ]),
    { initialPageSize: 25, pageSizeOptions: [10, 25, 50, 100] },
  );

  const groupedByClient = useMemo(() => {
    const map = new Map<string, InvoiceRow[]>();
    for (const row of paginated) {
      const list = map.get(row.clientName) ?? [];
      list.push(row);
      map.set(row.clientName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [paginated]);


  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const draft = { amount: 0, count: 0 };
    const awaiting = { amount: 0, count: 0 };
    const overdue = { amount: 0, count: 0 };
    const paid = { amount: 0, count: 0 };
    const currencies = new Set<string>();
    for (const row of scopeRows) {
      currencies.add(row.currency || "AUD");
      if (row.status === "DRAFT") {
        draft.amount += row.totalAmount;
        draft.count += 1;
      }
      if (row.status === "AWAITING_PAYMENT") {
        awaiting.amount += row.totalAmount;
        awaiting.count += 1;
        if (new Date(row.dueDate) < today) {
          overdue.amount += row.totalAmount;
          overdue.count += 1;
        }
      }
      if (row.status === "PAID" && new Date(row.issueDate) >= monthStart) {
        paid.amount += row.amount;
        paid.count += 1;
      }
    }
    const currencyList = [...currencies];
    const currency = currencyList.length === 1 ? currencyList[0]! : "AUD";
    return { draft, awaiting, overdue, paid, currency, mixed: currencyList.length > 1 };
  }, [scopeRows]);

  function exportCsv() {
    const header = ["No.", "Client", "Contract", "Period", "Issued", "Due", "Amount", "GST", "Total", "Status", "Accounting"];
    const lines = [
      header.join(","),
      ...filteredRows.map((row) =>
        [
          row.invoiceNumber,
          row.clientName,
          row.contractNumber,
          invoicePeriod(row),
          formatDayMonth(row.issueDate),
          formatDayMonth(row.dueDate),
          String(row.amount),
          String(row.taxAmount),
          String(row.totalAmount),
          CONTRACT_INVOICE_STATUS_LABELS[row.status] ?? row.status,
          accountingPill(row.accountingSyncStatus, row.accountingProvider).label,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter, clientFilter, dueFilter, monthFilter, viewMode, setPage]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "dueDate" || key === "issueDate" ? "desc" : "asc");
  }

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {kpis.awaiting.count} awaiting payment
              {" · "}
              {formatMoney(kpis.currency, kpis.awaiting.amount)} owed
              {" · "}
              {kpis.draft.count} draft
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredRows.length === 0}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Export
            </button>
            <Link
              href="/invoices/new?from=timesheets"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Generate from timesheets
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              + Invoice
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Draft",
              amount: kpis.draft.amount,
              sub: `${kpis.draft.count} invoice${kpis.draft.count === 1 ? "" : "s"}`,
              onClick: () => setStatusFilter(statusFilter === "DRAFT" ? "" : "DRAFT"),
              active: statusFilter === "DRAFT",
            },
            {
              label: "Awaiting payment",
              amount: kpis.awaiting.amount,
              sub: `${kpis.awaiting.count} invoice${kpis.awaiting.count === 1 ? "" : "s"}`,
              onClick: () => setStatusFilter(statusFilter === "AWAITING_PAYMENT" ? "" : "AWAITING_PAYMENT"),
              active: statusFilter === "AWAITING_PAYMENT",
            },
            {
              label: "Overdue",
              amount: kpis.overdue.amount,
              sub: kpis.overdue.count === 0 ? "none" : `${kpis.overdue.count} invoice${kpis.overdue.count === 1 ? "" : "s"}`,
              onClick: () => setDueFilter(dueFilter === "overdue" ? "" : "overdue"),
              active: dueFilter === "overdue",
            },
            {
              label: "Paid this month",
              amount: kpis.paid.amount,
              sub: "excl. GST",
              onClick: () => setStatusFilter(statusFilter === "PAID" ? "" : "PAID"),
              active: statusFilter === "PAID",
            },
          ].map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className={`rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 ${
                kpi.active ? "border-gray-900 dark:border-gray-100" : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {kpi.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatMoney(kpis.currency, kpi.amount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {kpi.sub}
                {kpis.mixed ? " · mixed currencies" : ""}
              </p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="">Client: all</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <select
            aria-label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="">Status: all</option>
            {CONTRACT_INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>{CONTRACT_INVOICE_STATUS_LABELS[status]}</option>
            ))}
          </select>
          <select
            aria-label="Month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="">Month: all</option>
            {monthOptions.map((key) => (
              <option key={key} value={key}>Month: {monthLabel(key)}</option>
            ))}
          </select>
          {dueFilter === "overdue" ? (
            <button
              type="button"
              onClick={() => setDueFilter("")}
              className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
            >
              Overdue only ×
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : viewMode === "card" ? (
          filteredRows.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No invoices found.
            </p>
          ) : (
            <div className="space-y-6">
              {groupedByClient.map(([clientName, clientRows]) => (
                <section
                  key={clientName}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{clientName}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {clientRows.length} invoice{clientRows.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {clientRows.map((row) => {
                      return (
                        <article
                          key={row.id}
                          className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <Link
                              href={invoiceDetailHref(row)}
                              className="whitespace-nowrap font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {row.invoiceNumber}
                            </Link>
                            <span
                              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusChip(row.status)}`}
                            >
                              {CONTRACT_INVOICE_STATUS_LABELS[row.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Issued {formatDate(row.issueDate)} · Due {formatDate(row.dueDate)}
                          </p>
                          <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400" title={`${row.contractNumber} — ${row.contractTitle}`}>
                            {row.contractNumber} — {row.contractTitle}
                          </p>
                          {row.description ? (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                              {row.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex items-end justify-between gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              {formatMoney(row.currency, row.amount)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMoney(row.currency, row.totalAmount)}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
              <TablePagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          )
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    <SortHeader label="No." sortKey="invoiceNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Contract</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Period</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    <SortHeader label="Issued" sortKey="issueDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    <SortHeader label="Due" sortKey="dueDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Amount" sortKey="totalAmount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Accounting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">No invoices found.</td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const pill = accountingPill(row.accountingSyncStatus, row.accountingProvider);
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link
                            href={invoiceDetailHref(row)}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline dark:text-gray-100 dark:hover:text-blue-400"
                          >
                            {row.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.clientName}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link
                            href={`/contracts/${row.contractId}`}
                            title={row.contractTitle}
                            className="text-gray-700 hover:text-blue-600 hover:underline dark:text-gray-300 dark:hover:text-blue-400"
                          >
                            {row.contractNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{invoicePeriod(row)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                          {formatDayMonth(row.issueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                          {formatDayMonth(row.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                          {formatMoney(row.currency, row.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.status}
                            disabled={updatingInvoiceId === row.id}
                            aria-label={`Status for ${row.invoiceNumber}`}
                            onChange={(e) =>
                              void patchInvoice(row, { status: e.target.value as ContractInvoiceStatus })
                            }
                            className={`cursor-pointer appearance-none rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${invoiceStatusChip(row.status)}`}
                          >
                            {CONTRACT_INVOICE_STATUSES.map((value) => (
                              <option key={value} value={value}>{CONTRACT_INVOICE_STATUS_LABELS[value]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${pill.className}`}>
                            {pill.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
