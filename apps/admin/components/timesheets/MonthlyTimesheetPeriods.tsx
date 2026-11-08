"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
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

/** Month-by-month listing for projects that use monthly timesheets (project start → end). */
export function MonthlyTimesheetPeriods({ refreshKey = 0 }: { refreshKey?: number }) {
  const [projects, setProjects] = useState<ProjectMonths[]>([]);

  useEffect(() => {
    void adminFetch("/api/admin/timesheets/monthly-periods")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((data) => setProjects((data.data as ProjectMonths[]) ?? []))
      .catch(() => setProjects([]));
  }, [refreshKey]);

  if (!projects.length) return null;

  return (
    <div className="mb-6 space-y-4">
      {projects.map((project) => (
        <section
          key={project.projectId}
          className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.projectLabel}</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Monthly timesheets
            </span>
          </header>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {project.months.map((row) => {
              const pct = row.requiredDays ? Math.round((row.filledDays / row.requiredDays) * 100) : 100;
              const returned = row.status === "DRAFT" && row.rejectReason;
              return (
                <li key={row.month}>
                  <Link
                    href={monthHref(project.projectId, row)}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="w-40 font-medium text-gray-900 dark:text-gray-100">
                      {formatMonthLabel(row.month)}
                      {row.isCurrent ? (
                        <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                          Current
                        </span>
                      ) : null}
                    </span>
                    <span className="w-44">
                      {row.status ? (
                        <TimesheetStatusBadge status={row.status} />
                      ) : (
                        <span className="text-xs text-gray-500">{row.isFuture ? "Upcoming" : "Not started"}</span>
                      )}
                      {returned ? <span className="ml-2 text-xs text-amber-700">Returned</span> : null}
                    </span>
                    <span className="flex min-w-[12rem] flex-1 items-center gap-2">
                      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <span
                          className={`block h-full rounded-full ${row.complete ? "bg-emerald-500" : "bg-amber-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {row.filledDays}/{row.requiredDays} weekdays
                      </span>
                    </span>
                    <span className="w-20 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {row.totalHours ? `${row.totalHours.toFixed(2)} h` : "—"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
