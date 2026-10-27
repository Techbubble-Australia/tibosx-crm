"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, Send, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { messageFromApiError } from "@/lib/api-error";
import { TIMESHEET_STATUSES, TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { TablePagination } from "@/components/ui/TablePagination";
import { SortableTh, toggleSortKey, type SortDir } from "@/components/ui/SortableTh";

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
  const router = useRouter();
  const { isEffectiveProjectMember, canManageProjects, canCreateTimesheets, userId, role, additionalRoles } =
    useAdminSession();
  const isAdmin = role === "admin" || additionalRoles.includes("admin");
  const showCreateTimesheet = canCreateTimesheets;
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<"period" | "project" | "member" | "status">("period");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (statusFilter) list = list.filter((row) => row.status === statusFilter);
    const sorted = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "project": {
          const al = a.targetLabel || a.projectTitle || "";
          const bl = b.targetLabel || b.projectTitle || "";
          return al.localeCompare(bl) * dir;
        }
        case "member":
          return a.memberName.localeCompare(b.memberName) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "period":
        default:
          return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
      }
    });
    return sorted;
  }, [rows, statusFilter, sortKey, sortDir]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  function handleSort(key: "period" | "project" | "member" | "status") {
    const next = toggleSortKey(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.dir);
    setPage(1);
  }

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

  async function submitSelected() {
    const ids = [...selected].filter((id) => {
      const row = rows.find((r) => r.id === id);
      return row?.status === "DRAFT";
    });
    if (!ids.length) {
      appAlert("Select at least one draft timesheet.");
      return;
    }
    if (
      !(await appConfirm(
        "You won't be able to make any further changes after submission. Do you want to continue?",
        { title: "Submit for approval" },
      ))
    ) {
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
      appAlert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteOne(id: string) {
    if (!(await appConfirm("Delete this timesheet? This cannot be undone."))) return;
    setSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to delete"));
      await fetchRows();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleExportSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExportSelectAll() {
    setSelected((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  function openCreateTimesheet() {
    router.push("/timesheets/new");
  }

  async function exportCsv() {
    const ids = [...selected];
    if (!ids.length) {
      appAlert("Select at least one timesheet to export.");
      return;
    }
    setExporting(true);
    try {
      const params = new URLSearchParams({ ids: ids.join(",") });
      const res = await adminFetch(`/api/admin/timesheets/export?${params}`);
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
      appAlert(error instanceof Error ? error.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  async function submitOne(id: string) {
    if (
      !(await appConfirm(
        "You won't be able to make any further changes after submission. Do you want to continue?",
        { title: "Submit for approval" },
      ))
    ) {
      return;
    }
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
      appAlert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProjectManagementGuard>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timesheets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create timesheets against projects or support tasks.
            </p>
          </div>
          <div className="flex gap-2">
            {rows.length > 0 ? (
              <button
                type="button"
                onClick={() => void exportCsv()}
                disabled={exporting || selected.size === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600"
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
              <button
                type="button"
                onClick={() => void openCreateTimesheet()}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" /> Create timesheet
              </button>
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
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {TIMESHEET_STATUSES.map((value) => (
                  <option key={value} value={value}>{TIMESHEET_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all timesheets for export"
                      checked={rows.length > 0 && selected.size === rows.length}
                      onChange={() => toggleExportSelectAll()}
                    />
                  </th>
                  <SortableTh
                    label="Timesheet period"
                    sortKey="period"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="px-4 py-2 text-left"
                  />
                  <SortableTh
                    label="Project"
                    sortKey="project"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="px-4 py-2 text-left"
                  />
                  {canManageProjects ? (
                    <SortableTh
                      label="Member"
                      sortKey="member"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      className="px-4 py-2 text-left"
                    />
                  ) : null}
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="px-4 py-2 text-left"
                  />
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Approver</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const projectLine =
                    row.targetLabel && row.targetLabel.includes(" — ")
                      ? row.targetLabel
                      : row.projectNumber && row.projectTitle
                        ? `${row.projectNumber} — ${row.projectTitle}`
                        : row.targetLabel || "—";
                  return (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleExportSelect(row.id)}
                        aria-label={`Select timesheet ${formatDate(row.startDate)} – ${formatDate(row.endDate)}`}
                      />
                    </td>
                    <td className="max-w-[11rem] px-4 py-2 text-gray-500">
                      <Link
                        href={`/timesheets/${row.id}`}
                        className="block truncate text-sky-600 hover:underline dark:text-sky-400"
                        title={`${formatDate(row.startDate)} – ${formatDate(row.endDate)}`}
                      >
                        {formatDate(row.startDate)} – {formatDate(row.endDate)}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-2">
                      <Link
                        href={`/timesheets/${row.id}`}
                        className="block truncate text-gray-800 hover:text-sky-600 hover:underline dark:text-gray-200 dark:hover:text-sky-400"
                        title={projectLine}
                      >
                        {projectLine}
                      </Link>
                    </td>
                    {canManageProjects ? (
                      <td className="px-4 py-2 text-gray-500">{row.memberName}</td>
                    ) : null}
                    <td className="px-4 py-2">
                      <TimesheetStatusBadge status={row.status} />
                      {row.status === "SUBMITTED" && row.approverKind === "CLIENT_CONTACT" ? (
                        <span className="mt-0.5 block text-xs text-sky-600 dark:text-sky-400">
                          Awaiting approval
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[10rem] px-4 py-2 text-gray-600 dark:text-gray-400">
                      <span className="block truncate" title={row.approverLabel ?? ""}>
                        {row.approverLabel ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
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
                        {(isAdmin || (row.memberUserId === userId && row.status === "DRAFT")) ? (
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
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
          </div>
        )}
      </div>
    </ProjectManagementGuard>
  );
}
