"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, ExternalLink, FileText, Loader2, Lock, Pencil, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { StatusSelect } from "@/components/StatusSelect";
import { TicketActivityLog, type TicketLogEntry } from "@/components/TicketActivityLog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { buildAgentIssuePrompt, resolveTicketScreenshotUrls } from "@/lib/agent-prompt";
import {
  MAX_TICKET_SCREENSHOTS,
  TICKET_ATTACHMENT_ACCEPT,
  attachmentLabel,
  isPdfUrl,
  uploadScreenshots,
} from "@/lib/upload-screenshot";
import { usePortalUser } from "@/lib/use-portal-user";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import { SprintSelect } from "@/components/SprintSelect";
import { BACKLOG, SPRINT_STATUS_LABELS, isSprintLocked, useSprints, type SprintStatus } from "@/lib/sprints";
import { TICKET_TITLE_MAX, formatEnvironment, memberStatusTarget, type TicketStatus } from "@/lib/tickets";
import { StatusBadge, TypeBadge } from "@/components/TicketBadges";
import { TicketComments, type TicketComment } from "@/components/TicketComments";
import { useConfirm } from "@/components/ConfirmDialog";

export type TicketDetail = {
  id: string;
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  title?: string | null;
  userDescription: string;
  reporterUserId: string;
  reporterEmail: string;
  reporterRole: string;
  currentUrl: string;
  userAgent: string;
  screenshotUrl: string | null;
  screenshotUrls?: string[];
  elementDiagnostics: unknown;
  apiPrerequisite: unknown;
  fullPayload: unknown;
  createdAt: string;
  logs?: TicketLogEntry[];
  comments?: TicketComment[];
  sprintId?: string | null;
  sprintName?: string | null;
  sprintStatus?: string | null;
};

