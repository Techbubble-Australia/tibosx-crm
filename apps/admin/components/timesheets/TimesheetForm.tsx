"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Plane,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";
import { formatTimesheetActivityTitle } from "@/lib/timesheet-activity-display";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { TimesheetProfileWarningBanner } from "@/components/timesheets/TimesheetProfileWarningBanner";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { appAlert, appConfirm } from "@/lib/app-alert";
import {
  formatDayLong,
  formatDayShort,
  formatMonthLabel,
  hoursInputToNumber,
  monthBounds,
  monthCompletion,
  monthDays,
  mondayOffset,
  projectMonthKeys,
  sanitizeHoursInput,
  shiftMonth,
  sumDateHours,
  DAY_OFF_LABELS,
  type DateComments,
  type DateHours,
  type DayOff,
  type DayOffKind,
} from "@/lib/timesheet-month";

export type TimesheetEntryValues = {
  id?: string;
  opportunityId?: string | null;
  ticketId?: string | null;
  label?: string;
  dailyHours?: DateHours | null;
  dailyComments?: DateComments | null;
  billable?: boolean;
};

/** A monthly timesheet: startDate is the 1st of the month, hours are keyed by ISO date. */
export type TimesheetFormValues = {
  id?: string;
  projectId?: string | null;
  approverKind?: string | null;
  projectClientContactId?: string | null;
  approverLabel?: string;
  memberName?: string;
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  fileUrls: string[];
  entries?: TimesheetEntryValues[];
  comments?: string | null;
  rejectReason?: string | null;
  targetLabel?: string;
  projectNumber?: string;
  projectTitle?: string;
  memberUserId?: string;
  monthKey?: string | null;
  daysOff?: Array<DayOff | string>;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  activityLogs?: Array<{
    id: string;
    action: string;
    reason: string | null;
    performedByName: string;
    createdAt: string;
  }>;
};

type ProjectOption = { id: string; label: string; kind: string };
type CaseOption = { kind: "ticket" | "opportunity" | "project"; id: string; label: string };
type ApproverOption = { kind: "PM" | "CLIENT_CONTACT"; id: string; label: string };

type LineEntry = {
  key: string;
  id?: string;
  caseKey: string;
  label?: string;
  dailyHours: DateHours;
  dailyComments: DateComments;
  billable: boolean;
};

type Props = {
  defaults: Partial<TimesheetFormValues>;
  monthKey: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  readOnly?: boolean;
  title?: string;
  footerActions?: ReactNode;
  onSubmitForApproval?: () => void | Promise<void>;
  submitForApprovalLoading?: boolean;
  showSubmitForApproval?: boolean;
  /** Owner may start a new sheet when navigating to a month without one. */
  canStartTimesheetForEmptyMonth?: boolean;
  /** Month switcher (off for client approvers, who only see the submitted sheet). */
  allowMonthNavigation?: boolean;
};

const selectClass =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function newLineKey() {
  return `line-${Math.random().toString(36).slice(2, 11)}`;
}

function caseKeyFromTargets(ticketId?: string | null, opportunityId?: string | null, projectId?: string | null) {
  if (ticketId) return `ticket:${ticketId}`;
  if (opportunityId) return `opportunity:${opportunityId}`;
  if (projectId) return `project:${projectId}`;
  return "";
}

function linesFromDefaults(defaults: Partial<TimesheetFormValues>): LineEntry[] {
  const projectId = defaults.projectId ?? null;
  return (defaults.entries ?? []).map((row) => ({
    key: row.id ?? newLineKey(),
    id: row.id,
    caseKey: caseKeyFromTargets(row.ticketId, row.opportunityId, projectId),
    label: row.label,
    dailyHours: (row.dailyHours as DateHours) ?? {},
    dailyComments: (row.dailyComments as DateComments) ?? {},
    billable: row.billable ?? true,
  }));
}

function linePayload(line: LineEntry) {
  const [kind, id] = line.caseKey ? line.caseKey.split(":") : ["", ""];
  const entry: Record<string, unknown> = {
    dailyHours: line.dailyHours,
    dailyComments: line.dailyComments,
    billable: line.billable,
  };
  if (line.id) entry.id = line.id;
  if (kind === "ticket" && id) entry.ticketId = id;
  else if (kind === "opportunity" && id) entry.opportunityId = id;
  return entry;
}

