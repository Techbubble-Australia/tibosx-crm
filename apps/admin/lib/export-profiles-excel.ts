import type { ProfileListRow } from "@/components/profiles/ProfilesListTable";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatExpectedSalary(row: ProfileListRow): string {
  const rate = new Intl.NumberFormat("en-US").format(row.expectedRate);
  return `${row.currency} ${rate} (${row.mode})`;
}

function formatName(row: ProfileListRow): string {
  return `${row.firstName} ${row.lastName}`.trim();
}

export function exportProfilesAsExcel(rows: ProfileListRow[], filename = "profiles-export.xls") {
  const headers = ["Name", "Email", "Phone", "City", "Country", "Expected Salary", "Sourced by"];
  const headerRow = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = [
        formatName(row),
        row.email,
        row.phone,
        row.city ?? "",
        row.country,
        formatExpectedSalary(row),
        row.sourcedByName ?? "",
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
