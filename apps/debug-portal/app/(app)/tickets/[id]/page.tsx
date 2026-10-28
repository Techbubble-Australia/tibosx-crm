"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  statusBadgeClass,
  resolveScreenshotUrl,
  type TicketStatus,
} from "@/lib/tickets";

type TicketDetail = {
  id: string;
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  userDescription: string;
  reporterEmail: string;
  reporterRole: string;
  currentUrl: string;
  userAgent: string;
  screenshotUrl: string | null;
  elementDiagnostics: unknown;
  apiPrerequisite: unknown;
  fullPayload: unknown;
  createdAt: string;
};

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [row, setRow] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<TicketStatus>("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      const ticket = data.data as TicketDetail;
      setRow(ticket);
      setStatus(ticket.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus() {
    if (!row) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setRow(data.data as TicketDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-3">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-red-600">{error || "Ticket not found"}</p>
      </div>
    );
  }

  const shot = resolveScreenshotUrl(row.screenshotUrl);

  return (
    <div className="space-y-6">
      <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        All tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{row.ticketId}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {row.type} · {row.reportedEnvironment} · {new Date(row.createdAt).toLocaleString("en-AU")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {row.reporterEmail} ({row.reporterRole})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}>
            {TICKET_STATUS_LABELS[row.status]}
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving || status === row.status}
            onClick={() => void saveStatus()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update status"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{row.userDescription}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Page URL</h2>
        <a href={row.currentUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-sky-700">
          {row.currentUrl}
        </a>
      </section>

      {shot ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt="Capture" className="max-h-[480px] max-w-full rounded border border-slate-100" />
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Element / screen metadata</h2>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(row.elementDiagnostics, null, 2)}
        </pre>
      </section>

      {row.apiPrerequisite ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">API prerequisite</h2>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(row.apiPrerequisite, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Full payload</h2>
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(row.fullPayload, null, 2)}
        </pre>
      </section>

      <p className="text-xs text-slate-500 break-all">User agent: {row.userAgent}</p>
    </div>
  );
}
