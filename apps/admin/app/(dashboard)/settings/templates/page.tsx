"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";

type TemplateRow = {
  id: string;
  name: string;
  updatedAt: string;
};

export default function SettingsTemplatesPage() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchRows();
  }, []);

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/credential-templates");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(id: string) {
    if (!(await appConfirm("Delete this template?"))) return;
    const res = await adminFetch(`/api/admin/credential-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((row) => row.id !== id));
      return;
    }
    const data = await res.json().catch(() => ({}));
    appAlert((data as { error?: string }).error || "Could not delete this template.");
  }

  return (
    <AdminOnlyGuard>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Credential agreement templates with configurable variables for project members.
            </p>
          </div>
          <Link
            href="/settings/templates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" /> New template
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400">No templates yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Updated</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <Link href={`/settings/templates/${row.id}`} className="hover:text-blue-600 hover:underline dark:hover:text-blue-400">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(row.updatedAt).toLocaleDateString("en-AU")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => void deleteRow(row.id)} className="rounded-lg border border-gray-200 p-2 text-red-500 hover:bg-red-50 dark:border-gray-600" aria-label="Delete template">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminOnlyGuard>
  );
}
