"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
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
  country: string;
  flag: string;
  type: string;
  workMode: string;
  category: string;
  technology: string;
  department: string;
  published: boolean;
  applicationCount: number;
  recruiterIds?: string[];
  createdAt: string;
}

type RecruiterUser = { id: string; email: string };

function formatRecruiters(recruiterIds: string[] | undefined, recruiterById: Map<string, string>): string {
  if (!recruiterIds?.length) return "—";
  const labels = recruiterIds
    .map((id) => recruiterById.get(id))
    .filter((email): email is string => Boolean(email));
  return labels.length > 0 ? labels.join(", ") : "—";
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

type JobsListPageProps = {
  publishedFilter: boolean;
  heading: string;
  description: string;
};

export function JobsListPage({ publishedFilter, heading, description }: JobsListPageProps) {
  const { canAccessWebsite, canAccessRecruitment } = useAdminSession();
  const canManageJobs = canAccessWebsite || canAccessRecruitment;
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [recruiterById, setRecruiterById] = useState<Map<string, string>>(new Map());
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
    paginated: paginatedJobs,
    totalItems,
    totalSourceItems,
  } = useListView(filteredJobs, jobSearchHaystack);

  useEffect(() => {
    void fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const [jobsRes, recruitersRes] = await Promise.all([
        adminFetch("/api/admin/jobs/admin/all"),
        adminFetch("/api/admin/jobs/admin/recruiters"),
      ]);
      const data = await jobsRes.json();
      const recruitersData = await recruitersRes.json();
      setJobs(data.data || []);
      const map = new Map<string, string>();
      for (const user of (recruitersData.data ?? []) as RecruiterUser[]) {
        map.set(user.id, user.email);
      }
      setRecruiterById(map);
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

  const groupedByTechnology = useMemo(() => {
    const map = new Map<string, JobListing[]>();
    for (const job of paginatedJobs) {
      const key = job.technology.trim() || "Unknown";
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [paginatedJobs]);

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
        placeholder="Search by ref, title, category, technology, department, location…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Ref</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Applications</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Recruiters</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No {publishedFilter ? "active" : "inactive"} job listings.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No listings match your search.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{job.referenceNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{job.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className="mr-1" aria-hidden>{job.flag}</span>
                      {job.country}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.technology || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.applicationCount ?? 0}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={formatRecruiters(job.recruiterIds, recruiterById)}>
                      {formatRecruiters(job.recruiterIds, recruiterById)}
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
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
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
          ) : (
            groupedByTechnology.map(([technology, items]) => (
              <section
                key={technology}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{technology}</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {items.length}
                  </span>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((job) => (
                    <li key={job.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{job.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {job.referenceNumber} · {job.country} · {job.applicationCount ?? 0} applications
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recruiters: {formatRecruiters(job.recruiterIds, recruiterById)}
                        </p>
                      </div>
                      <Link
                        href={jobEditHref(job.id, listTab)}
                        className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
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
      )}
    </div>
  );
}
