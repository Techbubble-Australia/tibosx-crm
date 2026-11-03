import ExcelJS from "exceljs";
import { TIMESHEET_STATUS_LABELS } from "./project-types";
import {
  entryHasHours,
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

const DAY_COLUMN_COUNT = WEEKDAY_KEYS.length;
const SHEET_COLUMN_COUNT = 1 + DAY_COLUMN_COUNT;

function padRow(cells: (string | number)[]): (string | number)[] {
  const row = [...cells];
  while (row.length < SHEET_COLUMN_COUNT) row.push("");
  return row.slice(0, SHEET_COLUMN_COUNT);
}

function dayComment(comments: unknown, key: WeekdayKey): string {
  return (((comments as DailyComments)?.[key] ?? "") as string).trim();
}

function applySheetGridBorders(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number) {
  for (let r = fromRow; r <= toRow; r += 1) {
    for (let c = 1; c <= SHEET_COLUMN_COUNT; c += 1) {
      sheet.getCell(r, c).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }
}

function writeTimesheetSheet(sheet: ExcelJS.Worksheet, row: TimesheetXlsxRow) {
  const weekStartIso = row.startDate.toISOString().slice(0, 10);
  const member = row.memberUser?.name?.trim() || row.memberUser?.email?.trim() || "";
  const total = totalHours(row);
  const projectName = projectListName(row.project ?? null);

  const startRow = sheet.rowCount + 1;

  sheet.addRow(padRow(["Project Name", projectName]));
  sheet.addRow(padRow(["Member", member]));
  sheet.addRow(padRow(["Status", timesheetStatusLabel(row.status)]));
  sheet.addRow(padRow(["Total hours", total]));
  sheet.addRow(padRow([]));

  const dayHeaders = WEEKDAY_KEYS.map((_, i) => formatDayLabel(addUtcDays(weekStartIso, i)));
  sheet.addRow(padRow(["Task name", ...dayHeaders]));

  const entries = exportEntries(row);
  entries.forEach((entry, index) => {
    const hoursCells = WEEKDAY_KEYS.map((key) => {
      const hours = Number((entry.dailyHours as DailyHours)?.[key]) || 0;
      return hours > 0 ? hours : "";
    });
    sheet.addRow(padRow([`Task #${index + 1}`, ...hoursCells]));

    const commentCells = WEEKDAY_KEYS.map((key) => dayComment(entry.dailyComments, key));
    sheet.addRow(padRow(["Task comments", ...commentCells]));
  });

  sheet.addRow(padRow(["Timesheet comments", row.comments?.trim() ?? ""]));
  sheet.addRow(padRow(["Approver", row.approverLabel]));

  const endRow = sheet.rowCount;
  applySheetGridBorders(sheet, startRow, endRow);

  sheet.getColumn(1).width = 18;
  for (let c = 2; c <= SHEET_COLUMN_COUNT; c += 1) {
    sheet.getColumn(c).width = 14;
  }
}

export async function buildTimesheetWorkbook(rows: TimesheetXlsxRow[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set<string>();
  rows.forEach((row, index) => {
    let title = sheetTitleForRow(row, index);
    let sheetName = title;
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      const extra = ` (${suffix})`;
      sheetName = sanitizeSheetName(`${title.slice(0, Math.max(1, 31 - extra.length))}${extra}`);
      suffix += 1;
    }
    usedNames.add(sheetName);
    const sheet = workbook.addWorksheet(sheetName);
    writeTimesheetSheet(sheet, row);
  });
  return workbook;
}

export async function buildTimesheetXlsxBuffer(rows: TimesheetXlsxRow[]): Promise<Buffer> {
  const workbook = await buildTimesheetWorkbook(rows);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
