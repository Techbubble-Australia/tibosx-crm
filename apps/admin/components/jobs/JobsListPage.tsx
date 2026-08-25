"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Settings, Flame, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { jobEditHref } from "@/lib/job-routes";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { ListColumnPersonalizer } from "@/components/ui/ListColumnPersonalizer";
import { useColumnVisibility, type ListColumnDef } from "@/hooks/useColumnVisibility";

const JOB_LIST_COLUMNS: ListColumnDef[] = [
  { id: "ref", label: "Ref" },
  { id: "order", label: "Order" },
  { id: "title", label: "Title" },
  { id: "hot", label: "Hot" },
  { id: "city", label: "City" },
  { id: "country", label: "Country" },
  { id: "client", label: "Client" },
  { id: "technology", label: "Technology" },
  { id: "level", label: "Level" },
  { id: "budget", label: "Budget" },
  { id: "type", label: "Employment type" },
  { id: "publishedDate", label: "Published date" },
  { id: "applications", label: "Applications" },
  { id: "status", label: "Status" },
];

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
  order?: number;
  level?: string;
  budget?: string;
  publishedDate?: string | null;
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

type SortKey =
  | "referenceNumber"
  | "order"
  | "title"
  | "isHot"
  | "city"
  | "country"
  | "clientName"
  | "technology"
  | "level"
  | "budget"
  | "type"
  | "publishedDate"
  | "applicationCount";
type SortDir = "asc" | "desc";

