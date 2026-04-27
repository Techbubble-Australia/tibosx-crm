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
  company?: string;
  resumeUrl?: string;
  message?: string;
  createdAt: string;
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Career Applications</h2>
        <p className="text-gray-500 text-sm">{applications.length} submission{applications.length !== 1 ? "s" : ""} received</p>
      </div>

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-gray-400">No applications yet.</div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{app.firstName} {app.lastName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Applying for: <span className="font-medium text-gray-900">{app.position}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <a href={`mailto:${app.email}`} className="hover:text-black hover:underline">{app.email}</a>
                    {app.phone && <span>{app.phone}</span>}
                    {app.company && <span>{app.company}</span>}
                  </div>
                  {app.message && (
                    <p className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">{app.message}</p>
                  )}
                  {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex text-sm text-blue-600 hover:underline">
                      View Resume →
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
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
          ))
        )}
      </div>
    </div>
  );
}
