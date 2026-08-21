"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  SALES_CURRENCIES,
} from "@/lib/opportunity-status";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientOption = { id: string; name: string; status: string };

export default function NewOpportunityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetClientId = searchParams.get("clientId")?.trim() ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState(presetClientId);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await adminFetch("/api/admin/clients");
        const data = await res.json();
        const list = ((data.data ?? []) as ClientOption[]).filter(
          (c) => c.status === "ACTIVE" || c.status === "PROSPECT",
        );
        setClients(list);
        if (presetClientId && list.some((c) => c.id === presetClientId)) {
          setClientId(presetClientId);
        }
      } catch (error) {
        console.error(error);
      }
    }
    void loadClients();
  }, [presetClientId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await adminFetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          clientId: formData.get("clientId"),
          currency: formData.get("currency"),
          amount: formData.get("amount"),
          status: formData.get("status"),
          comments: formData.get("comments") ?? "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      const targetClientId = String(formData.get("clientId") ?? "");
      router.push(targetClientId ? `/opportunities?clientId=${encodeURIComponent(targetClientId)}` : "/opportunities");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create opportunity");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/opportunities" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Opportunity</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name *</label>
          <input name="name" required className={inputClass} placeholder="e.g. ServiceNow AMS renewal" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Client *</label>
          <select name="clientId" required value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Currency *</label>
            <select name="currency" required defaultValue="AUD" className={inputClass}>
              {SALES_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Amount *</label>
            <input name="amount" type="number" required min="0.01" step="0.01" className={inputClass} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Status *</label>
          <select name="status" required defaultValue="DRAFT" className={inputClass}>
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>{OPPORTUNITY_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Comments</label>
          <textarea name="comments" rows={4} className={inputClass} placeholder="Optional notes" />
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Opportunity
        </button>
      </form>
    </div>
  );
}
