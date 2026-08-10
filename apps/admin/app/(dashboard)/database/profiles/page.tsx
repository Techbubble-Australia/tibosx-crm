"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

interface ProfileRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  category: string;
  technology: string;
  expectedRate: number;
  currency: string;
  mode: string;
  documentUrls: string[];
  previousSalary?: number | null;
  comments?: string | null;
  careerApplicationId?: string | null;
  createdAt: string;
}

function formatRate(row: ProfileRow): string {
  const rate = new Intl.NumberFormat("en-US").format(row.expectedRate);
  return `${row.currency} ${rate} (${row.mode})`;
}

export default function ProfilesPage() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      row.category,
      row.technology,
      row.currency,
      row.mode,
      row.comments,
      row.previousSalary,
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profiles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search candidate profiles and manage the talent database. Profiles are auto-created from career applications.
          </p>
        </div>
        <Link
          href="/database/profiles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New
        </Link>
      </div>

      <AdminSearchField
        id="profile-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, category, technology…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Expected rate</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No profile records yet. Create one with New or submit a career application.
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No profiles match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.category}</td>
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
                      <button
                        type="button"
                        onClick={() => void deleteRow(row.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
    </div>
  );
}
