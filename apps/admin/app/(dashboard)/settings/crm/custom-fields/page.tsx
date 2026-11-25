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

const ENTITY_TABS = [
  { value: "opportunity", label: "Opportunity" },
  { value: "client", label: "Client" },
  { value: "contact", label: "Contact" },
  { value: "lead", label: "Lead" },
] as const;

const FIELD_TYPES = ["text", "number", "date", "select", "boolean"] as const;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function CustomFieldsPage() {
  const [rows, setRows] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<(typeof ENTITY_TABS)[number]["value"]>("opportunity");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entityType: "opportunity",
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

  useEffect(() => {
    setForm((f) => ({ ...f, entityType: entityFilter }));
  }, [entityFilter]);

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
      setForm({ entityType: entityFilter, key: "", label: "", fieldType: "text", options: "", required: false });
      setShowForm(false);
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Custom fields</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add fields to clients, contacts, leads and opportunities without code
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Field
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
          {ENTITY_TABS.map((tab) => {
            const active = entityFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setEntityFilter(tab.value)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? "border-black text-gray-900 dark:border-white dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {showForm ? (
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
                {ENTITY_TABS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Saving…" : "Add field"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Field</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Required</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Active</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No custom fields for {ENTITY_TABS.find((t) => t.value === entityFilter)?.label ?? entityFilter}.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{row.label}</p>
                        <p className="font-mono text-xs text-gray-500">{row.key}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.fieldType}</td>
                      <td className="px-4 py-3 text-gray-600">{row.required ? "Yes" : "No"}</td>
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
