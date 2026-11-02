"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { StatusSelect } from "@/components/StatusSelect";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { buildAgentIssuePrompt, resolveTicketScreenshotUrl } from "@/lib/agent-prompt";
import {
  TICKET_STATUS_LABELS,
  formatEnvironment,
  formatTicketType,
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
    <div className="grid gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
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
      setCopyHint("Copy failed — try selecting the text manually.");
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
      <div className="dp-card flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-label="Loading ticket" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-4">
        <PageHeader backHref="/tickets" backLabel="All tickets" title="Ticket not found" />
        <p className="text-sm text-red-700" role="alert">
          {error || "This ticket does not exist or you do not have access."}
        </p>
      </div>
    );
  }

  const metaLine = `${formatTicketType(row.type)} · ${formatEnvironment(row.reportedEnvironment)} · ${new Date(row.createdAt).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;

  return (
    <div className="space-y-6">
      <PageHeader title={row.ticketId} description={metaLine} backHref="/tickets" backLabel="All tickets" />

      <div className="dp-card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Workflow status</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
          >
            {TICKET_STATUS_LABELS[row.status]}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <StatusSelect value={status} onChange={setStatus} aria-label="Change ticket status" />
          <button
            type="button"
            disabled={saving || status === row.status}
            onClick={() => void saveStatus()}
            className="dp-btn-primary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Save status
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {copyHint ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800" role="status">
          {copyHint}
        </p>
      ) : null}

      <SectionCard title="Description">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {row.userDescription.trim() || "No description provided."}
        </p>
      </SectionCard>

      <SectionCard title="Screenshot">
        {shot ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <a href={shot} target="_blank" rel="noreferrer" className="dp-btn-secondary py-2">
                Open full size
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
              <button type="button" onClick={() => void downloadScreenshot()} className="dp-btn-secondary py-2">
                <Download className="h-4 w-4" aria-hidden />
                Download
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot}
              alt="Debug capture screenshot"
              className="max-h-[min(520px,70vh)] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
            />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600">
            No screenshot attached. Captures from TBOS debug mode include an image when you submit; manual tickets
            can add one when creating the ticket.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Capture overview">
        <dl className="space-y-3">
          <DetailRow label="Reporter">
            {row.reporterEmail}
            <span className="block text-xs text-slate-500">{row.reporterRole}</span>
          </DetailRow>
          {row.currentUrl ? (
            <DetailRow label="Page URL">
              <a
                href={row.currentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-1 break-all text-sky-700 hover:text-sky-800 hover:underline"
              >
                {row.currentUrl}
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
            </DetailRow>
          ) : (
            <DetailRow label="Page URL">
              <span className="text-slate-500">Not recorded</span>
            </DetailRow>
          )}
          <DetailRow label="User agent">
            <span className="break-all text-xs leading-relaxed text-slate-600">{row.userAgent || "—"}</span>
          </DetailRow>
        </dl>
      </SectionCard>

      <SectionCard title="Element / screen context">
        {el.captureScope === "manual" ? (
          <p className="text-sm text-slate-600">
            Created manually in the debug portal (not from an in-app element capture).
          </p>
        ) : el.cssSelector || el.tagName ? (
          <dl className="space-y-3">
            {el.captureScope ? <DetailRow label="Scope">{el.captureScope}</DetailRow> : null}
            {el.tagName ? <DetailRow label="Tag">{el.tagName}</DetailRow> : null}
            {el.id ? <DetailRow label="Element id">{el.id}</DetailRow> : null}
            {el.className ? <DetailRow label="Classes">{el.className}</DetailRow> : null}
            {el.cssSelector ? (
              <DetailRow label="Selector">
                <code className="block break-all rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-800">
                  {el.cssSelector}
                </code>
              </DetailRow>
            ) : null}
            {el.innerText ? <DetailRow label="Visible text">{el.innerText}</DetailRow> : null}
            {el.boundingRect ? (
              <DetailRow label="Bounds">
                top {el.boundingRect.top}, left {el.boundingRect.left}, {el.boundingRect.width}×
                {el.boundingRect.height} px
              </DetailRow>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-slate-600">No element diagnostics recorded.</p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">Raw JSON</summary>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(row.elementDiagnostics, null, 2)}
          </pre>
        </details>
      </SectionCard>

      {api?.endpoint ? (
        <SectionCard title="API prerequisite">
          <dl className="space-y-3">
            <DetailRow label="Request">
              <code className="text-xs">
                {api.method ?? "GET"} {api.endpoint}
              </code>
            </DetailRow>
            {api.status != null ? <DetailRow label="HTTP status">{api.status}</DetailRow> : null}
            {typeof api.latencyMs === "number" ? <DetailRow label="Latency">{api.latencyMs} ms</DetailRow> : null}
            {api.captureSource ? <DetailRow label="Source">{api.captureSource}</DetailRow> : null}
          </dl>
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(api.payloadCaptured, null, 2)}
          </pre>
        </SectionCard>
      ) : null}

      <SectionCard title="AI agent brief">
        <p className="text-sm text-slate-600">
          Copy this into Cursor or another coding agent for context, reproduction steps, and fix guidance.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyText(agentPrompt, "Agent brief copied.")}
            className="dp-btn-secondary py-2"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Copy for agent
          </button>
          <button
            type="button"
            onClick={() => setAgentPrompt(buildAgentIssuePrompt(row))}
            className="dp-btn-secondary py-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Regenerate
          </button>
        </div>
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-violet-500" aria-hidden />
          <textarea
            readOnly
            value={agentPrompt}
            rows={16}
            aria-label="AI agent brief"
            className="dp-input min-h-[12rem] resize-y py-2 pl-9 font-mono text-xs leading-relaxed"
          />
        </div>
      </SectionCard>

      <SectionCard title="Full payload">
        <button
          type="button"
          onClick={() => void copyText(JSON.stringify(row.fullPayload, null, 2), "Full JSON copied.")}
          className="dp-btn-secondary py-2"
        >
          <Copy className="h-4 w-4" aria-hidden />
          Copy JSON
        </button>
        <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(row.fullPayload, null, 2)}
        </pre>
      </SectionCard>
    </div>
  );
}
