"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { TicketDetailView, type TicketDetail } from "@/components/TicketDetailView";
import { BACKLOG } from "@/lib/sprints";

type Props = {
  /** Internal ticket id. */
  id: string;
  /** Shown in the breadcrumb until the ticket has loaded. */
  ticketNumber?: string;
  sprintId?: string | null;
  sprintName?: string | null;
  /** Query added to the full-page link (e.g. "from=list" so its back link returns to the list). */
  fullPageQuery?: string;
  /** `changed` is true when anything was saved or the ticket was deleted, so the caller can reload. */
  onClose: (changed: boolean) => void;
};

/** Quick view of a ticket over the board or list; the ticket number opens the full page. */
export function TicketModal({ id, ticketNumber, sprintId, sprintName, fullPageQuery, onClose }: Props) {
  const [sprint, setSprint] = useState({ id: sprintId ?? null, name: sprintName ?? null });
  const [number, setNumber] = useState(ticketNumber ?? "");
  const changedRef = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // A confirm dialog on top handles its own Escape.
      if (e.key === "Escape" && !document.querySelector('[role="alertdialog"]')) closeRef.current(changedRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function syncHeader(ticket: TicketDetail) {
    setSprint({ id: ticket.sprintId ?? null, name: ticket.sprintName ?? null });
    setNumber(ticket.ticketId);
  }

  const fullPageHref = `/tickets/${id}${fullPageQuery ? `?${fullPageQuery}` : ""}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(changedRef.current);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={number ? `Ticket ${number}` : "Ticket"}
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link
              href={`/board?sprint=${encodeURIComponent(sprint.id ?? BACKLOG)}`}
              className="truncate text-slate-600 hover:text-slate-900 hover:underline"
            >
              {sprint.name ?? "Backlog"}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <Link
              href={fullPageHref}
              className="truncate font-semibold text-sky-700 hover:text-sky-800 hover:underline"
              title="Open the full ticket page"
            >
              {number || "Ticket"}
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => onClose(changedRef.current)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <TicketDetailView
            id={id}
            variant="modal"
            onLoaded={syncHeader}
            onChanged={(ticket) => {
              changedRef.current = true;
              syncHeader(ticket);
            }}
            onDeleted={() => onClose(true)}
          />
        </div>
      </div>
    </div>
  );
}