function formatHours(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(2).replace(/0$/, "");
}

/** Older sheets stored bare dates (leave). */
function dayOffMap(raw: Array<DayOff | string> | undefined): Map<string, DayOffKind> {
  const map = new Map<string, DayOffKind>();
  for (const item of raw ?? []) {
    if (typeof item === "string") map.set(item, "LEAVE");
    else if (item?.date) map.set(item.date, item.kind === "HOLIDAY" ? "HOLIDAY" : "LEAVE");
  }
  return map;
}

function dayOffSignature(map: Map<string, DayOffKind>): string {
  return [...map].sort(([a], [b]) => a.localeCompare(b)).map(([d, k]) => `${d}:${k}`).join(",");
}

type DayTone = "locked" | "logged" | "leave" | "holiday" | "missing" | "weekend" | "open";

/** Colour per day state; hours logged on a weekend still read as logged. */
const DAY_TONES: Record<DayTone, { cell: string; label: string }> = {
  locked: {
    cell: "cursor-not-allowed border-gray-100 bg-gray-100/80 text-gray-400 dark:border-gray-800 dark:bg-gray-900/70",
    label: "text-gray-400",
  },
  logged: {
    cell: "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/40",
    label: "text-emerald-800 dark:text-emerald-200",
  },
  leave: {
    cell: "border-violet-300 bg-violet-50 hover:border-violet-400 dark:border-violet-800 dark:bg-violet-950/40",
    label: "text-violet-800 dark:text-violet-200",
  },
  holiday: {
    cell: "border-amber-300 bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/40",
    label: "text-amber-800 dark:text-amber-200",
  },
  missing: {
    cell: "border-dashed border-rose-300 bg-white hover:bg-rose-50/60 dark:border-rose-800 dark:bg-gray-950",
    label: "text-rose-600 dark:text-rose-300",
  },
  weekend: {
    cell: "border-slate-200 bg-slate-100 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800/60",
    label: "text-slate-500 dark:text-slate-400",
  },
  open: {
    cell: "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950",
    label: "text-gray-500",
  },
};

function linesSignature(lines: LineEntry[]): string {
  return JSON.stringify(
    lines
      .filter((l) => sumDateHours(l.dailyHours) > 0 || l.caseKey)
      .map((l) => [l.caseKey, Object.entries(l.dailyHours).filter(([, v]) => (Number(v) || 0) > 0).sort()]),
  );
}

