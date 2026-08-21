"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Settings, Flame } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { jobEditHref } from "@/lib/job-routes";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";

interface JobListing {
  id: string;
  title: string;
  slug: string;
  referenceNumber: string;
  location: string;
  city?: string;
  country: string;
  flag: string;
  type: string;
  workMode: string;
  category: string;
  technology: string;
  department: string;
  published: boolean;
  applicationCount: number;
  clientName?: string;
  isHot?: boolean;
  createdAt: string;
}

function jobSearchHaystack(job: JobListing): string {
  return [
    job.referenceNumber,
    job.title,
    job.city,
    job.clientName,
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

type JobsListPageProps = {
  publishedFilter: boolean;
  heading: string;
  description: string;
};

export function JobsListPage({ publishedFilter, heading, description }: JobsListPageProps) {
  const { canManageJobs, canViewJobs } = useAdminSession();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listTab = publishedFilter ? "active" : "inactive";
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const filteredJobs = useMemo(
    () => jobs.filter((job) => job.published === publishedFilter),
    [jobs, publishedFilter],
  );
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paginated: paginatedJobs,
    totalItems,
    totalSourceItems,
  } = useListView(filteredJobs, jobSearchHaystack);
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTechnology(null);
  }, [search, viewMode, publishedFilter]);

  useEffect(() => {
    void fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const jobsRes = await adminFetch("/api/admin/jobs/admin/all");
      const data = await jobsRes.json();
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
      const res = await adminFetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  }

  async function toggleHot(job: JobListing) {
    if (!canManageJobs) return;
    const nextIsHot = !job.isHot;
    try {
      const res = await adminFetch(`/api/admin/jobs/admin/${job.id}/hot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHot: nextIsHot }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isHot: nextIsHot } : j)));
      }
    } catch (error) {
      console.error("Error toggling hot status:", error);
    }
  }

  const groupedByTechnology = useMemo(() => {
    const map = new Map<string, JobListing[]>();
    for (const job of filtered) {
      const key = job.technology.trim() || "Unknown";
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const jobsInSelectedTechnology = useMemo(() => {
    if (!selectedTechnology) return [];
    return groupedByTechnology.find(([tech]) => tech === selectedTechnology)?.[1] ?? [];
  }, [groupedByTechnology, selectedTechnology]);

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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          {canManageJobs ? (
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
        id={`job-search-${publishedFilter ? "active" : "inactive"}`}
        value={search}
        onChange={setSearch}
        placeholder="Search by ref, title, city, client, category, technology, department, location…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ref</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Hot</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">City</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Applications</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    No {publishedFilter ? "active" : "inactive"} job listings.
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
                    <td className="px-4 py-3">
                      {canManageJobs ? (
                        <button
                          type="button"
                          onClick={() => void toggleHot(job)}
                          className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label={job.isHot ? "Remove hot flag" : "Mark as hot"}
                          title={job.isHot ? "Hot job — click to remove" : "Mark as hot job"}
                        >
                          <Flame
                            className={`h-4 w-4 ${
                              job.isHot
                                ? "fill-orange-500 text-orange-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      ) : (
                        <Flame
                          className={`h-4 w-4 ${
                            job.isHot ? "fill-orange-500 text-orange-500" : "text-gray-400"
                          }`}
                          aria-hidden
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className="mr-1" aria-hidden>{job.flag}</span>
                      {job.country}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={job.clientName || undefined}>
                      {job.clientName || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.technology || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {(job.applicationCount ?? 0) > 0 ? (
                        <Link
                          href={`/career-applications/${listTab}?jobListingId=${encodeURIComponent(job.id)}`}
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {job.applicationCount ?? 0}
                        </Link>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          job.published
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {job.published ? "Published" : "Unpublished"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageJobs ? (
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={jobEditHref(job.id, listTab)}
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
                      ) : canViewJobs ? (
                        <Link
                          href={jobEditHref(job.id, listTab)}
                          className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          View
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredJobs.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      ) : selectedTechnology ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTechnology(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← All technologies
          </button>
          <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedTechnology}</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {jobsInSelectedTechnology.length} listing{jobsInSelectedTechnology.length !== 1 ? "s" : ""}
              </span>
            </div>
            {jobsInSelectedTechnology.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No listings for this technology.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {jobsInSelectedTechnology.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{job.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job.referenceNumber} · {job.city || "—"} · {job.country} ·{" "}
                        {(job.applicationCount ?? 0) > 0 ? (
                          <Link
                            href={`/career-applications/${listTab}?jobListingId=${encodeURIComponent(job.id)}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {job.applicationCount ?? 0} applications
                          </Link>
                        ) : (
                          "0 applications"
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Client: {job.clientName || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {canManageJobs ? (
                        <button
                          type="button"
                          onClick={() => void toggleHot(job)}
                          className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label={job.isHot ? "Remove hot flag" : "Mark as hot"}
                          title={job.isHot ? "Hot job — click to remove" : "Mark as hot job"}
                        >
                          <Flame
                            className={`h-4 w-4 ${
                              job.isHot
                                ? "fill-orange-500 text-orange-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      ) : job.isHot ? (
                        <Flame className="h-4 w-4 fill-orange-500 text-orange-500" aria-label="Hot job" />
                      ) : null}
                      {canManageJobs ? (
                        <>
                          <Link
                            href={jobEditHref(job.id, listTab)}
                            className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => void deleteJob(job.id)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            aria-label={`Delete ${job.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : canViewJobs ? (
                        <Link
                          href={jobEditHref(job.id, listTab)}
                          className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          View
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No {publishedFilter ? "active" : "inactive"} job listings.
            </div>
          ) : totalItems === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No listings match your search.
            </div>
          ) : groupedByTechnology.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No technologies with listings on this tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupedByTechnology.map(([technology, items]) => (
                <button
                  key={technology}
                  type="button"
                  onClick={() => setSelectedTechnology(technology)}
                  className="rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{technology}</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {items.length} listing{items.length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
