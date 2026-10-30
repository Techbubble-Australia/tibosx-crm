import ExcelJS from "exceljs";
import { TIMESHEET_STATUS_LABELS } from "./project-types";
import { sumDailyHours, WEEKDAY_KEYS, entryLabel, type DailyComments, type DailyHours, type WeekdayKey } from "./timesheet-entries";

type ExportEntry = {
  dailyHours: unknown;
  dailyComments: unknown;
  opportunity?: { name: string } | null;
  ticket?: { ticketNumber: string; subject: string } | null;
};

export type TimesheetXlsxRow = {
  startDate: Date;
  endDate: Date;
  status: string;
  comments: string | null;
  dailyHours: unknown;
  dailyComments: unknown;
  memberUser?: { name: string | null; email: string } | null;
  project?: { projectNumber: string; title: string } | null;
  entries: ExportEntry[];
  approverLabel: string;
  rejectReason?: string | null;
};

function addUtcDays(isoDate: string, days: number): Date {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatDayLabel(date: Date): string {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "short", timeZone: "UTC" });
  const dayMonth = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${weekday} (${dayMonth})`;
}

function projectDisplayName(project: { projectNumber: string; title: string } | null | undefined): string {
  if (!project) return "";
  return `${project.title} (${project.projectNumber})`;
}

function projectShortName(project: { projectNumber: string; title: string } | null | undefined): string {
  return project?.title?.trim() || project?.projectNumber || "";
}

function timesheetStatusLabel(status: string): string {
  if (status === "SUBMITTED") return "Submitted - Awaiting Approval";
  return TIMESHEET_STATUS_LABELS[status as keyof typeof TIMESHEET_STATUS_LABELS] ?? status;
}

function dayTaskAndHours(
  row: TimesheetXlsxRow,
  key: WeekdayKey,
): { task: string; hours: string | number } {
  const entries = row.entries ?? [];
  const withHours = entries.filter((entry) => Number((entry.dailyHours as DailyHours)?.[key]) > 0);
  const hoursSum = withHours.reduce(
    (sum, entry) => sum + (Number((entry.dailyHours as DailyHours)?.[key]) || 0),
    0,
  );
  if (hoursSum <= 0) {
    const sheetHours = Number((row.dailyHours as DailyHours)?.[key]) || 0;
    if (sheetHours <= 0) return { task: "N/A", hours: "N/A" };
    const label = row.project ? `${row.project.title}` : "Project time";
    return { task: label, hours: sheetHours };
  }
  if (withHours.length === 1) {
    return {
      task: entryLabel({ ...withHours[0]!, project: row.project ?? null }),
      hours: Number((withHours[0]!.dailyHours as DailyHours)?.[key]) || 0,
    };
  }
  return { task: `${withHours.length} entries`, hours: hoursSum };
}

function dayComment(row: TimesheetXlsxRow, key: WeekdayKey): string {
  for (const entry of row.entries ?? []) {
    const comment = (entry.dailyComments as DailyComments)?.[key]?.trim();
    if (comment) return comment;
  }
  return ((row.dailyComments as DailyComments)?.[key] ?? "").trim();
}

function totalHours(row: TimesheetXlsxRow): number {
  if (row.entries.length > 0) {
    return row.entries.reduce((sum, entry) => sum + sumDailyHours((entry.dailyHours ?? {}) as DailyHours), 0);
  }
  return sumDailyHours((row.dailyHours ?? {}) as DailyHours);
}

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31);
  return cleaned || "Timesheet";
}

function sheetTitleForRow(row: TimesheetXlsxRow, index: number): string {
  const member = row.memberUser?.name?.trim() || row.memberUser?.email?.trim() || "Member";
  const week = row.startDate.toISOString().slice(0, 10);
  return sanitizeSheetName(`${member} ${week}`.trim() || `Sheet ${index + 1}`);
}

export function buildTimesheetExportFilename(rows: TimesheetXlsxRow[]): string {
  if (rows.length === 1) {
    const row = rows[0]!;
    const member = row.memberUser?.name?.trim() || row.memberUser?.email?.trim() || "Member";
    const project = projectShortName(row.project ?? null) || "Project";
    const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, "_").trim();
    return `${safe(member)}_Timesheet_${safe(project)}.xlsx`;
  }
  return "timesheets_export.xlsx";
}

function writeTimesheetSheet(sheet: ExcelJS.Worksheet, row: TimesheetXlsxRow) {
  const weekStartIso = row.startDate.toISOString().slice(0, 10);
  sheet.addRow([`Project: ${projectDisplayName(row.project ?? null)}`]);
  sheet.addRow([`Status: ${timesheetStatusLabel(row.status)}`]);
  sheet.addRow([]);
  sheet.addRow(["Week", "Task", "Hours Worked", "Timesheet Comments"]);

  let total = 0;
  for (let i = 0; i < WEEKDAY_KEYS.length; i += 1) {
    const key = WEEKDAY_KEYS[i]!;
    const dayDate = addUtcDays(weekStartIso, i);
    const { task, hours } = dayTaskAndHours(row, key);
    const comment = dayComment(row, key);
    if (typeof hours === "number") total += hours;
    sheet.addRow([formatDayLabel(dayDate), task, hours, comment]);
  }

  sheet.addRow([]);
  sheet.addRow(["Total (Hrs)", "", total]);
  sheet.addRow([]);
  sheet.addRow(["Approver Comments"]);
  const approverNotes = row.rejectReason?.trim() || row.comments?.trim() || "";
  sheet.addRow(["Approver", row.approverLabel, approverNotes]);
}

export async function buildTimesheetWorkbook(rows: TimesheetXlsxRow[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  rows.forEach((row, index) => {
    const sheet = workbook.addWorksheet(sheetTitleForRow(row, index));
    writeTimesheetSheet(sheet, row);
  });
  return workbook;
}

export async function buildTimesheetXlsxBuffer(rows: TimesheetXlsxRow[]): Promise<Buffer> {
  const workbook = await buildTimesheetWorkbook(rows);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