export function TimesheetForm({
  defaults,
  monthKey,
  onSubmit,
  isSaving,
  readOnly = false,
  title,
  footerActions,
  onSubmitForApproval,
  submitForApprovalLoading = false,
  showSubmitForApproval = false,
  canStartTimesheetForEmptyMonth = false,
  allowMonthNavigation = true,
}: Props) {
  const router = useRouter();
  const { canCreateTimesheets } = useAdminSession();
  const projectId = defaults.projectId ?? "";
  const memberUserId = defaults.memberUserId?.trim() || "";
  const status = (defaults.status ?? "DRAFT") as TimesheetStatus;
  const statusBadgeKey = !defaults.id && status === "DRAFT" ? "DRAFT_UNSAVED" : status;
  const editable = !readOnly && status === "DRAFT";

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [bounds, setBounds] = useState<{ start: string; end: string } | null>(
    defaults.projectStartDate && defaults.projectEndDate
      ? { start: defaults.projectStartDate.slice(0, 10), end: defaults.projectEndDate.slice(0, 10) }
      : null,
  );
  const [lines, setLines] = useState<LineEntry[]>(() => linesFromDefaults(defaults));
  const [daysOff, setDaysOff] = useState<Map<string, DayOffKind>>(() => dayOffMap(defaults.daysOff));
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  /** Tasks added on the selected day that have no hours yet; reset whenever another date is opened. */
  const [dayLineKeys, setDayLineKeys] = useState<Set<string>>(() => new Set());
  const [navigating, setNavigating] = useState(false);

  const days = useMemo(() => monthDays(monthKey, bounds?.start, bounds?.end), [monthKey, bounds]);
  const months = useMemo(() => (bounds ? projectMonthKeys(bounds.start, bounds.end) : []), [bounds]);
  const totalsByDay = useMemo(() => {
    const totals = new Map<string, number>();
    for (const line of lines) {
      for (const [iso, value] of Object.entries(line.dailyHours)) {
        const n = Number(value) || 0;
        if (n > 0) totals.set(iso, (totals.get(iso) ?? 0) + n);
      }
    }
    return totals;
  }, [lines]);
  const completion = useMemo(
    () => monthCompletion(days, totalsByDay, new Set(daysOff.keys())),
    [days, totalsByDay, daysOff],
  );
  const leaveCount = [...daysOff.values()].filter((k) => k === "LEAVE").length;
  const holidayCount = daysOff.size - leaveCount;
  const monthTotal = useMemo(() => [...totalsByDay.values()].reduce((s, v) => s + v, 0), [totalsByDay]);
  const missing = useMemo(() => new Set(completion.missingDays), [completion]);

  const dirty = useMemo(() => {
    if (!editable) return false;
    if (linesSignature(lines) !== linesSignature(linesFromDefaults(defaults))) return true;
    if (dayOffSignature(daysOff) !== dayOffSignature(dayOffMap(defaults.daysOff))) return true;
    if ((comments ?? "").trim() !== (defaults.comments ?? "").trim()) return true;
    const initialFiles = defaults.fileUrls ?? [];
    return fileUrls.length !== initialFiles.length || fileUrls.some((u, i) => u !== initialFiles[i]);
  }, [editable, lines, daysOff, comments, fileUrls, defaults]);

  const tasksComplete = lines.every((l) => sumDateHours(l.dailyHours) === 0 || Boolean(l.caseKey));
  const approverMissing = editable && approvers.length > 0 && !selectedApprover;
  const canSave =
    editable &&
    Boolean(projectId) &&
    (monthTotal > 0 || daysOff.size > 0 || fileUrls.length > 0) &&
    tasksComplete &&
    !approverMissing;
  const canSubmit =
    showSubmitForApproval && Boolean(defaults.id) && status === "DRAFT" && completion.complete && !dirty;
  const submitHint = !completion.complete
    ? `Fill in every weekday before submitting: ${completion.filledDays} of ${completion.requiredDays} done.`
    : dirty
      ? "Save your changes before submitting."
      : null;

  const monthIndex = months.indexOf(monthKey);
  const canPrev = allowMonthNavigation && monthIndex > 0;
  const canNext = allowMonthNavigation && monthIndex >= 0 && monthIndex < months.length - 1;
  const projectLabel =
    projects.find((p) => p.id === projectId)?.label ||
    (defaults.projectNumber && defaults.projectTitle ? `${defaults.projectNumber} — ${defaults.projectTitle}` : "");

  useEffect(() => {
    if (!allowMonthNavigation) return;
    void adminFetch("/api/admin/timesheets/active-projects")
      .then((r) => r.json())
      .then((data) => setProjects((data.data as ProjectOption[]) ?? []))
      .catch(() => undefined);
  }, [allowMonthNavigation]);

  useEffect(() => {
    if (!projectId || !allowMonthNavigation) return;
    const params = new URLSearchParams({ projectId, month: monthKey });
    if (memberUserId) params.set("asMemberUserId", memberUserId);
    void adminFetch(`/api/admin/timesheets/project-cases?${params}`)
      .then((r) => r.json())
      .then((data) => setCases((data.data as CaseOption[]) ?? []))
      .catch(() => setCases([]));
  }, [projectId, monthKey, memberUserId, allowMonthNavigation]);

  useEffect(() => {
    if (!projectId || !allowMonthNavigation) return;
    void adminFetch(`/api/admin/timesheets/target-meta?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => {
        const payload = data.data as { approvers?: ApproverOption[]; startDate?: string; endDate?: string };
        const list = payload?.approvers ?? [];
        setApprovers(list);
        if (payload?.startDate && payload?.endDate) setBounds({ start: payload.startDate, end: payload.endDate });
        const first = list[0];
        if (editable && first) setSelectedApprover((prev) => prev || `${first.kind}:${first.id}`);
      })
      .catch(() => setApprovers([]));
  }, [projectId, editable, allowMonthNavigation]);

  useEffect(() => {
    if (defaults.approverKind === "CLIENT_CONTACT" && defaults.projectClientContactId) {
      setSelectedApprover(`CLIENT_CONTACT:${defaults.projectClientContactId}`);
    } else if (defaults.approverKind === "PM") {
      setSelectedApprover("PM:PM");
    }
  }, [defaults.approverKind, defaults.projectClientContactId]);

  function caseLabel(line: LineEntry): string {
    return (
      cases.find((c) => `${c.kind}:${c.id}` === line.caseKey)?.label ||
      line.label ||
      (line.caseKey.startsWith("project:") ? projectLabel : "") ||
      "Select task…"
    );
  }

  function updateLine(key: string, patch: Partial<LineEntry>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function setDayHours(line: LineEntry, iso: string, raw: string) {
    if (daysOff.has(iso)) return;
    const sanitized = sanitizeHoursInput(raw);
    setRawInputs((prev) => ({ ...prev, [`${line.key}:${iso}`]: sanitized }));
    const n = sanitized && sanitized !== "." ? hoursInputToNumber(sanitized) : undefined;
    updateLine(line.key, { dailyHours: { ...line.dailyHours, [iso]: n && n > 0 ? n : undefined } });
  }

  function setDayComment(line: LineEntry, iso: string, value: string) {
    if (daysOff.has(iso)) return;
    updateLine(line.key, { dailyComments: { ...line.dailyComments, [iso]: value || undefined } });
  }

  function lineHasDayContent(line: LineEntry, iso: string): boolean {
    return (Number(line.dailyHours[iso]) || 0) > 0 || Boolean(line.dailyComments[iso]?.trim());
  }

  /** Adds a task to the selected day only; tasks already used on other days are reused, not duplicated. */
  function addTask(caseKey: string) {
    if (!caseKey) return;
    const existing = lines.find((l) => l.caseKey === caseKey);
    const key = existing?.key ?? newLineKey();
    if (!existing) {
      setLines((prev) => [...prev, { key, caseKey, dailyHours: {}, dailyComments: {}, billable: true }]);
    }
    setDayLineKeys((prev) => new Set(prev).add(key));
  }

  /** Removes this task's entry from the selected day only; other days keep their hours. */
  function removeDayEntry(line: LineEntry, iso: string) {
    const dailyHours = { ...line.dailyHours, [iso]: undefined };
    const dailyComments = { ...line.dailyComments, [iso]: undefined };
    const stillUsed =
      Object.values(dailyHours).some((v) => (Number(v) || 0) > 0) ||
      Object.values(dailyComments).some((v) => Boolean(v?.trim()));
    setLines((prev) =>
      stillUsed
        ? prev.map((l) => (l.key === line.key ? { ...l, dailyHours, dailyComments } : l))
        : prev.filter((l) => l.key !== line.key),
    );
    setDayLineKeys((prev) => {
      const next = new Set(prev);
      next.delete(line.key);
      return next;
    });
    setRawInputs((prev) => {
      const next = { ...prev };
      delete next[`${line.key}:${iso}`];
      return next;
    });
  }

  /**
   * null = working day. Personal leave and public holidays count as filled; marking either clears that
   * day's hours, tasks and comments, and the day stays read-only until it's set back to a working day.
   */
  async function setDayOff(iso: string, kind: DayOffKind | null) {
    if (kind) {
      const entries = lines.filter((l) => lineHasDayContent(l, iso));
      if (entries.length) {
        const hours = totalsByDay.get(iso) ?? 0;
        const ok = await appConfirm(
          `Marking this day as ${DAY_OFF_LABELS[kind]} clears ${entries.length} task entr${entries.length === 1 ? "y" : "ies"}${
            hours ? ` (${formatHours(hours)} hours)` : ""
          } on this day. Continue?`,
          { title: `Mark as ${DAY_OFF_LABELS[kind]}`, confirmLabel: "Clear and mark" },
        );
        if (!ok) return;
        for (const line of entries) removeDayEntry(line, iso);
      }
      setDayLineKeys(new Set());
    }
    setDaysOff((prev) => {
      const next = new Map(prev);
      if (kind) next.set(iso, kind);
      else next.delete(iso);
      return next;
    });
  }

  function openDay(iso: string) {
    const day = days.find((d) => d.iso === iso);
    if (!day || day.locked) return;
    if (!editable && !(totalsByDay.get(iso) ?? 0) && !daysOff.has(iso)) return;
    setRawInputs({});
    setDayLineKeys(new Set());
    setSelectedDay(iso);
  }

  async function goToMonth(next: string) {
    if (next === monthKey || navigating) return;
    if (dirty && !(await appConfirm("Timesheet entries are not saved. Do you want to continue?", { title: "Unsaved changes", confirmLabel: "Continue" }))) {
      return;
    }
    setNavigating(true);
    try {
      const params = new URLSearchParams({ projectId, month: next });
      if (memberUserId) params.set("memberUserId", memberUserId);
      const data = await adminFetch(`/api/admin/timesheets/for-month?${params}`).then((r) => r.json());
      const existing = data.data as { id?: string } | null;
      if (existing?.id) {
        router.push(`/timesheets/${existing.id}`);
        return;
      }
      if (canCreateTimesheets && (editable || canStartTimesheetForEmptyMonth)) {
        router.push(`/timesheets/new?projectId=${encodeURIComponent(projectId)}&month=${next}`);
        return;
      }
      void appAlert(`There is no timesheet for ${formatMonthLabel(next)}.`, "No timesheet");
    } finally {
      setNavigating(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !editable) return;
    setUploading(true);
    try {
      const next = [...fileUrls];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("document", file);
        const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
        const url = readUploadImageUrlFromJson(await res.json());
        if (url) next.push(url);
      }
      setFileUrls(next);
    } catch {
      appAlert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    if (!tasksComplete) {
      appAlert("Select a task for each row with hours.");
      return;
    }
    const { startIso, endIso } = monthBounds(monthKey);
    const payload: Record<string, unknown> = {
      projectId,
      startDate: startIso,
      endDate: endIso,
      fileUrls,
      entries: lines.filter((l) => sumDateHours(l.dailyHours) > 0).map(linePayload),
      daysOff: [...daysOff]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, kind]) => ({ date, kind })),
      comments: comments.trim() || null,
    };
    if (approvers.length && selectedApprover) {
      const [approverKind, approverId] = selectedApprover.split(":");
      payload.approverKind = approverKind;
      if (approverKind === "CLIENT_CONTACT") payload.projectClientContactId = approverId;
    }
    await onSubmit(payload);
  }

  const selectedApproverLabel =
    defaults.approverLabel ||
    approvers.find((a) => selectedApprover === `${a.kind}:${a.id}`)?.label ||
    (approvers.length === 1 ? approvers[0]!.label : "");
  const dayLines = selectedDay
    ? lines.filter((l) => dayLineKeys.has(l.key) || lineHasDayContent(l, selectedDay))
    : [];
  const dayCaseKeys = new Set(dayLines.map((l) => l.caseKey));
  const selectedDayOff = selectedDay ? daysOff.get(selectedDay) ?? null : null;
  const selectedDayInfo = selectedDay ? days.find((d) => d.iso === selectedDay) : null;
  const selectedDayTotal = selectedDay ? totalsByDay.get(selectedDay) ?? 0 : 0;
  const progressPct = completion.requiredDays ? Math.round((completion.filledDays / completion.requiredDays) * 100) : 100;

  return (
    <form onSubmit={(e) => void handleSave(e)} className="flex flex-col xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1">
        <TimesheetProfileWarningBanner />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <div className="border-b border-gray-100 px-5 py-2.5 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title ?? (defaults.id ? "Timesheet" : "New timesheet")}
              </h1>
              <TimesheetStatusBadge status={statusBadgeKey} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project <span className="text-red-500">*</span>
                </label>
                {defaults.id || memberUserId ? (
                  <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                    <span className="truncate">{projectLabel || "Project"}</span>
                  </p>
                ) : (
                  <select
                    className={selectClass}
                    value={projectId}
                    onChange={(e) => router.push(`/timesheets/new?projectId=${encodeURIComponent(e.target.value)}`)}
                  >
                    {projects.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timesheet month <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canPrev || navigating}
                    onClick={() => void goToMonth(shiftMonth(monthKey, -1))}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <select
                    className={selectClass}
                    value={monthKey}
                    disabled={navigating || months.length === 0 || !allowMonthNavigation}
                    onChange={(e) => void goToMonth(e.target.value)}
                    aria-label="Timesheet month"
                  >
                    {(months.length && allowMonthNavigation ? months : [monthKey]).map((m) => (
                      <option key={m} value={m}>
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!canNext || navigating}
                    onClick={() => void goToMonth(shiftMonth(monthKey, 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[14rem] flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatMonthLabel(monthKey)}</h2>
                  <span className={`text-xs font-medium ${completion.complete ? "text-emerald-700" : "text-amber-700"}`}>
                    {completion.filledDays} of {completion.requiredDays} weekdays filled
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full ${completion.complete ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {leaveCount || holidayCount ? (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {[
                      leaveCount ? `${leaveCount} personal leave day${leaveCount === 1 ? "" : "s"}` : "",
                      holidayCount ? `${holidayCount} public holiday${holidayCount === 1 ? "" : "s"}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly total</p>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {monthTotal.toFixed(2)} <span className="text-base font-semibold">hrs</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="pb-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {label}
                </div>
              ))}
              {Array.from({ length: mondayOffset(monthKey) }, (_, i) => (
                <div key={`blank-${i}`} aria-hidden />
              ))}
              {days.map((day) => {
                const hours = totalsByDay.get(day.iso) ?? 0;
                const offKind = daysOff.get(day.iso) ?? null;
                const isMissing = editable && missing.has(day.iso);
                const isSelected = selectedDay === day.iso;
                const hasComment = lines.some((l) => Boolean(l.dailyComments[day.iso]?.trim()));
                const clickable = !day.locked && (editable || hours > 0 || Boolean(offKind));
                const tone: DayTone = day.locked
                  ? "locked"
                  : offKind === "HOLIDAY"
                    ? "holiday"
                    : hours > 0
                      ? "logged"
                      : offKind === "LEAVE"
                        ? "leave"
                        : isMissing
                          ? "missing"
                          : day.weekend
                            ? "weekend"
                            : "open";
                const style = DAY_TONES[tone];
                return (
                  <button
                    key={day.iso}
                    type="button"
                    disabled={!clickable}
                    onClick={() => openDay(day.iso)}
                    title={day.locked ? "Outside the project dates" : formatDayLong(day.iso)}
                    className={`relative flex h-24 min-w-0 flex-col rounded-lg border p-2 text-left transition-colors ${style.cell} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-950" : ""
                    } ${!clickable && !day.locked ? "cursor-default" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-semibold ${tone === "locked" ? "" : "text-gray-800 dark:text-gray-200"}`}>
                        {day.day}
                      </span>
                      <span className="flex min-w-0 items-center gap-1">
                        {hours > 0 && offKind === "HOLIDAY" ? (
                          <span className={`flex items-center gap-0.5 truncate text-[10px] font-semibold uppercase ${style.label}`}>
                            <PartyPopper className="h-3 w-3 shrink-0" aria-hidden /> Holiday
                          </span>
                        ) : hours > 0 && day.weekend ? (
                          <span className={`truncate text-[10px] font-semibold uppercase ${style.label}`}>Weekend</span>
                        ) : null}
                        {hasComment && !day.locked ? (
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-label="Has comment" />
                        ) : null}
                        {day.locked ? <Lock className="h-3.5 w-3.5" aria-label="Locked" /> : null}
                      </span>
                    </span>
                    <span className="mt-auto min-w-0">
                      {hours > 0 ? (
                        <span className={`flex items-baseline gap-0.5 tabular-nums ${style.label}`}>
                          <span className="text-2xl font-bold leading-none">{formatHours(hours)}</span>
                          <span className="text-xs font-semibold">hrs</span>
                        </span>
                      ) : offKind ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold leading-tight ${style.label}`}>
                          {offKind === "HOLIDAY" ? (
                            <PartyPopper className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          ) : (
                            <Plane className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          )}
                          <span className="truncate">{DAY_OFF_LABELS[offKind]}</span>
                        </span>
                      ) : isMissing ? (
                        <span className={`text-xs font-medium ${style.label}`}>To fill</span>
                      ) : day.weekend && !day.locked ? (
                        <span className={`text-xs ${style.label}`}>Weekend</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              {(
                [
                  ["logged", "Hours logged"],
                  ["leave", "Personal Leave"],
                  ["holiday", "Public holiday"],
                  ["weekend", "Weekend (optional)"],
                  ...(editable ? ([["missing", "Weekday still to fill"]] as const) : []),
                  ["locked", "Outside project dates"],
                ] as const
              ).map(([tone, label]) => (
                <span key={tone} className="inline-flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded border ${DAY_TONES[tone].cell}`} aria-hidden />
                  {label}
                </span>
              ))}
            </div>

            {lines.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Task</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Days</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const logged = Object.values(line.dailyHours).filter((v) => (Number(v) || 0) > 0).length;
                      return (
                        <tr key={line.key} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{caseLabel(line)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-600">{logged}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">{sumDateHours(line.dailyHours).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : editable ? (
              <p className="mt-4 text-sm text-gray-500">Click a day in the calendar to log hours against a task.</p>
            ) : null}
          </div>

          <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Submission Details</h2>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Assigned Approver{approvers.length > 0 ? <span className="text-red-500"> *</span> : null}
            </p>
            {editable && approvers.length > 1 ? (
              <select className={`${selectClass} mb-4 max-w-md`} value={selectedApprover} onChange={(e) => setSelectedApprover(e.target.value)}>
                <option value="">Select approver…</option>
                {approvers.map((row) => (
                  <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                    {row.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mb-4 text-sm text-gray-800 dark:text-gray-200">{selectedApproverLabel || "—"}</p>
            )}
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              General timesheet comments <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              className="min-h-[5rem] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
              placeholder="Add any general notes for this month…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              readOnly={!editable}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">Total: {monthTotal.toFixed(2)} hrs</p>
              <p className="text-xs text-gray-500">
                {statusBadgeKey === "DRAFT_UNSAVED"
                  ? "Draft - Unsaved timesheet"
                  : `${TIMESHEET_STATUS_LABELS[status] ?? status} timesheet`}
              </p>
              {editable && showSubmitForApproval && submitHint ? (
                <p className="mt-1 text-xs text-amber-700">{submitHint}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {footerActions}
              {editable ? (
                <>
                  <button
                    type="submit"
                    disabled={!canSave || isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Draft
                  </button>
                  {showSubmitForApproval ? (
                    <button
                      type="button"
                      disabled={!canSubmit || submitForApprovalLoading}
                      title={submitHint ?? undefined}
                      onClick={() => void onSubmitForApproval?.()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitForApprovalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit for Approval
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Files</h3>
          <p className="mb-3 text-xs text-gray-500">Attach evidence of client approval if required</p>
          {editable ? (
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 hover:border-blue-300 dark:border-gray-600 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">Upload files</span>
              <input type="file" multiple className="sr-only" onChange={(e) => void uploadFiles(e.target.files)} disabled={uploading} />
            </label>
          ) : null}
          {fileUrls.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {fileUrls.map((url, index) => (
                <li key={url} className="flex items-center justify-between gap-2 text-sm">
                  <a href={resolveDocumentHref(url)} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                    {url.split("/").pop()}
                  </a>
                  {editable ? (
                    <button type="button" onClick={() => setFileUrls((prev) => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No files attached.</p>
          )}
        </section>

        {defaults.rejectReason ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Reject reason: {defaults.rejectReason}
          </div>
        ) : null}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
          {defaults.activityLogs && defaults.activityLogs.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {defaults.activityLogs.map((log) => (
                <li key={log.id} className="py-3 text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatTimesheetActivityTitle(log.action)}</p>
                  {log.reason ? <p className="text-gray-600">{log.reason}</p> : null}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {log.performedByName ? ` · ${log.performedByName}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No activity yet.</p>
          )}
        </section>
      </div>

      {selectedDay && selectedDayInfo ? (
        <aside className="mt-4 w-full shrink-0 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950 xl:mt-0 xl:w-[24rem] xl:border-l xl:shadow-[-4px_0_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDayLong(selectedDay)}</h2>
              <p className="text-xs text-gray-500">
                {selectedDayInfo.weekend ? "Weekend (optional)" : "Weekday"} · {formatHours(selectedDayTotal)} h logged
              </p>
            </div>
            <button type="button" onClick={() => setSelectedDay(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4 px-5 py-4">
            {!selectedDayInfo.weekend ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Day type">
                  {(
                    [
                      [null, "Working day", "logged"],
                      ["LEAVE", DAY_OFF_LABELS.LEAVE, "leave"],
                      ["HOLIDAY", DAY_OFF_LABELS.HOLIDAY, "holiday"],
                    ] as const
                  ).map(([kind, label, tone]) => {
                    const active = selectedDayOff === kind;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!editable && !active}
                        onClick={() => {
                          if (editable && !active) void setDayOff(selectedDay, kind);
                        }}
                        className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? `${DAY_TONES[tone].cell} ${DAY_TONES[tone].label} ring-1 ring-current`
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {kind === "LEAVE" ? <Plane className="h-3.5 w-3.5" aria-hidden /> : null}
                        {kind === "HOLIDAY" ? <PartyPopper className="h-3.5 w-3.5" aria-hidden /> : null}
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedDayOff
                    ? `Marked as ${DAY_OFF_LABELS[selectedDayOff]} — no hours, tasks or comments can be added. Choose Working day to log time.`
                    : `${DAY_OFF_LABELS.LEAVE} and public holidays count as filled.`}
                </p>
              </div>
            ) : null}

            {selectedDayOff ? null : (
              <>
                {dayLines.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {editable ? "No entries for this day yet. Add a task below." : "No hours logged."}
                  </p>
                ) : null}

                {dayLines.map((line) => {
                  const rawKey = `${line.key}:${selectedDay}`;
                  const value = line.dailyHours[selectedDay];
                  const raw = rawInputs[rawKey] ?? (value ? String(value) : "");
                  return (
                    <div key={line.key} className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {caseLabel(line)}
                        </p>
                        {editable ? (
                          <button
                            type="button"
                            onClick={() => removeDayEntry(line, selectedDay)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove this entry from this day"
                            title="Remove this entry from this day"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          readOnly={!editable}
                          value={raw}
                          onChange={(e) => setDayHours(line, selectedDay, e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-24 rounded-md border border-gray-200 px-3 text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                          aria-label="Hours"
                        />
                        <span className="text-xs text-gray-500">hours</span>
                      </div>
                      <textarea
                        rows={5}
                        readOnly={!editable}
                        value={line.dailyComments[selectedDay] ?? ""}
                        onChange={(e) => setDayComment(line, selectedDay, e.target.value)}
                        placeholder="What did you work on? (optional)"
                        className="min-h-[7.5rem] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm leading-relaxed dark:border-gray-600 dark:bg-gray-900"
                      />
                    </div>
                  );
                })}

                {editable ? (
                  <select
                    className={`${selectClass} border-dashed`}
                    value=""
                    onChange={(e) => addTask(e.target.value)}
                    aria-label="Add task"
                  >
                    <option value="">+ Add task for this day…</option>
                    {cases
                      .filter((row) => !dayCaseKeys.has(`${row.kind}:${row.id}`))
                      .map((row) => (
                        <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                          {row.label}
                        </option>
                      ))}
                  </select>
                ) : null}
                {editable ? (
                  <p className="flex items-start gap-1.5 text-xs text-gray-500">
                    <Plus className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    Each day starts empty; add the tasks you worked on and their hours. Changes are kept until you click Save Draft.
                  </p>
                ) : null}
              </>
            )}

            <div className="flex gap-2 pt-1">
              {(() => {
                const openDays = days.filter((d) => !d.locked);
                const index = openDays.findIndex((d) => d.iso === selectedDay);
                const prev = index > 0 ? openDays[index - 1] : null;
                const next = index >= 0 && index < openDays.length - 1 ? openDays[index + 1] : null;
                return (
                  <>
                    <button
                      type="button"
                      disabled={!prev}
                      onClick={() => prev && openDay(prev.iso)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4" /> {prev ? formatDayShort(prev.iso) : "Previous"}
                    </button>
                    <button
                      type="button"
                      disabled={!next}
                      onClick={() => next && openDay(next.iso)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-100"
                    >
                      {next ? formatDayShort(next.iso) : "Next"} <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </aside>
      ) : null}
    </form>
  );
}
