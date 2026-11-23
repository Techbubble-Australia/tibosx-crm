"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarRange,
  Check,
  GripVertical,
  Images,
  Loader2,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { FilterField } from "@/components/ui/FilterField";
import { PageHeader } from "@/components/ui/PageHeader";
import { SprintForm } from "@/components/SprintForm";
import { SprintSelect } from "@/components/SprintSelect";
import { TypeBadge } from "@/components/TicketBadges";
import { TicketModal } from "@/components/TicketModal";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { useConfirm } from "@/components/ConfirmDialog";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import {
  ALL_SPRINTS,
  BACKLOG,
  SPRINT_STATUS_LABELS,
  ACTIVE_SPRINT_DELETE_HINT,
  defaultSprintSelection,
  isSprintLocked,
  sprintDeleteConfirm,
  sprintDateRange,
  useSprints,
  type Sprint,
} from "@/lib/sprints";
import {
  BOARD_LEVEL_TABS,
  STATUS_COLORS,
  boardFamilyForLevel,
  canMoveStatus,
  formatEnvironment,
  formatTicketType,
  memberStatusTarget,
  parseHierarchyLevel,
  statusColorClasses,
  typeBorderClass,
  typesForLevel,
  type BoardFamily,
  type HierarchyLevel,
  type StatusOption,
  type TicketStatus,
} from "@/lib/tickets";
import { usePortalUser } from "@/lib/use-portal-user";

type BoardTicket = {
  id: string;
  ticketId: string;
  type: string;
  hierarchyLevel?: number;
  parentId?: string | null;
  status: TicketStatus;
  reportedEnvironment: string;
  title?: string | null;
  userDescription: string;
  reporterUserId: string;
  reporterEmail: string;
  screenshotUrls?: string[];
  createdAt: string;
  sprintId?: string | null;
  sprintName?: string | null;
  sprintStatus?: string | null;
  childCount?: number;
};

const BOARD_LIMIT = 500;
const TICKET_DRAG = "application/x-dp-ticket";
const COLUMN_DRAG = "application/x-dp-status";

async function statusRequest(
  path: string,
  init: RequestInit,
  family: BoardFamily,
): Promise<StatusOption[]> {
  const qs = path.includes("?") ? "&" : "?";
  const url =
    path === "/order" || path.includes("boardFamily=")
      ? `/api/debug-portal/statuses${path}`
      : `/api/debug-portal/statuses${path}${qs}boardFamily=${family}`;
  const body =
    init.body && typeof init.body === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(init.body) as Record<string, unknown>;
            if (parsed.boardFamily == null) parsed.boardFamily = family;
            return JSON.stringify(parsed);
          } catch {
            return init.body;
          }
        })()
      : init.body;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not update statuses");
  return (data.data ?? []) as StatusOption[];
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Column colour">
      {STATUS_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          title={color}
          onClick={() => onChange(color)}
          className={`h-5 w-5 rounded-full ${statusColorClasses(color).swatch} ${
            value === color ? "ring-2 ring-slate-900 ring-offset-2" : "ring-1 ring-black/10"
          }`}
        />
      ))}
    </div>
  );
}

