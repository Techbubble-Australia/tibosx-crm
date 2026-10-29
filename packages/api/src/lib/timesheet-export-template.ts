import { TIMESHEET_STATUS_LABELS } from "./project-types";
import { WEEKDAY_KEYS, entryLabel, sumDailyHours, type DailyComments, type DailyHours } from "./timesheet-entries";

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cols: (string | number)[]): string {
  return cols.map(csvEscape).join(",");
}

function addUtcDays(isoDate: string, days: number): Date {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatDayHeader(date: Date): string {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "short", timeZone: "UTC" });
  const dayMonth = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${weekday} (${dayMonth})`;
}

type ExportTimesheetRow = {
  startDate: Date;
  endDate: Date;
  status: string;
  comments: string | null;
  dailyHours: unknown;
  dailyComments: unknown;
  memberUser?: { name: string | null; email: string } | null;
  project?: { projectNumber: string; title: string } | null;
  entries: Array<{
    dailyHours: unknown;
    dailyComments: unknown;
    opportunity?: { name: string } | null;
    ticket?: { ticketNumber: string; subject: string } | null;
  }>;
  approverLabel: string;
};

function projectLabel(project: { projectNumber: string; title: string } | null | undefined): string {
  if (!project) return "";
  return `${project.projectNumber} — ${project.title}`;
}

function timesheetTotalHours(row: ExportTimesheetRow): number {
  if (row.entries.length > 0) {
    return row.entries.reduce(
      (sum, entry) => sum + sumDailyHours((entry.dailyHours ?? {}) as DailyHours),
      0,
    );
  }
  return sumDailyHours((row.dailyHours ?? {}) as DailyHours);
}

function formatTimesheetBlock(row: ExportTimesheetRow): string[] {
  const weekStartIso = row.startDate.toISOString().slice(0, 10);
  const member = row.memberUser?.name || row.memberUser?.email || "";
  const status =
    TIMESHEET_STATUS_LABELS[row.status as keyof typeof TIMESHEET_STATUS_LABELS] ?? row.status;
  const total = timesheetTotalHours(row);
  const lines: string[] = [];

  lines.push(csvRow(["<Project Name>", projectLabel(row.project)]));
  lines.push(csvRow(["<Member>", member]));
  lines.push(csvRow(["<Status>", status]));
  lines.push(csvRow(["<Total hours>", total]));

  const dayHeaders = WEEKDAY_KEYS.map((_, index) => formatDayHeader(addUtcDays(weekStartIso, index)));
  lines.push(csvRow(dayHeaders));

  const entryRows =
    row.entries.length > 0
      ? row.entries
      : [
          {
            dailyHours: row.dailyHours,
            dailyComments: row.dailyComments,
            opportunity: null,
            ticket: null,
          },
        ];

  for (const entry of entryRows) {
    const hours = (entry.dailyHours ?? {}) as DailyHours;
    const comments = (entry.dailyComments ?? {}) as DailyComments;
    const label = entryLabel({ ...entry, project: row.project ?? null });
    lines.push(csvRow(["<Task name>", ...WEEKDAY_KEYS.map((k) => hours[k] ?? "")]));
    lines.push(csvRow([label, ...WEEKDAY_KEYS.map((k) => comments[k] ?? "")]));
  }

  lines.push(csvRow(["<Timesheet comments>", row.comments ?? ""]));
  lines.push(csvRow(["<Approver>", row.approverLabel]));
  return lines;
}

export function buildTimesheetTemplateCsv(rows: ExportTimesheetRow[]): string {
  const blocks: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (i > 0) blocks.push("");
    blocks.push(...formatTimesheetBlock(rows[i]!));
  }
  return blocks.join("\n");
}
