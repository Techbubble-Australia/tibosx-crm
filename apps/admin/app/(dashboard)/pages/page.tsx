"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { SITE_CONTENT_FORM_KEYS, SITE_CONTENT_KEY_LABELS } from "@/lib/site-content-normalize";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

interface SiteContentRow {
  id: string;
  key: string;
  label: string;
  updatedAt: string;
}

type MergedRow =
  | (SiteContentRow & { missing?: false })
  | { id: string; key: string; label: string; updatedAt: string | null; missing: true };

export default function SitePagesListPage() {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mergedRows = useMemo(() => {
    const byKey = new Map(rows.map((r) => [r.key, r]));
    const canonical: MergedRow[] = SITE_CONTENT_FORM_KEYS.map((key) => {
      const existing = byKey.get(key);
      if (existing) {
        return { ...existing, missing: false as const };
      }
      return {
        id: `__missing__${key}`,
        key,
        label: SITE_CONTENT_KEY_LABELS[key],
        updatedAt: null,
        missing: true,
      };
    });
    const canonicalKeys = new Set<string>(SITE_CONTENT_FORM_KEYS);
    const extras = rows.filter((r) => !canonicalKeys.has(r.key)).map((r) => ({ ...r, missing: false as const }));
    return [...canonical, ...extras];
  }, [rows]);

  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalItems,
    totalSourceItems,
  } = useListView(mergedRows, (row) =>
    buildSearchHaystack([row.key, row.label, row.missing ? "missing" : ""]),
  );

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
            JSON documents for the marketing site, including the{" "}
            <span className="font-medium text-gray-700">footer</span> (<code className="text-xs">site_footer</code>
            ), announcement bar, homepage, and inner pages.
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

      <AdminSearchField
        id="site-pages-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by key or label…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

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
            {mergedRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No site content yet. Run the database seed or create a document.
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No pages match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id} className={row.missing ? "bg-amber-50/50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{row.key}</td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-gray-700">
                    {row.missing ? (
                      <span>
                        <span className="text-amber-800">{row.label}</span>
                        <span className="ml-2 text-xs font-normal text-amber-700">(not in database)</span>
                      </span>
                    ) : (
                      row.label || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {row.missing ? "—" : new Date(row.updatedAt as string).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {row.missing ? (
                        <Link
                          href={`/pages/new?template=${encodeURIComponent(row.key)}`}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-900 underline decoration-amber-700 hover:bg-amber-100"
                        >
                          Create
                        </Link>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {mergedRows.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>
    </div>
  );
}
