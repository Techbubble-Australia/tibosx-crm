"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { JobAddProfileForm } from "@/components/jobs/JobAddProfileForm";

type ApplicationRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
};

export function JobApplicationsPanel({
  jobId,
  jobTitle,
  jobCountry,
}: {
  jobId: string;
  jobTitle: string;
  jobCountry: string;
}) {
  const { canAccessWebsite, canAccessRecruitment } = useAdminSession();
  const canManageApplications = canAccessWebsite || canAccessRecruitment;
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/jobs/admin/${jobId}/applications`);
      const data = await res.json();
      setRows(data.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  async function deleteApplication(id: string) {
    if (!(await appConfirm("Delete this application? This cannot be undone."))) return;
    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/admin/career-applications/admin/applications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error(error);
      appAlert("Failed to delete application.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Applications</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading applications…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Applications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Career applications submitted for this job listing.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {rows.length}
        </span>
        {canManageApplications ? (
          <button
            type="button"
            onClick={() => setShowAddProfile(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <UserPlus className="h-4 w-4" />
            Add new profile
          </button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">There are no profiles for this job.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Location</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Submitted</th>
                {canManageApplications ? (
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.email}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.phone || "—"}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  {canManageApplications ? (
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteApplication(row.id)}
                        disabled={deletingId === row.id}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                        aria-label={`Delete application from ${row.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAddProfile ? (
        <JobAddProfileForm
          jobId={jobId}
          jobTitle={jobTitle}
          jobCountry={jobCountry}
          onClose={() => setShowAddProfile(false)}
          onCreated={() => void fetchApplications()}
        />
      ) : null}
    </section>
  );
}
