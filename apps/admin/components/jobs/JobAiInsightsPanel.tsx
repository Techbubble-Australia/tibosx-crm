"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

type MatchRow = {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  category: string;
  technology: string;
  matchCount: number;
  matchedTags: string[];
  countryMatch: boolean;
};

type Props = {
  jobId: string;
};

export function JobAiInsightsPanel({ jobId }: Props) {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch(`/api/admin/jobs/admin/${jobId}/matching-profiles`)
      .then((res) => res.json())
      .then((data) => setRows((data.data as MatchRow[]) ?? []))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Matching profiles based on country and meta tags (including resume text).
      </p>
      {loading ? (
        <p className="text-sm text-gray-400">Loading matches…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">No matching profiles found. Add meta tags to improve matching.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">Category / Tech</th>
                <th className="py-2 pr-3">Matched tags</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.profileId} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/database/profiles/${row.profileId}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">
                    {row.country}
                    {row.countryMatch ? " ✓" : ""}
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">
                    {row.category} · {row.technology}
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">
                    {row.matchedTags.length ? row.matchedTags.join(", ") : "—"}
                  </td>
                  <td className="py-2">{row.matchCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
