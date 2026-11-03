"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { SALES_CURRENCIES } from "@/lib/opportunity-status";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_COLORS,
  CONTRACT_INVOICE_STATUS_LABELS,
  type ContractInvoiceStatus,
} from "@/lib/contract-invoice-status";
import { appAlert } from "@/lib/app-alert";

type InvoiceDetail = {
  id: string;
  contractId: string;
  contractNumber: string;
  contractTitle: string;
  contractStatus: string;
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
  defaultCurrency: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function toDateInputValue(value: string) {
  const date = new Date(value);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function computePreview(qty: number, rate: number, taxRate: number) {
  const amount = qty * rate;
  const taxAmount = (amount * taxRate) / 100;
  return { amount, taxAmount, totalAmount: amount + taxAmount };
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<InvoiceDetail | null>(null);

  const [reference, setReference] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ContractInvoiceStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    void adminFetch(`/api/admin/invoices/${invoiceId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        const detail = data.data as InvoiceDetail;
        setRow(detail);
        setReference(detail.reference);
        setIssueDate(toDateInputValue(detail.issueDate));
        setDueDate(toDateInputValue(detail.dueDate));
        setStatus(detail.status);
        setDescription(detail.description);
        setCurrency(detail.currency || detail.defaultCurrency || "AUD");
        setQty(String(detail.qty));
        setRate(String(detail.rate));
        setTaxRate(String(detail.taxRate));
        setFileUrl(detail.fileUrl);
      })
      .catch((error) => {
        appAlert(error instanceof Error ? error.message : "Failed to load invoice");
        router.push("/invoices");
      })
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  const fieldsEditable = status === "DRAFT";
  const preview = useMemo(() => {
    return computePreview(
      Number.parseFloat(qty) || 0,
      Number.parseFloat(rate) || 0,
      Number.parseFloat(taxRate) || 0,
    );
  }, [qty, rate, taxRate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    if (!dueDate || !description.trim()) {
      appAlert("Due date and description are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${row.contractId}/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          issueDate,
          dueDate,
          status,
          description: description.trim(),
          currency,
          qty: Number.parseFloat(qty) || 0,
          rate: Number.parseFloat(rate) || 0,
          taxRate: Number.parseFloat(taxRate) || 0,
          fileUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update invoice");
      appAlert("Invoice saved.");
      router.push("/invoices");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !row) {
    return (
      <ClientsOnlyGuard>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </ClientsOnlyGuard>
    );
  }

  const statusColors = CONTRACT_INVOICE_STATUS_COLORS[row.status] ?? CONTRACT_INVOICE_STATUS_COLORS.DRAFT;

  return (
    <ClientsOnlyGuard>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{row.invoiceNumber}</h1>
              <p className="text-sm text-gray-500">
                {row.clientName} ·{" "}
                <Link href={`/contracts/${row.contractId}`} className="text-sky-600 hover:underline">
                  {row.contractNumber} — {row.contractTitle}
                </Link>
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
              {CONTRACT_INVOICE_STATUS_LABELS[row.status]}
            </span>
          </div>
        </div>

        {!fieldsEditable ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40">
            Set status to <strong>Draft</strong> to edit all invoice fields. You can still change status and due date below.
          </p>
        ) : null}

        <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Reference</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} readOnly={!fieldsEditable} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ContractInvoiceStatus)} className={inputClass}>
                {CONTRACT_INVOICE_STATUSES.map((value) => (
                  <option key={value} value={value}>{CONTRACT_INVOICE_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Issue date *</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} readOnly={!fieldsEditable} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due date *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} readOnly={!fieldsEditable} required className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!fieldsEditable} className={inputClass}>
                {SALES_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Qty</label>
              <input type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} readOnly={!fieldsEditable} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rate</label>
              <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} readOnly={!fieldsEditable} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax rate %</label>
              <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} readOnly={!fieldsEditable} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount</label>
              <p className={inputClass}>{formatMoney(currency, preview.amount)}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tax amount</label>
              <p className={inputClass}>{formatMoney(currency, preview.taxAmount)}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Total amount</label>
              <p className={inputClass}>{formatMoney(currency, preview.totalAmount)}</p>
            </div>
          </div>
          {fileUrl ? (
            <p className="text-sm">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                View uploaded invoice file
              </a>
            </p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
              {saving ? "Saving…" : "Save invoice"}
            </button>
            <Link href="/invoices" className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </ClientsOnlyGuard>
  );
}