function compareJobs(a: JobListing, b: JobListing, key: SortKey): number {
  switch (key) {
    case "referenceNumber":
      return a.referenceNumber.localeCompare(b.referenceNumber);
    case "order":
      return (a.order ?? 0) - (b.order ?? 0);
    case "title":
      return a.title.localeCompare(b.title);
    case "isHot":
      return Number(a.isHot) - Number(b.isHot);
    case "city":
      return (a.city || "").localeCompare(b.city || "");
    case "country":
      return a.country.localeCompare(b.country);
    case "clientName":
      return (a.clientName || "").localeCompare(b.clientName || "");
    case "technology":
      return (a.technology || "").localeCompare(b.technology || "");
    case "level":
      return (a.level || "").localeCompare(b.level || "");
    case "budget":
      return (a.budget || "").localeCompare(b.budget || "");
    case "type":
      return (a.type || "").localeCompare(b.type || "");
    case "publishedDate":
      return new Date(a.publishedDate ?? 0).getTime() - new Date(b.publishedDate ?? 0).getTime();
    case "applicationCount":
      return (a.applicationCount ?? 0) - (b.applicationCount ?? 0);
    default:
      return 0;
  }
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 ${className}`}
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <span className="inline-block h-3.5 w-3.5 opacity-0" aria-hidden />
      )}
    </button>
  );
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
    totalItems,
    totalSourceItems,
  } = useListView(filteredJobs, jobSearchHaystack, {
    initialPageSize: 100,
    pageSizeOptions: [25, 50, 100, 200],
  });
  const { columns: jobColumnDefs, visibleIds, isVisible: isColumnVisible, toggleColumn } =
    useColumnVisibility("tbos:jobs-columns", JOB_LIST_COLUMNS);
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingPublishedDateId, setEditingPublishedDateId] = useState<string | null>(null);
  const [publishedDateDrafts, setPublishedDateDrafts] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  function startEditOrder(job: JobListing) {
    setEditingOrderId(job.id);
    setOrderDrafts((prev) => ({ ...prev, [job.id]: String(job.order ?? 0) }));
  }

  function cancelEditOrder(jobId: string) {
    setEditingOrderId((current) => (current === jobId ? null : current));
    setOrderDrafts((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }

  async function saveOrder(job: JobListing) {
    if (!canManageJobs) return;
    const raw = orderDrafts[job.id] ?? String(job.order ?? 0);
    const order = Number.parseInt(raw, 10);
    if (Number.isNaN(order)) {
      cancelEditOrder(job.id);
      return;
    }
    if (order === job.order) {
      cancelEditOrder(job.id);
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/jobs/admin/${job.id}/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, order } : j)));
        cancelEditOrder(job.id);
      }
    } catch (error) {
      console.error("Error updating job order:", error);
    }
  }

  async function savePublishedDate(job: JobListing) {
    if (!canManageJobs) return;
    const raw = publishedDateDrafts[job.id];
    if (!raw?.trim()) {
      cancelEditPublishedDate(job.id);
      return;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      cancelEditPublishedDate(job.id);
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/jobs/admin/${job.id}/published-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedDate: raw }),
      });
      if (res.ok) {
        const data = await res.json();
        const nextDate = data.data?.publishedDate ?? raw;
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, publishedDate: nextDate } : j)),
        );
        cancelEditPublishedDate(job.id);
      }
    } catch (error) {
      console.error("Error updating published date:", error);
    }
  }

  function startEditPublishedDate(job: JobListing) {
    setEditingPublishedDateId(job.id);
    const existing = job.publishedDate ? new Date(job.publishedDate) : new Date();
    const value = Number.isNaN(existing.getTime())
      ? ""
      : existing.toISOString().slice(0, 10);
    setPublishedDateDrafts((prev) => ({ ...prev, [job.id]: value }));
  }

  function cancelEditPublishedDate(jobId: string) {
    setEditingPublishedDateId((current) => (current === jobId ? null : current));
    setPublishedDateDrafts((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = compareJobs(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedFiltered.slice(start, start + pageSize);
  }, [sortedFiltered, page, pageSize]);

  const groupedByTechnology = useMemo(() => {
    const map = new Map<string, JobListing[]>();
    for (const job of sortedFiltered) {
      const key = job.technology.trim() || "Unknown";
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sortedFiltered]);

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
          {viewMode === "list" ? (
            <ListColumnPersonalizer
              columns={jobColumnDefs}
              visibleIds={visibleIds}
              onToggle={toggleColumn}
            />
          ) : null}
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
                {isColumnVisible("ref") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Ref" sortKey="referenceNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("order") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Order" sortKey="order" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("title") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("hot") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Hot" sortKey="isHot" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("city") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="City" sortKey="city" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("country") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Country" sortKey="country" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("client") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("technology") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Technology" sortKey="technology" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("level") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Level" sortKey="level" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("budget") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Budget" sortKey="budget" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("type") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Employment type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("publishedDate") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Published date" sortKey="publishedDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("applications") ? (
                  <th className="px-4 py-3 text-left">
                    <SortHeader label="Applications" sortKey="applicationCount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ) : null}
                {isColumnVisible("status") ? (
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                ) : null}
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-4 py-8 text-center text-gray-400">
                    No {publishedFilter ? "active" : "inactive"} job listings.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={20} className="px-4 py-8 text-center text-gray-400">
                    No listings match your search.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {isColumnVisible("ref") ? (
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{job.referenceNumber}</td>
                    ) : null}
                    {isColumnVisible("order") ? (
                      <td className="px-4 py-3">
                        {canManageJobs ? (
                          <div className="flex items-center gap-1">
                            {editingOrderId === job.id ? (
                              <input
                                type="number"
                                value={orderDrafts[job.id] ?? String(job.order ?? 0)}
                                onChange={(e) =>
                                  setOrderDrafts((prev) => ({ ...prev, [job.id]: e.target.value }))
                                }
                                onBlur={() => void saveOrder(job)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  } else if (e.key === "Escape") {
                                    cancelEditOrder(job.id);
                                  }
                                }}
                                autoFocus
                                className="w-16 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                aria-label={`Edit order for ${job.title}`}
                              />
                            ) : (
                              <>
                                <span className="text-gray-600 dark:text-gray-400">{job.order ?? 0}</span>
                                <button
                                  type="button"
                                  onClick={() => startEditOrder(job)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                  aria-label={`Edit order for ${job.title}`}
                                  title="Edit order"
                                >
                                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{job.order ?? 0}</span>
                        )}
                      </td>
                    ) : null}
                    {isColumnVisible("title") ? (
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{job.title}</td>
                    ) : null}
                    {isColumnVisible("hot") ? (
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
                    ) : null}
                    {isColumnVisible("city") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.city || "—"}</td>
                    ) : null}
                    {isColumnVisible("country") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="mr-1" aria-hidden>{job.flag}</span>
                        {job.country}
                      </td>
                    ) : null}
                    {isColumnVisible("client") ? (
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={job.clientName || undefined}>
                        {job.clientName || "—"}
                      </td>
                    ) : null}
                    {isColumnVisible("technology") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.technology || "—"}</td>
                    ) : null}
                    {isColumnVisible("level") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.level ?? "Developer"}</td>
                    ) : null}
                    {isColumnVisible("budget") ? (
                      <td className="max-w-[160px] truncate px-4 py-3 text-gray-600 dark:text-gray-400" title={job.budget || undefined}>
                        {job.budget?.trim() ? job.budget : "—"}
                      </td>
                    ) : null}
                    {isColumnVisible("type") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{job.type || "—"}</td>
                    ) : null}
                    {isColumnVisible("publishedDate") ? (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {canManageJobs ? (
                          <div className="flex items-center gap-1">
                            {editingPublishedDateId === job.id ? (
                              <input
                                type="date"
                                value={publishedDateDrafts[job.id] ?? ""}
                                onChange={(e) =>
                                  setPublishedDateDrafts((prev) => ({ ...prev, [job.id]: e.target.value }))
                                }
                                onBlur={() => void savePublishedDate(job)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  } else if (e.key === "Escape") {
                                    cancelEditPublishedDate(job.id);
                                  }
                                }}
                                autoFocus
                                className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                aria-label={`Edit published date for ${job.title}`}
                              />
                            ) : (
                              <>
                                <span>
                                  {job.publishedDate
                                    ? new Date(job.publishedDate).toLocaleDateString("en-AU", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "—"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => startEditPublishedDate(job)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                  aria-label={`Edit published date for ${job.title}`}
                                  title="Edit published date"
                                >
                                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          job.publishedDate
                            ? new Date(job.publishedDate).toLocaleDateString("en-AU", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"
                        )}
                      </td>
                    ) : null}
                    {isColumnVisible("applications") ? (
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
                    ) : null}
                    {isColumnVisible("status") ? (
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
                    ) : null}
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
