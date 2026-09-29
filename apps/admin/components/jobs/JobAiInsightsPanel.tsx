"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  metaTags?: string[];
};

export function JobAiInsightsPanel({ jobId, metaTags = [] }: Props) {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedProfileIds, setAppliedProfileIds] = useState<Set<string>>(new Set());
  const [addingProfileId, setAddingProfileId] = useState<string | null>(null);

  const metaTagsKey = useMemo(() => metaTags.join(","), [metaTags]);

  const loadApplications = useCallback(async () => {
    const res = await adminFetch(`/api/admin/jobs/admin/${jobId}/applications`);
    const data = await res.json();
    const profileIds = new Set<string>();
    for (const row of (data.data ?? []) as Array<{ profileId?: string | null }>) {
      if (row.profileId) profileIds.add(row.profileId);
    }
    setAppliedProfileIds(profileIds);
  }, [jobId]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (metaTags.length) params.set("metaTags", metaTags.join(","));
    const timer = window.setTimeout(() => {
      void adminFetch(`/api/admin/jobs/admin/${jobId}/matching-profiles?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => setRows((data.data as MatchRow[]) ?? []))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [jobId, metaTagsKey]);

  async function addProfile(profileId: string) {
    setAddingProfileId(profileId);
    try {
      const res = await adminFetch(`/api/admin/jobs/admin/${jobId}/applications/from-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to add profile");
      setAppliedProfileIds((prev) => new Set(prev).add(profileId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add profile");
    } finally {
      setAddingProfileId(null);
    }
  }

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
                <th className="py-2 pr-3">Score</th>
                <th className="py-2">Add</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const alreadyApplied = appliedProfileIds.has(row.profileId);
                return (
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
                    <td className="py-2 pr-3">{row.matchCount}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => void addProfile(row.profileId)}
                        disabled={alreadyApplied || addingProfileId === row.profileId}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        {alreadyApplied ? "Added" : addingProfileId === row.profileId ? "Adding…" : "Add"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
