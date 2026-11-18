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
import { AdminUserFilesField, type UserFileRow } from "@/components/users/AdminUserFilesField";
import {
  InvoiceLineItemsEditor,
  emptyInvoiceLine,
  invoiceLinesPayload,
  invoiceLinesProblem,
  invoiceLinesSubtotal,
  type InvoiceLineDraft,
} from "@/components/invoices/InvoiceLineItemsEditor";
import { InvoiceActivityLogSection } from "@/components/invoices/InvoiceActivityLogSection";
import type { InvoiceActivityLogEntry } from "@/lib/invoice-activity";

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
  lineItems?: Array<{ description: string; qty: number; rate: number }>;
  files?: UserFileRow[];
  defaultCurrency: string;
  activityLogs?: InvoiceActivityLogEntry[];
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

function computePreview(amount: number, taxRate: number) {
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
  const [lines, setLines] = useState<InvoiceLineDraft[]>([emptyInvoiceLine()]);
  const [taxRate, setTaxRate] = useState("10");
  const [files, setFiles] = useState<UserFileRow[]>([]);

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
        setLines(
          (detail.lineItems?.length
            ? detail.lineItems
            : [{ description: detail.description, qty: detail.qty, rate: detail.rate }]
          ).map((line) => ({ description: line.description, qty: String(line.qty), rate: String(line.rate) })),
        );
        setTaxRate(String(detail.taxRate));
        setFiles(detail.files ?? (detail.fileUrl ? [{ name: "Invoice file", url: detail.fileUrl }] : []));
      })
      .catch((error) => {
        appAlert(error instanceof Error ? error.message : "Failed to load invoice");
        router.push("/invoices");
      })
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  const fieldsEditable = status === "DRAFT";
  const preview = useMemo(
    () => computePreview(invoiceLinesSubtotal(lines), Number.parseFloat(taxRate) || 0),
    [lines, taxRate],
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    if (!dueDate || !description.trim()) {
      appAlert("Due date and description are required.");
      return;
    }
    const editingAll = fieldsEditable || row.status === "DRAFT";
    const linesProblem = editingAll ? invoiceLinesProblem(lines) : null;
    if (linesProblem) {
      appAlert(linesProblem);
      return;
    }
    setSaving(true);
    try {
      // Sent invoices only accept status, due date and files.
      const body = editingAll
        ? {
            reference,
            issueDate,
            dueDate,
            status,
            description: description.trim(),
            currency,
            lineItems: invoiceLinesPayload(lines),
            taxRate: Number.parseFloat(taxRate) || 0,
            fileUrls: files,
          }
        : { status, dueDate, fileUrls: files };
      const res = await adminFetch(`/api/admin/contracts/${row.contractId}/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update invoice");
      appAlert("Invoice saved.");
      const refreshed = await adminFetch(`/api/admin/invoices/${row.id}`).then((r) => r.json());
      if (refreshed.data) {
        const detail = refreshed.data as InvoiceDetail;
        setRow(detail);
        setStatus(detail.status);
        setFiles(detail.files ?? []);
      }
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
              <label className="mb-1 block text-sm font-medium">Issue date <span className="text-red-500">*</span></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} readOnly={!fieldsEditable} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due date <span className="text-red-500">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description <span className="text-red-500">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} readOnly={!fieldsEditable} required className={inputClass} />
          </div>
          <InvoiceLineItemsEditor lines={lines} onChange={setLines} currency={currency} readOnly={!fieldsEditable} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!fieldsEditable} className={inputClass}>
                {SALES_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax rate %</label>
              <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} readOnly={!fieldsEditable} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (before tax)</label>
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
          <AdminUserFilesField
            files={files}
            onChange={setFiles}
            title="Files"
            description="Attach copies of the actual invoice (PDF, Word, etc.). Files can be added at any status; click Save invoice to keep them."
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
              {saving ? "Saving…" : "Save invoice"}
            </button>
            <Link href="/invoices" className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
              Cancel
            </Link>
          </div>
        </form>
        <div className="mt-6">
          <InvoiceActivityLogSection logs={row.activityLogs ?? []} />
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
