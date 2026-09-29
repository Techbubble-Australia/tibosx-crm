"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_COLORS,
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
};

type ClientOption = { id: string; name: string };

type SortKey = "dueDate" | "issueDate" | "invoiceNumber" | "clientName" | "totalAmount" | "status";

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
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
      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
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

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    void adminFetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => setClients((data.data ?? []) as ClientOption[]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (clientFilter) params.set("clientId", clientFilter);
    if (dueFilter) params.set("due", dueFilter);
    params.set("sortBy", sortKey);
    params.set("sortDir", sortDir);
    void adminFetch(`/api/admin/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as InvoiceRow[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, clientFilter, dueFilter, sortKey, sortDir]);

  const filteredRows = useMemo(() => rows, [rows]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">All contract invoices across clients.</p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Add invoice
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">All due dates</option>
            <option value="overdue">Overdue</option>
            <option value="due_this_month">Due this month</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">All statuses</option>
            {CONTRACT_INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>{CONTRACT_INVOICE_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Invoice" sortKey="invoiceNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Contract</th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Due" sortKey="dueDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Total" sortKey="totalAmount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No invoices found.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const colors = CONTRACT_INVOICE_STATUS_COLORS[row.status] ?? CONTRACT_INVOICE_STATUS_COLORS.DRAFT;
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <Link href={`/contracts/${row.contractId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                            {row.contractNumber} — {row.contractTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.clientName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(row.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                            {CONTRACT_INVOICE_STATUS_LABELS[row.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.amount)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatMoney(row.currency, row.totalAmount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
