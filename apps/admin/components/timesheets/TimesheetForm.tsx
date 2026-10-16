"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Lightbulb,
  Loader2,
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
import {
  type DailyHours,
  snapToMondayInput,
  sumDailyHours,
  toDateInputUtc,
  weekDatesFromMonday,
  WEEKDAY_KEYS,
  mondayOfWeek,
  sundayOfWeek,
} from "@/lib/timesheet-week";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
const readOnlyClass = "bg-gray-50 dark:bg-gray-900 cursor-not-allowed";
const dayInputClass =
  "h-9 w-full min-w-[2.5rem] max-w-[3.25rem] rounded-lg border border-gray-200 bg-white px-1 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800";
const selectClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

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
type CaseOption = { kind: "ticket" | "opportunity"; id: string; label: string };
type ApproverOption = { kind: "PM" | "CLIENT_CONTACT"; id: string; label: string };

type Props = {
  defaults: Partial<TimesheetFormValues>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  readOnly?: boolean;
  /** PM approve / reject actions */
  footerActions?: ReactNode;
  onSubmitForApproval?: () => void | Promise<void>;
  submitForApprovalLoading?: boolean;
  showSubmitForApproval?: boolean;
};

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

function formatDashDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDayColumnLabel(dow: string, iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dow} ${dd}/${mm}`;
}

function shiftWeek(mondayIso: string, deltaDays: number) {
  const d = new Date(`${mondayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return snapToMondayInput(toDateInputUtc(d));
}

function emptyHours(): DailyHours {
  return {};
}

function BillableToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
      }`}
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
  footerActions,
  onSubmitForApproval,
  submitForApprovalLoading = false,
  showSubmitForApproval = false,
}: Props) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(defaults.projectId ?? "");
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [caseKey, setCaseKey] = useState(
    defaults.ticketId
      ? `ticket:${defaults.ticketId}`
      : defaults.opportunityId
        ? `opportunity:${defaults.opportunityId}`
        : "",
  );
  const [weekMonday, setWeekMonday] = useState(
    snapToMondayInput(toDateInput(defaults.startDate) || toDateInputUtc(mondayOfWeek())),
  );
  const [dailyHours, setDailyHours] = useState<DailyHours>(
    (defaults.dailyHours as DailyHours) ?? emptyHours(),
  );
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [billable, setBillable] = useState(true);
  const [entryAdded, setEntryAdded] = useState(Boolean(defaults.id && sumDailyHours((defaults.dailyHours as DailyHours) ?? {}) > 0));
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [uploading, setUploading] = useState(false);

  const status = defaults.status ?? "DRAFT";
  const editable = !readOnly && status === "DRAFT";

  const weekSun = useMemo(() => {
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    return toDateInputUtc(sundayOfWeek(mon));
  }, [weekMonday]);

  const weekDays = useMemo(() => weekDatesFromMonday(weekMonday), [weekMonday]);
  const rowHoursTotal = useMemo(() => sumDailyHours(dailyHours), [dailyHours]);
  const hoursTotal = rowHoursTotal;

  const managerRequired = editable && approvers.length > 0 && !selectedApprover;
  const hasLineContent = Boolean(projectId) && (rowHoursTotal > 0 || fileUrls.length > 0);
  const canAddEntry = editable && hasLineContent;
  const canSave = editable && entryAdded && hasLineContent && !managerRequired;
  const canSubmitForApproval =
    showSubmitForApproval &&
    Boolean(defaults.id) &&
    entryAdded &&
    hasLineContent &&
    !managerRequired &&
    status === "DRAFT";

  const weekBanner =
    status === "DRAFT" && !defaults.id
      ? "No timesheet found for this week."
      : status === "DRAFT"
        ? "Timesheet is in draft — add your entry, save, then submit for approval."
        : `Status: ${TIMESHEET_STATUS_LABELS[status]}`;

  const gridTemplate =
    "grid-cols-[minmax(11rem,1.45fr)_repeat(7,minmax(2.5rem,1fr))_minmax(3.5rem,auto)]";

  useEffect(() => {
    if (defaults.id && sumDailyHours((defaults.dailyHours as DailyHours) ?? {}) > 0) {
      setEntryAdded(true);
    }
  }, [defaults.id, defaults.dailyHours]);

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
      });
  }, []);

  useEffect(() => {
    if (!projectId) {
      setCases([]);
      if (editable) setCaseKey("");
      return;
    }
    void adminFetch(`/api/admin/timesheets/project-cases?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => setCases((data.data as CaseOption[]) ?? []));
  }, [projectId, editable]);

  useEffect(() => {
    if (!projectId) {
      setApprovers([]);
      return;
    }
    const [kind, id] = caseKey ? caseKey.split(":") : ["", ""];
    const query =
      kind === "ticket" && id
        ? `ticketId=${encodeURIComponent(id)}`
        : kind === "opportunity" && id
          ? `opportunityId=${encodeURIComponent(id)}`
          : `projectId=${encodeURIComponent(projectId)}`;
    void adminFetch(`/api/admin/timesheets/target-meta?${query}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data as { approvers?: ApproverOption[] })?.approvers ?? [];
        setApprovers(list);
        const first = list[0];
        if (editable && first) {
          const defaultKey = `${first.kind}:${first.id}`;
          setSelectedApprover((prev) => prev || defaultKey);
        }
      })
      .catch(() => setApprovers([]));
  }, [projectId, caseKey, editable]);

  function clearEntryRow() {
    if (!editable) return;
    setProjectId("");
    setCaseKey("");
    setDailyHours(emptyHours());
    setComments("");
    setBillable(true);
    setEntryAdded(false);
  }

  function addEntry() {
    if (!canAddEntry) return;
    setEntryAdded(true);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !editable) return;
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
      alert("Select a project or board.");
      return;
    }
    if (approvers.length && !selectedApprover) {
      alert("Choose a manager to approve your timesheet.");
      return;
    }
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    const sun = sundayOfWeek(mon);
    const payload: Record<string, unknown> = {
      startDate: weekMonday,
      endDate: toDateInputUtc(sun),
      fileUrls,
      dailyHours,
      comments: comments.trim() || null,
    };
    const [kind, id] = caseKey ? caseKey.split(":") : ["", ""];
    if (kind === "ticket" && id) payload.ticketId = id;
    else if (kind === "opportunity" && id) payload.opportunityId = id;
    else payload.projectId = projectId;

    if (approvers.length && selectedApprover) {
      const [approverKind, approverId] = selectedApprover.split(":");
      payload.approverKind = approverKind;
      if (approverKind === "CLIENT_CONTACT") payload.projectClientContactId = approverId;
    }
    await onSubmit(payload);
  }

  const footerBtnClass =
    "inline-flex min-w-[12rem] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium sm:flex-none sm:min-w-[14rem]";

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      {/* Reference header — outside entry card */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="shrink-0">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Select Week</label>
          <input
            type="date"
            className={`${inputClass} w-[10.5rem] ${editable ? "" : readOnlyClass}`}
            value={weekMonday}
            onChange={(e) => setWeekMonday(snapToMondayInput(e.target.value))}
            readOnly={!editable}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
          <button
            type="button"
            className="rounded border border-gray-200 p-1 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
            disabled={!editable}
            onClick={() => setWeekMonday((w) => shiftWeek(w, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="whitespace-nowrap font-medium">
            Week of {formatDashDate(weekMonday)} - {formatDashDate(weekSun)}
          </span>
          <button
            type="button"
            className="rounded border border-gray-200 p-1 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
            disabled={!editable}
            onClick={() => setWeekMonday((w) => shiftWeek(w, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <Info className="h-4 w-4 shrink-0" />
          <span>{weekBanner}</span>
        </div>

        <div className="shrink-0 text-right text-sm">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Total: {hoursTotal}h</p>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden /> Tracked (Timer)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" aria-hidden /> Manual Entry
            </span>
          </div>
        </div>
      </div>

      {/* Main entry card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto p-3 sm:p-4">
          <div className={`grid min-w-[44rem] ${gridTemplate} gap-0 text-sm`}>
            <div className="border-b border-gray-200 px-2 py-2 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:text-gray-200">
              Project/Board Task
            </div>
            {weekDays.map((d, i) => {
              const dow = d.label.split(" ")[0] ?? d.key;
              const isLastDay = i === weekDays.length - 1;
              return (
                <div
                  key={d.key}
                  className={`border-b border-gray-200 px-0.5 py-2 text-center text-xs font-semibold text-gray-800 dark:border-gray-600 dark:text-gray-200 ${
                    isLastDay ? "border-r" : "border-r"
                  }`}
                >
                  {formatDayColumnLabel(dow, d.iso)}
                </div>
              );
            })}
            <div className="border-b border-gray-200 px-2 py-2 text-center text-xs font-semibold text-gray-800 dark:border-gray-600 dark:text-gray-200">
              Billable
            </div>

            {/* Entry row */}
            <div className="flex flex-col justify-center gap-2 border-b border-r border-gray-200 py-2 pr-2 dark:border-gray-600">
              {!editable && defaults.targetLabel ? (
                <p className="text-sm text-gray-900 dark:text-gray-100">{defaults.targetLabel}</p>
              ) : (
                <>
                  <select
                    className={`${selectClass} ${editable ? "" : readOnlyClass}`}
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      setCaseKey("");
                      setEntryAdded(false);
                    }}
                    disabled={!editable}
                  >
                    <option value="">Search project or board...</option>
                    {projects.map((row) => (
                      <option key={row.id} value={row.id}>{row.label}</option>
                    ))}
                  </select>
                  <select
                    className={`${selectClass} ${editable ? "" : readOnlyClass}`}
                    value={caseKey}
                    onChange={(e) => {
                      setCaseKey(e.target.value);
                      setEntryAdded(false);
                    }}
                    disabled={!editable || !projectId}
                  >
                    <option value="">
                      {projectId ? "Choose task (optional)" : "Choose project/board first"}
                    </option>
                    {cases.map((row) => (
                      <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {WEEKDAY_KEYS.map((key, index) => (
              <div
                key={key}
                className={`flex items-center justify-center border-b border-gray-200 py-2 dark:border-gray-600 ${
                  index === WEEKDAY_KEYS.length - 1 ? "border-r" : "border-r"
                }`}
              >
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  inputMode="decimal"
                  className={`${dayInputClass} ${editable ? "" : readOnlyClass}`}
                  value={dailyHours[key] ?? ""}
                  placeholder="0"
                  disabled={!editable}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntryAdded(false);
                    setDailyHours((prev) => ({
                      ...prev,
                      [key]: v === "" ? undefined : Number(v),
                    }));
                  }}
                  readOnly={!editable}
                />
              </div>
            ))}

            <div className="flex items-center justify-center border-b border-gray-200 py-2 dark:border-gray-600">
              <BillableToggle checked={billable} onChange={setBillable} disabled={!editable} />
            </div>

            {/* Comments + Add entry row */}
            <div className="col-span-full border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <textarea
                    className={`${inputClass} min-h-[5rem] resize-y ${editable ? "" : readOnlyClass}`}
                    placeholder="Add comments (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    readOnly={!editable}
                    rows={3}
                  />
                  {editable ? (
                    <p className="mt-2 flex items-start gap-1 text-xs italic text-amber-700 dark:text-amber-400">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Enter project, optional task, and hours for each day, then click &apos;Add Entry&apos;
                    </p>
                  ) : null}
                </div>
                {editable ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:max-w-md">
                    <div
                      className="flex min-w-[4.5rem] items-center justify-center rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      {rowHoursTotal.toFixed(1)}h
                    </div>
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        billable
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      Billable
                    </span>
                    <button
                      type="button"
                      disabled={!canAddEntry}
                      onClick={() => addEntry()}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <Plus className="h-4 w-4" /> Add Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => clearEntryRow()}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                      aria-label="Clear entry row"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer — approver + save / submit */}
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100">
            Select Approver (Manager)
          </label>
          {editable && approvers.length > 0 ? (
            <select
              className={inputClass}
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
            >
              <option value="">Choose a manager to approve your timesheet</option>
              {approvers.map((row) => (
                <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                  {row.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={`${inputClass} ${readOnlyClass}`}
              readOnly
              value={
                defaults.approverLabel ||
                approvers.find((a) => selectedApprover === `${a.kind}:${a.id}`)?.label ||
                "Choose a manager to approve your timesheet"
              }
            />
          )}
          {editable ? (
            <p className="mt-1 text-xs text-red-600">
              * Manager selection is required before saving or submitting timesheet
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {footerActions}
            {editable ? (
              <>
                <button
                  type="submit"
                  disabled={!canSave || isSaving}
                  className={`${footerBtnClass} border border-gray-200 bg-gray-100 text-gray-600 disabled:cursor-not-allowed disabled:opacity-80 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {canSave ? "Save timesheet" : "Add timesheet entries first"}
                </button>
                {showSubmitForApproval ? (
                  <button
                    type="button"
                    disabled={!canSubmitForApproval || submitForApprovalLoading}
                    onClick={() => void onSubmitForApproval?.()}
                    className={`${footerBtnClass} border border-gray-200 bg-gray-100 text-gray-600 disabled:cursor-not-allowed disabled:opacity-80 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300`}
                  >
                    {submitForApprovalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {canSubmitForApproval ? "Submit for approval" : "Add entries to submit"}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Files</h3>
        <p className="mb-3 text-xs text-gray-500">Attach evidence when required (optional if weekly hours are entered).</p>
        {editable ? (
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-gray-600 dark:hover:border-sky-700 dark:hover:bg-sky-950/20 ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">Upload files</span>
            <span className="mt-1 text-xs">PDF, images, or documents</span>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => void uploadFiles(e.target.files)}
              disabled={uploading}
            />
          </label>
        ) : null}
        {uploading ? <p className="mt-2 text-xs text-gray-500">Uploading…</p> : null}
        {fileUrls.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {fileUrls.map((url, index) => (
              <li key={url} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={resolveDocumentHref(url)}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-blue-600 hover:underline dark:text-blue-400"
                >
                  {url.split("/").pop()}
                </a>
                {editable ? (
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Reject reason: {defaults.rejectReason}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
        {defaults.activityLogs && defaults.activityLogs.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {defaults.activityLogs.map((log) => (
              <li key={log.id} className="py-3 text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">{log.action.replaceAll("_", " ")}</p>
                {log.reason ? <p className="text-gray-600 dark:text-gray-400">Reason: {log.reason}</p> : null}
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
    </form>
  );
}
