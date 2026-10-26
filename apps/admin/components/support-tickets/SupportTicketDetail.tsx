"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import {
  isTerminalTicketStatus,
  ticketAllowsAssignToMe,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_TYPES,
} from "@/lib/support-ticket-labels";
import { TicketAttachmentList } from "@/components/support-tickets/TicketAttachmentList";
import { TicketLifecycleActions } from "@/components/workspace/TicketLifecycleActions";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { type TicketAuditRow } from "@/lib/ticket-audit-display";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { TicketEditableSubject } from "@/components/support-tickets/TicketEditableSubject";
import { TicketResolutionNotesSection } from "@/components/support-tickets/TicketResolutionNotesSection";
import { TicketRecordLayout, TicketAttributeField } from "@/components/support-tickets/TicketRecordLayout";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Assignee = { id: string; name: string; email: string };

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  resolutionNotes?: string | null;
  projectLabel?: string | null;
  projectId?: string | null;
  organization?: { id: string; name: string };
  createdBy?: { id?: string; name: string; email: string };
  updatedBy?: { id?: string; name: string; email: string } | null;
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
  const { impersonation, canManageProjects, role: sessionRole } = useAdminSession();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [session, setSession] = useState<{
    ticketingUserId: string;
    role: string | null;
    consultantVerified: boolean;
  } | null>(null);

  const reload = useCallback(() => {
    void adminFetch(`/api/admin/ticketing/tickets/${ticketId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load ticket");
        const row = data.data as TicketDetail;
        setTicket(row);
        setResolutionNotes(row.resolutionNotes ?? "");
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [ticketId]);

  useEffect(() => {
    reload();
    void adminFetch("/api/admin/ticketing/session")
      .then((res) => res.json())
      .then((data) => {
        const row = data.data as { ticketingUserId: string; role: string | null; consultantVerified: boolean };
        setSession(row);
      })
      .catch(() => setSession(null));
    void adminFetch(`/api/admin/ticketing/assignees?ticketId=${encodeURIComponent(ticketId)}`)
      .then((res) => res.json())
      .then((data) => setAssignees((data.data as Assignee[]) ?? []));
  }, [reload, ticketId]);

  async function runLifecycle(action: string, payload?: { resolutionNotes?: string }) {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/ticketing/tickets/${ticketId}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      reload();
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

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
      appAlert(e instanceof Error ? e.message : "Update failed");
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
      appAlert(data.error || "Failed to send message");
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
      appAlert(err instanceof Error ? err.message : "Upload failed");
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
  const staffImpersonating = Boolean(impersonation);
  const portalRole = staffImpersonating
    ? "CONSULTANT"
    : session?.role === "CONSULTANT" && session.consultantVerified
      ? "CONSULTANT"
      : "CLIENT";
  const canManageAssignee =
    canManageProjects ||
    sessionRole === "customer_support" ||
    sessionRole === "admin" ||
    staffImpersonating ||
    (portalRole === "CONSULTANT" && !closedOrCancelled);
  const showAssignToMe =
    ticketAllowsAssignToMe(ticket?.status ?? "") &&
    canManageAssignee &&
    Boolean(session?.ticketingUserId) &&
    ticket?.assignedToId !== session?.ticketingUserId;
  const isCreator = staffImpersonating
    ? false
    : Boolean(
        session?.ticketingUserId &&
          (ticket.createdById === session.ticketingUserId || ticket.createdBy?.id === session.ticketingUserId),
      );
  const statusKey = normalizeTicketStatusKey(ticket.status);
  const canEditResolutionNotes =
    portalRole === "CONSULTANT" && !closedOrCancelled && statusKey === "IN_PROGRESS";
  const projectLine = ticket.projectLabel?.trim() || null;
  const projectHref =
    ticket.projectId && canManageProjects ? `/projects/${ticket.projectId}` : null;

  const headerActions = !closedOrCancelled ? (
    <>
      <TicketLifecycleActions
        status={ticket.status}
        role={portalRole}
        isCreator={isCreator}
        disabled={saving}
        resolutionNotes={resolutionNotes}
        onAction={runLifecycle}
      />
      {showAssignToMe ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void patch({ assignedToId: session!.ticketingUserId })}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
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
          { label: "Support", href: "/support-tickets" },
          { label: "Tickets", href: "/support-tickets" },
          { label: ticket.ticketNumber },
        ]}
        ticketNumber={ticket.ticketNumber}
        subject={
          <TicketEditableSubject
            subject={ticket.subject}
            disabled={closedOrCancelled || saving}
            onSave={(subject) => patch({ subject })}
          />
        }
        status={ticket.status}
        projectLabel={projectLine}
        projectHref={projectHref}
        headerActions={headerActions}
        createdBy={ticket.createdBy}
        createdAt={ticket.createdAt}
        updatedAt={ticket.updatedAt}
        updatedBy={ticket.updatedBy}
        auditLogs={ticket.auditLogs}
        attributesBar={
          <>
            <TicketAttributeField label="Type">
              <select
                disabled={saving || closedOrCancelled}
                value={ticket.type}
                onChange={(e) => void patch({ type: e.target.value })}
                className="w-full rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>{TICKET_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </TicketAttributeField>
            <TicketAttributeField label="Priority">
              <div className="flex items-center gap-2">
                <TicketPriorityBadge priority={ticket.priority} />
                <select
                  disabled={saving || closedOrCancelled}
                  value={ticket.priority}
                  onChange={(e) => void patch({ priority: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </TicketAttributeField>
            <TicketAttributeField label="Status">
              <TicketStatusBadge status={ticket.status} />
            </TicketAttributeField>
            <TicketAttributeField label="Assigned to">
              {canManageAssignee ? (
                <select
                  disabled={saving || closedOrCancelled}
                  value={ticket.assignedToId ?? ""}
                  onChange={(e) => void patch({ assignedToId: e.target.value || null })}
                  className="w-full rounded-lg border px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {ticket.assignedTo?.name ?? "Unassigned"}
                </p>
              )}
            </TicketAttributeField>
          </>
        }
        description={
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Description</h2>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{ticket.description}</p>
          </>
        }
        attachments={
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Attachments</h2>
              {closedOrCancelled ? null : (
                <label className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {uploading ? "Uploading…" : "+ Add file"}
                  <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <TicketAttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
          </>
        }
        conversation={
          <>
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
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
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
            onSaveDraft={() => patch({ resolutionNotes: resolutionNotes.trim() || null })}
          />
        }
      />
    </div>
  );
}
