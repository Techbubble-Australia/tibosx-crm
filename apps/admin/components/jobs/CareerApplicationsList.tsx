"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, ChevronDown } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { resolveDocumentFileName, resolveDocumentHref } from "@/lib/media-url";
import {
  CAREER_APPLICATION_STATUSES,
  CAREER_APPLICATION_STATUS_COLORS,
  CAREER_APPLICATION_STATUS_LABELS,
  type CareerApplicationStatus,
} from "@/lib/career-application-status";

interface CareerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  jobListingId?: string | null;
  country?: string | null;
  city?: string | null;
  visaStatus?: string | null;
  isCitizen?: boolean;
  status?: string;
  salaryCurrency?: string | null;
  salaryRate?: number | null;
  salaryMode?: string | null;
  salaryExpectation?: number | null;
  resumeUrl?: string;
  documentUrls?: string[] | null;
  message?: string;
  createdAt: string;
  jobTitle?: string | null;
  jobPublished?: boolean | null;
  jobCountry?: string | null;
  jobWorkMode?: string | null;
  clientName?: string | null;
  profileId?: string | null;
}

function formatSalary(app: CareerApplication): string | null {
  if (app.salaryCurrency && app.salaryRate && app.salaryMode) {
    const rate = new Intl.NumberFormat("en-US").format(app.salaryRate);
    return `${app.salaryCurrency} ${rate} (${app.salaryMode})`;
  }
  if (app.salaryExpectation != null && app.salaryExpectation > 0) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(app.salaryExpectation);
  }
  return null;
}

function documentLinks(app: CareerApplication): string[] {
  if (Array.isArray(app.documentUrls) && app.documentUrls.length > 0) {
    return app.documentUrls;
  }
  return app.resumeUrl ? [app.resumeUrl] : [];
}