type EditDraft = {
  type: "BUG" | "ENHANCEMENT";
  reportedEnvironment: string;
  title: string;
  userDescription: string;
  currentUrl: string;
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

type Props = {
  /** Internal ticket id (not the TICK- number). */
  id: string;
  /** "page" renders its own header with a back link; "modal" leaves the header to the modal. */
  variant?: "page" | "modal";
  backHref?: string;
  backLabel?: string;
  onLoaded?: (ticket: TicketDetail) => void;
  /** Any saved change (status, sprint, edit, screenshots, comments). */
  onChanged?: (ticket: TicketDetail) => void;
  onDeleted?: () => void;
};

export function TicketDetailView({
  id,
  variant = "page",
  backHref = "/board",
  backLabel = "Board",
  onLoaded,
  onChanged,
  onDeleted,
}: Props) {
  const inModal = variant === "modal";
  const [row, setRow] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<TicketStatus>("PENDING");
  const [copyHint, setCopyHint] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [uploadingShots, setUploadingShots] = useState(false);
  const [removingShot, setRemovingShot] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    type: "BUG",
    reportedEnvironment: "development",
    title: "",
    userDescription: "",
    currentUrl: "",
  });
  const { user, isAdmin } = usePortalUser();
  const { labelOf } = useTicketStatuses();
  const { sprints, reload: reloadSprints } = useSprints();
  const [savingSprint, setSavingSprint] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();

  async function deleteTicket() {
    if (!row) return;
    const ok = await confirm({
      title: `Delete ${row.ticketId}?`,
      message: "Its screenshots, comments and activity log are removed too. This can't be undone.",
      confirmLabel: "Delete ticket",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not delete ticket");
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete ticket");
      setDeleting(false);
    }
  }

  async function changeSprint(value: string) {
    setSavingSprint(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId: value === BACKLOG ? null : value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not change sprint");
      applyUpdated(data.data as TicketDetail);
      void reloadSprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change sprint");
    } finally {
      setSavingSprint(false);
    }
  }

  function applyUpdated(updated: TicketDetail) {
    setRow(updated);
    setStatus(updated.status);
    setAgentPrompt(buildAgentIssuePrompt(updated));
    onChanged?.(updated);
  }

  function startEdit() {
    if (!row) return;
    setEditDraft({
      type: row.type === "ENHANCEMENT" ? "ENHANCEMENT" : "BUG",
      reportedEnvironment: row.reportedEnvironment,
      title: row.title ?? "",
      userDescription: row.userDescription,
      currentUrl: row.currentUrl.startsWith("manual://") ? "" : row.currentUrl,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!editDraft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!editDraft.userDescription.trim()) {
      setError("Description is required.");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editDraft.type,
          reportedEnvironment: editDraft.reportedEnvironment,
          title: editDraft.title.trim(),
          userDescription: editDraft.userDescription.trim(),
          currentUrl: editDraft.currentUrl.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save changes");
      applyUpdated(data.data as TicketDetail);
      setEditing(false);
      setCopyHint("Ticket updated.");
      window.setTimeout(() => setCopyHint(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeScreenshot(storedUrl: string) {
    const ok = await confirm({
      title: "Remove this screenshot?",
      message: "It will no longer be attached to the ticket.",
      confirmLabel: "Remove screenshot",
      tone: "danger",
    });
    if (!ok) return;
    setRemovingShot(storedUrl);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}/screenshots`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotUrl: storedUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to remove screenshot");
      applyUpdated(data.data as TicketDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove screenshot");
    } finally {
      setRemovingShot(null);
    }
  }

  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

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
      onLoadedRef.current?.(ticket);
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

  /** Re-reads only the activity log (e.g. after a comment change) without a loading state. */
  const refreshLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const logs = (data.data as TicketDetail).logs;
      setRow((prev) => (prev ? { ...prev, logs } : prev));
    } catch {
      // The comment itself succeeded; the log catches up on the next load.
    }
  }, [id]);

  const shots = useMemo(() => (row ? resolveTicketScreenshotUrls(row) : []), [row]);
  /** Stored URLs (what the API expects for removal), aligned with `shots`. */
  const storedShots = useMemo(
    () => (row?.screenshotUrls?.length ? row.screenshotUrls : row?.screenshotUrl ? [row.screenshotUrl] : []),
    [row],
  );

  async function addScreenshots(files: FileList | null) {
    if (!row || !files?.length) return;
    const room = MAX_TICKET_SCREENSHOTS - shots.length;
    if (room <= 0) {
      setError(`A ticket can have at most ${MAX_TICKET_SCREENSHOTS} screenshots.`);
      return;
    }
    setUploadingShots(true);
    setError("");
    try {
      const urls = await uploadScreenshots(Array.from(files).slice(0, room));
      const res = await fetch(`/api/debug-portal/tickets/${id}/screenshots`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotUrls: urls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add screenshots");
      applyUpdated(data.data as TicketDetail);
      setCopyHint(`${urls.length} screenshot${urls.length === 1 ? "" : "s"} added.`);
      window.setTimeout(() => setCopyHint(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add screenshots");
    } finally {
      setUploadingShots(false);
    }
  }

  const locked = isSprintLocked(row?.sprintStatus, isAdmin);
  /** Only the ticket's creator can edit its details or delete it (the API enforces the same rule). */
  const isCreator = Boolean(row && user && row.reporterUserId === user.id);
  const memberTarget = row && !isAdmin && !locked ? memberStatusTarget(row.status) : null;
  const el = (row?.elementDiagnostics ?? {}) as ElementDiagnosticsShape;
  const api = (row?.apiPrerequisite ?? null) as ApiPrerequisiteShape | null;

  async function saveStatus(nextStatus: TicketStatus = status) {
    if (!row) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      applyUpdated(data.data as TicketDetail);
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

  async function downloadScreenshot(shot: string, index: number) {
    if (!row) return;
    setCopyHint("");
    try {
      const res = await fetch(shot, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      const suffix = shots.length > 1 ? `-${index + 1}` : "";
      anchor.download = `${row.ticketId.replace(/[^\w.-]+/g, "_")}-screenshot${suffix}.png`;
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
        {inModal ? (
          <h2 className="text-lg font-semibold text-slate-900">Ticket not found</h2>
        ) : (
          <PageHeader backHref={backHref} backLabel={backLabel} title="Ticket not found" />
        )}
        <p className="text-sm text-red-700" role="alert">
          {error || "This ticket does not exist or you do not have access."}
        </p>
      </div>
    );
  }

  const metaLine = `${formatEnvironment(row.reportedEnvironment)} · ${new Date(row.createdAt).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;

  /** Sprint + workflow status controls: main column on the full page, above Activity in the modal. */
  const cardClass = inModal
    ? "dp-card flex flex-col gap-3 p-4"
    : "dp-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5";
  const sprintAndStatus = (
    <>
        <div className={cardClass}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Sprint</span>
            {!isAdmin ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                {row.sprintName ?? "Backlog"}
              </span>
            ) : null}
            {row.sprintStatus && row.sprintStatus !== "ACTIVE" ? (
              <span className="text-xs text-slate-500">
                {SPRINT_STATUS_LABELS[row.sprintStatus as SprintStatus] ?? row.sprintStatus}
              </span>
            ) : null}
          </div>
          {locked ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
              This sprint is completed and locked. You can view this ticket but not change it.
            </p>
          ) : null}
          {isAdmin ? (
            <div className={inModal ? "flex w-full items-center gap-2" : "flex items-center gap-2"}>
              {savingSprint ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Saving sprint" /> : null}
              <SprintSelect
                value={row.sprintId ?? BACKLOG}
                onChange={(value) => void changeSprint(value)}
                sprints={sprints}
                disabled={savingSprint}
                className={inModal ? "w-full" : "min-w-[16rem]"}
                aria-label="Move ticket to sprint"
              />
            </div>
          ) : null}
        </div>
        <div className={cardClass}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Workflow status</span>
            <StatusBadge status={row.status} />
          </div>
          {isAdmin ? (
            <div className={inModal ? "flex items-center gap-2" : "flex flex-col gap-2 sm:flex-row sm:items-center"}>
              <StatusSelect
                value={status}
                onChange={setStatus}
                className={inModal ? "min-w-0 flex-1" : undefined}
                aria-label="Change ticket status"
              />
              <button
                type="button"
                disabled={saving || status === row.status}
                onClick={() => void saveStatus()}
                className="dp-btn-primary shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Save status
              </button>
            </div>
          ) : memberTarget ? (
            <div className={inModal ? "flex flex-col items-start gap-1" : "flex flex-col items-start gap-1 sm:items-end"}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveStatus(memberTarget)}
                className={memberTarget === "COMPLETED" ? "dp-btn-primary" : "dp-btn-secondary"}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {memberTarget === "COMPLETED"
                  ? `Mark ${labelOf("COMPLETED").toLowerCase()}`
                  : `Reopen (move to ${labelOf("PENDING")})`}
              </button>
              <p className="text-xs text-slate-500">
                {memberTarget === "COMPLETED"
                  ? "Confirm the fix works, then mark it completed."
                  : "Not fixed after all? Reopen it for the team."}
              </p>
            </div>
          ) : locked ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Locked (completed sprint)
            </p>
          ) : (
            <p className="text-xs text-slate-500">An admin will update the status as this is worked on.</p>
          )}
        </div>
    </>
  );

  return (
    <div className="space-y-4">
      {inModal ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{metaLine}</p>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={row.type} />
            <StatusBadge status={row.status} />
          </div>
        </div>
      ) : (
        <PageHeader
          title={row.ticketId}
          description={metaLine}
          backHref={backHref}
          backLabel={backLabel}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={row.type} />
              <StatusBadge status={row.status} />
            </div>
          }
        />
      )}

      {isCreator && !locked ? (
        <section
          aria-label="Ticket actions"
          className="dp-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ticket actions</h2>
            <p className="text-xs text-slate-500">Update the ticket details, or delete it permanently.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startEdit}
              disabled={editing || deleting}
              className="dp-btn-secondary py-2"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {editing ? "Editing…" : "Edit ticket"}
            </button>
            <button
              type="button"
              onClick={() => void deleteTicket()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
              Delete ticket
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="min-w-0 space-y-4">
      {inModal ? null : sprintAndStatus}

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

      {editing ? (
        <SectionCard title="Edit ticket">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="edit-type" className="dp-label">
                  Type
                </label>
                <ChevronSelect
                  id="edit-type"
                  value={editDraft.type}
                  onChange={(v) => setEditDraft((d) => ({ ...d, type: v as EditDraft["type"] }))}
                  className="block w-44"
                >
                  <option value="BUG">Bug</option>
                  <option value="ENHANCEMENT">Enhancement</option>
                </ChevronSelect>
              </div>
              <div>
                <label htmlFor="edit-env" className="dp-label">
                  Environment
                </label>
                <ChevronSelect
                  id="edit-env"
                  value={editDraft.reportedEnvironment}
                  onChange={(v) => setEditDraft((d) => ({ ...d, reportedEnvironment: v }))}
                  className="block w-44"
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                  {editDraft.reportedEnvironment === "staging" ? <option value="staging">Staging</option> : null}
                </ChevronSelect>
              </div>
            </div>
            <div>
              <label htmlFor="edit-url" className="dp-label">
                Related URL <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="edit-url"
                type="url"
                value={editDraft.currentUrl}
                onChange={(e) => setEditDraft((d) => ({ ...d, currentUrl: e.target.value }))}
                placeholder="https://…"
                className="dp-input"
              />
            </div>
            <div>
              <label htmlFor="edit-title" className="dp-label">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                maxLength={TICKET_TITLE_MAX}
                value={editDraft.title}
                onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Short summary of the issue"
                className="dp-input"
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="dp-label">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="edit-description"
                rows={8}
                value={editDraft.userDescription}
                onChange={(e) => setEditDraft((d) => ({ ...d, userDescription: e.target.value }))}
                className="dp-input min-h-[10rem] resize-y"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button type="button" disabled={savingEdit} onClick={() => void saveEdit()} className="dp-btn-primary">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Save changes
              </button>
              <button type="button" disabled={savingEdit} onClick={() => setEditing(false)} className="dp-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <>
        <h2 className={`px-1 text-xl font-semibold leading-snug ${row.title ? "text-slate-900" : "text-slate-400"}`}>
          {row.title || "Untitled ticket"}
        </h2>
        <SectionCard title="Description">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {row.userDescription.trim() || "No description provided."}
          </p>
        </SectionCard>
        </>
      )}

      <SectionCard title={shots.length ? `Screenshots & files (${shots.length})` : "Screenshots & files"}>
        <div className="space-y-6">
          {shots.length ? (
            shots.map((shot, index) => (
              <div key={shot} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isPdfUrl(shot) ? (
                    <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <FileText className="h-4 w-4 text-red-600" aria-hidden />
                      PDF · {attachmentLabel(shot)}
                    </span>
                  ) : shots.length > 1 ? (
                    <span className="mr-1 text-sm font-medium text-slate-700">Image {index + 1}</span>
                  ) : null}
                  <a href={shot} target="_blank" rel="noreferrer" className="dp-btn-secondary py-2">
                    {isPdfUrl(shot) ? "Open PDF" : "Open full size"}
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                  {isPdfUrl(shot) ? null : (
                    <button type="button" onClick={() => void downloadScreenshot(shot, index)} className="dp-btn-secondary py-2">
                      <Download className="h-4 w-4" aria-hidden />
                      Download
                    </button>
                  )}
                  {storedShots[index] && !locked ? (
                    <button
                      type="button"
                      disabled={removingShot === storedShots[index]}
                      onClick={() => void removeScreenshot(storedShots[index]!)}
                      className="dp-btn-ghost py-2 text-red-700 hover:bg-red-50"
                    >
                      {removingShot === storedShots[index] ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                      Remove
                    </button>
                  ) : null}
                </div>
                {isPdfUrl(shot) ? null : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shot}
                    alt={`Debug capture screenshot ${index + 1}`}
                    className="max-h-[min(520px,70vh)] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">No screenshots or files attached yet.</p>
          )}
          {shots.length < MAX_TICKET_SCREENSHOTS && !locked ? (
            <div className="border-t border-slate-100 pt-4">
              <label className={`dp-btn-secondary inline-flex cursor-pointer ${uploadingShots ? "pointer-events-none opacity-60" : ""}`}>
                {uploadingShots ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                {uploadingShots ? "Uploading…" : "Add screenshots or PDFs"}
                <input
                  type="file"
                  multiple
                  accept={TICKET_ATTACHMENT_ACCEPT}
                  className="sr-only"
                  disabled={uploadingShots}
                  onChange={(e) => {
                    void addScreenshots(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-slate-500">
                PNG, JPEG, GIF, WebP or PDF · max 10 MB each · up to {MAX_TICKET_SCREENSHOTS} per ticket
              </p>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <TicketComments
        ticketId={row.id}
        comments={row.comments ?? []}
        currentUserId={user?.id ?? null}
        isAdmin={isAdmin}
        onChange={(comments) => {
          setRow((prev) => (prev ? { ...prev, comments } : prev));
          void refreshLogs();
        }}
      />

      {inModal ? null : (
      <>
      <SectionCard title="Capture overview" collapsible>
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

      <SectionCard title="Element / screen context" collapsible>
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
        <SectionCard title="API prerequisite" collapsible>
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

      <SectionCard title="AI agent brief" collapsible>
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

      <SectionCard title="Full payload" collapsible>
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
      </>
      )}
      </div>

      <aside
        className={`min-w-0 lg:sticky lg:overflow-y-auto ${
          inModal ? "lg:top-0 lg:max-h-[calc(90vh-6rem)]" : "lg:top-20 lg:max-h-[calc(100vh-6rem)]"
        }`}
      >
        {inModal ? <div className="mb-4 space-y-4">{sprintAndStatus}</div> : null}
        <TicketActivityLog logs={row.logs ?? []} />
      </aside>
      </div>
    </div>
  );
}
