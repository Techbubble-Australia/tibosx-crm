"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Loader2, Send, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert, appConfirm } from "@/lib/app-alert";
import { messageFromApiError } from "@/lib/api-error";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import type { TimesheetStatus } from "@/lib/project-types";
import { formatMonthLabel } from "@/lib/timesheet-month";

type MonthRow = {
  month: string;
  isCurrent: boolean;
  isFuture: boolean;
  timesheetId: string | null;
  status: TimesheetStatus | null;
  rejectReason: string | null;
  approverLabel: string;
  approverKind: string | null;
  projectClientContactId: string | null;
  totalHours: number;
  requiredDays: number;
  filledDays: number;
  complete: boolean;
};

type ProjectMonths = {
  projectId: string;
  projectLabel: string;
  months: MonthRow[];
};

function monthHref(projectId: string, row: MonthRow): string {
  return row.timesheetId
    ? `/timesheets/${row.timesheetId}`
    : `/timesheets/new?projectId=${encodeURIComponent(projectId)}&month=${row.month}`;
}

/**
 * Month-by-month listing of the member's projects (project start → end), with the approver and
 * submit / delete actions for each month's timesheet.
 */
export function MonthlyTimesheetPeriods({
  refreshKey = 0,
  onChanged,
}: {
  refreshKey?: number;
  onChanged?: () => void;
}) {
  const [projects, setProjects] = useState<ProjectMonths[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/timesheets/monthly-periods");
      const data = res.ok ? await res.json() : { data: [] };
      setProjects((data.data as ProjectMonths[]) ?? []);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function submit(row: MonthRow) {
    if (!row.timesheetId) return;
    const ok = await appConfirm(
      `Submit your ${formatMonthLabel(row.month)} timesheet to ${row.approverLabel || "your approver"}?${
        row.complete ? "" : ` It covers ${row.filledDays} of ${row.requiredDays} weekdays.`
      } You won't be able to make further changes after submission.`,
      { title: "Submit for approval" },
    );
    if (!ok) return;
    setBusy(row.timesheetId);
    try {
      const res = await adminFetch("/api/admin/timesheets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: row.timesheetId,
              approverKind: row.approverKind ?? "PM",
              ...(row.approverKind === "CLIENT_CONTACT" && row.projectClientContactId
                ? { projectClientContactId: row.projectClientContactId }
                : {}),
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to submit"));
      await load();
      onChanged?.();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: MonthRow) {
    if (!row.timesheetId) return;
    if (!(await appConfirm(`Delete your ${formatMonthLabel(row.month)} timesheet? This cannot be undone.`))) return;
    setBusy(row.timesheetId);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${row.timesheetId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to delete"));
      await load();
      onChanged?.();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setBusy(null);
    }
  }

  if (!projects.length) return null;

  return (
    <div className="mb-6 space-y-4">
      {projects.map((project) => (
        <section
          key={project.projectId}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.projectLabel}</h3>
          </header>
          <div className="hidden grid-cols-[10rem_11rem_minmax(10rem,1fr)_minmax(8rem,12rem)_5rem_auto] gap-x-4 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 lg:grid dark:border-gray-800 dark:bg-gray-950">
            <span>Month</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Approver</span>
            <span className="text-right">Hours</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {project.months.map((row) => {
              const pct = row.requiredDays ? Math.round((row.filledDays / row.requiredDays) * 100) : 100;
              const returned = row.status === "DRAFT" && row.rejectReason;
              const isDraft = row.status === "DRAFT" && row.timesheetId;
              const rowBusy = busy !== null && busy === row.timesheetId;
              return (
                <li
                  key={row.month}
                  className="grid grid-cols-1 items-center gap-x-4 gap-y-2 px-4 py-3 text-sm hover:bg-gray-50 lg:grid-cols-[10rem_11rem_minmax(10rem,1fr)_minmax(8rem,12rem)_5rem_auto] dark:hover:bg-gray-800/50"
                >
                  <Link href={monthHref(project.projectId, row)} className="font-medium text-sky-700 hover:underline dark:text-sky-400">
                    {formatMonthLabel(row.month)}
                    {row.isCurrent ? (
                      <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                        Current
                      </span>
                    ) : null}
                  </Link>
                  <span>
                    {row.status ? (
                      <TimesheetStatusBadge status={row.status} />
                    ) : (
                      <span className="text-xs text-gray-500">{row.isFuture ? "Upcoming" : "Not started"}</span>
                    )}
                    {returned ? <span className="ml-2 text-xs text-amber-700">Returned</span> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <span
                        className={`block h-full rounded-full ${row.complete ? "bg-emerald-500" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.filledDays}/{row.requiredDays} weekdays
                    </span>
                  </span>
                  <span className="truncate text-gray-700 dark:text-gray-300" title={row.approverLabel}>
                    <span className="mr-1 text-xs text-gray-400 lg:hidden">Approver:</span>
                    {row.approverLabel || "—"}
                  </span>
                  <span className="tabular-nums text-gray-700 lg:text-right dark:text-gray-300">
                    {row.totalHours ? `${row.totalHours.toFixed(2)} h` : "—"}
                  </span>
                  <span className="flex items-center gap-2 lg:justify-end">
                    {rowBusy ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden /> : null}
                    {isDraft ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void submit(row)}
                          disabled={busy !== null || row.filledDays === 0}
                          title={
                            row.filledDays > 0
                              ? "Submit for approval"
                              : "Log hours on at least one day (or mark a day off) first"
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600"
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden /> Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          disabled={busy !== null}
                          className="rounded-lg border border-gray-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-red-950/30"
                          aria-label={`Delete ${formatMonthLabel(row.month)} timesheet`}
                          title="Delete timesheet"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </>
                    ) : (
                      <Link
                        href={monthHref(project.projectId, row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                      >
                        {row.timesheetId ? "Open" : "Start"} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
