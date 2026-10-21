"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Plus, Send, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { messageFromApiError } from "@/lib/api-error";
import { type TimesheetStatus } from "@/lib/project-types";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";

type TimesheetRow = {
  id: string;
  memberUserId?: string;
  projectNumber: string;
  projectTitle: string;
  targetLabel?: string;
  memberName: string;
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  approverKind?: string | null;
  approverLabel?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function TimesheetsPage() {
  const { isEffectiveProjectMember, canManageProjects, canCreateTimesheets, userId } = useAdminSession();
  const showCreateTimesheet = canCreateTimesheets;
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/timesheets");
      const data = await res.json();
      setRows(data.data || []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchRows();
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitSelected() {
    const ids = [...selected].filter((id) => {
      const row = rows.find((r) => r.id === id);
      return row?.status === "DRAFT";
    });
    if (!ids.length) {
      alert("Select at least one draft timesheet.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminFetch("/api/admin/timesheets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to submit"));
      setSelected(new Set());
      await fetchRows();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteOne(id: string) {
    if (!window.confirm("Delete this timesheet? This cannot be undone.")) return;
    setSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to delete"));
      await fetchRows();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await adminFetch("/api/admin/timesheets/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(messageFromApiError(data, "Failed to export timesheets"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timesheets.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  async function submitOne(id: string) {
    setSubmitting(true);
    try {
      const res = await adminFetch("/api/admin/timesheets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to submit"));
      await fetchRows();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProjectManagementGuard>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timesheets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create timesheets against projects or support tickets.
            </p>
          </div>
          <div className="flex gap-2">
            {rows.length > 0 ? (
              <button
                type="button"
                onClick={() => void exportCsv()}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            ) : null}
            {isEffectiveProjectMember && selected.size > 0 ? (
              <button
                type="button"
                onClick={() => void submitSelected()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
              >
                <Send className="h-4 w-4" /> Submit selected
              </button>
            ) : null}
            {showCreateTimesheet ? (
              <Link
                href="/timesheets/new"
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" /> Create timesheet
              </Link>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {canManageProjects
                ? "No timesheets to review yet. Team members submit timesheets from their project member accounts."
                : "No timesheets yet."}
            </p>
            {showCreateTimesheet ? (
              <Link
                href="/timesheets/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" /> Create timesheet
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  {isEffectiveProjectMember ? <th className="w-10 px-4 py-3" aria-label="Select drafts" /> : null}
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Project</th>
                  {canManageProjects ? (
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Member</th>
                  ) : null}
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Week</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                    {isEffectiveProjectMember ? (
                      <td className="px-4 py-3">
                        {row.status === "DRAFT" ? (
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <Link href={`/timesheets/${row.id}`} className="text-sky-600 hover:underline dark:text-sky-400">
                        {row.targetLabel || (
                          <>
                            <span className="font-mono text-xs text-gray-400">{row.projectNumber}</span>
                            <br />
                            {row.projectTitle}
                          </>
                        )}
                      </Link>
                    </td>
                    {canManageProjects ? (
                      <td className="px-4 py-3 text-gray-500">{row.memberName}</td>
                    ) : null}
                    <td className="px-4 py-3 text-gray-500">
                      <Link href={`/timesheets/${row.id}`} className="hover:text-sky-600 hover:underline dark:hover:text-sky-400">
                        {formatDate(row.startDate)} – {formatDate(row.endDate)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TimesheetStatusBadge status={row.status} />
                      {row.status === "SUBMITTED" && row.approverKind === "CLIENT_CONTACT" ? (
                        <span className="mt-0.5 block text-xs text-sky-600 dark:text-sky-400">
                          Awaiting client{row.approverLabel ? `: ${row.approverLabel}` : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {isEffectiveProjectMember && row.status === "DRAFT" ? (
                          <button
                            type="button"
                            onClick={() => void submitOne(row.id)}
                            disabled={submitting}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                          >
                            Submit
                          </button>
                        ) : null}
                        {row.memberUserId === userId &&
                        (row.status === "DRAFT" || row.status === "SUBMITTED") ? (
                          <button
                            type="button"
                            onClick={() => void deleteOne(row.id)}
                            disabled={submitting}
                            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50 dark:border-gray-600 dark:hover:bg-red-950/30"
                            aria-label="Delete timesheet"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProjectManagementGuard>
  );
}
