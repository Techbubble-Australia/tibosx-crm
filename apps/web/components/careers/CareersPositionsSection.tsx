"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { JobApiRow } from "@/lib/api/public";

function formatType(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CareersPositionsSection({ jobs }: { jobs: JobApiRow[] }) {
  const locations = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.location?.trim()) set.add(j.location.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

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
      if (locationFilter && j.location !== locationFilter) return false;
      const dept = (j.department || "General").trim() || "General";
      if (departmentFilter && dept !== departmentFilter) return false;
      return true;
    });
  }, [jobs, locationFilter, departmentFilter]);

  return (
    <>
      <div className="mb-8">
        <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
          <p className="text-[12px] font-medium leading-4 text-[#111111]">Open Positions</p>
        </div>
        <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">Current Opportunities</h2>
            <p className="mt-1 text-[18px] leading-7 text-[#666666]">Find your perfect role and start your journey with us.</p>
          </div>
          {jobs.length > 0 ? (
            <div className="flex shrink-0 flex-wrap items-center gap-4 pb-1">
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-[51px] min-w-[160px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666]"
                  aria-label="Filter by location"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666]"
                  aria-hidden
                />
              </div>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-[51px] min-w-[180px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666]"
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
                  className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666]"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#cfcfcf] bg-white px-8 py-14 text-center">
          <p className="text-[16px] font-semibold text-[#111111]">No open roles published yet</p>
          <p className="mt-2 text-[14px] leading-6 text-[#666666]">
            Jobs load from the API (<code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[13px]">GET /api/jobs</code>). Add and publish roles in the admin app, and ensure this site&apos;s{" "}
            <code className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[13px]">API_URL</code> points at your API.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {filtered.map((position) => (
              <Link
                key={position.slug}
                href={`/careers/${encodeURIComponent(position.slug)}`}
                className="flex min-h-[78px] items-center justify-between gap-4 rounded-[24px] border border-[#e5e5e5] bg-white px-6 py-3 transition-colors hover:bg-[#fafafa]"
              >
                <div>
                  <p className="text-[16px] font-bold leading-6 text-[#111111]">{position.title}</p>
                  <p className="text-[14px] leading-5 tracking-[0.035px] text-[#7a7f8e]">
                    {position.flag} {position.location} · {formatType(position.type)} · {formatType(position.workMode)}
                  </p>
                </div>
                <ArrowRight className="h-[18px] w-[18px] shrink-0 stroke-[1.5] text-[#111111]" aria-hidden />
              </Link>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-[15px] text-[#666666]">No roles match these filters. Try &quot;All Locations&quot; and &quot;All Departments&quot;.</p>
          ) : null}
        </>
      )}

      <p className="mt-14 text-center text-[16px] font-bold leading-6 text-[#666666]">
        Don&apos;t see a role that fits? We&apos;re always open to exceptional talent.
      </p>
    </>
  );
}
