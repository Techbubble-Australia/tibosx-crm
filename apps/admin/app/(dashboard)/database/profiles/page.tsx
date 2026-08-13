"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { useAdminSession } from "@/contexts/AdminSessionContext";

interface ProfileRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city?: string | null;
  category: string;
  technology: string;
  expectedRate: number;
  currency: string;
  mode: string;
}

function formatRate(row: ProfileRow): string {
  const rate = new Intl.NumberFormat("en-US").format(row.expectedRate);
  return `${row.currency} ${rate} (${row.mode})`;
}

export default function ProfilesPage() {
  const { canDeleteProfiles } = useAdminSession();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
  } = useListView(rows, (row) =>
    buildSearchHaystack([
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      row.country,
      row.city,
      row.technology,
      row.currency,
      row.mode,
    ]),
  );

  useEffect(() => {
    void fetchRows();
  }, []);

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/profiles");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this profile?")) return;
    try {
      const res = await adminFetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((row) => row.id !== id));
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  }

  const groupedByTechnology = useMemo(() => {
    const map = new Map<string, ProfileRow[]>();
    for (const row of paginated) {
      const key = row.technology.trim() || "Unknown";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [paginated]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profiles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search candidate profiles and manage the talent database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/database/profiles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Link>
        </div>
      </div>

      <AdminSearchField
        id="profile-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, phone, city, country, technology…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">City</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Expected rate</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No profile records yet.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No profiles match your search.</td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.phone}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.technology}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatRate(row)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/database/profiles/${row.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {canDeleteProfiles ? (
                          <button
                            type="button"
                            onClick={() => void deleteRow(row.id)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {rows.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profile records yet.
            </div>
          ) : totalItems === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profiles match your search.
            </div>
          ) : groupedByTechnology.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profiles on this page.
            </div>
          ) : (
            groupedByTechnology.map(([technology, profiles]) => (
              <section
                key={technology}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{technology}</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {profiles.length}
                  </span>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {profiles.map((row) => (
                    <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {row.email} · {row.phone}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {[row.city, row.country].filter(Boolean).join(", ") || "—"} · {formatRate(row)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/database/profiles/${row.id}`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          {rows.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
