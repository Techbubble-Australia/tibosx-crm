"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import {
  isTerminalTicketStatus,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_TYPES,
} from "@/lib/support-ticket-labels";
import { TicketAttachmentList } from "@/components/support-tickets/TicketAttachmentList";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { formatTicketAuditLine, type TicketAuditRow } from "@/lib/ticket-audit-display";

type Assignee = { id: string; name: string; email: string };

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  organization?: { id: string; name: string };
  createdBy?: { name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  assignedToId?: string | null;
  messages: {
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: { name: string; role: string };
  }[];
  attachments: { id: string; fileName: string; fileUrl: string; fileSize?: number | null }[];
  auditLogs?: TicketAuditRow[];
};

export function SupportTicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    void adminFetch(`/api/admin/ticketing/tickets/${ticketId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load ticket");
        setTicket(data.data as TicketDetail);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [ticketId]);

  useEffect(() => {
    reload();
    void adminFetch("/api/admin/ticketing/assignees")
      .then((res) => res.json())
      .then((data) => setAssignees((data.data as Assignee[]) ?? []));
  }, [reload]);

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/ticketing/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    const res = await adminFetch(`/api/admin/ticketing/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply, isInternal: internal }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to send message");
      return;
    }
    setReply("");
    reload();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await adminFetch(`/api/admin/ticketing/tickets/${ticketId}/attachments/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (error && !ticket) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!ticket) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const closedOrCancelled = isTerminalTicketStatus(ticket.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/support-tickets" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← All tickets
      </Link>

      <div>
        <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ticket.organization?.name ?? "—"}
          {ticket.createdBy ? ` · opened by ${ticket.createdBy.name}` : ""}
        </p>
        <p className="text-xs text-gray-400">
          Created {new Date(ticket.createdAt).toLocaleString()} · Updated {new Date(ticket.updatedAt).toLocaleString()}
          {ticket.closedAt ? ` · Closed ${new Date(ticket.closedAt).toLocaleString()}` : ""}
        </p>
      </div>

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Status">
          <div className="mt-1">
            <TicketStatusBadge status={ticket.status} />
          </div>
        </Field>
        <Field label="Priority">
          <select
            disabled={saving || closedOrCancelled}
            value={ticket.priority}
            onChange={(e) => void patch({ priority: e.target.value })}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            disabled={saving || closedOrCancelled}
            value={ticket.type}
            onChange={(e) => void patch({ type: e.target.value })}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>{TICKET_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Assigned to">
          <select
            disabled={saving || closedOrCancelled}
            value={ticket.assignedToId ?? ""}
            onChange={(e) => void patch({ assignedToId: e.target.value || null })}
            className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{ticket.description}</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Attachments</h2>
          {closedOrCancelled ? null : (
            <label className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              {uploading ? "Uploading…" : "Add file"}
              <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
            </label>
          )}
        </div>
        <TicketAttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Conversation</h2>
        {ticket.messages.length === 0 ? (
          <p className="mb-4 text-sm text-gray-500">No messages yet. Reply to the client below.</p>
        ) : (
          <ul className="mb-4 space-y-3">
            {ticket.messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg p-3 text-sm ${m.isInternal ? "bg-amber-50 dark:bg-amber-950/40" : "bg-gray-50 dark:bg-gray-800"}`}
              >
                <p className="text-xs text-gray-500">
                  {m.author.name} ({m.author.role}) · {new Date(m.createdAt).toLocaleString()}
                  {m.isInternal ? " · Internal note" : " · Visible to client"}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
        {closedOrCancelled ? (
          <p className="border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800">
            This ticket is closed or cancelled. No further replies or uploads are allowed.
          </p>
        ) : (
          <form onSubmit={sendReply} className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <textarea
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to client or add an internal note…"
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Internal note (not visible to client)
            </label>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
            >
              Send message
            </button>
          </form>
        )}
      </section>

      {ticket.auditLogs && ticket.auditLogs.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 font-semibold">Activity log</h2>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {ticket.auditLogs.map((log) => (
              <li key={log.id}>
                {new Date(log.createdAt).toLocaleString()} — {formatTicketAuditLine(log)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  );
}
