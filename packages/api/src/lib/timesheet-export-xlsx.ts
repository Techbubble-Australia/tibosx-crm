import ExcelJS from "exceljs";
import { TIMESHEET_STATUS_LABELS } from "./project-types";
import {
  entryHasHours,
  entryLabel,
  sumDailyHours,
  WEEKDAY_KEYS,
  type DailyComments,
  type DailyHours,
  type WeekdayKey,
} from "./timesheet-entries";

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

function formatTabDate(date: Date): string {
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
}

function projectListName(project: { projectNumber: string; title: string } | null | undefined): string {
  if (!project) return "";
  return `${project.projectNumber} - ${project.title}`;
}

function projectShortName(project: { projectNumber: string; title: string } | null | undefined): string {
  return project?.title?.trim() || project?.projectNumber || "";
}

function timesheetStatusLabel(status: string): string {
  if (status === "SUBMITTED") return "Submitted - Awaiting Approval";
  return TIMESHEET_STATUS_LABELS[status as keyof typeof TIMESHEET_STATUS_LABELS] ?? status;
}

function totalHours(row: TimesheetXlsxRow): number {
  if (row.entries.length > 0) {
    return row.entries.reduce((sum, entry) => sum + sumDailyHours((entry.dailyHours ?? {}) as DailyHours), 0);
  }
  return sumDailyHours((row.dailyHours ?? {}) as DailyHours);
}

function exportEntries(row: TimesheetXlsxRow): ExportEntry[] {
  const active = (row.entries ?? []).filter((entry) => entryHasHours(entry.dailyHours as DailyHours));
  if (active.length > 0) return active;
  if (entryHasHours(row.dailyHours as DailyHours)) {
    return [{ dailyHours: row.dailyHours, dailyComments: row.dailyComments, opportunity: null, ticket: null }];
  }
  return [];
}

function dayTaskLabel(
  entry: ExportEntry,
  project: TimesheetXlsxRow["project"],
  key: WeekdayKey,
): string {
  const comment = ((entry.dailyComments as DailyComments)?.[key] ?? "").trim();
  if (comment) return comment;
  return entryLabel({ ...entry, project: project ?? null });
}

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31);
  return cleaned || "Timesheet";
}

function sheetTitleForRow(row: TimesheetXlsxRow, index: number): string {
  const start = formatTabDate(row.startDate);
  const end = formatTabDate(row.endDate);
  return sanitizeSheetName(`${start} - ${end}` || `Sheet ${index + 1}`);
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
  const member = row.memberUser?.name?.trim() || row.memberUser?.email?.trim() || "";
  const total = totalHours(row);

  sheet.addRow(["Project Name", projectListName(row.project ?? null)]);
  sheet.addRow(["Member", member]);
  sheet.addRow(["Status", timesheetStatusLabel(row.status)]);
  sheet.addRow(["Total hours", total]);

  const dayHeaders = WEEKDAY_KEYS.map((_, i) => formatDayLabel(addUtcDays(weekStartIso, i)));
  sheet.addRow(dayHeaders);

  for (const entry of exportEntries(row)) {
    const hoursCells = WEEKDAY_KEYS.map((key) => {
      const hours = Number((entry.dailyHours as DailyHours)?.[key]) || 0;
      return hours > 0 ? hours : "";
    });
    sheet.addRow(["Task name", ...hoursCells]);
    const labelCells = WEEKDAY_KEYS.map((key) => {
      const hours = Number((entry.dailyHours as DailyHours)?.[key]) || 0;
      return hours > 0 ? dayTaskLabel(entry, row.project ?? null, key) : "";
    });
    sheet.addRow(labelCells);
  }

  sheet.addRow(["Timesheet comments", row.comments?.trim() ?? ""]);
  sheet.addRow(["Approver", row.approverLabel]);
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
