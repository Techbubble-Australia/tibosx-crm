"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  validUntil: string | null;
  client: { id: string; name: string } | null;
  opportunity: { id: string; name: string } | null;
  lines: Array<{
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }>;
};

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    void adminFetch(`/api/admin/crm/quotes/${id}`)
      .then((res) => res.json())
      .then((data) => setQuote((data.data ?? null) as Quote | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function acceptQuote() {
    setAccepting(true);
    try {
      const res = await adminFetch(`/api/admin/crm/quotes/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createContract: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Accept failed");
      const contractId = data.data?.contractId as string | undefined;
      if (contractId) {
        router.push(`/contracts/${contractId}`);
        return;
      }
      load();
      appAlert("Quote accepted.");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setAccepting(false);
    }
  }

  async function sendForAcceptance() {
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/crm/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Send failed");
      setQuote((data.data ?? null) as Quote | null);
      appAlert("Quote marked as sent for acceptance.");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  function previewPdf() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!quote) {
    return (
      <ClientsOnlyGuard>
        <p className="text-sm text-gray-500">Quote not found.</p>
      </ClientsOnlyGuard>
    );
  }

  return (
    <ClientsOnlyGuard>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="flex items-start gap-3">
            <Link href="/quotes" className="mt-0.5 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{quote.quoteNumber}</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{quote.title}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {quote.client?.name ?? "—"} ·{" "}
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {quote.status}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={previewPdf}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Preview PDF
            </button>
            {quote.status === "DRAFT" || quote.status === "SENT" ? (
              <button
                type="button"
                disabled={sending || quote.status === "SENT"}
                onClick={() => void sendForAcceptance()}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                {quote.status === "SENT" ? "Sent" : sending ? "Sending…" : "Send for acceptance"}
              </button>
            ) : null}
            {quote.status !== "ACCEPTED" ? (
              <button
                type="button"
                disabled={accepting}
                onClick={() => void acceptQuote()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {accepting ? "Accepting…" : "Accept & create contract"}
              </button>
            ) : null}
          </div>
        </div>

        <div id="quote-print" className="space-y-6">
          <div className="hidden print:block">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{quote.quoteNumber}</p>
            <h2 className="text-lg font-semibold text-gray-900">{quote.title}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {quote.client?.name ?? "—"} · {quote.status}
            </p>
          </div>

          {quote.opportunity ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
              Opportunity:{" "}
              <Link
                href={`/opportunities/${quote.opportunity.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400 print:text-black print:no-underline"
              >
                {quote.opportunity.name}
              </Link>
            </p>
          ) : null}

          <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Valid until</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(quote.validUntil)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{quote.status}</p>
            </div>
          </section>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Unit price</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {quote.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{line.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{line.qty}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {formatMoney(quote.currency, line.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {formatMoney(quote.currency, line.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(quote.currency, quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax ({quote.taxRate}%)</span>
              <span className="tabular-nums">{formatMoney(quote.currency, quote.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(quote.currency, quote.totalAmount)}</span>
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
            {quote.notes?.trim() ? (
              <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{quote.notes}</p>
            ) : (
              <p className="text-sm text-gray-400">No notes.</p>
            )}
          </section>
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
