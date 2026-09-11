import {
  CAREER_APPLICATION_STATUS_LABELS,
  type CareerApplicationStatus,
} from "@/lib/career-application-status";

export type CareerApplicationExportRow = {
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  position: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  status?: string;
  chargeRate?: string | null;
  statusComments?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatName(row: CareerApplicationExportRow): string {
  return `${row.firstName} ${row.lastName}`.trim();
}

function formatJobName(row: CareerApplicationExportRow): string {
  return row.jobTitle ?? row.position ?? "";
}

function formatStatus(status?: string): string {
  if (!status) return "";
  const key = status as CareerApplicationStatus;
  return CAREER_APPLICATION_STATUS_LABELS[key] ?? status;
}

export function exportCareerApplicationsAsExcel(
  rows: CareerApplicationExportRow[],
  filename = "career-applications-export.xls",
) {
  const headers = [
    "Candidate name",
    "Job name",
    "Email",
    "Phone",
    "City",
    "Country",
    "Status",
    "Charge rate",
    "Comments",
  ];
  const headerRow = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = [
        formatName(row),
        formatJobName(row),
        row.email,
        row.phone ?? "",
        row.city ?? "",
        row.country ?? "",
        formatStatus(row.status),
        row.chargeRate ?? "",
        row.statusComments ?? "",
      ];
      return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
