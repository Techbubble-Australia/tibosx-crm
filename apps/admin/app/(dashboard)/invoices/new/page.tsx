"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_LABELS,
  type ContractInvoiceStatus,
} from "@/lib/contract-invoice-status";

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
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [contractId, setContractId] = useState("");
  const [reference, setReference] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ContractInvoiceStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [saving, setSaving] = useState(false);

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
      alert("Please select a contract.");
      return;
    }
    if (!dueDate) {
      alert("Due date is required.");
      return;
    }
    if (!description.trim()) {
      alert("Description is required.");
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
          qty: Number.parseFloat(qty) || 0,
          rate: Number.parseFloat(rate) || 0,
          taxRate: Number.parseFloat(taxRate) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create invoice");
      router.push("/invoices");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create invoice");
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
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contract *</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Issue date *</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Due date *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Qty *</label>
              <input type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Rate *</label>
              <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Tax rate (%)</label>
              <input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} />
            </div>
          </div>
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
