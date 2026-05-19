"use client";

import { useMemo, useState } from "react";
import type { TeamMemberPublicRow } from "@/lib/api/public";
import { resolveOptionalMediaUrl } from "@/lib/media-url";
import { AboutAnimatedWorkforceStats } from "@/components/about/AboutAnimatedWorkforceStats";
import { AboutPersonImage } from "@/components/about/AboutPersonImage";
import { SectionPill } from "@/components/ui/SectionPill";

export type AboutWorkforceCms = {
  pill: string;
  title: string;
  intro: string;
  stats: { n: string; l: string }[];
  management: {
    title: string;
    memberCountLabel: string;
    people: { name: string; role: string; imageKey: string; imageUrl: string; bio?: string }[];
  };
  defaultMemberBio: string;
};

type Props = {
  cms: AboutWorkforceCms;
  /** Name → fallback bio (from Site content: leadership + workforce management). */
  bioFallbackByName: Record<string, string>;
  apiMembers: TeamMemberPublicRow[];
};

function memberBioText(
  name: string,
  apiDescription: string,
  bioFallbackByName: Record<string, string>,
  defaultMemberBio: string,
): string {
  const fromApi = apiDescription.trim();
  if (fromApi) return fromApi;
  const named = (bioFallbackByName[name] ?? "").trim();
  if (named) return named;
  return defaultMemberBio.trim();
}

/** When the API returns published team members: department pills (only non-empty depts), tab panel, bios from API with CMS fallbacks. */
export function AboutWorkforceApiSection({ cms, bioFallbackByName, apiMembers }: Props) {
  const byDept = useMemo(() => {
    const m = new Map<string, TeamMemberPublicRow[]>();
    for (const x of apiMembers) {
      const d = x.department?.trim() || "Team";
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(x);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
    return m;
  }, [apiMembers]);

  const depts = useMemo(() => [...byDept.keys()].sort((a, b) => a.localeCompare(b)), [byDept]);
  const [activeDept, setActiveDept] = useState(depts[0] ?? "");
  const activeMembers = activeDept ? (byDept.get(activeDept) ?? []) : [];

  const deptCount = depts.length;
  const memberTotal = apiMembers.length;

  const dynamicStats = useMemo(
    () => [
      { n: `${memberTotal}+`, l: "Expert Team Members" },
      { n: String(deptCount), l: "Specialized Departments" },
      cms.stats[2] ?? { n: "5", l: "Global Offices" },
      cms.stats[3] ?? { n: "10+", l: "Years Experience" },
    ],
    [memberTotal, deptCount, cms.stats],
  );

  if (depts.length === 0) {
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
            <AboutAnimatedWorkforceStats stats={dynamicStats} />
          </div>

          <div className="mt-16">
            <div className="flex flex-wrap items-center gap-2">
              {depts.map((dept) => {
                const count = byDept.get(dept)?.length ?? 0;
                const active = dept === activeDept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setActiveDept(dept)}
                    className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[35px] border px-[23px] text-[16px] font-semibold leading-6 transition-colors ${
                      active ? "border-[#111111] bg-[#111111] text-white" : "border-[#e5e5e5] bg-white text-[#666666] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12">
            <div className="border-b border-[#e5e5e5] pb-2">
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">{activeDept}</h3>
              <p className="mt-1 text-[14px] leading-5 tracking-[0.035px] text-[#666666]">{activeMembers.length} members</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {activeMembers.map((person) => {
                const bio = memberBioText(person.name, person.description, bioFallbackByName, cms.defaultMemberBio);
                const avatarSrc = resolveOptionalMediaUrl(person.imageUrl);
                return (
                  <div key={person.id} className="text-center">
                    <div className="mx-auto h-[145px] w-[145px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-200">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={person.name}
                          width={145}
                          height={145}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
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

/** No published API team: show CMS copy, stat bar, and management grid (no department pills). */
export function AboutWorkforceCmsFallbackSection({ cms }: { cms: AboutWorkforceCms }) {
  const { management } = cms;
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

          <div className="mt-12">
            <div className="border-b border-[#e5e5e5] pb-2">
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">{management.title}</h3>
              <p className="mt-1 text-[14px] leading-5 tracking-[0.035px] text-[#666666]">{management.memberCountLabel}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {management.people.map((person) => {
                const bio = (person.bio ?? "").trim() || cms.defaultMemberBio.trim();
                return (
                  <div key={person.name} className="text-center">
                    <div className="mx-auto h-[145px] w-[145px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-200">
                      <AboutPersonImage
                        imageUrl={person.imageUrl}
                        imageKey={person.imageKey}
                        alt={person.name}
                        width={145}
                        height={145}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-[16px] font-bold leading-6 text-[#111111]">{person.name}</p>
                    <p className="mx-auto mt-0.5 max-w-[190px] text-[14px] leading-5 tracking-[0.035px] text-[#666666]">{person.role}</p>
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
