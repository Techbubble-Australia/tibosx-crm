"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";

interface JobListing {
  id: string;
  title: string;
  slug: string;
  referenceNumber: string;
  location: string;
  country: string;
  flag: string;
  type: string;
  workMode: string;
  category: string;
  technology: string;
  department: string;
  published: boolean;
  createdAt: string;
}

function jobSearchHaystack(job: JobListing): string {
  return [
    job.referenceNumber,
    job.title,
    job.location,
    job.country,
    job.type,
    job.workMode,
    job.category,
    job.technology,
    job.department,
  ]
    .join(" ")
    .toLowerCase();
}

export default function JobsPage() {
  const { canAccessWebsite } = useAdminSession();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated: paginatedJobs,
    totalItems,
    totalSourceItems,
  } = useListView(jobs, jobSearchHaystack);

  useEffect(() => {
    void fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await adminFetch("/api/admin/jobs/admin/all");
      const data = await res.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteJob(id: string) {
    if (!confirm("Are you sure you want to delete this job listing?")) return;
    try {
      const res = await adminFetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const next = jobs.filter((j) => j.id !== id);
        setJobs(next);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Listings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage open positions on the careers page</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAccessWebsite ? (
            <>
              <Link
                href="/settings/categories"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
                Taxonomy settings
              </Link>
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Add Job
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <AdminSearchField
        id="job-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by ref, title, category, technology, department, location…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ref</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Department</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  No job listings yet. Add one to get started.
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  No listings match your search.
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{job.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{job.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <span className="mr-1" aria-hidden>
                      {job.flag}
                    </span>
                    {job.country}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.location}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {job.type} · {job.workMode}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.category || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.technology || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.department}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.published
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {job.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canAccessWebsite ? (
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void deleteJob(job.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {jobs.length > 0 ? (
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
