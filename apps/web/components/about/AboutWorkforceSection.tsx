"use client";

import { useEffect, useMemo, useState } from "react";
import type { TeamMemberPublicRow } from "@/lib/api/public";
import { AboutAnimatedWorkforceStats } from "@/components/about/AboutAnimatedWorkforceStats";
import { SectionPill } from "@/components/ui/SectionPill";
import { UploadableImage } from "@/components/media/UploadableImage";
import { orderedWorkforceDeptPills, isWorkforceExcludedDepartment, type WorkforceTabCms } from "@/lib/about/workforce-tabs";

export type AboutWorkforceCms = {
  pill: string;
  title: string;
  intro: string;
  stats: { n: string; l: string }[];
  /** Department pills: `active` controls visibility; `department` must match Team API `department` (counts are live on site). */
  tabs: WorkforceTabCms[];
  defaultMemberBio: string;
};

type Props = {
  cms: AboutWorkforceCms;
  apiMembers: TeamMemberPublicRow[];
};

function memberBioText(apiDescription: string, defaultMemberBio: string): string {
  const fromApi = apiDescription.trim();
  if (fromApi) return fromApi;
  return defaultMemberBio.trim();
}

function lookupMembersByDeptCi(
  byDept: Map<string, TeamMemberPublicRow[]>,
  dept: string,
): TeamMemberPublicRow[] {
  if (byDept.has(dept)) return byDept.get(dept) ?? [];
  const lc = dept.trim().toLowerCase();
  for (const [k, v] of byDept) {
    if (k.trim().toLowerCase() === lc) return v;
  }
  return [];
}

/** Pills are only published API departments; labels follow CMS when the tab maps to that department. */
export function AboutWorkforceApiSection({ cms, apiMembers }: Props) {
  const byDept = useMemo(() => {
    const m = new Map<string, TeamMemberPublicRow[]>();
    for (const x of apiMembers) {
      const d = x.department?.trim() || "Team";
      if (isWorkforceExcludedDepartment(d)) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(x);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
    return m;
  }, [apiMembers]);

  const depts = useMemo(() => [...byDept.keys()].sort((a, b) => a.localeCompare(b)), [byDept]);
  const orderedPills = useMemo(() => orderedWorkforceDeptPills(cms.tabs, depts), [cms.tabs, depts]);
  const [activeMemberDeptKey, setActiveMemberDeptKey] = useState("");
  const activePill = useMemo(
    () => orderedPills.find((p) => p.memberDeptKey === activeMemberDeptKey) ?? orderedPills[0],
    [orderedPills, activeMemberDeptKey],
  );
  const activeMembers = lookupMembersByDeptCi(byDept, activePill?.memberDeptKey ?? "");

  useEffect(() => {
    if (orderedPills.length === 0) return;
    if (!orderedPills.some((p) => p.memberDeptKey === activeMemberDeptKey)) {
      setActiveMemberDeptKey(orderedPills[0]!.memberDeptKey);
    }
  }, [orderedPills, activeMemberDeptKey]);

  if (orderedPills.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-[60px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1136px]">
          <div className="text-center">
            <SectionPill label={cms.pill} className="mx-auto" />
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{cms.title}</h2>
            <p className="mx-auto mt-1 max-w-[923px] text-[18px] leading-7 text-[#666666]">{cms.intro}</p>
          </div>

          <div className="mt-8">
            <AboutAnimatedWorkforceStats stats={cms.stats} />
          </div>

          <div className="mt-16">
            <div className="flex flex-wrap items-center gap-2">
              {orderedPills.map((pill, idx) => {
                const count = lookupMembersByDeptCi(byDept, pill.memberDeptKey).length;
                const active = pill.memberDeptKey === activePill?.memberDeptKey;
                return (
                  <button
                    key={`${pill.memberDeptKey}-${idx}`}
                    type="button"
                    onClick={() => setActiveMemberDeptKey(pill.memberDeptKey)}
                    className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[35px] border px-[23px] text-[16px] font-semibold leading-6 transition-colors dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 ${
                      active
                        ? "border-[#111111] bg-[#111111] text-white dark:border-white dark:bg-white dark:text-[#111111]"
                        : "border-[#e5e5e5] bg-white text-[#666666] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {pill.pillLabel} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12">
            <div className="border-b border-[#e5e5e5] pb-2">
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">{activePill?.pillLabel ?? ""}</h3>
              <p className="mt-1 text-[14px] leading-5 tracking-[0.035px] text-[#666666]">
                {activeMembers.length} member{activeMembers.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {activeMembers.map((person) => {
                const bio = memberBioText(person.description, cms.defaultMemberBio);
                const avatarSrc = (person.imageUrl ?? "").trim();
                return (
                  <div key={person.id} className="text-center">
                    <div className="relative mx-auto h-[145px] w-[145px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-200 dark:border-zinc-700 dark:bg-zinc-800">
                      {avatarSrc ? (
                        <UploadableImage
                          src={avatarSrc}
                          alt={person.name}
                          fill
                          className="object-cover"
                          sizes="145px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[32px] font-semibold text-[#666666]">
                          {person.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[16px] font-bold leading-6 text-[#111111]">{person.name}</p>
                    <p className="mx-auto mt-0.5 max-w-[190px] text-[14px] leading-5 tracking-[0.035px] text-[#666666]">{person.role}</p>
                    {person.location?.trim() ? (
                      <p className="mx-auto mt-0.5 max-w-[190px] text-[13px] leading-5 tracking-[0.035px] text-[#838383] dark:text-zinc-400">
                        {person.location.trim()}
                      </p>
                    ) : null}
                    {bio ? (
                      <p className="mx-auto mt-2 max-w-[220px] text-left text-[12px] font-medium leading-[17px] text-[#666666]">{bio}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** No published team members: show CMS copy and stat bar only. */
export function AboutWorkforceCmsFallbackSection({ cms }: { cms: AboutWorkforceCms }) {
  return (
    <section className="bg-white py-[60px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1136px]">
          <div className="text-center">
            <SectionPill label={cms.pill} className="mx-auto" />
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{cms.title}</h2>
            <p className="mx-auto mt-1 max-w-[923px] text-[18px] leading-7 text-[#666666]">{cms.intro}</p>
          </div>

          <AboutAnimatedWorkforceStats stats={cms.stats} />
        </div>
      </div>
    </section>
  );
}
