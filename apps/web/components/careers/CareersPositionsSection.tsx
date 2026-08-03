"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { JobApiRow } from "@/lib/api/public";
import {
  collectJobLocationFilterOptions,
  formatLocationEntryDisplay,
  jobMatchesLocationFilter,
  normalizeJobLocations,
} from "@/lib/job-locations";
import { JobLocationFlags } from "@/components/careers/JobLocationFlags";
import { SectionPill } from "@/components/ui/SectionPill";

function formatType(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CareersPositionsSection({ jobs }: { jobs: JobApiRow[] }) {
  const locationOptions = useMemo(() => collectJobLocationFilterOptions(jobs), [jobs]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      const d = (j.department || "General").trim() || "General";
      set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const [locationFilter, setLocationFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (!jobMatchesLocationFilter(j, locationFilter)) return false;
      const dept = (j.department || "General").trim() || "General";
      if (departmentFilter && dept !== departmentFilter) return false;
      return true;
    });
  }, [jobs, locationFilter, departmentFilter]);

  return (
    <>
      <div className="mb-8">
        <SectionPill label="Open Positions" />
        <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] dark:text-zinc-50 md:text-5xl lg:text-[56px] lg:leading-[64px]">
              Current Opportunities
            </h2>
            <p className="mt-1 text-[18px] leading-7 text-[#666666] dark:text-zinc-400">
              Find your perfect role and start your journey with us.
            </p>
          </div>
          {jobs.length > 0 ? (
            <div className="flex shrink-0 flex-wrap items-center gap-4 pb-1">
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-[51px] min-w-[160px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  aria-label="Filter by location"
                >
                  <option value="">All Locations</option>
                  {locationOptions.map((loc) => (
                    <option key={loc.key} value={loc.key}>
                      {loc.flag ? `${loc.flag} ` : ""}
                      {loc.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666] dark:text-zinc-400"
                  aria-hidden
                />
              </div>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-[51px] min-w-[180px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  aria-label="Filter by department"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666] dark:text-zinc-400"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#cfcfcf] bg-white px-8 py-14 text-center dark:border-zinc-600 dark:bg-zinc-900">
          <p className="text-[16px] font-semibold text-[#111111] dark:text-zinc-100">No open roles published yet</p>
          <p className="mt-2 text-[14px] leading-6 text-[#666666] dark:text-zinc-400">
            Jobs load from the API (<code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[13px] dark:bg-zinc-800">GET /api/jobs</code>). Add and publish roles in the admin app, and ensure this site&apos;s{" "}
            <code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[13px] dark:bg-zinc-800">API_URL</code> points at your API.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((position) => {
              const entries = normalizeJobLocations(position);
              const locationText = entries
                .map((e) => formatLocationEntryDisplay(e))
                .filter(Boolean)
                .join(" · ");
              const categoryTech = [position.category?.trim(), position.technology?.trim()]
                .filter(Boolean)
                .join(" - ");
              const listingType = (position.listingType || "Internal").trim();
              return (
                <Link
                  key={position.slug}
                  href={`/careers/${encodeURIComponent(position.slug)}`}
                  className="group flex h-full flex-col rounded-[24px] border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-[#cfcfcf] hover:bg-[#fafafa] dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {position.referenceNumber ? (
                        <p className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#999] dark:text-zinc-500">
                          {position.referenceNumber}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[18px] font-bold leading-7 text-[#111111] dark:text-zinc-50">{position.title}</p>
                    </div>
                    <ArrowRight
                      className="mt-1 h-[18px] w-[18px] shrink-0 stroke-[1.5] text-[#111111] transition-transform group-hover:translate-x-0.5 dark:text-zinc-200"
                      aria-hidden
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {entries.length > 0 || locationText ? (
                      <p className="flex flex-wrap items-center gap-1 text-[14px] leading-5 text-[#7a7f8e] dark:text-zinc-400">
                        <JobLocationFlags locations={entries} flagHeight={18} />
                        {locationText ? <span>{locationText}</span> : null}
                      </p>
                    ) : null}
                    <p className="text-[13px] font-medium leading-5 text-[#666666] dark:text-zinc-400">
                      {formatType(position.type)} · {formatType(position.workMode)}
                    </p>
                    {categoryTech ? (
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#111111] dark:text-zinc-200">
                        {categoryTech}
                      </p>
                    ) : null}
                    {listingType ? (
                      <p className="text-[12px] font-medium uppercase tracking-wide text-[#999] dark:text-zinc-500">
                        {listingType}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-[15px] text-[#666666] dark:text-zinc-400">
              No roles match these filters. Try &quot;All Locations&quot; and &quot;All Departments&quot;.
            </p>
          ) : null}
        </>
      )}

      <p className="mt-14 text-center text-[16px] font-bold leading-6 text-[#666666] dark:text-zinc-400">
        Don&apos;t see a role that fits? We&apos;re always open to exceptional talent.
      </p>
    </>
  );
}
