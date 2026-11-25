"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert, appConfirm } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type CustomField = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  order: number;
  active: boolean;
};

const ENTITY_TYPES = ["client", "contact", "lead", "opportunity"] as const;
const FIELD_TYPES = ["text", "number", "date", "select", "boolean"] as const;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function CustomFieldsPage() {
  const [rows, setRows] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entityType: "lead",
    key: "",
    label: "",
    fieldType: "text",
    options: "",
    required: false,
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter) params.set("entityType", entityFilter);
    void adminFetch(`/api/admin/crm/settings/custom-fields?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as CustomField[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function createField(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/crm/settings/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: form.entityType,
          key: form.key.trim(),
          label: form.label.trim(),
          fieldType: form.fieldType,
          options:
            form.fieldType === "select"
              ? form.options
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : null,
          required: form.required,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Create failed");
      setForm({ entityType: form.entityType, key: "", label: "", fieldType: "text", options: "", required: false });
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: CustomField) {
    try {
      const res = await adminFetch(`/api/admin/crm/settings/custom-fields/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      }
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function deleteField(id: string) {
    if (!(await appConfirm("Delete this custom field?"))) return;
    try {
      const res = await adminFetch(`/api/admin/crm/settings/custom-fields/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Delete failed");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Custom fields</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Extra fields on clients, contacts, leads, and opportunities.
          </p>
        </div>

        <form
          onSubmit={(e) => void createField(e)}
          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-700 dark:bg-gray-900"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Entity</label>
            <select
              value={form.entityType}
              onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
              className={inputClass}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Key</label>
            <input
              required
              pattern="^[a-z0-9_]+$"
              placeholder="budget_band"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Label</label>
            <input
              required
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
            <select
              value={form.fieldType}
              onChange={(e) => setForm((f) => ({ ...f, fieldType: e.target.value }))}
              className={inputClass}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {form.fieldType === "select" ? (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Options (comma-separated)</label>
              <input
                value={form.options}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                className={inputClass}
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
            />
            Required
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Saving…" : "Add field"}
            </button>
          </div>
        </form>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className={`${inputClass} max-w-xs`}
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Key</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Label</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Active</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No custom fields.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-gray-600">{row.entityType}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">{row.key}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.label}</td>
                      <td className="px-4 py-3 text-gray-600">{row.fieldType}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void toggleActive(row)}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {row.active ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void deleteField(row.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
