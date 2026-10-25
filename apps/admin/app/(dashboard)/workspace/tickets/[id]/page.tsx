"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { workspaceFetch } from "@/lib/workspace-fetch";
import {
  isTerminalTicketStatus,
  ticketAllowsAssignToMe,
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
import { type TicketAuditRow } from "@/lib/ticket-audit-display";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { TicketEditableSubject } from "@/components/support-tickets/TicketEditableSubject";
import { TicketResolutionNotesSection } from "@/components/support-tickets/TicketResolutionNotesSection";
import { TicketRecordLayout, TicketAttributeField } from "@/components/support-tickets/TicketRecordLayout";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Message = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { name: string; role: string };
};

type Assignee = { id: string; name: string; email: string };

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdById: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  updatedBy?: { name: string; email: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  organization?: { name: string };
  projectLabel?: string | null;
  projectId?: string | null;
  resolutionNotes?: string | null;
  messages: Message[];
  attachments: { id: string; fileName: string; fileUrl: string; fileSize?: number | null }[];
  auditLogs?: TicketAuditRow[];
};

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { impersonation } = useAdminSession();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState("");

  function reload() {
    void workspaceFetch(`/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const t = data.data as TicketDetail;
        setTicket(t);
        setDescription(t.description);
        setResolutionNotes(t.resolutionNotes ?? "");
      });
  }

  useEffect(() => {
    reload();
    void workspaceFetch("/auth/me")
      .then((res) => res.json())
      .then((data) => setMe(data.data as { id: string; role: string }));
  }, [id]);

  useEffect(() => {
    void workspaceFetch(`/tickets/assignees?ticketId=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = await res.json();
        const list = (data.data as Assignee[]) ?? [];
        if (list.length > 0) {
          setAssignees(list);
          return;
        }
        if (!res.ok) {
          setAssignees([]);
          return;
        }
        const fallback = await adminFetch(`/api/admin/ticketing/assignees?ticketId=${encodeURIComponent(id)}`);
        const fallbackData = await fallback.json();
        setAssignees((fallbackData.data as Assignee[]) ?? []);
      })
      .catch(() => setAssignees([]));
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

  async function runLifecycle(action: string, payload?: { resolutionNotes?: string }) {
    setSaving(true);
    const res = await workspaceFetch(`/tickets/${id}/lifecycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
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

  const staffImpersonating = Boolean(impersonation);
  const lifecycleRole =
    staffImpersonating || me?.role === "CONSULTANT" ? "CONSULTANT" : (me?.role ?? "");
  const isConsultant = lifecycleRole === "CONSULTANT";
  const isClient = lifecycleRole === "CLIENT";
  const isCreator = staffImpersonating ? false : Boolean(me?.id && ticket.createdById === me.id);
  const canEditTypePriority = isClient || isConsultant;
  const canEditDescription = isClient || isConsultant;
  const canEditAssignee = isConsultant || staffImpersonating;
  const typeOptions = isClient ? CLIENT_REQUEST_TYPES : TICKET_TYPES.map((t) => ({ value: t, label: TICKET_TYPE_LABELS[t] }));
  const closedOrCancelled = isTerminalTicketStatus(ticket.status);
  const showAssignToMe =
    ticketAllowsAssignToMe(ticket.status) &&
    canEditAssignee &&
    Boolean(me?.id) &&
    ticket.assignedToId !== me?.id;
  const statusKey = normalizeTicketStatusKey(ticket.status);
  const canEditResolutionNotes =
    isConsultant && !closedOrCancelled && statusKey === "IN_PROGRESS";
  const projectLine = ticket.projectLabel?.trim() || null;

  const headerActions = !closedOrCancelled ? (
    <>
      <TicketLifecycleActions
        status={ticket.status}
        role={lifecycleRole}
        isCreator={isCreator}
        disabled={saving}
        resolutionNotes={resolutionNotes}
        onAction={runLifecycle}
      />
      {showAssignToMe ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void savePatch({ assignedToId: me!.id })}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50"
        >
          Assign to me
        </button>
      ) : null}
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <TicketRecordLayout
        breadcrumbs={[
          { label: "Support", href: "/workspace/tickets" },
          { label: "Tickets", href: "/workspace/tickets" },
          { label: ticket.ticketNumber },
        ]}
        ticketNumber={ticket.ticketNumber}
        subject={
          <TicketEditableSubject
            subject={ticket.subject}
            disabled={closedOrCancelled || saving}
            onSave={(subject) => savePatch({ subject })}
          />
        }
        status={ticket.status}
        projectLabel={projectLine}
        headerActions={headerActions}
        createdBy={ticket.createdBy}
        createdAt={ticket.createdAt}
        updatedAt={ticket.updatedAt}
        updatedBy={ticket.updatedBy}
        auditLogs={ticket.auditLogs}
        attributesBar={
          <>
            <TicketAttributeField label="Type">
              {canEditTypePriority && !closedOrCancelled ? (
                <select
                  value={ticket.type}
                  disabled={saving}
                  onChange={(e) => void savePatch({ type: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm"
                >
                  {typeOptions.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm">{TICKET_TYPE_LABELS[ticket.type]}</p>
              )}
            </TicketAttributeField>
            <TicketAttributeField label="Priority">
              {canEditTypePriority && !closedOrCancelled ? (
                <div className="flex items-center gap-2">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <select
                    value={ticket.priority}
                    disabled={saving}
                    onChange={(e) => void savePatch({ priority: e.target.value })}
                    className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <TicketPriorityBadge priority={ticket.priority} />
              )}
            </TicketAttributeField>
            <TicketAttributeField label="Status">
              <TicketStatusBadge status={ticket.status} />
              <span className="sr-only">{TICKET_STATUS_LABELS[ticket.status]}</span>
            </TicketAttributeField>
            <TicketAttributeField label="Assigned to">
              {canEditAssignee && !closedOrCancelled ? (
                <select
                  value={ticket.assignedToId ?? ""}
                  disabled={saving}
                  onChange={(e) => void savePatch({ assignedToId: e.target.value || null })}
                  className="w-full rounded border px-2 py-1 text-sm"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm">{ticket.assignedTo?.name ?? "Unassigned"}</p>
              )}
            </TicketAttributeField>
          </>
        }
        description={
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Description</h2>
              {canEditDescription && !closedOrCancelled ? (
                <button
                  type="button"
                  disabled={saving || description === ticket.description}
                  onClick={() => void savePatch({ description })}
                  className="text-sm font-medium text-sky-600 hover:underline disabled:opacity-50"
                >
                  Save
                </button>
              ) : null}
            </div>
            {canEditDescription && !closedOrCancelled ? (
              <textarea
                rows={5}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
            )}
          </>
        }
        attachments={
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Attachments</h2>
              {!closedOrCancelled ? (
                <label className="cursor-pointer text-sm font-medium text-sky-600 hover:underline">
                  {uploading ? "Uploading…" : "+ Add file"}
                  <input type="file" className="hidden" onChange={onUploadFile} disabled={uploading} />
                </label>
              ) : null}
            </div>
            <TicketAttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
          </>
        }
        conversation={
          <>
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
              <form onSubmit={sendMessage} className="space-y-2 border-t border-gray-100 pt-4">
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
                    Internal note
                  </label>
                ) : null}
                <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
                  Send
                </button>
              </form>
            )}
          </>
        }
        resolution={
          <TicketResolutionNotesSection
            notes={resolutionNotes}
            status={ticket.status}
            canEdit={canEditResolutionNotes}
            disabled={saving}
            onNotesChange={setResolutionNotes}
            showSaveDraft={
              canEditResolutionNotes && resolutionNotes.trim() !== (ticket.resolutionNotes ?? "").trim()
            }
            onSaveDraft={() => savePatch({ resolutionNotes: resolutionNotes.trim() || null })}
          />
        }
      />
    </div>
  );
}
