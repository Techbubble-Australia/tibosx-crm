"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const readOnlyClass = "bg-gray-50 dark:bg-gray-900 cursor-not-allowed";

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
  const [managerName, setManagerName] = useState("");
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const status = defaults.status ?? "DRAFT";
  const editable = !readOnly && status === "DRAFT";

  const weekRange = useMemo(() => {
    const mon = new Date(`${weekMonday}T00:00:00.000Z`);
    const sun = sundayOfWeek(mon);
    return `${weekMonday} – ${toDateInputUtc(sun)}`;
  }, [weekMonday]);

  const weekDays = useMemo(() => weekDatesFromMonday(weekMonday), [weekMonday]);

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
        if (!projectId && list[0]) setProjectId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!projectId) {
      setCases([]);
      setCaseKey("");
      return;
    }
    void adminFetch(`/api/admin/timesheets/project-cases?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => setCases((data.data as CaseOption[]) ?? []));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setManagerName("");
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
        const row = data.data as { managerName?: string; approvers?: ApproverOption[] };
        setManagerName(row.managerName ?? "");
        const list = row.approvers ?? [];
        setApprovers(list);
        if (editable) {
          setSelectedApprover(list[0] ? `${list[0].kind}:${list[0].id}` : "");
        }
      })
      .catch(() => {
        setManagerName("");
        setApprovers([]);
      });
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
      alert("Select a project.");
      return;
    }
    const hoursTotal = sumDailyHours(dailyHours);
    if (!fileUrls.length && hoursTotal <= 0) {
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

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
            <input
              className={`${inputClass} ${readOnlyClass}`}
              value={defaults.memberName || userName || email}
              readOnly
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <input className={`${inputClass} ${readOnlyClass}`} value={TIMESHEET_STATUS_LABELS[status]} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select week (Monday)</label>
            <input
              type="date"
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={weekMonday}
              onChange={(e) => setWeekMonday(snapToMondayInput(e.target.value))}
              readOnly={!editable}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Week</label>
            <input className={`${inputClass} ${readOnlyClass}`} value={weekRange} readOnly />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search project *</label>
            <input
              type="search"
              placeholder="Filter projects…"
              className={`${inputClass} mb-2 ${editable ? "" : readOnlyClass}`}
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              disabled={!editable}
            />
            <select
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setCaseKey("");
              }}
              required
              disabled={!editable}
            >
              <option value="">Select project…</option>
              {filteredProjects.map((row) => (
                <option key={row.id} value={row.id}>{row.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Case</label>
            <input
              type="search"
              placeholder="Filter cases…"
              className={`${inputClass} mb-2 ${editable ? "" : readOnlyClass}`}
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              disabled={!editable}
            />
            <select
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={caseKey}
              onChange={(e) => setCaseKey(e.target.value)}
              disabled={!editable || !projectId}
            >
              <option value="">No case (project only)</option>
              {filteredCases.map((row) => (
                <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project manager / owner</label>
            <input className={`${inputClass} ${readOnlyClass}`} value={managerName || "—"} readOnly />
          </div>
          {approvers.length > 0 && editable ? (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Timesheet approver</label>
              <select
                className={inputClass}
                value={selectedApprover}
                onChange={(e) => setSelectedApprover(e.target.value)}
              >
                {approvers.map((row) => (
                  <option key={`${row.kind}:${row.id}`} value={`${row.kind}:${row.id}`}>
                    {row.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {!editable && defaults.approverLabel ? (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Approver</label>
              <input className={`${inputClass} ${readOnlyClass}`} value={defaults.approverLabel} readOnly />
            </div>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                {weekDays.map((d) => (
                  <th key={d.key} className="px-2 py-2 font-medium">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {WEEKDAY_KEYS.map((key) => (
                  <td key={key} className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      inputMode="decimal"
                      className={`${inputClass} ${editable ? "" : readOnlyClass}`}
                      value={dailyHours[key] ?? ""}
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
          <p className="mt-2 text-xs text-gray-500">Enter hours in decimal (e.g. 7.5).</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Files</h3>
        <p className="mb-3 text-xs text-gray-500">Optional when weekly hours are entered. Otherwise attach client approval.</p>
        {editable ? (
          <input type="file" multiple onChange={(e) => void uploadFiles(e.target.files)} disabled={uploading} />
        ) : null}
        {uploading ? <p className="mt-2 text-xs text-gray-500">Uploading…</p> : null}
        {fileUrls.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {fileUrls.map((url, index) => (
              <li key={url} className="flex items-center justify-between gap-2 text-sm">
                <a href={resolveDocumentHref(url)} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Reject reason: {defaults.rejectReason}
        </div>
      ) : null}

      {defaults.activityLogs && defaults.activityLogs.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
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
        </section>
      ) : null}

      {editable ? (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save timesheet
          </button>
        </div>
      ) : null}
    </form>
  );
}
