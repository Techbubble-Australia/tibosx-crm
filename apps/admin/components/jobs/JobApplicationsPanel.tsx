"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

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

export function JobApplicationsPanel({ jobId }: { jobId: string }) {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch(`/api/admin/jobs/admin/${jobId}/applications`)
      .then((res) => res.json())
      .then((data) => setRows(data.data ?? []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [jobId]);

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
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Phone</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Location</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Submitted</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
