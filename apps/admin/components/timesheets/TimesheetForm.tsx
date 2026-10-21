"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import {
  type DailyComments,
  type DailyHours,
  type WeekdayKey,
  snapToMondayInput,
  sumDailyHours,
  toDateInputUtc,
  weekDatesFromMonday,
  WEEKDAY_KEYS,
  mondayOfWeek,
  sundayOfWeek,
  hoursInputToNumber,
  sanitizeHoursInput,
  weekOverlapsProjectRange,
  projectWeekMondayBounds,
} from "@/lib/timesheet-week";

export type TimesheetEntryValues = {
  id?: string;
  opportunityId?: string | null;
  ticketId?: string | null;
  label?: string;
  dailyHours?: DailyHours | null;
  dailyComments?: DailyComments | null;
  billable?: boolean;
};

export type TimesheetFormValues = {
  id?: string;
  projectId?: string | null;
  opportunityId?: string | null;
  ticketId?: string | null;
  approverKind?: string | null;
  projectClientContactId?: string | null;
  approverLabel?: string;
  memberName?: string;
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  fileUrls: string[];
  dailyHours?: DailyHours | null;
  dailyComments?: DailyComments | null;
  entries?: TimesheetEntryValues[];
  comments?: string | null;
  rejectReason?: string | null;
  targetLabel?: string;
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

type Props = {
  defaults: Partial<TimesheetFormValues>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  readOnly?: boolean;
  title?: string;
  footerActions?: ReactNode;
  onSubmitForApproval?: () => void | Promise<void>;
  submitForApprovalLoading?: boolean;
  showSubmitForApproval?: boolean;
};

type LineEntry = {
  key: string;
  id?: string;
  caseKey: string;
  label?: string;
  dailyHours: DailyHours;
  dailyComments: DailyComments;
  billable: boolean;
};

type CellSelection = { lineKey: string; dayKey: WeekdayKey };

const selectClass =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeekRange(mondayIso: string, sundayIso: string) {
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00.000Z`);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };
  return `${fmt(mondayIso)} – ${fmt(sundayIso)}`;
}

function formatDayHeader(iso: string, shortDow: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-AU", { month: "short", timeZone: "UTC" });
  return `${shortDow} (${day} ${month})`;
}

function formatLongDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatHoursCell(value: number | undefined) {
  if (value === undefined || value === 0) return "";
  return value.toFixed(2);
}

function hoursDurationHint(raw: string) {
  const n = hoursInputToNumber(raw);
  if (n === undefined || n <= 0) return null;
  const whole = Math.floor(n);
  const minutes = Math.round((n - whole) * 60);
  const hPart = `${whole} hour${whole === 1 ? "" : "s"}`;
  if (minutes === 0) return `${raw} = ${hPart}`;
  return `${raw} = ${hPart} ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function shiftWeek(mondayIso: string, deltaDays: number) {
  const d = new Date(`${mondayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return snapToMondayInput(toDateInputUtc(d));
}

function emptyHours(): DailyHours {
  return {};
}

function newLineKey() {
  return `line-${Math.random().toString(36).slice(2, 11)}`;
}

function caseKeyFromTargets(
  ticketId?: string | null,
  opportunityId?: string | null,
  projectId?: string | null,
) {
  if (ticketId) return `ticket:${ticketId}`;
  if (opportunityId) return `opportunity:${opportunityId}`;
  if (projectId) return `project:${projectId}`;
  return "";
}

function emptyLine(): LineEntry {
  return {
    key: newLineKey(),
    caseKey: "",
    dailyHours: emptyHours(),
    dailyComments: {},
    billable: true,
  };
}

function linesFromDefaults(defaults: Partial<TimesheetFormValues>): LineEntry[] {
  const projectId = defaults.projectId ?? null;
  if (defaults.entries?.length) {
    return defaults.entries.map((row) => ({
      key: row.id ?? newLineKey(),
      id: row.id,
      caseKey: caseKeyFromTargets(row.ticketId, row.opportunityId, projectId),
      label: row.label,
      dailyHours: (row.dailyHours as DailyHours) ?? emptyHours(),
      dailyComments: (row.dailyComments as DailyComments) ?? {},
      billable: row.billable ?? true,
    }));
  }
  const hours = (defaults.dailyHours as DailyHours) ?? emptyHours();
  if (defaults.id && sumDailyHours(hours) > 0) {
    return [
      {
        key: defaults.id,
        id: defaults.id,
        caseKey: caseKeyFromTargets(defaults.ticketId, defaults.opportunityId, projectId),
        label: defaults.targetLabel,
        dailyHours: hours,
        dailyComments: (defaults.dailyComments as DailyComments) ?? {},
        billable: true,
      },
    ];
  }
  return [];
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

function setDailyHour(
  hours: DailyHours,
  key: WeekdayKey,
  raw: string,
): DailyHours {
  const sanitized = sanitizeHoursInput(raw);
  if (!sanitized || sanitized === ".") {
    return { ...hours, [key]: undefined };
  }
  const n = hoursInputToNumber(sanitized);
  return { ...hours, [key]: n };
}

function approverDisplayName(label: string) {
  const match = label.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { name: match[1]!.trim(), role: match[2]!.trim() };
  return { name: label, role: "" };
}

function BillableToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function TimesheetForm({
  defaults,
  onSubmit,
  isSaving,
  readOnly = false,
  title,
  footerActions,
  onSubmitForApproval,
  submitForApprovalLoading = false,
  showSubmitForApproval = false,
}: Props) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(defaults.projectId ?? "");
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [lines, setLines] = useState<LineEntry[]>(() => linesFromDefaults(defaults));
  const [weekMonday, setWeekMonday] = useState(
    snapToMondayInput(toDateInput(defaults.startDate) || toDateInputUtc(mondayOfWeek())),
  );
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [weekConflict, setWeekConflict] = useState(false);
  const [projectBounds, setProjectBounds] = useState<{ start: string; end: string } | null>(null);
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [panelHours, setPanelHours] = useState("");
  const [panelComment, setPanelComment] = useState("");
  const weekDateInputRef = useRef<HTMLInputElement>(null);

  const status = defaults.status ?? "DRAFT";
  const formEditable = !readOnly && status === "DRAFT";
  const entryEditable = formEditable && !weekConflict;
  const pageTitle = title ?? (defaults.id ? "Timesheet" : "New Timesheet");

  const weekSun = useMemo(() => {
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    return toDateInputUtc(sundayOfWeek(mon));
  }, [weekMonday]);

  const weekDays = useMemo(() => weekDatesFromMonday(weekMonday), [weekMonday]);
  const weekMondayBounds = useMemo(() => {
    if (!projectBounds) return null;
    return projectWeekMondayBounds(projectBounds.start, projectBounds.end);
  }, [projectBounds]);
  const weekInProject = useMemo(() => {
    if (!projectBounds) return true;
    return weekOverlapsProjectRange(weekMonday, projectBounds.start, projectBounds.end);
  }, [projectBounds, weekMonday]);

  const canShiftWeekPrev = useMemo(() => {
    if (!formEditable || !weekMondayBounds) return formEditable;
    const prev = shiftWeek(weekMonday, -7);
    return (
      prev >= weekMondayBounds.min &&
      weekOverlapsProjectRange(prev, projectBounds!.start, projectBounds!.end)
    );
  }, [formEditable, weekMonday, weekMondayBounds, projectBounds]);

  const canShiftWeekNext = useMemo(() => {
    if (!formEditable || !weekMondayBounds) return formEditable;
    const next = shiftWeek(weekMonday, 7);
    return (
      next <= weekMondayBounds.max &&
      weekOverlapsProjectRange(next, projectBounds!.start, projectBounds!.end)
    );
  }, [formEditable, weekMonday, weekMondayBounds, projectBounds]);

  const projectLabel = projects.find((p) => p.id === projectId)?.label ?? "";

  function dayWithinProject(iso: string) {
    if (!projectBounds) return true;
    return iso >= projectBounds.start && iso <= projectBounds.end;
  }

  const hoursTotal = useMemo(
    () => lines.reduce((sum, line) => sum + sumDailyHours(line.dailyHours), 0),
    [lines],
  );

  const dailyTotals = useMemo(() => {
    const totals: Partial<Record<WeekdayKey, number>> = {};
    for (const key of WEEKDAY_KEYS) {
      totals[key] = lines.reduce((sum, line) => sum + (Number(line.dailyHours[key]) || 0), 0);
    }
    return totals;
  }, [lines]);

  const managerRequired = entryEditable && approvers.length > 0 && !selectedApprover;
  const hasAnyHours = hoursTotal > 0;
  const entryRowsForSave = useMemo(
    () => lines.filter((line) => sumDailyHours(line.dailyHours) > 0 || line.caseKey.trim()),
    [lines],
  );
  const entryTasksComplete = useMemo(
    () =>
      entryRowsForSave.every(
        (line) => sumDailyHours(line.dailyHours) === 0 || Boolean(line.caseKey.trim()),
      ),
    [entryRowsForSave],
  );
  const canSave =
    entryEditable &&
    weekInProject &&
    Boolean(projectId) &&
    hasAnyHours &&
    !managerRequired &&
    entryTasksComplete;
  const canSubmitForApproval =
    showSubmitForApproval &&
    Boolean(defaults.id) &&
    hasAnyHours &&
    !managerRequired &&
    status === "DRAFT";

  const selectedApproverLabel =
    defaults.approverLabel ||
    approvers.find((a) => selectedApprover === `${a.kind}:${a.id}`)?.label ||
    "";
  const approverParts = approverDisplayName(selectedApproverLabel);

  const selectedLine = selection ? lines.find((l) => l.key === selection.lineKey) : null;
  const selectedDayIso = selection
    ? weekDays.find((d) => d.key === selection.dayKey)?.iso
    : undefined;

  useEffect(() => {
    if (defaults.projectId) setProjectId(defaults.projectId);
  }, [defaults.projectId]);

  useEffect(() => {
    if (defaults.id) {
      const loaded = linesFromDefaults(defaults);
      setLines(loaded.length ? loaded : [emptyLine()]);
    }
  }, [
    defaults.id,
    defaults.projectId,
    defaults.entries,
    defaults.dailyHours,
    defaults.ticketId,
    defaults.opportunityId,
    defaults.targetLabel,
  ]);

  useEffect(() => {
    if (entryEditable && lines.length === 0) {
      setLines([emptyLine()]);
    }
  }, [entryEditable, lines.length]);

  useEffect(() => {
    if (defaults.approverKind === "CLIENT_CONTACT" && defaults.projectClientContactId) {
      setSelectedApprover(`CLIENT_CONTACT:${defaults.projectClientContactId}`);
    } else if (defaults.approverKind === "PM") {
      setSelectedApprover("PM:PM");
    }
  }, [defaults.approverKind, defaults.projectClientContactId]);

  useEffect(() => {
    void adminFetch("/api/admin/timesheets/active-projects")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data as ProjectOption[]) ?? [];
        setProjects(list);
        if (!projectId && defaults.projectId) setProjectId(defaults.projectId);
        else if (!projectId && list.length === 1) setProjectId(list[0]!.id);
      });
  }, [defaults.projectId, projectId]);

  useEffect(() => {
    if (!projectId) {
      setCases([]);
      return;
    }
    void adminFetch(`/api/admin/timesheets/project-cases?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => setCases((data.data as CaseOption[]) ?? []));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setApprovers([]);
      setProjectBounds(null);
      return;
    }
    void adminFetch(`/api/admin/timesheets/target-meta?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => {
        const payload = data.data as {
          approvers?: ApproverOption[];
          startDate?: string | null;
          endDate?: string | null;
        };
        const list = payload?.approvers ?? [];
        setApprovers(list);
        if (payload?.startDate && payload?.endDate) {
          setProjectBounds({ start: payload.startDate, end: payload.endDate });
        } else {
          setProjectBounds(null);
        }
        const first = list[0];
        if (formEditable && first) {
          setSelectedApprover((prev) => prev || `${first.kind}:${first.id}`);
        }
      })
      .catch(() => {
        setApprovers([]);
        setProjectBounds(null);
      });
  }, [projectId, formEditable]);

  useEffect(() => {
    if (defaults.id || !projectId || !weekMonday) {
      setWeekConflict(false);
      return;
    }
    void adminFetch(
      `/api/admin/timesheets/for-week?projectId=${encodeURIComponent(projectId)}&startDate=${encodeURIComponent(weekMonday)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const existing = data.data as { id?: string } | null;
        setWeekConflict(Boolean(existing?.id));
      })
      .catch(() => setWeekConflict(false));
  }, [defaults.id, projectId, weekMonday]);

  useEffect(() => {
    if (!formEditable) return;
    const loadedMonday = snapToMondayInput(toDateInput(defaults.startDate));
    if (weekMonday === loadedMonday) return;
    setLines([emptyLine()]);
    setComments("");
    setFileUrls([]);
    setSelection(null);
  }, [weekMonday, formEditable, defaults.startDate]);

  useEffect(() => {
    if (defaults.id || !projectId || !weekMonday) return;
    setLines([emptyLine()]);
    setComments("");
    setFileUrls([]);
    setSelection(null);
  }, [projectId, weekMonday, defaults.id]);

  function updateLine(key: string, patch: Partial<LineEntry>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    setLines((prev) => {
      const next = prev.filter((line) => line.key !== key);
      return next.length ? next : [emptyLine()];
    });
    if (selection?.lineKey === key) setSelection(null);
  }

  function addTaskLine() {
    if (!entryEditable || !weekInProject || !projectId) return;
    setLines((prev) => [...prev, emptyLine()]);
  }

  function openCell(lineKey: string, dayKey: WeekdayKey) {
    if (!entryEditable) return;
    const line = lines.find((l) => l.key === lineKey);
    const iso = weekDays.find((d) => d.key === dayKey)?.iso;
    if (!line || !iso || !dayWithinProject(iso)) return;
    setSelection({ lineKey, dayKey });
    const h = line.dailyHours[dayKey];
    setPanelHours(h !== undefined && h > 0 ? String(h) : "");
    setPanelComment(line.dailyComments[dayKey] ?? "");
  }

  function savePanelEntry() {
    if (!selection) return;
    const { lineKey, dayKey } = selection;
    const line = lines.find((l) => l.key === lineKey);
    if (!line) return;
    updateLine(lineKey, {
      dailyHours: setDailyHour(line.dailyHours, dayKey, panelHours),
      dailyComments: {
        ...line.dailyComments,
        [dayKey]: panelComment.trim() || undefined,
      },
    });
    setSelection(null);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !entryEditable) return;
    setUploading(true);
    try {
      const nextUrls = [...fileUrls];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("document", file);
        const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
        const data = await res.json();
        const url = readUploadImageUrlFromJson(data);
        if (url) nextUrls.push(url);
      }
      setFileUrls(nextUrls);
    } catch {
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    if (!projectId) {
      alert("Select a project.");
      return;
    }
    if (approvers.length && !selectedApprover) {
      alert("Choose an approver for your timesheet.");
      return;
    }
    const entryRows = entryRowsForSave;
    if (entryRows.some((line) => sumDailyHours(line.dailyHours) > 0 && !line.caseKey.trim())) {
      alert("Select a task or ticket for each row with hours.");
      return;
    }
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    const sun = sundayOfWeek(mon);
    const payload: Record<string, unknown> = {
      projectId,
      startDate: weekMonday,
      endDate: toDateInputUtc(sun),
      fileUrls,
      entries: entryRows.map(linePayload),
      comments: comments.trim() || null,
    };
    if (approvers.length && selectedApprover) {
      const [approverKind, approverId] = selectedApprover.split(":");
      payload.approverKind = approverKind;
      if (approverKind === "CLIENT_CONTACT") payload.projectClientContactId = approverId;
    }
    await onSubmit(payload);
  }

  const conflictMessage = weekConflict
    ? "There's already a timesheet for this project and week. Choose a different project or week."
    : projectBounds && !weekInProject
      ? "This week is outside the project contract dates."
      : null;

  const shortDows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <form onSubmit={(e) => void handleSave(e)} className="flex flex-col xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1">
        {conflictMessage ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {conflictMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
              <TimesheetStatusBadge status={status} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  className={`${selectClass} ${formEditable ? "" : "cursor-not-allowed bg-gray-50"}`}
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setLines([emptyLine()]);
                    setSelection(null);
                  }}
                  disabled={!formEditable}
                  required
                >
                  <option value="">Select project…</option>
                  {projects.map((row) => (
                    <option key={row.id} value={row.id}>{row.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timesheet week <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
                    disabled={!canShiftWeekPrev}
                    onClick={() => setWeekMonday((w) => shiftWeek(w, -7))}
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative min-w-0 flex-1">
                    <input
                      ref={weekDateInputRef}
                      type="date"
                      className="sr-only"
                      value={weekMonday}
                      min={weekMondayBounds?.min}
                      max={weekMondayBounds?.max}
                      onChange={(e) => setWeekMonday(snapToMondayInput(e.target.value))}
                      tabIndex={-1}
                      aria-hidden
                    />
                    <button
                      type="button"
                      disabled={!formEditable}
                      onClick={() => weekDateInputRef.current?.showPicker?.() ?? weekDateInputRef.current?.click()}
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    >
                      <span className="truncate">{formatWeekRange(weekMonday, weekSun)}</span>
                      <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
                    disabled={!canShiftWeekNext}
                    onClick={() => setWeekMonday((w) => shiftWeek(w, 7))}
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-3 flex items-end justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Time Entries</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Weekly Total</p>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {hoursTotal.toFixed(2)} <span className="text-base font-semibold">hrs</span>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/50">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Task / Ticket
                    </th>
                    {weekDays.map((d, i) => (
                      <th
                        key={d.key}
                        className="border-l border-gray-200 px-1 py-2.5 text-center text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                      >
                        {formatDayHeader(d.iso, shortDows[i]!)}
                      </th>
                    ))}
                    <th className="border-l border-gray-200 px-2 py-2.5 text-center text-xs font-semibold text-gray-700 dark:border-gray-700">
                      Total
                    </th>
                    <th className="border-l border-gray-200 px-2 py-2.5 text-center text-xs font-semibold text-gray-700 dark:border-gray-700">
                      Billable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const lineTotal = sumDailyHours(line.dailyHours);
                    const caseLabel =
                      line.label ||
                      (line.caseKey
                        ? cases.find((c) => `${c.kind}:${c.id}` === line.caseKey)?.label
                        : undefined);
                    return (
                      <tr key={line.key} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-2 py-2 align-middle">
                          <div className="flex items-center gap-1">
                            {entryEditable ? (
                              <select
                                className={`${selectClass} h-9 min-w-[10rem] text-xs`}
                                value={line.caseKey}
                                onChange={(e) =>
                                  updateLine(line.key, { caseKey: e.target.value, label: undefined })
                                }
                                disabled={!projectId}
                              >
                                <option value="">Select task…</option>
                                {cases.map((row) => (
                                  <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                                    {row.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {caseLabel || "—"}
                              </span>
                            )}
                            {entryEditable && lines.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeLine(line.key)}
                                className="text-gray-400 hover:text-red-500"
                                aria-label="Remove row"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        {weekDays.map(({ key, iso }) => {
                          const value = line.dailyHours[key];
                          const hasComment = Boolean(line.dailyComments[key]?.trim());
                          const isSelected =
                            selection?.lineKey === line.key && selection.dayKey === key;
                          const dayAllowed = dayWithinProject(iso);
                          return (
                            <td key={key} className="border-l border-gray-100 p-1 dark:border-gray-800">
                              <button
                                type="button"
                                disabled={!entryEditable || !dayAllowed}
                                onClick={() => openCell(line.key, key)}
                                className={`relative flex h-11 w-full flex-col items-center justify-center rounded-md text-sm tabular-nums transition-colors ${
                                  isSelected
                                    ? "border-2 border-blue-500 bg-blue-50/50 ring-1 ring-blue-200"
                                    : "border border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                                } ${!entryEditable || !dayAllowed ? "cursor-default opacity-60" : ""}`}
                              >
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatHoursCell(value)}
                                </span>
                                {hasComment ? (
                                  <MessageSquare
                                    className="absolute right-1 top-1 h-3 w-3 text-blue-500"
                                    aria-label="Has comment"
                                  />
                                ) : null}
                              </button>
                            </td>
                          );
                        })}
                        <td className="border-l border-gray-100 px-2 py-2 text-center font-semibold tabular-nums text-gray-900 dark:border-gray-800 dark:text-gray-100">
                          {lineTotal > 0 ? lineTotal.toFixed(2) : "—"}
                        </td>
                        <td className="border-l border-gray-100 px-2 py-2 text-center dark:border-gray-800">
                          <div className="flex justify-center">
                            <BillableToggle
                              checked={line.billable}
                              disabled={!entryEditable}
                              onChange={(v) => updateLine(line.key, { billable: v })}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50/60 dark:bg-gray-900/40">
                    <td className="px-3 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Daily Total
                    </td>
                    {WEEKDAY_KEYS.map((key) => (
                      <td
                        key={`total-${key}`}
                        className="border-l border-gray-100 px-1 py-2.5 text-center text-sm font-semibold tabular-nums text-gray-900 dark:border-gray-800 dark:text-gray-100"
                      >
                        {(dailyTotals[key] ?? 0) > 0 ? (dailyTotals[key] ?? 0).toFixed(2) : "—"}
                      </td>
                    ))}
                    <td className="border-l border-gray-100 px-2 py-2.5 text-center text-sm font-bold tabular-nums dark:border-gray-800">
                      {hoursTotal.toFixed(2)}
                    </td>
                    <td className="border-l border-gray-100 dark:border-gray-800" />
                  </tr>
                </tbody>
              </table>
            </div>

            {entryEditable ? (
              <button
                type="button"
                onClick={() => addTaskLine()}
                disabled={!projectId || !weekInProject}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                <Plus className="h-4 w-4" /> Add Task / Ticket
              </button>
            ) : null}
          </div>

          <div className="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
              Submission Details
            </h2>

            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Approver</p>
            {formEditable && approvers.length > 1 ? (
              <select
                className={`${selectClass} mb-4 max-w-md`}
                value={selectedApprover}
                onChange={(e) => setSelectedApprover(e.target.value)}
              >
                <option value="">Select approver…</option>
                {approvers.map((row) => (
                  <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                    {row.label}
                  </option>
                ))}
              </select>
            ) : selectedApproverLabel ? (
              <div className="mb-4 flex max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {approverParts.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {approverParts.name}
                    {approverParts.role ? (
                      <span className="font-normal text-gray-500"> ({approverParts.role})</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">Automatically assigned from project</p>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-500">Select a project to see the approver.</p>
            )}

            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              General timesheet comments <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              className="min-h-[5rem] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
              placeholder="Add any general notes for this timesheet submission…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              readOnly={!entryEditable}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                Total: {hoursTotal.toFixed(2)} hrs
              </p>
              <p className="text-xs text-gray-500">
                {TIMESHEET_STATUS_LABELS[status]} timesheet
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {footerActions}
              {entryEditable ? (
                <>
                  <button
                    type="submit"
                    disabled={!canSave || isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Draft
                  </button>
                  {showSubmitForApproval ? (
                    <button
                      type="button"
                      disabled={!canSubmitForApproval || submitForApprovalLoading}
                      onClick={() => void onSubmitForApproval?.()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitForApprovalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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
          <p className="mb-3 text-xs text-gray-500">
            Attach evidence when required for client approval outside TBOS.
          </p>
          {entryEditable ? (
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 hover:border-blue-300 dark:border-gray-600 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">Upload files</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => void uploadFiles(e.target.files)}
                disabled={uploading}
              />
            </label>
          ) : null}
          {fileUrls.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {fileUrls.map((url, index) => (
                <li key={url} className="flex items-center justify-between gap-2 text-sm">
                  <a
                    href={resolveDocumentHref(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-blue-600 hover:underline"
                  >
                    {url.split("/").pop()}
                  </a>
                  {entryEditable ? (
                    <button
                      type="button"
                      onClick={() => setFileUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500"
                    >
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
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTimesheetActivityTitle(log.action)}
                  </p>
                  {log.reason ? <p className="text-gray-600">{log.reason}</p> : null}
                  <p className="mt-1 text-xs text-gray-400">
                    {formatActivityDate(log.createdAt)}
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

      {selection && selectedLine && selectedDayIso ? (
        <aside
          className="mt-6 w-full shrink-0 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950 xl:mt-0 xl:w-[22rem] xl:border-l xl:shadow-[-4px_0_24px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Daily Entry</h2>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-5 px-5 py-5">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatLongDate(selectedDayIso)}
              </p>
              <p className="text-xs text-gray-500">{projectLabel || "Project"}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Task
              </label>
              <select
                className={selectClass}
                value={selectedLine.caseKey}
                onChange={(e) => updateLine(selectedLine.key, { caseKey: e.target.value, label: undefined })}
              >
                <option value="">Select task…</option>
                {cases.map((row) => (
                  <option key={`panel-${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                    {row.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hours worked
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                value={panelHours}
                onChange={(e) => setPanelHours(sanitizeHoursInput(e.target.value))}
                placeholder="0.00"
              />
              {hoursDurationHint(panelHours) ? (
                <p className="mt-1 text-xs text-gray-500">{hoursDurationHint(panelHours)}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily task comments
              </label>
              <textarea
                className="min-h-[6rem] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                placeholder="Describe work completed on this task for the day…"
                value={panelComment}
                onChange={(e) => setPanelComment(e.target.value)}
                rows={4}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedLine.billable}
                onChange={(e) => updateLine(selectedLine.key, { billable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Billable hours
            </label>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => savePanelEntry()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Check className="h-4 w-4" /> Save Entry
              </button>
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </form>
  );
}