function BoardPageInner() {
  const { isAdmin } = usePortalUser();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardLevel = parseHierarchyLevel(searchParams.get("level"));
  const boardFamily = boardFamilyForLevel(boardLevel);
  const levelTypes = typesForLevel(boardLevel);
  const { statusesOf, setStatusesForFamily } = useTicketStatuses();
  const statuses = statusesOf(boardFamily);
  const setStatuses = (rows: StatusOption[]) => setStatusesForFamily(boardFamily, rows);
  const [tickets, setTickets] = useState<BoardTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  function setBoardLevel(level: HierarchyLevel) {
    const params = new URLSearchParams(searchParams.toString());
    if (level === 0) params.delete("level");
    else params.set("level", String(level));
    const qs = params.toString();
    router.push(qs ? `/board?${qs}` : "/board");
    setTypeFilter("");
  }
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [openTicket, setOpenTicket] = useState<BoardTicket | null>(null);
  const [dropTarget, setDropTarget] = useState<TicketStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const [columnDropTarget, setColumnDropTarget] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [columnDraft, setColumnDraft] = useState({ label: "", color: "slate" });
  const [adding, setAdding] = useState(false);
  const [newStatus, setNewStatus] = useState({ label: "", color: "slate" });
  const [statusSaving, setStatusSaving] = useState(false);
  const { sprints, loading: sprintsLoading, reload: reloadSprints } = useSprints();
  /** null until sprints load and the default (active, else latest) sprint is chosen. */
  const [sprintFilter, setSprintFilter] = useState<string | null>(null);
  const [sprintForm, setSprintForm] = useState<"create" | "edit" | null>(null);
  const [sprintSaving, setSprintSaving] = useState(false);

  useEffect(() => {
    if (sprintsLoading || sprintFilter !== null) return;
    const requested = new URLSearchParams(window.location.search).get("sprint");
    const requestedValid =
      requested !== null && (requested === BACKLOG || sprints.some((s) => s.id === requested));
    setSprintFilter(requestedValid ? requested : defaultSprintSelection(sprints));
  }, [sprintsLoading, sprints, sprintFilter]);

  function selectSprint(value: string) {
    setSprintFilter(value);
    setSprintForm(null);
  }

  const selectedSprint = sprints.find((s) => s.id === sprintFilter) ?? null;
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;
  const selectedLocked = isSprintLocked(selectedSprint?.status, isAdmin);

  async function activateSprint(sprint: Sprint) {
    const ok = await confirm({
      title: `Make "${sprint.name}" the active sprint?`,
      message: activeSprint
        ? `"${activeSprint.name}" will be marked Completed. New tickets will go to "${sprint.name}".`
        : `New tickets will go to "${sprint.name}".`,
      confirmLabel: "Set as active",
    });
    if (!ok) return;
    setSprintSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/sprints/${sprint.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not activate sprint");
      await reloadSprints();
      setSprintForm(null);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate sprint");
    } finally {
      setSprintSaving(false);
    }
  }

  const loadSeq = useRef(0);
  /** `silent` refreshes in the background (auto-refresh) without the loading state or clearing errors. */
  const load = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (sprintFilter === null) return;
    // Silent refreshes must not bump loadSeq — otherwise they can strand a non-silent load with loading stuck true.
    const seq = silent ? loadSeq.current : ++loadSeq.current;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const qs = new URLSearchParams({ limit: String(BOARD_LIMIT) });
      qs.set("hierarchyLevel", String(boardLevel));
      if (reporterFilter) qs.set("reporterUserId", reporterFilter);
      if (sprintFilter) qs.set("sprintId", sprintFilter);
      if (typeFilter) qs.set("type", typeFilter);
      const res = await fetch(`/api/debug-portal/tickets?${qs}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (seq !== loadSeq.current) return;
      if (!res.ok) throw new Error(data.error || "Failed to load tickets");
      setTickets((data.data ?? []) as BoardTicket[]);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (err) {
      if (seq !== loadSeq.current || silent) return;
      setError(err instanceof Error ? err.message : "Failed to load tickets");
      setTickets([]);
    } finally {
      if (seq === loadSeq.current && !silent) setLoading(false);
    }
  }, [reporterFilter, sprintFilter, boardLevel, typeFilter]);

  useAutoRefresh(() => void load({ silent: true }), {
    paused: Boolean(draggingId || savingId || openTicket || editingColumn || adding || statusSaving || loading),
  });

  async function deleteSprint() {
    if (!selectedSprint || selectedSprint.status === "ACTIVE") return;
    if (!(await confirm(sprintDeleteConfirm(selectedSprint)))) return;
    setSprintSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/sprints/${selectedSprint.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: selectedSprint.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not delete sprint");
      const deletedId = selectedSprint.id;
      await reloadSprints();
      selectSprint(defaultSprintSelection(sprints.filter((s) => s.id !== deletedId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete sprint");
    } finally {
      setSprintSaving(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  // Every reporter comes from the API, not the loaded tickets — otherwise picking one reporter hides the rest.
  const [allReporters, setAllReporters] = useState<Array<{ reporterUserId: string; reporterEmail: string }>>([]);
  useEffect(() => {
    if (!isAdmin) return;
    void fetch("/api/debug-portal/tickets/reporters", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.data)) setAllReporters(json.data);
      })
      .catch(() => undefined);
  }, [isAdmin, total]);

  const reporters = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of allReporters) map.set(r.reporterUserId, r.reporterEmail);
    for (const t of tickets) if (!map.has(t.reporterUserId)) map.set(t.reporterUserId, t.reporterEmail);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allReporters, tickets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (!typeFilter || t.type === typeFilter) &&
        (!q || t.ticketId.toLowerCase().includes(q) || t.userDescription.toLowerCase().includes(q)),
    );
  }, [tickets, typeFilter, search]);

  const columns = useMemo(
    () => statuses.map((status) => ({ status, items: visible.filter((t) => t.status === status.key) })),
    [statuses, visible],
  );

  const draggingTicket = draggingId ? tickets.find((t) => t.id === draggingId) ?? null : null;
  const canDrag = (ticket: BoardTicket) =>
    !isSprintLocked(ticket.sprintStatus, isAdmin) && (isAdmin || memberStatusTarget(ticket.status) !== null);
  const canDropOn = (status: TicketStatus) =>
    Boolean(draggingTicket && canMoveStatus(isAdmin, draggingTicket.status, status));

  async function moveTicket(id: string, status: TicketStatus) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || !canDrag(ticket) || !canMoveStatus(isAdmin, ticket.status, status)) return;
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

  async function reorderColumns(draggedKey: string, targetKey: string) {
    if (draggedKey === targetKey) return;
    const keys = statuses.map((s) => s.key);
    const from = keys.indexOf(draggedKey);
    const to = keys.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    keys.splice(from, 1);
    keys.splice(to, 0, draggedKey);
    const previous = statuses;
    setStatuses(keys.map((key, position) => ({ ...statuses.find((s) => s.key === key)!, position })));
    setError("");
    try {
      setStatuses(
        await statusRequest(
          "/order",
          { method: "PUT", body: JSON.stringify({ keys, boardFamily }) },
          boardFamily,
        ),
      );
    } catch (err) {
      setStatuses(previous);
      setError(err instanceof Error ? err.message : "Could not save column order");
    }
  }

  function startEditColumn(status: StatusOption) {
    setEditingColumn(status.key);
    setColumnDraft({ label: status.label, color: status.color });
  }

  async function saveColumn(key: string) {
    if (!columnDraft.label.trim()) return;
    setStatusSaving(true);
    setError("");
    try {
      setStatuses(
        await statusRequest(
          `/${encodeURIComponent(key)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              label: columnDraft.label.trim(),
              color: columnDraft.color,
              boardFamily,
            }),
          },
          boardFamily,
        ),
      );
      setEditingColumn(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setStatusSaving(false);
    }
  }

  async function deleteColumn(status: StatusOption) {
    const ok = await confirm({
      title: `Delete the "${status.label}" column?`,
      message: "The column is removed from this board family for every sprint.",
      confirmLabel: "Delete column",
      tone: "danger",
    });
    if (!ok) return;
    setStatusSaving(true);
    setError("");
    try {
      setStatuses(
        await statusRequest(`/${encodeURIComponent(status.key)}`, { method: "DELETE" }, boardFamily),
      );
      setEditingColumn(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete status");
    } finally {
      setStatusSaving(false);
    }
  }

  async function addColumn() {
    if (!newStatus.label.trim()) return;
    setStatusSaving(true);
    setError("");
    try {
      setStatuses(
        await statusRequest(
          "",
          {
            method: "POST",
            body: JSON.stringify({
              label: newStatus.label.trim(),
              color: newStatus.color,
              boardFamily,
            }),
          },
          boardFamily,
        ),
      );
      setNewStatus({ label: "", color: "slate" });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add status");
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Board"
        description={
          isAdmin
            ? "Each hierarchy level has its own board. Drag tickets between columns to change status."
            : "Each hierarchy level has its own board. Drag a For review ticket to Completed once it's fixed, or reopen from Completed."
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Hierarchy level">
        {BOARD_LEVEL_TABS.map((tab) => {
          const active = tab.level === boardLevel;
          return (
            <button
              key={tab.level}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setBoardLevel(tab.level)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
              title={tab.description}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="dp-card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FilterField label="Sprint" htmlFor="board-sprint" className="sm:min-w-[20rem]">
              <SprintSelect
                id="board-sprint"
                value={sprintFilter ?? ALL_SPRINTS}
                onChange={selectSprint}
                sprints={sprints}
                includeAll
                showLocks={!isAdmin}
                disabled={sprintFilter === null}
                className="block w-full min-w-0"
              />
            </FilterField>
            {selectedSprint ? (
              <div className="flex flex-wrap items-center gap-2 pb-1 text-xs text-slate-600">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${
                    selectedSprint.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                      : selectedSprint.status === "PLANNED"
                        ? "bg-sky-50 text-sky-800 ring-sky-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  {SPRINT_STATUS_LABELS[selectedSprint.status]}
                </span>
                {sprintDateRange(selectedSprint) ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                    {sprintDateRange(selectedSprint)}
                  </span>
                ) : null}
                <span>{selectedSprint.ticketCount} ticket(s)</span>
              </div>
            ) : sprintFilter === BACKLOG ? (
              <p className="pb-1 text-xs text-slate-500">Tickets not planned into a sprint yet.</p>
            ) : null}
            {loading && sprintFilter !== null ? (
              <span className="inline-flex items-center gap-1.5 pb-1 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading tickets…
              </span>
            ) : null}
          </div>
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              {selectedSprint ? (
                <>
                  {selectedSprint.status !== "ACTIVE" ? (
                    <button
                      type="button"
                      disabled={sprintSaving}
                      onClick={() => void activateSprint(selectedSprint)}
                      className="dp-btn-secondary py-2 text-emerald-800"
                    >
                      <PlayCircle className="h-4 w-4" aria-hidden /> Set as active sprint
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSprintForm("edit")}
                    className="dp-btn-secondary py-2"
                  >
                    <Pencil className="h-4 w-4" aria-hidden /> Edit sprint
                  </button>
                  <button
                    type="button"
                    disabled={sprintSaving || selectedSprint.status === "ACTIVE"}
                    title={selectedSprint.status === "ACTIVE" ? ACTIVE_SPRINT_DELETE_HINT : undefined}
                    onClick={() => void deleteSprint()}
                    className="dp-btn-ghost py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete sprint
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setSprintForm("create")}
                className="dp-btn-primary py-2"
              >
                <Plus className="h-4 w-4" aria-hidden /> New sprint
              </button>
            </div>
          ) : null}
        </div>
        {selectedSprint?.goal ? <p className="text-sm text-slate-600">Goal: {selectedSprint.goal}</p> : null}
        {selectedLocked ? (
          <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Lock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            This sprint is completed and locked. You can view its tickets but not change them.
          </p>
        ) : null}

        {!sprintsLoading && sprints.length === 0 && !sprintForm ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-4 py-3 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              No sprints yet. New tickets are saved to the Backlog until there is an active sprint.
            </p>
            {isAdmin ? (
              <button type="button" onClick={() => setSprintForm("create")} className="dp-btn-primary shrink-0 py-2">
                <Plus className="h-4 w-4" aria-hidden /> Create first sprint
              </button>
            ) : null}
          </div>
        ) : null}

        {isAdmin && sprintForm ? (
          <SprintForm
            key={sprintForm === "edit" ? selectedSprint?.id : "new"}
            sprint={sprintForm === "edit" ? selectedSprint : null}
            activeSprint={activeSprint}
            onSaved={async (saved) => {
              await reloadSprints();
              selectSprint(saved.id);
            }}
            onCancel={() => setSprintForm(null)}
          />
        ) : null}
      </div>

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
        {levelTypes.length > 1 ? (
          <FilterField label="Type" htmlFor="board-type">
            <ChevronSelect id="board-type" value={typeFilter} onChange={setTypeFilter} className="block w-full min-w-0">
              <option value="">All types on this board</option>
              {levelTypes.map((t) => (
                <option key={t} value={t}>
                  {formatTicketType(t)}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
        ) : null}
        <FilterField label="Search" htmlFor="board-search" className="sm:min-w-[16rem] sm:flex-1">
          <input
            id="board-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticket ID or description…"
            className="dp-input"
          />
        </FilterField>
        <button
          type="button"
          onClick={() => {
            void load();
            void reloadSprints();
          }}
          disabled={loading}
          className="dp-btn-secondary"
        >
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
        <div
          className={`flex items-start gap-4 overflow-x-auto pb-3 transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`}
          aria-busy={loading}
        >
          {columns.map(({ status, items }) => {
            const accent = statusColorClasses(status.color).accent;
            const isEditing = editingColumn === status.key;
            return (
              <section
                key={status.key}
                aria-label={status.label}
                onDragOver={(e) => {
                  const types = Array.from(e.dataTransfer.types);
                  if (types.includes(COLUMN_DRAG)) {
                    if (!isAdmin || !draggingColumn) return;
                    e.preventDefault();
                    setColumnDropTarget(status.key);
                    return;
                  }
                  if (!canDropOn(status.key)) return;
                  e.preventDefault();
                  setDropTarget(status.key);
                }}
                onDragLeave={() => {
                  setDropTarget((current) => (current === status.key ? null : current));
                  setColumnDropTarget((current) => (current === status.key ? null : current));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const columnKey = e.dataTransfer.getData(COLUMN_DRAG);
                  setDropTarget(null);
                  setColumnDropTarget(null);
                  if (columnKey) {
                    setDraggingColumn(null);
                    if (isAdmin) void reorderColumns(columnKey, status.key);
                    return;
                  }
                  const id = e.dataTransfer.getData(TICKET_DRAG) || draggingId;
                  setDraggingId(null);
                  if (id) void moveTicket(id, status.key);
                }}
                className={`flex min-h-[16rem] w-72 shrink-0 flex-col rounded-xl border border-t-4 border-slate-200 bg-slate-50/70 transition-opacity ${accent} ${
                  dropTarget === status.key ? "ring-2 ring-sky-400 ring-offset-1" : ""
                } ${
                  columnDropTarget === status.key && draggingColumn !== status.key
                    ? "ring-2 ring-violet-400 ring-offset-1"
                    : ""
                } ${draggingColumn === status.key ? "opacity-40" : ""} ${
                  draggingTicket && !canDropOn(status.key) && draggingTicket.status !== status.key ? "opacity-50" : ""
                }`}
              >
                <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-1">
                    {isAdmin ? (
                      <span
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(COLUMN_DRAG, status.key);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingColumn(status.key);
                        }}
                        onDragEnd={() => {
                          setDraggingColumn(null);
                          setColumnDropTarget(null);
                        }}
                        className="-ml-1 cursor-grab rounded p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 active:cursor-grabbing"
                        title="Drag to reorder column"
                        aria-label={`Drag to reorder ${status.label}`}
                      >
                        <GripVertical className="h-4 w-4" aria-hidden />
                      </span>
                    ) : null}
                    <h2
                      className={`inline-flex min-w-0 items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-sm font-semibold ${statusColorClasses(status.color).badge}`}
                      title={status.label}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusColorClasses(status.color).swatch}`} aria-hidden />
                      <span className="truncate">{status.label}</span>
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {items.length}
                    </span>
                    {isAdmin || status.key === "PENDING" ? (
                      <Link
                        href={`/tickets/new?status=${encodeURIComponent(status.key)}&level=${boardLevel}`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                        aria-label={`Add a ticket to ${status.label}`}
                        title={`Add a ticket to ${status.label}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </Link>
                    ) : null}
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => (isEditing ? setEditingColumn(null) : startEditColumn(status))}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                        aria-label={`Edit ${status.label} column`}
                        title="Column settings"
                      >
                        <Settings2 className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </header>

                {isEditing ? (
                  <div className="mx-2 mb-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <label className="dp-label" htmlFor={`col-${status.key}`}>
                      Name
                    </label>
                    <input
                      id={`col-${status.key}`}
                      value={columnDraft.label}
                      maxLength={40}
                      onChange={(e) => setColumnDraft((d) => ({ ...d, label: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveColumn(status.key);
                        if (e.key === "Escape") setEditingColumn(null);
                      }}
                      className="dp-input"
                      autoFocus
                    />
                    <ColorSwatches value={columnDraft.color} onChange={(color) => setColumnDraft((d) => ({ ...d, color }))} />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={statusSaving || !columnDraft.label.trim()}
                        onClick={() => void saveColumn(status.key)}
                        className="dp-btn-primary py-1.5 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden /> Save
                      </button>
                      <button type="button" onClick={() => setEditingColumn(null)} className="dp-btn-ghost py-1.5 text-xs">
                        Cancel
                      </button>
                      {status.isSystem ? (
                        <span className="text-[11px] text-slate-400">Built-in status</span>
                      ) : (
                        <button
                          type="button"
                          disabled={statusSaving}
                          onClick={() => void deleteColumn(status)}
                          className="dp-btn-ghost ml-auto py-1.5 text-xs text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Each column scrolls on its own so long queues don't stretch the whole page. */}
                <ul className="flex max-h-[calc(100vh-18rem)] min-h-[8rem] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">

                  {items.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                      {canDropOn(status.key) ? "Drop here" : "No tickets"}
                    </li>
                  ) : (
                    items.map((ticket) => (
                      <li
                        key={ticket.id}
                        draggable={canDrag(ticket)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(TICKET_DRAG, ticket.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(ticket.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropTarget(null);
                        }}
                        className={`relative rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow ${typeBorderClass(
                          ticket.type,
                        )} ${canDrag(ticket) ? "cursor-grab active:cursor-grabbing" : ""} ${
                          draggingId === ticket.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setOpenTicket(ticket)}
                            className="truncate text-left text-sm font-semibold text-sky-700 after:absolute after:inset-0 after:content-[''] hover:text-sky-800 hover:underline"
                          >
                            {ticket.ticketId}
                          </button>
                          {savingId === ticket.id ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" aria-label="Saving" />
                          ) : (
                            <span className="flex shrink-0 items-center gap-1">
                              {isSprintLocked(ticket.sprintStatus, isAdmin) ? (
                                <Lock className="h-3.5 w-3.5 text-slate-400" aria-label="Locked (completed sprint)" />
                              ) : null}
                              <TypeBadge type={ticket.type} size="sm" />
                            </span>
                          )}
                        </div>
                        {ticket.title ? (
                          <p className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-slate-900">{ticket.title}</p>
                        ) : null}
                        <p className={`${ticket.title ? "line-clamp-2" : "line-clamp-3"} text-xs leading-relaxed text-slate-600`}>
                          {ticket.userDescription || "No description"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          <span>{formatEnvironment(ticket.reportedEnvironment)}</span>
                          <span aria-hidden>·</span>
                          <span>
                            {new Date(ticket.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
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
            );
          })}

          {isAdmin ? (
            <section className="w-72 shrink-0 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 p-3">
              {adding ? (
                <div className="space-y-2">
                  <label className="dp-label" htmlFor="new-status-label">
                    New status
                  </label>
                  <input
                    id="new-status-label"
                    value={newStatus.label}
                    maxLength={40}
                    onChange={(e) => setNewStatus((s) => ({ ...s, label: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addColumn();
                      if (e.key === "Escape") setAdding(false);
                    }}
                    placeholder="e.g. Blocked, Waiting on client"
                    className="dp-input"
                    autoFocus
                  />
                  <ColorSwatches value={newStatus.color} onChange={(color) => setNewStatus((s) => ({ ...s, color }))} />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={statusSaving || !newStatus.label.trim()}
                      onClick={() => void addColumn()}
                      className="dp-btn-primary py-1.5 text-xs"
                    >
                      {statusSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                      Add status
                    </button>
                    <button type="button" onClick={() => setAdding(false)} className="dp-btn-ghost py-1.5 text-xs">
                      <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-6 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add status
                </button>
              )}
            </section>
          ) : null}
        </div>
      )}

      {openTicket ? (
        <TicketModal
          id={openTicket.id}
          ticketNumber={openTicket.ticketId}
          sprintId={openTicket.sprintId}
          sprintName={openTicket.sprintName}
          onClose={(changed) => {
            setOpenTicket(null);
            if (changed) void load();
          }}
        />
      ) : null}
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-label="Loading" />
        </div>
      }
    >
      <BoardPageInner />
    </Suspense>
  );
}