function formatLocation(app: CareerApplication): string | null {
  const parts = [app.city, app.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function applicationSearchHaystack(app: CareerApplication): string {
  return buildSearchHaystack([
    app.firstName,
    app.lastName,
    app.email,
    app.phone,
    app.position,
    app.country,
    app.city,
    app.visaStatus,
    app.message,
    app.jobTitle,
    app.jobCountry,
    app.jobWorkMode,
    app.clientName,
    app.status,
  ]);
}

function jobGroupKey(app: CareerApplication): string {
  return app.jobListingId ?? app.position ?? "unknown";
}

function jobGroupLabel(app: CareerApplication): string {
  return app.jobTitle ?? app.position ?? "Unknown role";
}

type Props = {
  jobPublished: boolean;
  jobListingId?: string;
};

function ApplicationCard({
  app,
  canEdit,
  hidePosition = false,
  onStatusChange,
  onDelete,
}: {
  app: CareerApplication;
  canEdit: boolean;
  hidePosition?: boolean;
  onStatusChange: (id: string, status: CareerApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  const salary = formatSalary(app);
  const docs = documentLinks(app);
  const location = formatLocation(app);
  const status = (app.status as CareerApplicationStatus) || "INTERNAL_REVIEW";
  const statusColors = CAREER_APPLICATION_STATUS_COLORS[status] ?? CAREER_APPLICATION_STATUS_COLORS.INTERNAL_REVIEW;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {app.profileId ? (
              <Link
                href={`/database/profiles/${app.profileId}`}
                className="font-semibold text-gray-900 hover:text-blue-600 hover:underline dark:text-gray-100 dark:hover:text-blue-400"
              >
                {app.firstName} {app.lastName}
              </Link>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {app.firstName} {app.lastName}
              </p>
            )}
            {canEdit ? (
              <select
                value={status}
                onChange={(e) => void onStatusChange(app.id, e.target.value as CareerApplicationStatus)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText} border-0`}
                aria-label="Application status"
              >
                {CAREER_APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{CAREER_APPLICATION_STATUS_LABELS[s]}</option>
                ))}
              </select>
            ) : (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}>
                {CAREER_APPLICATION_STATUS_LABELS[status]}
              </span>
            )}
          </div>
          {hidePosition ? null : (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              Applying for:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">{app.position}</span>
              {app.jobTitle && app.jobTitle !== app.position ? (
                <span className="text-gray-500"> · {app.jobTitle}</span>
              ) : null}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <a href={`mailto:${app.email}`} className="hover:text-black hover:underline dark:hover:text-white">
              {app.email}
            </a>
            {app.phone ? <span>{app.phone}</span> : null}
            {location ? <span>{location}</span> : null}
            {app.jobCountry ? <span>Job country: {app.jobCountry}</span> : null}
            {app.jobWorkMode ? <span>{app.jobWorkMode}</span> : null}
            {app.isCitizen === false && app.visaStatus ? <span>Visa: {app.visaStatus}</span> : null}
            {app.isCitizen !== false ? <span>Citizen: Yes</span> : null}
            {salary ? <span>Salary: {salary}</span> : null}
            {app.clientName ? <span>Client: {app.clientName}</span> : null}
          </div>
          {app.message ? (
            <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
              {app.message}
            </p>
          ) : null}
          {docs.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {docs.map((url, index) => (
                <a
                  key={`${url}-${index}`}
                  href={resolveDocumentHref(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {resolveDocumentFileName(url, index + 1)} →
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
          <span className="text-xs text-gray-400">
            {new Date(app.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {canEdit ? (
            <button
              type="button"
              onClick={() => void onDelete(app.id)}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              aria-label="Delete application"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CareerApplicationsList({ jobPublished, jobListingId }: Props) {
  const { canAccessRecruitment } = useAdminSession();
  const canEdit = canAccessRecruitment;
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [filteredJobTitle, setFilteredJobTitle] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterWorkMode, setFilterWorkMode] = useState("");
  const [filterClient, setFilterClient] = useState("");

  const filteredByJobMeta = useMemo(() => {
    return applications.filter((app) => {
      if (filterCountry && app.jobCountry !== filterCountry) return false;
      if (filterWorkMode && app.jobWorkMode !== filterWorkMode) return false;
      if (filterClient && app.clientName !== filterClient) return false;
      return true;
    });
  }, [applications, filterCountry, filterWorkMode, filterClient]);

  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const workModes = new Set<string>();
    const clients = new Set<string>();
    for (const app of applications) {
      if (app.jobCountry) countries.add(app.jobCountry);
      if (app.jobWorkMode) workModes.add(app.jobWorkMode);
      if (app.clientName) clients.add(app.clientName);
    }
    return {
      countries: [...countries].sort((a, b) => a.localeCompare(b)),
      workModes: [...workModes].sort((a, b) => a.localeCompare(b)),
      clients: [...clients].sort((a, b) => a.localeCompare(b)),
    };
  }, [applications]);

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
    adjustPageAfterDelete,
  } = useListView(filteredByJobMeta, applicationSearchHaystack, {
    initialPageSize: 100,
    pageSizeOptions: [25, 50, 100, 200],
  });

  useEffect(() => {
    void fetchApplications();
  }, [jobPublished, jobListingId]);

  async function fetchApplications() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("published", jobPublished ? "true" : "false");
      if (jobListingId) params.set("jobListingId", jobListingId);
      const res = await adminFetch(`/api/admin/career-applications/admin/applications?${params.toString()}`);
      const data = await res.json();
      const rows = (data.data || []) as CareerApplication[];
      setApplications(rows);
      if (jobListingId) {
        const match = rows.find((row) => row.jobListingId === jobListingId);
        setFilteredJobTitle(match?.jobTitle ?? match?.position ?? "Selected job");
      } else {
        setFilteredJobTitle("");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id: string, status: CareerApplicationStatus) {
    try {
      const res = await adminFetch(`/api/admin/career-applications/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications((prev) => prev.map((row) => (row.id === id ? { ...row, ...data.data } : row)));
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm("Permanently delete this application?")) return;
    try {
      const res = await adminFetch(`/api/admin/career-applications/admin/applications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApplications((prev) => {
          const next = prev.filter((item) => item.id !== id);
          adjustPageAfterDelete(next.length);
          return next;
        });
      }
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  }

  const groupedByJob = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        country: string | null;
        workMode: string | null;
        clientName: string | null;
        items: CareerApplication[];
      }
    >();
    for (const app of paginated) {
      const key = jobGroupKey(app);
      const existing = map.get(key);
      if (existing) {
        existing.items.push(app);
      } else {
        map.set(key, {
          label: jobGroupLabel(app),
          country: app.jobCountry ?? null,
          workMode: app.jobWorkMode ?? null,
          clientName: app.clientName ?? null,
          items: [app],
        });
      }
    }
    return [...map.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [paginated]);

  function toggleJobGroup(key: string) {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const clearJobFilterHref = jobPublished ? "/career-applications/active" : "/career-applications/inactive";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Career Applications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {jobPublished ? "Applications for active (published) jobs" : "Applications for inactive jobs"} —{" "}
            {filteredByJobMeta.length} submission{filteredByJobMeta.length !== 1 ? "s" : ""}
          </p>
          {jobListingId && filteredJobTitle ? (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Filtered to job: <span className="font-medium text-gray-900 dark:text-gray-100">{filteredJobTitle}</span>.{" "}
              <Link href={clearJobFilterHref} className="text-blue-600 hover:underline dark:text-blue-400">
                Show all
              </Link>
            </p>
          ) : null}
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <AdminSearchField
        id="career-applications-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, position, location…"
        filteredCount={totalItems}
        totalCount={filteredByJobMeta.length}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterCountry}
          onChange={(e) => {
            setFilterCountry(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {filterOptions.countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        <select
          value={filterWorkMode}
          onChange={(e) => {
            setFilterWorkMode(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          aria-label="Filter by employment type"
        >
          <option value="">All employment types</option>
          {filterOptions.workModes.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
        <select
          value={filterClient}
          onChange={(e) => {
            setFilterClient(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          aria-label="Filter by client"
        >
          <option value="">All clients</option>
          {filterOptions.clients.map((client) => (
            <option key={client} value={client}>{client}</option>
          ))}
        </select>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
          No applications in this tab yet.
        </div>
      ) : filteredByJobMeta.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
          No applications match your filters.
        </div>
      ) : totalItems === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
          No applications match your search.
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {paginated.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              canEdit={canEdit}
              onStatusChange={(id, status) => void updateStatus(id, status)}
              onDelete={(id) => void deleteApplication(id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByJob.map(([key, group]) => {
            const isExpanded = expandedJobs.has(key);
            const panelId = `career-app-group-${key.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <section
                key={key}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() => toggleJobGroup(key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                    <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">{group.label}</h3>
                    <span className="hidden min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 sm:flex dark:text-gray-400">
                      {group.country ? <span>{group.country}</span> : null}
                      {group.workMode ? <span>{group.workMode}</span> : null}
                      {group.clientName ? <span>{group.clientName}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {group.items.length}
                  </span>
                </button>
                {isExpanded ? (
                  <div id={panelId} className="space-y-3 border-t border-gray-100 p-4 dark:border-gray-800">
                    {group.items.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        canEdit={canEdit}
                        hidePosition
                        onStatusChange={(id, status) => void updateStatus(id, status)}
                        onDelete={(id) => void deleteApplication(id)}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {applications.length > 0 ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}
