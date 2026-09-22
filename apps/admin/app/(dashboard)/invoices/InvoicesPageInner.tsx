"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    void adminFetch(`/api/admin/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as InvoiceRow[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filteredRows = useMemo(() => rows, [rows]);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">All contract invoices across clients.</p>
          </div>
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
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Invoice</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Contract</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Due</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Total</th>
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
