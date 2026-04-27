"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface SiteContentRow {
  id: string;
  key: string;
  label: string;
  updatedAt: string;
}

export default function SitePagesListPage() {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchRows();
  }, []);

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/site-content/all");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error("Error fetching site pages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(key: string) {
    if (!confirm(`Delete site content "${key}"? The marketing site may break until you re-seed or recreate this entry.`)) return;
    try {
      const res = await adminFetch(`/api/admin/site-content/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (res.ok) setRows((r) => r.filter((x) => x.key !== key));
      else {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting site content:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Site pages &amp; CMS blocks</h2>
          <p className="text-sm text-gray-500">
            JSON documents keyed for the marketing site (home, services, pricing, about, careers, announcement bar, etc.)
          </p>
        </div>
        <Link
          href="/pages/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          New document
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Key</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Label</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Updated</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No site content yet. Run the database seed or create a document.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{row.key}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-gray-700">{row.label || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(row.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/pages/${encodeURIComponent(row.key)}`}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.key)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
