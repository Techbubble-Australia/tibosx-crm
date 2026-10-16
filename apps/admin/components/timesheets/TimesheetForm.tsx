"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Info, Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { useAdminSession } from "@/contexts/AdminSessionContext";
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
  "h-9 w-full min-w-[2.75rem] max-w-[4.5rem] rounded-md border border-gray-200 bg-white px-1 py-1.5 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800";
const selectClass =
  "h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

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
  /** Lifecycle actions (submit / approve / reject) rendered in the card footer. */
  footerActions?: ReactNode;
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

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function shiftWeek(mondayIso: string, deltaDays: number) {
  const d = new Date(`${mondayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return snapToMondayInput(toDateInputUtc(d));
}

function emptyHours(): DailyHours {
  return {};
}

function SearchableProjectSelect({
  options,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  options: ProjectOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative">
      <input
        type="text"
        className={`${selectClass} ${disabled ? readOnlyClass : ""}`}
        placeholder={placeholder}
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.label ?? "");
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        autoComplete="off"
      />
      {open && !disabled ? (
        <ul
          className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No matching projects</li>
          ) : (
            filtered.map((o) => (
              <li key={o.id} role="option">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50 dark:hover:bg-gray-700"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.id);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function TimesheetForm({ defaults, onSubmit, isSaving, readOnly = false, footerActions }: Props) {
  const { userName, email } = useAdminSession();
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
  const hoursTotal = useMemo(() => sumDailyHours(dailyHours), [dailyHours]);

  const managerRequired = editable && approvers.length > 0 && !selectedApprover;
  const hasHoursOrFiles = hoursTotal > 0 || fileUrls.length > 0;
  const gridCols = "grid-cols-[minmax(14rem,1.6fr)_repeat(7,minmax(2.75rem,1fr))]";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      alert("Select a project or board.");
      return;
    }
    if (approvers.length && !selectedApprover) {
      alert("Choose a manager to approve your timesheet.");
      return;
    }
    const total = sumDailyHours(dailyHours);
    if (!fileUrls.length && total <= 0) {
      alert("Enter hours for the week or attach at least one file.");
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

  const weekBanner =
    status === "DRAFT" && !defaults.id
      ? "No timesheet saved for this week yet. Enter hours and save."
      : status === "DRAFT"
        ? "Timesheet is in draft — you can edit and submit for approval."
        : `Status: ${TIMESHEET_STATUS_LABELS[status]}`;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex min-w-[10rem] flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Select week</span>
            <input
              type="date"
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={weekMonday}
              onChange={(e) => setWeekMonday(snapToMondayInput(e.target.value))}
              readOnly={!editable}
            />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
              disabled={!editable}
              onClick={() => setWeekMonday((w) => shiftWeek(w, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Week of {formatShortDate(weekMonday)} – {formatShortDate(weekSun)}
            </span>
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600"
              disabled={!editable}
              onClick={() => setWeekMonday((w) => shiftWeek(w, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <TimesheetStatusBadge status={status} />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total: {hoursTotal}h</p>
            <p className="text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-400" aria-hidden /> Manual entry
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
          <Info className="h-4 w-4 shrink-0" />
          {weekBanner}
        </div>

        <div className="overflow-x-auto p-4">
          <div className={`grid min-w-[40rem] ${gridCols} overflow-hidden rounded-lg border border-gray-200 text-sm dark:border-gray-600`}>
            <div className="border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
              Project / board task
            </div>
            {weekDays.map((d, i) => {
              const [dow, ...rest] = d.label.split(" ");
              const isLast = i === weekDays.length - 1;
              return (
                <div
                  key={d.key}
                  className={`border-b border-gray-200 bg-gray-50 px-0.5 py-2 text-center text-[0.65rem] font-semibold uppercase leading-tight text-gray-600 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300 ${
                    isLast ? "" : "border-r"
                  }`}
                >
                  <div>{dow}</div>
                  <div className="font-normal normal-case text-gray-500 dark:text-gray-400">{rest.join(" ")}</div>
                </div>
              );
            })}

            <div className="flex min-h-[4.5rem] flex-col justify-center gap-2 border-b border-r border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-900">
              {!editable && defaults.targetLabel ? (
                <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">{defaults.targetLabel}</p>
              ) : (
                <>
                  <SearchableProjectSelect
                    options={projects}
                    value={projectId}
                    disabled={!editable}
                    placeholder="Search project or board…"
                    onChange={(id) => {
                      setProjectId(id);
                      setCaseKey("");
                    }}
                  />
                  <select
                    className={`${selectClass} ${editable ? "" : readOnlyClass}`}
                    value={caseKey}
                    onChange={(e) => setCaseKey(e.target.value)}
                    disabled={!editable || !projectId}
                    aria-label="Task or case"
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
                className={`flex items-center justify-center border-b border-gray-200 bg-white p-1.5 dark:border-gray-600 dark:bg-gray-900 ${
                  index === WEEKDAY_KEYS.length - 1 ? "" : "border-r"
                }`}
              >
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  inputMode="decimal"
                  aria-label={weekDays[index]?.label ?? key}
                  className={`${dayInputClass} ${editable ? "" : readOnlyClass}`}
                  value={dailyHours[key] ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const v = e.target.value;
                    setDailyHours((prev) => ({
                      ...prev,
                      [key]: v === "" ? undefined : Number(v),
                    }));
                  }}
                  readOnly={!editable}
                />
              </div>
            ))}

            <div className="col-span-full border-t border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <textarea
                className={`${inputClass} min-h-[4rem] resize-y ${editable ? "" : readOnlyClass}`}
                placeholder="Add comments (optional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                readOnly={!editable}
                rows={2}
              />
              {editable ? (
                <p className="mt-2 text-xs italic text-amber-700 dark:text-amber-400">
                  Enter project, optional task, and hours for each day, then save the timesheet.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select approver (manager)
              </label>
              {editable && approvers.length > 0 ? (
                <select
                  className={inputClass}
                  value={selectedApprover}
                  onChange={(e) => setSelectedApprover(e.target.value)}
                  required
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
                    "—"
                  }
                />
              )}
              {managerRequired ? (
                <p className="mt-1 text-xs text-red-600">
                  * Manager selection is required before saving or submitting timesheet
                </p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                Member: {defaults.memberName || userName || email}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {footerActions}
              {editable ? (
                <button
                  type="submit"
                  disabled={isSaving || managerRequired || !projectId}
                  title={
                    !hasHoursOrFiles
                      ? "Add timesheet entries first"
                      : managerRequired
                        ? "Select an approver"
                        : undefined
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save timesheet
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
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

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
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
