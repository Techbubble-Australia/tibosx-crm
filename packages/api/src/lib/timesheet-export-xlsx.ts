import ExcelJS from "exceljs";
import { TIMESHEET_STATUS_LABELS } from "./project-types";
import { normalizeDaysOff } from "./timesheet-monthly";
import {
  entryHasHours,
  entryLabel,
  isIsoDayKey,
  sumDailyHours,
  WEEKDAY_KEYS,
  type DailyHours,
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
  period?: string;
  daysOff?: unknown;
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
  const month = row.startDate.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
  return sanitizeSheetName(month || `Sheet ${index + 1}`);
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

function padRow(cells: (string | number)[], columnCount: number): (string | number)[] {
  const row = [...cells];
  while (row.length < columnCount) row.push("");
  return row.slice(0, columnCount);
}

/** Every day of the timesheet's month as a column. */
function sheetDayIsos(row: TimesheetXlsxRow): string[] {
  const startIso = row.startDate.toISOString().slice(0, 10);
  const count = Math.round((row.endDate.getTime() - row.startDate.getTime()) / 86_400_000) + 1;
  return Array.from({ length: Math.max(1, count) }, (_, i) => addUtcDays(startIso, i).toISOString().slice(0, 10));
}

/** Map weekday-keyed or ISO-keyed values onto ISO days. */
function valuesByIsoDay<T>(startIso: string, values: unknown): Map<string, T> {
  const out = new Map<string, T>();
  if (!values || typeof values !== "object") return out;
  for (const [key, value] of Object.entries(values as Record<string, T>)) {
    if (isIsoDayKey(key)) {
      out.set(key, value);
      continue;
    }
    const index = (WEEKDAY_KEYS as readonly string[]).indexOf(key);
    if (index >= 0) out.set(addUtcDays(startIso, index).toISOString().slice(0, 10), value);
  }
  return out;
}

function applySheetGridBorders(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number, columnCount: number) {
  for (let r = fromRow; r <= toRow; r += 1) {
    for (let c = 1; c <= columnCount; c += 1) {
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
  const startIso = row.startDate.toISOString().slice(0, 10);
  const dayIsos = sheetDayIsos(row);
  const columnCount = 1 + dayIsos.length;
  const pad = (cells: (string | number)[]) => padRow(cells, columnCount);
  const member = row.memberUser?.name?.trim() || row.memberUser?.email?.trim() || "";
  const total = totalHours(row);
  const projectName = projectListName(row.project ?? null);

  const startRow = sheet.rowCount + 1;

  sheet.addRow(pad(["Project Name", projectName]));
  sheet.addRow(pad(["Member", member]));
  sheet.addRow(pad(["Status", timesheetStatusLabel(row.status)]));
  sheet.addRow(pad(["Total hours", total]));
  const daysOff = normalizeDaysOff(row.daysOff);
  const listDays = (kind: string) =>
    daysOff
      .filter((d) => d.kind === kind)
      .map((d) => formatTabDate(new Date(`${d.date}T00:00:00.000Z`)))
      .join(", ");
  if (daysOff.some((d) => d.kind === "LEAVE")) sheet.addRow(pad(["Leave", listDays("LEAVE")]));
  if (daysOff.some((d) => d.kind === "HOLIDAY")) sheet.addRow(pad(["Public holidays", listDays("HOLIDAY")]));
  sheet.addRow(pad([]));

  const dayHeaders = dayIsos.map((iso) => formatDayLabel(new Date(`${iso}T00:00:00.000Z`)));
  sheet.addRow(pad(["Task name", ...dayHeaders]));

  const entries = exportEntries(row);
  entries.forEach((entry) => {
    const hoursByDay = valuesByIsoDay<number>(startIso, entry.dailyHours);
    const commentsByDay = valuesByIsoDay<string>(startIso, entry.dailyComments);
    const hoursCells = dayIsos.map((iso) => {
      const hours = Number(hoursByDay.get(iso)) || 0;
      return hours > 0 ? hours : "";
    });
    const taskName = entryLabel({ ...entry, project: row.project ?? null }).replace(/\s*—\s*/g, " - ");
    sheet.addRow(pad([taskName, ...hoursCells]));

    const commentCells = dayIsos.map((iso) => String(commentsByDay.get(iso) ?? "").trim());
    sheet.addRow(pad(["Task comments", ...commentCells]));
  });

  sheet.addRow(pad(["Timesheet comments", row.comments?.trim() ?? ""]));
  sheet.addRow(pad(["Approver", row.approverLabel]));

  const endRow = sheet.rowCount;
  applySheetGridBorders(sheet, startRow, endRow, columnCount);

  sheet.getColumn(1).width = 36;
  for (let c = 2; c <= columnCount; c += 1) {
    sheet.getColumn(c).width = 12;
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
