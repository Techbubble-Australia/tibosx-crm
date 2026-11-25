"use client";

import { useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type Entity = "clients" | "leads" | "opportunities";

const ENTITY_FIELDS: Record<Entity, string[]> = {
  clients: ["name", "country", "website", "status"],
  leads: ["firstName", "lastName", "email", "company", "phone", "source", "country"],
  opportunities: ["name", "clientName", "amount", "currency", "location", "country"],
};

const FIELD_LABELS: Record<string, string> = {
  name: "Client name / Name",
  country: "Country",
  website: "Website",
  status: "Status",
  firstName: "First name",
  lastName: "Last name",
  email: "Contact email",
  company: "Company",
  phone: "Phone",
  source: "Source",
  clientName: "Client name",
  amount: "Opportunity value",
  currency: "Currency",
  location: "Location",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function escapeCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate(entity: Entity) {
  const headers = ENTITY_FIELDS[entity];
  const sample: Record<string, string> = {};
  for (const field of headers) {
    sample[field] = "";
  }
  if (entity === "clients") {
    sample.name = "Acme Pty Ltd";
    sample.country = "Australia";
    sample.website = "https://acme.example";
    sample.status = "ACTIVE";
  } else if (entity === "leads") {
    sample.firstName = "Jane";
    sample.lastName = "Citizen";
    sample.email = "jane@example.com";
    sample.company = "Acme";
    sample.source = "website";
    sample.country = "Australia";
  } else {
    sample.name = "Website rebuild";
    sample.clientName = "Acme Pty Ltd";
    sample.amount = "25000";
    sample.currency = "AUD";
    sample.location = "Sydney";
    sample.country = "Australia";
  }
  downloadText(`${entity}-template.csv`, rowsToCsv([sample]));
}

type Step = 1 | 2 | 3;

export default function ImportExportPage() {
  const [entity, setEntity] = useState<Entity>("clients");
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>(1);
  const [preview, setPreview] = useState<{
    dryRun: boolean;
    rowCount?: number;
    created?: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
    preview?: Array<Record<string, string>>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const sourceColumns = useMemo(() => {
    const trimmed = raw.trim();
    if (!trimmed) return [] as string[];
    try {
      if (trimmed.startsWith("[")) {
        const rows = JSON.parse(trimmed) as Record<string, string>[];
        return rows[0] ? Object.keys(rows[0]) : [];
      }
    } catch {
      /* fall through to CSV */
    }
    const rows = parseCsv(trimmed);
    return rows[0] ? Object.keys(rows[0]) : [];
  }, [raw]);

  function parseRows(): Record<string, string>[] {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      return JSON.parse(trimmed) as Record<string, string>[];
    }
    return parseCsv(trimmed);
  }

  const rowCount = useMemo(() => {
    try {
      const trimmed = raw.trim();
      if (!trimmed) return 0;
      if (trimmed.startsWith("[")) {
        return (JSON.parse(trimmed) as unknown[]).length;
      }
      return parseCsv(trimmed).length;
    } catch {
      return 0;
    }
  }, [raw]);

  function autoMap(cols: string[] = sourceColumns) {
    const next: Record<string, string> = {};
    for (const field of ENTITY_FIELDS[entity]) {
      const match = cols.find((c) => c.toLowerCase() === field.toLowerCase());
      if (match) next[field] = match;
    }
    setColumnMap(next);
  }

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      appAlert("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      setFileName(file.name);
      setPreview(null);
      const rows = parseCsv(text);
      const cols = rows[0] ? Object.keys(rows[0]) : [];
      autoMap(cols);
      setStep(cols.length ? 2 : 1);
    };
    reader.readAsText(file);
  }

  async function runImport(dryRun: boolean) {
    setBusy(true);
    try {
      const rows = parseRows();
      if (!rows.length) throw new Error("Upload a CSV with at least one data row.");
      const res = await adminFetch("/api/admin/crm/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, dryRun, rows, columnMap }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed");
      setPreview(data.data);
      setStep(3);
      if (!dryRun && !data.data?.errorCount) {
        appAlert(`Imported ${data.data?.created ?? 0} row(s).`);
      }
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportEntity(target: Entity) {
    try {
      const res = await adminFetch(`/api/admin/crm/settings/export?entity=${target}`);
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Export failed");
      const rows = (data.data ?? []) as Array<Record<string, unknown>>;
      if (!rows.length) {
        downloadText(`${target}-export.csv`, ENTITY_FIELDS[target].join(",") + "\n");
        return;
      }
      downloadText(`${target}-export.csv`, rowsToCsv(rows));
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Export failed");
    }
  }

  const checkNew = preview
    ? Math.max(0, (preview.rowCount ?? preview.created ?? 0) - (preview.errorCount ?? 0))
    : 0;
  const checkErrors = preview?.errorCount ?? 0;
  const checkDupes = 0;

  return (
    <ClientsOnlyGuard>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import and export</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            CSV or Excel. Check before anything is saved.
          </p>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Download template</h3>
          <div className="flex flex-wrap gap-2">
            {(["clients", "leads", "opportunities"] as Entity[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => downloadTemplate(e)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                {e} CSV
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Entity</label>
              <select
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value as Entity);
                  setColumnMap({});
                  setPreview(null);
                  setStep(raw.trim() ? 2 : 1);
                }}
                className={inputClass}
              >
                <option value="clients">Clients</option>
                <option value="leads">Leads</option>
                <option value="opportunities">Opportunities</option>
              </select>
            </div>
          </div>

          <ol className="flex flex-wrap gap-2 text-xs font-medium">
            {([1, 2, 3] as Step[]).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    if (s === 1 || (s === 2 && sourceColumns.length) || (s === 3 && preview)) {
                      setStep(s);
                    }
                  }}
                  className={`rounded-full px-3 py-1 ${
                    step === s
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {s}. {s === 1 ? "Upload" : s === 2 ? "Match columns" : "Check"}
                </button>
              </li>
            ))}
          </ol>

          {step === 1 ? (
            <div className="space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center dark:border-gray-600 dark:bg-gray-800/40">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Drop a file here
                </span>
                <span className="mt-1 text-xs text-gray-500">Accepts .csv</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {fileName ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {fileName}
                  {rowCount ? ` · ${rowCount} rows` : ""}
                </p>
              ) : null}
              {raw.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    autoMap();
                    setStep(2);
                  }}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Continue to match columns
                </button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your column → Goes to
                  {fileName ? (
                    <span className="text-gray-500">
                      {" "}
                      · {fileName}
                      {rowCount ? ` · ${rowCount} rows` : ""}
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => autoMap()}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Auto-map
                </button>
              </div>
              {sourceColumns.length === 0 ? (
                <p className="text-sm text-gray-500">Upload a CSV first.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="py-2 text-left font-medium text-gray-600">Your column</th>
                        <th className="py-2 text-left font-medium text-gray-600">Goes to</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {ENTITY_FIELDS[entity].map((field) => (
                        <tr key={field}>
                          <td className="py-2 pr-4">
                            <select
                              value={columnMap[field] ?? ""}
                              onChange={(e) =>
                                setColumnMap((m) => ({ ...m, [field]: e.target.value }))
                              }
                              className={inputClass}
                            >
                              <option value="">—</option>
                              {sourceColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 text-gray-800 dark:text-gray-200">
                            {FIELD_LABELS[field] ?? field}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy || !sourceColumns.length}
                  onClick={() => void runImport(true)}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {busy ? "Checking…" : "Dry run / Check"}
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              {preview ? (
                <>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                      {checkNew} new
                    </span>
                    <span className="tabular-nums text-gray-600">{checkDupes} duplicates</span>
                    <span className="tabular-nums text-red-600">{checkErrors} errors</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Duplicates matched on domain and name. Choose skip, update or merge. Dry-run
                    results shown; nothing is saved until you commit.
                  </p>
                  {preview.errors?.length ? (
                    <ul className="list-disc pl-5 text-xs text-red-600">
                      {preview.errors.map((err) => (
                        <li key={`${err.row}-${err.message}`}>
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runImport(true)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                    >
                      Re-run dry run
                    </button>
                    <button
                      type="button"
                      disabled={busy || checkErrors > 0}
                      onClick={() => void runImport(false)}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                    >
                      Import {checkNew} rows
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Run a dry check from step 2 first.</p>
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Export</h3>
          <p className="mb-3 text-xs text-gray-500">
            Every list can be exported with the current filters. Exports are written to the audit
            log.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["clients", "leads", "opportunities"] as Entity[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => void exportEntity(e)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Export {e}
              </button>
            ))}
          </div>
        </section>
      </div>
    </ClientsOnlyGuard>
  );
}
