"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientOption = { id: string; name: string };
type LineDraft = { description: string; qty: string; unitPrice: string };

function NewQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOpportunityId = searchParams.get("opportunityId") ?? "";
  const presetClientId = searchParams.get("clientId") ?? "";

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(presetClientId);
  const [opportunityId, setOpportunityId] = useState(presetOpportunityId);
  const [currency, setCurrency] = useState("AUD");
  const [taxRate, setTaxRate] = useState("10");
  const [lines, setLines] = useState<LineDraft[]>([
    { description: "", qty: "1", unitPrice: "0" },
  ]);

  useEffect(() => {
    void adminFetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => {
        const list = ((data.data ?? []) as Array<{ id: string; name: string; status?: string }>).filter(
          (c) => c.status !== "INACTIVE",
        );
        setClients(list.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(console.error);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/crm/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          clientId,
          opportunityId: opportunityId.trim() || null,
          currency,
          taxRate: Number(taxRate) || 0,
          lines: lines.map((l, i) => ({
            description: l.description.trim(),
            qty: Number(l.qty) || 0,
            unitPrice: Number(l.unitPrice) || 0,
            order: i,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create quote");
      router.push(`/quotes/${data.data.id}`);
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/quotes" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New quote</h2>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Opportunity ID (optional)
            </label>
            <input
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              placeholder="opp_…"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {["AUD", "USD", "INR", "EUR", "GBP"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tax rate %</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Line items</label>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { description: "", qty: "1", unitPrice: "0" }])}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[1fr_5rem_7rem_auto] gap-2">
                <input
                  required
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) => (i === index ? { ...l, description: e.target.value } : l)),
                    )
                  }
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="Qty"
                  value={line.qty}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, qty: e.target.value } : l)))
                  }
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Unit price"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) => (i === index ? { ...l, unitPrice: e.target.value } : l)),
                    )
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Creating…" : "Create quote"}
        </button>
      </form>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <ClientsOnlyGuard>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        }
      >
        <NewQuoteForm />
      </Suspense>
    </ClientsOnlyGuard>
  );
}
