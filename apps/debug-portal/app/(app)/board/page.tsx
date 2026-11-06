"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Images, Loader2, RefreshCw } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { FilterField } from "@/components/ui/FilterField";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  canMoveStatus,
  memberStatusTarget,
  formatEnvironment,
  formatTicketType,
  typeBadgeClass,
  type TicketStatus,
} from "@/lib/tickets";
import { usePortalUser } from "@/lib/use-portal-user";

type BoardTicket = {
  id: string;
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  userDescription: string;
  reporterUserId: string;
  reporterEmail: string;
  screenshotUrls?: string[];
  createdAt: string;
};

const BOARD_LIMIT = 500;

const COLUMN_ACCENT: Record<TicketStatus, string> = {
  PENDING: "border-t-amber-400",
  IN_PROGRESS: "border-t-sky-500",
  FOR_REVIEW: "border-t-violet-500",
  COMPLETED: "border-t-emerald-500",
};

export default function BoardPage() {
  const { isAdmin } = usePortalUser();
  const [tickets, setTickets] = useState<BoardTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TicketStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ limit: String(BOARD_LIMIT) });
      if (reporterFilter) qs.set("reporterUserId", reporterFilter);
      const res = await fetch(`/api/debug-portal/tickets?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tickets");
      setTickets((data.data ?? []) as BoardTicket[]);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [reporterFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const reporters = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tickets) map.set(t.reporterUserId, t.reporterEmail);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tickets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (!typeFilter || t.type === typeFilter) &&
        (!q || t.ticketId.toLowerCase().includes(q) || t.userDescription.toLowerCase().includes(q)),
    );
  }, [tickets, typeFilter, search]);

  const columns = useMemo(
    () => TICKET_STATUSES.map((status) => ({ status, items: visible.filter((t) => t.status === status) })),
    [visible],
  );

  const draggingTicket = draggingId ? tickets.find((t) => t.id === draggingId) ?? null : null;
  const canDrag = (ticket: BoardTicket) => isAdmin || memberStatusTarget(ticket.status) !== null;
  const canDropOn = (status: TicketStatus) =>
    Boolean(draggingTicket && canMoveStatus(isAdmin, draggingTicket.status, status));

  async function moveTicket(id: string, status: TicketStatus) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || !canMoveStatus(isAdmin, ticket.status, status)) return;
    const previous = ticket.status;
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not move ticket");
    } catch (err) {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: previous } : t)));
      setError(err instanceof Error ? err.message : "Could not move ticket");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Board"
        description={
          isAdmin
            ? "Drag tickets between columns to change their status."
            : "Your tickets by status. Drag a For review ticket to Completed once it's fixed, or a Completed ticket back to Pending to reopen it."
        }
      />

      <div className="dp-card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
        {isAdmin ? (
          <FilterField label="Reporter" htmlFor="board-reporter" className="sm:max-w-[18rem]">
            <ChevronSelect
              id="board-reporter"
              value={reporterFilter}
              onChange={setReporterFilter}
              className="block w-full min-w-0"
              aria-label="Filter by reporter"
            >
              <option value="">All reporters</option>
              {reporters.map(([id, email]) => (
                <option key={id} value={id}>
                  {email}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
        ) : null}
        <FilterField label="Type" htmlFor="board-type">
          <ChevronSelect id="board-type" value={typeFilter} onChange={setTypeFilter} className="block w-full min-w-0">
            <option value="">All types</option>
            <option value="BUG">Bug</option>
            <option value="ENHANCEMENT">Enhancement</option>
          </ChevronSelect>
        </FilterField>
        <FilterField label="Search" htmlFor="board-search" className="sm:min-w-[16rem] sm:flex-1">
          <input
            id="board-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticket ID or description…"
            className="dp-input"
          />
        </FilterField>
        <button type="button" onClick={() => void load()} disabled={loading} className="dp-btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {total > BOARD_LIMIT ? (
        <p className="text-xs text-slate-500">
          Showing the newest {BOARD_LIMIT} of {total} tickets. Use the reporter filter to narrow the board.
        </p>
      ) : null}

      {loading && tickets.length === 0 ? (
        <div className="dp-card flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-label="Loading board" />
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
          {columns.map(({ status, items }) => (
            <section
              key={status}
              aria-label={TICKET_STATUS_LABELS[status]}
              onDragOver={(e) => {
                if (!canDropOn(status)) return;
                e.preventDefault();
                setDropTarget(status);
              }}
              onDragLeave={() => setDropTarget((current) => (current === status ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const id = e.dataTransfer.getData("text/plain") || draggingId;
                setDraggingId(null);
                if (id) void moveTicket(id, status);
              }}
              className={`flex min-h-[16rem] min-w-[16rem] flex-col rounded-xl border border-t-4 border-slate-200 bg-slate-50/70 transition-opacity ${COLUMN_ACCENT[status]} ${
                dropTarget === status ? "ring-2 ring-sky-400 ring-offset-1" : ""
              } ${draggingTicket && !canDropOn(status) && draggingTicket.status !== status ? "opacity-50" : ""}`}
            >
              <header className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold text-slate-800">{TICKET_STATUS_LABELS[status]}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {items.length}
                </span>
              </header>
              <ul className="flex flex-1 flex-col gap-2 px-2 pb-3">
                {items.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    {canDropOn(status) ? "Drop here" : "No tickets"}
                  </li>
                ) : (
                  items.map((ticket) => (
                    <li
                      key={ticket.id}
                      draggable={canDrag(ticket)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", ticket.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(ticket.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition ${
                        canDrag(ticket) ? "cursor-grab active:cursor-grabbing" : ""
                      } ${draggingId === ticket.id ? "opacity-50" : ""}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="truncate text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                        >
                          {ticket.ticketId}
                        </Link>
                        {savingId === ticket.id ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" aria-label="Saving" />
                        ) : (
                          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${typeBadgeClass(ticket.type)}`}>
                            {formatTicketType(ticket.type)}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {ticket.userDescription || "No description"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span>{formatEnvironment(ticket.reportedEnvironment)}</span>
                        <span aria-hidden>·</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                        {ticket.screenshotUrls?.length ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Images className="h-3 w-3" aria-hidden />
                              {ticket.screenshotUrls.length}
                            </span>
                          </>
                        ) : null}
                      </div>
                      {isAdmin ? (
                        <p className="mt-1 truncate text-[11px] text-slate-400" title={ticket.reporterEmail}>
                          {ticket.reporterEmail}
                        </p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
