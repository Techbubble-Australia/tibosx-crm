"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { formatCrmMoney } from "@/lib/crm-format";
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
  owner?: { id: string; name: string; email: string } | null;
  lines: Array<{
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }>;
};


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

  const cardClass =
    "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900";
  const statusLabel = quote.status.charAt(0) + quote.status.slice(1).toLowerCase();
  const statusPill =
    quote.status === "ACCEPTED"
      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : quote.status === "REJECTED" || quote.status === "EXPIRED"
        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        : quote.status === "SENT"
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <ClientsOnlyGuard>
      <div className="max-w-6xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="flex items-start gap-3">
            <Link href="/quotes" className="mt-1 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Back to quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Quote {quote.quoteNumber}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-500">
                <span>{quote.client?.name ?? "—"}</span>
                {quote.opportunity ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      linked to{" "}
                      <Link
                        href={`/opportunities/${quote.opportunity.id}`}
                        className="hover:underline"
                      >
                        {quote.opportunity.name}
                      </Link>
                    </span>
                  </>
                ) : null}
                <span aria-hidden>·</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPill}`}>
                  {statusLabel}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={previewPdf}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-800"
            >
              Preview PDF
            </button>
            {quote.status !== "ACCEPTED" ? (
              <button
                type="button"
                disabled={accepting}
                onClick={() => void acceptQuote()}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-800"
              >
                {accepting ? "Accepting…" : "Accept & create contract"}
              </button>
            ) : null}
            {quote.status === "DRAFT" || quote.status === "SENT" ? (
              <button
                type="button"
                disabled={sending || quote.status === "SENT"}
                onClick={() => void sendForAcceptance()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {quote.status === "SENT" ? "Sent" : sending ? "Sending…" : "Send for acceptance"}
              </button>
            ) : null}
          </div>
        </div>

        <div id="quote-print" className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="hidden print:col-span-3 print:block">
            <h2 className="text-lg font-semibold text-gray-900">Quote {quote.quoteNumber}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {quote.client?.name ?? "—"} · {statusLabel}
            </p>
          </div>

          <section className={`${cardClass} lg:col-span-2`}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Line items</h3>
            <p className="mb-3 text-xs text-gray-500">
              Prices in {quote.currency}. Workspace currency and tax rules apply.
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {quote.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">{line.description}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">{line.qty}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                        {formatCrmMoney(line.unitPrice, quote.currency)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                        {formatCrmMoney(line.amount, quote.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 text-right text-sm text-gray-600 dark:text-gray-400">
              <p className="tabular-nums">Subtotal {formatCrmMoney(quote.subtotal, quote.currency)}</p>
              <p className="tabular-nums">
                GST {quote.taxRate}% {formatCrmMoney(quote.taxAmount, quote.currency)}
              </p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                Total {formatCrmMoney(quote.totalAmount, quote.currency)}
              </p>
            </div>
          </section>

          <div className="space-y-5">
            <section className={cardClass}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Details</h3>
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Valid until</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(quote.validUntil)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Terms</dt>
                  {/* Quote has no dedicated terms field yet; notes hold the terms text. */}
                  <dd className="whitespace-pre-wrap font-medium text-gray-900 dark:text-gray-100">
                    {quote.notes?.trim() ? quote.notes : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Prepared by</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{quote.owner?.name ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className={`${cardClass} print:hidden`}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">On acceptance</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700 dark:text-gray-300">
                <li>Opportunity moves to Verbal yes</li>
                <li>Draft contract is created</li>
                <li>Client portal shows the signed quote</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
