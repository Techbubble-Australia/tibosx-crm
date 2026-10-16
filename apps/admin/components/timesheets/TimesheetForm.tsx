"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";
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
  "w-full min-w-[3rem] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800";

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

export function TimesheetForm({ defaults, onSubmit, isSaving, readOnly = false }: Props) {
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
  const [projectSearch, setProjectSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const status = defaults.status ?? "DRAFT";
  const editable = !readOnly && status === "DRAFT";

  const weekSun = useMemo(() => {
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    return toDateInputUtc(sundayOfWeek(mon));
  }, [weekMonday]);

  const weekDays = useMemo(() => weekDatesFromMonday(weekMonday), [weekMonday]);
  const hoursTotal = useMemo(() => sumDailyHours(dailyHours), [dailyHours]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.label.toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const filteredCases = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) => c.label.toLowerCase().includes(q));
  }, [cases, caseSearch]);

  const managerRequired = editable && approvers.length > 0 && !selectedApprover;

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
        else if (!projectId && list[0] && editable) setProjectId(list[0].id);
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
        if (editable && list[0]) {
          setSelectedApprover((prev) => prev || `${list[0].kind}:${list[0].id}`);
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
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total: {hoursTotal}h</p>
            <p className="mt-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-400" /> Manual entry
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
          <Info className="h-4 w-4 shrink-0" />
          {weekBanner}
        </div>

        <div className="overflow-x-auto p-4">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="min-w-[14rem] pb-2 pr-2">Project / board task</th>
                {weekDays.map((d) => (
                  <th key={d.key} className="px-1 pb-2 text-center whitespace-nowrap">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="pr-2 py-1">
                  <input
                    type="search"
                    placeholder="Search project or board…"
                    className={`${inputClass} mb-2 ${editable ? "" : readOnlyClass}`}
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    disabled={!editable}
                  />
                  <select
                    className={`${inputClass} mb-2 ${editable ? "" : readOnlyClass}`}
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      setCaseKey("");
                    }}
                    required
                    disabled={!editable}
                  >
                    <option value="">Search project or board…</option>
                    {filteredProjects.map((row) => (
                      <option key={row.id} value={row.id}>{row.label}</option>
                    ))}
                  </select>
                  <input
                    type="search"
                    placeholder="Filter tasks…"
                    className={`${inputClass} mb-2 ${editable ? "" : readOnlyClass}`}
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    disabled={!editable || !projectId}
                  />
                  <select
                    className={`${inputClass} ${editable ? "" : readOnlyClass}`}
                    value={caseKey}
                    onChange={(e) => setCaseKey(e.target.value)}
                    disabled={!editable || !projectId}
                  >
                    <option value="">{projectId ? "Choose task (optional)" : "Choose project/board first"}</option>
                    {filteredCases.map((row) => (
                      <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </td>
                {WEEKDAY_KEYS.map((key) => (
                  <td key={key} className="px-1 py-1">
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      inputMode="decimal"
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
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <div className="mt-4">
            <textarea
              className={`${inputClass} min-h-[4rem] ${editable ? "" : readOnlyClass}`}
              placeholder="Add comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              readOnly={!editable}
              rows={3}
            />
            {editable ? (
              <p className="mt-2 text-xs italic text-amber-700 dark:text-amber-400">
                Enter project, optional task, and hours for each day, then save the timesheet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-800">
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
            <p className="mt-1 text-xs text-red-600">* Manager selection is required before saving or submitting.</p>
          ) : null}
          <p className="mt-1 text-xs text-gray-500">
            Member: {defaults.memberName || userName || email} · Status: {TIMESHEET_STATUS_LABELS[status]}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Files</h3>
        <p className="mb-3 text-xs text-gray-500">Attach evidence when required (optional if weekly hours are entered).</p>
        {editable ? (
          <input type="file" multiple onChange={(e) => void uploadFiles(e.target.files)} disabled={uploading} />
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

      {editable ? (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || managerRequired}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save timesheet
          </button>
        </div>
      ) : null}
    </form>
  );
}
