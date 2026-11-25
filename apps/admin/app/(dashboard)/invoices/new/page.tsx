"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_LABELS,
  type ContractInvoiceStatus,
} from "@/lib/contract-invoice-status";
import { AdminUserFilesField, type UserFileRow } from "@/components/users/AdminUserFilesField";
import {
  InvoiceLineItemsEditor,
  emptyInvoiceLine,
  invoiceLinesPayload,
  invoiceLinesProblem,
  invoiceLinesSubtotal,
  type InvoiceLineDraft,
} from "@/components/invoices/InvoiceLineItemsEditor";

type ContractOption = {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  currency: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetContractId = searchParams.get("contractId")?.trim() ?? "";
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [contractId, setContractId] = useState(presetContractId);
  const [reference, setReference] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ContractInvoiceStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<InvoiceLineDraft[]>([emptyInvoiceLine()]);
  const [files, setFiles] = useState<UserFileRow[]>([]);
  const [taxRate, setTaxRate] = useState("10");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (presetContractId) setContractId(presetContractId);
  }, [presetContractId]);

  useEffect(() => {
    void Promise.all([
      adminFetch("/api/admin/contracts?tab=active").then((res) => res.json()),
      adminFetch("/api/admin/contracts?tab=inactive").then((res) => res.json()),
    ])
      .then(([activeData, inactiveData]) => {
        const active = (activeData.data ?? []) as ContractOption[];
        const inactive = ((inactiveData.data ?? []) as ContractOption[]).filter(
          (row) => row.status === "EXPIRED",
        );
        setContracts([...active, ...inactive]);
      })
      .catch(console.error);
  }, []);

  const selectedContract = contracts.find((row) => row.id === contractId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contractId) {
      appAlert("Please select a contract.");
      return;
    }
    if (!dueDate) {
      appAlert("Due date is required.");
      return;
    }
    if (!description.trim()) {
      appAlert("Description is required.");
      return;
    }
    const linesProblem = invoiceLinesProblem(lines);
    if (linesProblem) {
      appAlert(linesProblem);
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${contractId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          issueDate,
          dueDate,
          status,
          currency: selectedContract?.currency,
          description: description.trim(),
          qty: 1,
          rate: invoiceLinesSubtotal(lines),
          lineItems: invoiceLinesPayload(lines),
          taxRate: Number.parseFloat(taxRate) || 0,
          fileUrls: files,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create invoice");
      router.push("/invoices");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClientsOnlyGuard>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add invoice</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create an invoice against an active or expired contract.</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contract <span className="text-red-500">*</span></label>
            <select value={contractId} onChange={(e) => setContractId(e.target.value)} required className={inputClass}>
              <option value="">Select contract…</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber} — {contract.title} ({contract.status})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Reference</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ContractInvoiceStatus)} className={inputClass}>
                {CONTRACT_INVOICE_STATUSES.map((value) => (
                  <option key={value} value={value}>{CONTRACT_INVOICE_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Issue date <span className="text-red-500">*</span></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Due date <span className="text-red-500">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Description <span className="text-red-500">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className={inputClass} />
          </div>
          <InvoiceLineItemsEditor lines={lines} onChange={setLines} currency={selectedContract?.currency ?? "AUD"} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Tax rate (%)</label>
              <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Total (incl. tax)</label>
              <p className={inputClass}>
                {selectedContract?.currency ?? "AUD"}{" "}
                {new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                  invoiceLinesSubtotal(lines) * (1 + (Number.parseFloat(taxRate) || 0) / 100),
                )}
              </p>
            </div>
          </div>
          <AdminUserFilesField
            files={files}
            onChange={setFiles}
            title="Files"
            description="Attach copies of the actual invoice (PDF, Word, etc.)."
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create invoice
            </button>
            <Link href="/invoices" className="inline-flex items-center rounded-lg border border-gray-200 px-6 py-2 text-sm dark:border-gray-600">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </ClientsOnlyGuard>
  );
}
