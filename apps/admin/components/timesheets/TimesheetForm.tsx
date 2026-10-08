"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const readOnlyClass = "bg-gray-50 dark:bg-gray-900 cursor-not-allowed";

export type TimesheetFormValues = {
  id?: string;
  projectId?: string | null;
  opportunityId?: string | null;
  memberName?: string;
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  fileUrls: string[];
  rejectReason?: string | null;
  activityLogs?: Array<{
    id: string;
    action: string;
    reason: string | null;
    performedByName: string;
    createdAt: string;
  }>;
};

type TargetOption = { kind: "project" | "opportunity"; id: string; label: string };

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

function targetKey(kind: "project" | "opportunity", id: string) {
  return `${kind}:${id}`;
}

export function TimesheetForm({ defaults, onSubmit, isSaving, readOnly = false }: Props) {
  const { userName, email } = useAdminSession();
  const initialKind: "project" | "opportunity" = defaults.opportunityId ? "opportunity" : "project";
  const initialId = defaults.opportunityId ?? defaults.projectId ?? "";
  const [selectedTarget, setSelectedTarget] = useState(
    initialId ? targetKey(initialKind, initialId) : "",
  );
  const [managerName, setManagerName] = useState("");
  const [startDate, setStartDate] = useState(toDateInput(defaults.startDate));
  const [endDate, setEndDate] = useState(toDateInput(defaults.endDate));
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const status = defaults.status ?? "DRAFT";
  const editable = !readOnly && status === "DRAFT";

  useEffect(() => {
    void adminFetch("/api/admin/timesheets/active-targets")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data as TargetOption[]) ?? [];
        setTargets(list);
        if (!selectedTarget && list[0]) {
          setSelectedTarget(targetKey(list[0].kind, list[0].id));
        }
      });
    if (!startDate || !endDate) {
      void adminFetch("/api/admin/timesheets/defaults")
        .then((r) => r.json())
        .then((data) => {
          const d = data.data as { startDate?: string; endDate?: string };
          if (!startDate && d.startDate) setStartDate(toDateInput(d.startDate));
          if (!endDate && d.endDate) setEndDate(toDateInput(d.endDate));
        });
    }
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      setManagerName("");
      return;
    }
    const [kind, id] = selectedTarget.split(":");
    if (!kind || !id) {
      setManagerName("");
      return;
    }
    const query =
      kind === "project"
        ? `projectId=${encodeURIComponent(id)}`
        : `opportunityId=${encodeURIComponent(id)}`;
    void adminFetch(`/api/admin/timesheets/target-meta?${query}`)
      .then((r) => r.json())
      .then((data) => {
        const row = data.data as { managerName?: string };
        setManagerName(row.managerName ?? "");
      })
      .catch(() => setManagerName(""));
  }, [selectedTarget]);

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
    if (!selectedTarget) {
      alert("Select a project or case.");
      return;
    }
    if (!fileUrls.length) {
      alert("At least one file is required.");
      return;
    }
    const [kind, id] = selectedTarget.split(":");
    const payload: Record<string, unknown> = { startDate, endDate, fileUrls };
    if (kind === "project") payload.projectId = id;
    else payload.opportunityId = id;
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
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project / case *</label>
            <select
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              required
              disabled={!editable}
            >
              <option value="">Select project or case…</option>
              {targets.map((row) => (
                <option key={targetKey(row.kind, row.id)} value={targetKey(row.kind, row.id)}>
                  {row.kind === "opportunity" ? `Case: ${row.label}` : row.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project manager / owner</label>
            <input className={`${inputClass} ${readOnlyClass}`} value={managerName || "—"} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start date *</label>
            <input
              type="date"
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              readOnly={!editable}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End date *</label>
            <input
              type="date"
              className={`${inputClass} ${editable ? "" : readOnlyClass}`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              readOnly={!editable}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Files *</h3>
        <p className="mb-3 text-xs text-gray-500">Add approved screenshots, emails, etc. from client.</p>
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
