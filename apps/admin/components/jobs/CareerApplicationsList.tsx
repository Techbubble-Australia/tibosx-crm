"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
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
  clientName?: string | null;
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
    app.clientName,
    app.status,
  ]);
}

type Props = {
  jobPublished: boolean;
};

export function CareerApplicationsList({ jobPublished }: Props) {
  const { canAccessRecruitment } = useAdminSession();
  const canEdit = canAccessRecruitment;
  const [applications, setApplications] = useState<CareerApplication[]>([]);
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
    adjustPageAfterDelete,
  } = useListView(applications, applicationSearchHaystack);

  useEffect(() => {
    void fetchApplications();
  }, [jobPublished]);

  async function fetchApplications() {
    setIsLoading(true);
    try {
      const query = `?published=${jobPublished ? "true" : "false"}`;
      const res = await adminFetch(`/api/admin/career-applications/admin/applications${query}`);
      const data = await res.json();
      setApplications(data.data || []);
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Career Applications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {jobPublished ? "Applications for active (published) jobs" : "Applications for inactive jobs"} —{" "}
          {totalSourceItems} submission{totalSourceItems !== 1 ? "s" : ""}
        </p>
      </div>

      <AdminSearchField
        id="career-applications-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, position, location…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
            No applications in this tab yet.
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
            No applications match your search.
          </div>
        ) : (
          paginated.map((app) => {
            const salary = formatSalary(app);
            const docs = documentLinks(app);
            const location = formatLocation(app);
            const status = (app.status as CareerApplicationStatus) || "CLIENT_REVIEW";
            const statusColors = CAREER_APPLICATION_STATUS_COLORS[status] ?? CAREER_APPLICATION_STATUS_COLORS.CLIENT_REVIEW;

            return (
              <div
                key={app.id}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {app.firstName} {app.lastName}
                      </p>
                      {canEdit ? (
                        <select
                          value={status}
                          onChange={(e) => void updateStatus(app.id, e.target.value as CareerApplicationStatus)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText} border-0`}
                          aria-label="Application status"
                        >
                          {CAREER_APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>{CAREER_APPLICATION_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}
                        >
                          {CAREER_APPLICATION_STATUS_LABELS[status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                      Applying for:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{app.position}</span>
                      {app.jobTitle && app.jobTitle !== app.position ? (
                        <span className="text-gray-500"> · {app.jobTitle}</span>
                      ) : null}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <a href={`mailto:${app.email}`} className="hover:text-black hover:underline dark:hover:text-white">
                        {app.email}
                      </a>
                      {app.phone ? <span>{app.phone}</span> : null}
                      {location ? <span>{location}</span> : null}
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
                        onClick={() => void deleteApplication(app.id)}
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
          })
        )}
      </div>

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
