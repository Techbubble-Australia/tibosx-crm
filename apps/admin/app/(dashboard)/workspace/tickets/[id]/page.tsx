"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { workspaceFetch } from "@/lib/workspace-fetch";
import {
  isTerminalTicketStatus,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_TYPES,
  CLIENT_REQUEST_TYPES,
} from "@/lib/support-ticket-labels";
import { TicketAttachmentList } from "@/components/workspace/TicketAttachmentList";
import { TicketLifecycleActions } from "@/components/workspace/TicketLifecycleActions";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { formatTicketAuditLine, type TicketAuditRow } from "@/lib/ticket-audit-display";

type Message = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { name: string; role: string };
};

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdById: string;
  organization?: { name: string };
  messages: Message[];
  attachments: { id: string; fileName: string; fileUrl: string; fileSize?: number | null }[];
  auditLogs?: TicketAuditRow[];
};

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    void workspaceFetch(`/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const t = data.data as TicketDetail;
        setTicket(t);
        setDescription(t.description);
      });
  }

  useEffect(() => {
    reload();
    void workspaceFetch("/auth/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data as { id: string; role: string }));
  }, [id]);

  async function savePatch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await workspaceFetch(`/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Update failed");
      return;
    }
    reload();
  }

  async function runLifecycle(action: string) {
    setSaving(true);
    const res = await workspaceFetch(`/tickets/${id}/lifecycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Action failed");
      return;
    }
    reload();
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await workspaceFetch(`/tickets/${id}/attachments/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      reload();
    } catch {
      alert("Could not upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const res = await workspaceFetch(`/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply, isInternal: internal }),
    });
    if (!res.ok) {
      alert("Failed to send message");
      return;
    }
    setReply("");
    reload();
  }

  if (!ticket) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const isConsultant = me?.role === "CONSULTANT";
  const isClient = me?.role === "CLIENT";
  const isCreator = Boolean(me?.id && ticket.createdById === me.id);
  const canEditTypePriority = isClient || isConsultant;
  const canEditDescription = isClient || isConsultant;
  const typeOptions = isClient ? CLIENT_REQUEST_TYPES : TICKET_TYPES.map((t) => ({ value: t, label: TICKET_TYPE_LABELS[t] }));
  const closedOrCancelled = isTerminalTicketStatus(ticket.status);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
        <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        {ticket.organization ? <p className="text-sm text-gray-500">{ticket.organization.name}</p> : null}
      </div>

      {!closedOrCancelled ? (
        <TicketLifecycleActions
          status={ticket.status}
          role={me?.role ?? ""}
          isCreator={isCreator}
          disabled={saving}
          onAction={runLifecycle}
        />
      ) : null}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Type</p>
          {canEditTypePriority && !closedOrCancelled ? (
            <select
              value={ticket.type}
              disabled={saving}
              onChange={(e) => void savePatch({ type: e.target.value })}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            >
              {typeOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm">{TICKET_TYPE_LABELS[ticket.type]}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Priority</p>
          {canEditTypePriority && !closedOrCancelled ? (
            <select
              value={ticket.priority}
              disabled={saving}
              onChange={(e) => void savePatch({ priority: e.target.value })}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm">{TICKET_PRIORITY_LABELS[ticket.priority]}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <div className="mt-1">
            <TicketStatusBadge status={ticket.status} />
            <span className="sr-only">{TICKET_STATUS_LABELS[ticket.status]}</span>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Description</h2>
        {canEditDescription && !closedOrCancelled ? (
          <div className="space-y-2">
            <textarea
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              type="button"
              disabled={saving || description === ticket.description}
              onClick={() => void savePatch({ description })}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Save description
            </button>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Attachments</h2>
          {!closedOrCancelled ? (
            <label className="cursor-pointer text-sm font-medium text-sky-600 hover:underline">
              {uploading ? "Uploading…" : "Add file"}
              <input type="file" className="hidden" onChange={onUploadFile} disabled={uploading} />
            </label>
          ) : null}
        </div>
        <TicketAttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 font-semibold">Conversation</h2>
        <ul className="mb-4 space-y-3">
          {ticket.messages.map((m) => (
            <li key={m.id} className={`rounded-lg p-3 text-sm ${m.isInternal ? "bg-amber-50" : "bg-gray-50"}`}>
              <p className="mb-1 text-xs text-gray-500">
                {m.author.name} · {new Date(m.createdAt).toLocaleString()}
                {m.isInternal ? " · Internal" : ""}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
        {closedOrCancelled ? (
          <p className="text-sm text-gray-500">This ticket is closed or cancelled. No further replies are allowed.</p>
        ) : (
          <form onSubmit={sendMessage} className="space-y-2">
            <textarea
              required
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Write a reply…"
            />
            {isConsultant ? (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Internal note (not visible to client)
              </label>
            ) : null}
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Send</button>
          </form>
        )}
      </section>

      {ticket.auditLogs && ticket.auditLogs.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Activity log</h2>
          <ul className="space-y-1 text-xs text-gray-600">
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
