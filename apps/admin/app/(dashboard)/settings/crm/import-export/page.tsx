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

export default function ImportExportPage() {
  const [entity, setEntity] = useState<Entity>("clients");
  const [raw, setRaw] = useState("");
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
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

  function autoMap() {
    const next: Record<string, string> = {};
    for (const field of ENTITY_FIELDS[entity]) {
      const match = sourceColumns.find((c) => c.toLowerCase() === field.toLowerCase());
      if (match) next[field] = match;
    }
    setColumnMap(next);
  }

  async function runImport(dryRun: boolean) {
    setBusy(true);
    try {
      const rows = parseRows();
      if (!rows.length) throw new Error("Paste at least one data row (CSV or JSON array).");
      const res = await adminFetch("/api/admin/crm/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, dryRun, rows, columnMap }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed");
      setPreview(data.data);
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

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Entity</label>
              <select
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value as Entity);
                  setColumnMap({});
                  setPreview(null);
                }}
                className={inputClass}
              >
                <option value="clients">Clients</option>
                <option value="leads">Leads</option>
                <option value="opportunities">Opportunities</option>
              </select>
            </div>
            <button
              type="button"
              onClick={autoMap}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Auto-map columns
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Paste CSV (header row) or JSON array of objects
            </label>
            <textarea
              rows={8}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={'name,country\nAcme,Australia\n\nor\n[{"name":"Acme","country":"Australia"}]'}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          {sourceColumns.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ENTITY_FIELDS[entity].map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{field} ←</label>
                  <select
                    value={columnMap[field] ?? ""}
                    onChange={(e) => setColumnMap((m) => ({ ...m, [field]: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {sourceColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runImport(true)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
            >
              Dry run
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runImport(false)}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              Commit import
            </button>
          </div>

          {preview ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-800/50">
              <p>
                {preview.dryRun ? "Dry run" : "Commit"}: {preview.rowCount ?? preview.created ?? 0} rows,{" "}
                {preview.errorCount} error(s)
                {preview.created != null ? `, created ${preview.created}` : ""}.
              </p>
              {preview.errors?.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
                  {preview.errors.map((err) => (
                    <li key={`${err.row}-${err.message}`}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Export</h3>
          <p className="mb-3 text-xs text-gray-500">Downloads a CSV file for the selected entity.</p>
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
