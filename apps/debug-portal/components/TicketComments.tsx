"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";

export type TicketComment = {
  id: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string | null;
  body: string;
  createdAt: string;
};

type Props = {
  ticketId: string;
  comments: TicketComment[];
  currentUserId: string | null;
  isAdmin: boolean;
  onChange: (comments: TicketComment[]) => void;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

/** Discussion thread; everyone who can open the ticket can read and post. */
export function TicketComments({ ticketId, comments, currentUserId, isAdmin, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function post() {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${ticketId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not post comment");
      onChange([...comments, data.data as TicketComment]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  async function remove(comment: TicketComment) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingId(comment.id);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${ticketId}/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not delete comment");
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
                    {mine || isAdmin ? (
                      <button
                        type="button"
                        onClick={() => void remove(comment)}
                        disabled={deletingId === comment.id}
                        className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-700"
                        aria-label="Delete comment"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-100">
                    {comment.body}
                  </p>
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
        <textarea
          id="ticket-comment"
          rows={3}
          maxLength={5000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void post();
            }
          }}
          placeholder="Share an update, ask a question, or add context…"
          className="dp-input min-h-[5rem] resize-y"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Ctrl/⌘ + Enter to post</span>
          <button type="button" onClick={() => void post()} disabled={posting || !draft.trim()} className="dp-btn-primary">
            {posting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Post comment
          </button>
        </div>
      </div>
    </section>
  );
}
