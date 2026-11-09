"use client";

import { useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { resolveMediaPreviewUrl } from "@/lib/media-url";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";

export type CommentAttachment = {
  url: string;
  name: string;
  kind: "image" | "file";
  size?: number;
};

export type TicketComment = {
  id: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string | null;
  body: string;
  attachments?: CommentAttachment[];
  editedAt?: string | null;
  createdAt: string;
};

type Props = {
  ticketId: string;
  comments: TicketComment[];
  currentUserId: string | null;
  isAdmin: boolean;
  onChange: (comments: TicketComment[]) => void;
};

const MAX_ATTACHMENTS = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.json,.zip";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(comment: TicketComment): string {
  const source = comment.authorName?.trim() || comment.authorEmail;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function mediaHref(url: string): string {
  return resolveMediaPreviewUrl(url) ?? url;
}

async function uploadAttachment(file: File): Promise<CommentAttachment> {
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB`);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/attachment", { method: "POST", credentials: "include", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof json.error === "string" && json.error !== "Something went wrong!" ? json.error : "";
    throw new Error(message || `Could not upload ${file.name}. Allowed: images, PDF, Word, Excel, CSV, TXT, LOG, JSON, ZIP (max 10 MB).`);
  }
  const url = readUploadImageUrlFromJson(json);
  if (!url) throw new Error(`Could not upload ${file.name}`);
  return { url, name: file.name, kind: file.type.startsWith("image/") ? "image" : "file", size: file.size };
}

function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: CommentAttachment[];
  onRemove?: (index: number) => void;
}) {
  if (!attachments.length) return null;
  const images = attachments.map((a, i) => ({ a, i })).filter(({ a }) => a.kind === "image");
  const files = attachments.map((a, i) => ({ a, i })).filter(({ a }) => a.kind === "file");
  return (
    <div className="mt-2 space-y-2">
      {images.length ? (
        <div className="flex flex-wrap gap-2">
          {images.map(({ a, i }) => (
            <div key={`${a.url}-${i}`} className="group relative">
              <a href={mediaHref(a.url)} target="_blank" rel="noreferrer" title={a.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaHref(a.url)}
                  alt={a.name}
                  className="h-24 w-32 rounded-lg border border-slate-200 bg-slate-50 object-cover transition hover:opacity-90"
                />
              </a>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-0.5 text-white shadow hover:bg-red-600"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {files.length ? (
        <ul className="space-y-1">
          {files.map(({ a, i }) => (
            <li
              key={`${a.url}-${i}`}
              className="flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              <a
                href={mediaHref(a.url)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate font-medium text-sky-700 hover:underline"
                title={a.name}
              >
                {a.name}
              </a>
              {a.size ? <span className="shrink-0 text-xs text-slate-400">{formatSize(a.size)}</span> : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Text + image/file attachments; used for new comments and for editing an existing one. */
function CommentComposer({
  id,
  initialBody = "",
  initialAttachments = [],
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  id: string;
  initialBody?: string;
  initialAttachments?: CommentAttachment[];
  submitLabel: string;
  onSubmit: (body: string, attachments: CommentAttachment[]) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<CommentAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function addFiles(files: File[]) {
    if (!files.length) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setError(`Up to ${MAX_ATTACHMENTS} attachments per comment.`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded: CommentAttachment[] = [];
      for (const file of files.slice(0, room)) uploaded.push(await uploadAttachment(file));
      setAttachments((prev) => [...prev, ...uploaded]);
      if (files.length > room) setError(`Only ${room} more attachment${room === 1 ? "" : "s"} could be added.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (saving || uploading || (!body.trim() && !attachments.length)) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit(body.trim(), attachments);
      if (!onCancel) {
        setBody("");
        setAttachments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save comment");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving && !uploading && (Boolean(body.trim()) || attachments.length > 0);

  return (
    <div className="space-y-2">
      <textarea
        id={id}
        rows={3}
        maxLength={5000}
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
        onPaste={(e) => {
          const pasted = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
          if (pasted.length) {
            e.preventDefault();
            void addFiles(pasted);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        placeholder="Share an update, ask a question, or add context…"
        className="dp-input min-h-[5rem] resize-y"
      />

      <AttachmentList attachments={attachments} onRemove={(i) => setAttachments((prev) => prev.filter((_, j) => j !== i))} />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <input
            ref={imageInput}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <input
            ref={fileInput}
            type="file"
            accept={FILE_ACCEPT}
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => imageInput.current?.click()}
            disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
            className="dp-btn-ghost py-1.5 text-sm"
          >
            <ImagePlus className="h-4 w-4" aria-hidden /> Image
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
            className="dp-btn-ghost py-1.5 text-sm"
          >
            <Paperclip className="h-4 w-4" aria-hidden /> File
          </button>
          {uploading ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Uploading…
            </span>
          ) : (
            <span className="hidden text-xs text-slate-400 sm:inline">Paste images · Ctrl/⌘ + Enter to post</span>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={saving} className="dp-btn-secondary py-1.5">
              Cancel
            </button>
          ) : null}
          <button type="button" onClick={() => void submit()} disabled={!canSubmit} className="dp-btn-primary py-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Discussion thread; everyone who can open the ticket can read and post. */
export function TicketComments({ ticketId, comments, currentUserId, isAdmin, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const confirm = useConfirm();

  async function request(path: string, init: RequestInit, fallback: string) {
    const res = await fetch(`/api/debug-portal/tickets/${ticketId}/comments${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : fallback);
    return data.data as TicketComment;
  }

  async function post(body: string, attachments: CommentAttachment[]) {
    const created = await request("", { method: "POST", body: JSON.stringify({ body, attachments }) }, "Could not post comment");
    onChange([...comments, created]);
  }

  async function save(commentId: string, body: string, attachments: CommentAttachment[]) {
    const updated = await request(
      `/${commentId}`,
      { method: "PATCH", body: JSON.stringify({ body, attachments }) },
      "Could not update comment",
    );
    onChange(comments.map((c) => (c.id === commentId ? updated : c)));
    setEditingId(null);
  }

  async function remove(comment: TicketComment) {
    const ok = await confirm({
      title: "Delete this comment?",
      message: "The comment and its attachments are removed. This can't be undone.",
      confirmLabel: "Delete comment",
      tone: "danger",
    });
    if (!ok) return;
    setDeletingId(comment.id);
    setError("");
    try {
      await request(`/${comment.id}`, { method: "DELETE" }, "Could not delete comment");
      onChange(comments.filter((c) => c.id !== comment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete comment");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="dp-card p-4 sm:p-5" aria-label="Comments">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <MessageSquare className="h-4 w-4 text-slate-500" aria-hidden />
        Comments
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">No comments yet. Start the discussion below.</p>
      ) : (
        <ul className="mb-4 space-y-4">
          {comments.map((comment) => {
            const mine = comment.authorUserId === currentUserId;
            const editing = editingId === comment.id;
            return (
              <li key={comment.id} className="flex gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    mine ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                  aria-hidden
                >
                  {initials(comment)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {comment.authorName?.trim() || comment.authorEmail}
                      {mine ? <span className="ml-1 font-normal text-slate-500">(you)</span> : null}
                    </span>
                    <span className="text-xs text-slate-500">{formatWhen(comment.createdAt)}</span>
                    {comment.editedAt ? (
                      <span className="text-xs italic text-slate-400" title={`Edited ${formatWhen(comment.editedAt)}`}>
                        (edited)
                      </span>
                    ) : null}
                    {!editing && (mine || isAdmin) ? (
                      <span className="ml-auto flex items-center gap-0.5">
                        {mine ? (
                          <button
                            type="button"
                            onClick={() => setEditingId(comment.id)}
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Edit comment"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void remove(comment)}
                          disabled={deletingId === comment.id}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete comment"
                          title="Delete"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </button>
                      </span>
                    ) : null}
                  </div>
                  {editing ? (
                    <div className="mt-2">
                      <CommentComposer
                        id={`edit-comment-${comment.id}`}
                        initialBody={comment.body}
                        initialAttachments={comment.attachments ?? []}
                        submitLabel="Save changes"
                        autoFocus
                        onSubmit={(body, attachments) => save(comment.id, body, attachments)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                      {comment.body ? (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{comment.body}</p>
                      ) : null}
                      <AttachmentList attachments={comment.attachments ?? []} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <label htmlFor="ticket-comment" className="dp-label">
          Add a comment
        </label>
        <CommentComposer id="ticket-comment" submitLabel="Post comment" onSubmit={post} />
      </div>
    </section>
  );
}
