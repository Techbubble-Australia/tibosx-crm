"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface CareerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  country?: string | null;
  visaStatus?: string | null;
  salaryCurrency?: string | null;
  salaryRate?: number | null;
  salaryMode?: string | null;
  salaryExpectation?: number | null;
  resumeUrl?: string;
  documentUrls?: string[] | null;
  message?: string;
  createdAt: string;
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

export default function CareerApplicationsPage() {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    try {
      const res = await adminFetch("/api/admin/career-applications/admin/applications");
      const data = await res.json();
      setApplications(data.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm("Permanently delete this application?")) return;
    try {
      const res = await adminFetch(`/api/admin/career-applications/admin/applications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setApplications((a) => a.filter((x) => x.id !== id));
    } catch (error) {
      console.error("Error deleting application:", error);
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Career Applications</h2>
        <p className="text-sm text-gray-500">
          {applications.length} submission{applications.length !== 1 ? "s" : ""} received
        </p>
      </div>

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-400">
            No applications yet.
          </div>
        ) : (
          applications.map((app) => {
            const salary = formatSalary(app);
            const docs = documentLinks(app);
            return (
              <div key={app.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{app.firstName} {app.lastName}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Applying for: <span className="font-medium text-gray-900">{app.position}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <a href={`mailto:${app.email}`} className="hover:text-black hover:underline">{app.email}</a>
                      {app.phone && <span>{app.phone}</span>}
                      {app.country && <span>Country: {app.country}</span>}
                      {app.visaStatus && <span>Visa: {app.visaStatus}</span>}
                      {salary ? <span>Salary: {salary}</span> : null}
                    </div>
                    {app.message && (
                      <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">{app.message}</p>
                    )}
                    {docs.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {docs.map((url, index) => (
                          <a
                            key={`${url}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-sm text-blue-600 hover:underline"
                          >
                            Document {index + 1} →
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteApplication(app.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
