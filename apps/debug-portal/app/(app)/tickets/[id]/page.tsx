"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { StatusSelect } from "@/components/StatusSelect";
import { buildAgentIssuePrompt, resolveTicketScreenshotUrl } from "@/lib/agent-prompt";
import {
  TICKET_STATUS_LABELS,
  statusBadgeClass,
  type TicketStatus,
} from "@/lib/tickets";

type TicketDetail = {
  id: string;
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  userDescription: string;
  reporterUserId: string;
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

type ElementDiagnosticsShape = {
  tagName?: string;
  id?: string | null;
  className?: string | null;
  cssSelector?: string;
  innerText?: string | null;
  captureScope?: string;
  boundingRect?: { top: number; left: number; width: number; height: number };
};

type ApiPrerequisiteShape = {
  endpoint?: string;
  method?: string;
  status?: number | null;
  latencyMs?: number;
  captureSource?: string;
  payloadCaptured?: unknown;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [row, setRow] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<TicketStatus>("PENDING");
  const [copyHint, setCopyHint] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");

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
      setAgentPrompt(buildAgentIssuePrompt(ticket));
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

  const shot = useMemo(() => (row ? resolveTicketScreenshotUrl(row) : null), [row]);

  const el = (row?.elementDiagnostics ?? {}) as ElementDiagnosticsShape;
  const api = (row?.apiPrerequisite ?? null) as ApiPrerequisiteShape | null;

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
      const updated = data.data as TicketDetail;
      setRow(updated);
      setAgentPrompt(buildAgentIssuePrompt(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(label);
      window.setTimeout(() => setCopyHint(""), 2000);
    } catch {
      setCopyHint("Copy failed");
    }
  }

  async function downloadScreenshot() {
    if (!shot || !row) return;
    setCopyHint("");
    try {
      const res = await fetch(shot, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${row.ticketId.replace(/[^\w.-]+/g, "_")}-screenshot.png`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setCopyHint("Screenshot downloaded.");
      window.setTimeout(() => setCopyHint(""), 2000);
    } catch {
      setCopyHint("Could not download screenshot.");
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}>
            {TICKET_STATUS_LABELS[row.status]}
          </span>
          <StatusSelect value={status} onChange={setStatus} aria-label="Ticket status" />
          <button
            type="button"
            disabled={saving || status === row.status}
            onClick={() => void saveStatus()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update status"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {copyHint ? <p className="text-sm text-emerald-700">{copyHint}</p> : null}

      <Section title="Capture overview">
        <dl className="space-y-2">
          <DetailRow label="Reporter">
            {row.reporterEmail} · {row.reporterRole}
            <span className="block text-xs text-slate-500">User id: {row.reporterUserId}</span>
          </DetailRow>
          <DetailRow label="Page URL">
            <a
              href={row.currentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 break-all text-sky-700 hover:underline"
            >
              {row.currentUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </DetailRow>
          <DetailRow label="User agent">
            <span className="break-all text-xs text-slate-600">{row.userAgent}</span>
          </DetailRow>
        </dl>
      </Section>

      <Section title="Screenshot">
        {shot ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <a
                href={shot}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-sky-700 hover:bg-slate-50"
              >
                Open full size
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => void downloadScreenshot()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download screenshot
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot}
              alt="Debug capture screenshot"
              className="max-h-[520px] w-full max-w-full rounded-lg border border-slate-100 object-contain bg-slate-50"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No screenshot on this ticket. Captures from TBOS debug mode upload an image when you submit; older tickets
            may only have JSON metadata.
          </p>
        )}
      </Section>

      <Section title="Description">
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {row.userDescription.trim() || "(No description.)"}
        </p>
      </Section>

      <Section title="Element / screen context">
        {el.cssSelector || el.tagName ? (
          <dl className="space-y-2">
            {el.captureScope ? <DetailRow label="Scope">{el.captureScope}</DetailRow> : null}
            {el.tagName ? <DetailRow label="Tag">{el.tagName}</DetailRow> : null}
            {el.id ? <DetailRow label="Id">{el.id}</DetailRow> : null}
            {el.className ? <DetailRow label="Classes">{el.className}</DetailRow> : null}
            {el.cssSelector ? (
              <DetailRow label="Selector">
                <code className="block break-all rounded bg-slate-100 px-2 py-1 text-xs">{el.cssSelector}</code>
              </DetailRow>
            ) : null}
            {el.innerText ? <DetailRow label="Text">{el.innerText}</DetailRow> : null}
            {el.boundingRect ? (
              <DetailRow label="Rect">
                top {el.boundingRect.top}, left {el.boundingRect.left}, {el.boundingRect.width}×
                {el.boundingRect.height} px
              </DetailRow>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-slate-600">No element diagnostics recorded.</p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Raw JSON</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(row.elementDiagnostics, null, 2)}
          </pre>
        </details>
      </Section>

      {api?.endpoint ? (
        <Section title="API prerequisite">
          <dl className="space-y-2">
            <DetailRow label="Request">
              <code className="text-xs">
                {api.method ?? "GET"} {api.endpoint}
              </code>
            </DetailRow>
            {api.status != null ? <DetailRow label="Status">{api.status}</DetailRow> : null}
            {typeof api.latencyMs === "number" ? <DetailRow label="Latency">{api.latencyMs} ms</DetailRow> : null}
            {api.captureSource ? <DetailRow label="Source">{api.captureSource}</DetailRow> : null}
          </dl>
          <pre className="max-h-64 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(api.payloadCaptured, null, 2)}
          </pre>
        </Section>
      ) : null}

      <Section title="AI agent brief">
        <p className="text-sm text-slate-600">
          Structured summary for Cursor or another coding agent: context, reproduction hints, API snapshot, and fix
          instructions.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText(agentPrompt, "Agent brief copied.")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
            Copy for agent
          </button>
          <button
            type="button"
            onClick={() => setAgentPrompt(buildAgentIssuePrompt(row))}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        </div>
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-violet-500" aria-hidden />
          <textarea
            readOnly
            value={agentPrompt}
            rows={16}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 font-mono text-xs leading-relaxed text-slate-800"
          />
        </div>
      </Section>

      <Section title="Full payload">
        <button
          type="button"
          onClick={() => void copyText(JSON.stringify(row.fullPayload, null, 2), "Full JSON copied.")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" />
          Copy JSON
        </button>
        <pre className="max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(row.fullPayload, null, 2)}
        </pre>
      </Section>
    </div>
  );
}
