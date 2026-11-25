"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Printer, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { SALES_CURRENCIES } from "@/lib/opportunity-status";
import {
  CONTRACT_INVOICE_STATUSES,
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
import { formatInvoiceActivitySummary, type InvoiceActivityLogEntry } from "@/lib/invoice-activity";
import { accountingPill, formatDayMonth, invoicePeriod, invoiceStatusChip } from "@/lib/invoice-display";

type InvoiceDetail = {
  id: string;
  contractId: string;
  contractNumber: string;
  contractTitle: string;
  contractStatus: string;
  clientName: string;
  clientEmail?: string | null;
  contactEmail?: string | null;
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
  accountingSyncStatus?: string | null;
  accountingProvider?: string | null;
  contractRemaining?: number | null;
  poNumber?: string | null;
  timesheetApproved?: boolean | null;
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
  const code = (currency || "AUD").toUpperCase();
  const n = new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  return code === "AUD" ? `A$${n}` : `${code} ${n}`;
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
  const [accountingSyncStatus, setAccountingSyncStatus] = useState<string>("NOT_SYNCED");
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    void adminFetch(`/api/admin/invoices/${invoiceId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        const detail = data.data as InvoiceDetail;
        setRow(detail);
        setAccountingSyncStatus(detail.accountingSyncStatus ?? "NOT_SYNCED");
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

  const checks = useMemo(() => {
    if (!row) return [];
    const desc = `${row.description} ${lines.map((l) => l.description).join(" ")}`.toLowerCase();
    const timesheetApproved =
      typeof row.timesheetApproved === "boolean"
        ? row.timesheetApproved
        : /timesheet/.test(desc) && /approved/.test(desc);
    const poPresent = Boolean(
      (row.poNumber && row.poNumber.trim()) ||
        (row.reference && row.reference.trim()) ||
        files.some((f) => /po|purchase/i.test(f.name)),
    );
    const withinValue =
      typeof row.contractRemaining === "number"
        ? row.contractRemaining >= preview.amount
        : true;
    const contactEmail = Boolean(
      (row.contactEmail && row.contactEmail.includes("@")) ||
        (row.clientEmail && row.clientEmail.includes("@")),
    );
    return [
      { id: "timesheet", label: "Timesheet approved", ok: timesheetApproved },
      { id: "po", label: "PO present", ok: poPresent },
      { id: "value", label: "Within contract value", ok: withinValue },
      { id: "email", label: "Client contact has email", ok: contactEmail },
    ];
  }, [row, lines, files, preview.amount]);

  function handlePreviewPdf() {
    window.print();
  }

  async function handleSendToAccounting() {
    if (!row) return;
    setActionBusy(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${row.contractId}/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountingSyncStatus: "PENDING" }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const next =
          (data.data as { accountingSyncStatus?: string } | undefined)?.accountingSyncStatus ??
          "PENDING";
        setAccountingSyncStatus(next);
        setRow((prev) => (prev ? { ...prev, accountingSyncStatus: next } : prev));
        appAlert("Marked for accounting sync.");
      } else {
        setAccountingSyncStatus("PENDING");
        setRow((prev) => (prev ? { ...prev, accountingSyncStatus: "PENDING" } : prev));
        appAlert("Accounting sync queued locally (API stub). Sync providers wire-up coming soon.");
      }
    } catch {
      setAccountingSyncStatus("PENDING");
      appAlert("Accounting sync queued locally (API stub). Sync providers wire-up coming soon.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleApproveAndSend() {
    if (!row) return;
    setActionBusy(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${row.contractId}/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AWAITING_PAYMENT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to approve invoice");
      setStatus("AWAITING_PAYMENT");
      setRow((prev) => (prev ? { ...prev, status: "AWAITING_PAYMENT" } : prev));
      appAlert("Invoice approved and marked awaiting payment.");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Approve and send is not available yet.");
    } finally {
      setActionBusy(false);
    }
  }

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

  const pill = accountingPill(accountingSyncStatus, row.accountingProvider);
  const baseButton =
    "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";
  const periodLabel = invoicePeriod({ description: row.description, issueDate: row.issueDate });
  const lineRows = lines
    .filter((l) => l.description.trim() || Number.parseFloat(l.rate))
    .map((l) => {
      const qty = Number.parseFloat(l.qty) || 0;
      const rate = Number.parseFloat(l.rate) || 0;
      return { description: l.description, qty, rate, amount: qty * rate };
    });
  const history = row.activityLogs ?? [];
  const cardClass = "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900";

  return (
    <ClientsOnlyGuard>
      <div className="max-w-6xl space-y-4">
        <section className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                href="/invoices"
                className="mt-0.5 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 print:hidden"
                aria-label="Back to invoices"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {row.invoiceNumber}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusChip(row.status)}`}>
                    {CONTRACT_INVOICE_STATUS_LABELS[row.status]}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pill.className}`}>{pill.label}</span>
                </h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {row.clientName} ·{" "}
                  <Link href={`/contracts/${row.contractId}`} className="hover:text-blue-600 hover:underline">
                    {row.contractNumber}
                  </Link>{" "}
                  · {periodLabel} · Issue {formatDayMonth(row.issueDate)}, due {formatDayMonth(row.dueDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button type="button" onClick={handlePreviewPdf} className={`${baseButton} inline-flex items-center gap-1.5`}>
                <Printer className="h-4 w-4" />
                Preview PDF
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleSendToAccounting()}
                className={baseButton}
              >
                Send to accounting
              </button>
              <button
                type="button"
                disabled={actionBusy || status !== "DRAFT"}
                onClick={() => void handleApproveAndSend()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Approve and send
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className={`${cardClass} min-w-0 self-start`}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lines</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Currency {currency}. Foreign rates, when used, show the rate and date.
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Rate</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                        No lines yet.
                      </td>
                    </tr>
                  ) : (
                    lineRows.map((line, index) => (
                      <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">{line.description}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                          {line.qty}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                          {formatMoney(currency, line.rate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">
                          {formatMoney(currency, line.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <dl className="mt-3 space-y-1 text-right text-sm text-gray-700 dark:text-gray-300">
              <div>
                <dt className="mr-2 inline">Subtotal</dt>
                <dd className="inline tabular-nums">{formatMoney(currency, preview.amount)}</dd>
              </div>
              <div>
                <dt className="mr-2 inline">GST {Number.parseFloat(taxRate) || 0}%</dt>
                <dd className="inline tabular-nums">{formatMoney(currency, preview.taxAmount)}</dd>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <dt className="mr-2 inline">Total</dt>
                <dd className="inline tabular-nums">{formatMoney(currency, preview.totalAmount)}</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-4 print:hidden">
            <section className={cardClass}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Source</h3>
              <dl className="space-y-2.5 text-sm">
                {typeof row.timesheetApproved === "boolean" ? (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Timesheet</dt>
                    <dd>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.timesheetApproved
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {row.timesheetApproved ? "Approved" : "Not approved"}
                      </span>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Contract</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    <Link href={`/contracts/${row.contractId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                      {row.contractNumber}
                    </Link>
                    {typeof row.contractRemaining === "number"
                      ? `, ${formatMoney(currency, row.contractRemaining)} remaining${
                          row.status === "DRAFT" ? " before this invoice" : ""
                        }`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">PO number</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {row.poNumber ? `${row.poNumber}, printed on invoice` : <span className="text-gray-400">Not set</span>}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Checks before sending</h3>
              <ul className="flex flex-wrap gap-2">
                {checks.map((check) => (
                  <li
                    key={check.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      check.ok
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {check.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {check.label}
                  </li>
                ))}
              </ul>
            </section>

            <section className={cardClass}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">History</h3>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-gray-900 dark:text-gray-100">
                  {history.slice(0, 8).map((log) => (
                    <li key={log.id}>
                      <span className="text-gray-500 dark:text-gray-400">{formatDayMonth(log.createdAt)}: </span>
                      {formatInvoiceActivitySummary(log)}
                      {log.performedByName ? (
                        <span className="text-gray-500 dark:text-gray-400"> by {log.performedByName}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="max-w-3xl space-y-4 print:hidden">
          {!fieldsEditable ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40">
              Set status to <strong>Draft</strong> to edit all invoice fields. You can still change status and due date below.
            </p>
          ) : null}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit invoice</h3>
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
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
