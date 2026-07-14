"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { UploadableImage } from "@/components/media/UploadableImage";
import { buildHomeCaseStudySlots, type CaseStudyListCard } from "@/lib/case-study-mapper";
import { displayCategoryPill } from "@/lib/display-category";

type EmptyState = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

type CaseStudiesPracticeSectionProps = {
  caseStudies: CaseStudyListCard[];
  categories: string[];
  emptyState: EmptyState;
};

function filterCaseStudies(cards: CaseStudyListCard[], category: string): CaseStudyListCard[] {
  if (category === "All") {
    return cards.filter((c) => c.showInAllTab);
  }
  return cards.filter((c) => c.category === category);
}

export function CaseStudiesPracticeSection({
  caseStudies,
  categories,
  emptyState,
}: CaseStudiesPracticeSectionProps) {
  const tabs = categories.length > 0 ? categories : ["All"];
  const [activeCategory, setActiveCategory] = useState(tabs[0] ?? "All");

  const filtered = useMemo(
    () => filterCaseStudies(caseStudies, activeCategory),
    [caseStudies, activeCategory],
  );

  const { featured: featuredStudy, secondary: topRightStudy, grid: lowerStudies } = useMemo(
    () => buildHomeCaseStudySlots(filtered),
    [filtered],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter case studies by category">
        {tabs.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex h-10 items-center rounded-[35px] border px-[23px] text-[16px] font-semibold leading-6 transition-colors ${
                active
                  ? "border-[#111111] bg-[#111111] text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-[#e5e5e5] bg-white text-[#666666] hover:bg-[#f7f7f7] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {caseStudies.length === 0 ? (
        <div className="mt-12 rounded-[24px] border border-dashed border-[#e5e5e5] bg-[#fafafa] px-8 py-16 text-center dark:border-zinc-600 dark:bg-zinc-900">
          <p className="text-[18px] font-semibold text-[#111111] dark:text-zinc-50">{emptyState.title}</p>
          <p className="mt-2 text-[16px] leading-6 text-[#666666] dark:text-zinc-400">{emptyState.body}</p>
          <Link
            href={emptyState.ctaHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[14px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {emptyState.ctaLabel}
          </Link>
        </div>
      ) : filtered.length === 0 || !featuredStudy ? (
        <div className="mt-12 rounded-[24px] border border-[#e5e5e5] bg-white px-8 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-[17px] font-semibold text-[#111111] dark:text-zinc-50">No case studies in this category</p>
          <p className="mt-2 text-[15px] leading-6 text-[#666666] dark:text-zinc-400">
            Try another filter or view all case studies.
          </p>
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-6 text-[14px] font-semibold text-[#111111] hover:bg-[#fafafa] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <div
            className={`grid gap-4 ${topRightStudy ? "grid-cols-1 lg:grid-cols-[746px_1fr]" : "grid-cols-1 max-w-[746px]"}`}
          >
            <Link
              href={`/case-studies/${featuredStudy.slug}`}
              className="group flex min-h-[400px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white dark:border-zinc-700 dark:bg-zinc-900 lg:h-[547px]"
            >
              <div className="flex h-full flex-1 flex-col px-[33px] pb-6 pt-[26px]">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-7 items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666] dark:bg-zinc-800 dark:text-zinc-300">
                    {displayCategoryPill(featuredStudy.category)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111] dark:bg-zinc-100" aria-hidden />
                    <span className="text-[12px] font-medium leading-4 text-[#666666] dark:text-zinc-400">
                      {featuredStudy.date}
                    </span>
                  </div>
                </div>

                <div className="relative mt-[14px] h-[150px] overflow-hidden rounded-[8px]">
                  <UploadableImage
                    src={featuredStudy.image}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1200px) 100vw, 451px"
                  />
                </div>

                <h3 className="mt-[18px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a] dark:text-zinc-50">
                  {featuredStudy.title}
                </h3>
                <p className="mt-[6px] line-clamp-5 text-[16px] leading-6 text-[#666666] dark:text-zinc-400">
                  {featuredStudy.description}
                </p>

                <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px] dark:border-zinc-700">
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {featuredStudy.stat1.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {featuredStudy.stat1.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {featuredStudy.stat2.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {featuredStudy.stat2.label}
                    </p>
                  </div>
                  <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Read
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </div>

              <div className="hidden w-[228px] shrink-0 bg-[#111111] px-[25px] pt-[49px] text-white dark:bg-zinc-950 lg:block">
                <p className="text-[12px] font-bold leading-4">ON THIS CASE STUDY</p>
                <div className="mt-[15px]">
                  {featuredStudy.sidebar?.map((item, idx) => (
                    <div
                      key={item.label}
                      className={`flex h-[42px] items-center border-[#e5e5e5] ${idx < 5 ? "border-b" : ""}`}
                    >
                      <span
                        className={`mr-[10px] h-[14px] w-[3px] rounded-[2px] ${
                          idx === featuredStudy.sidebar.length - 1 ? "bg-[#086eff]" : "bg-white"
                        }`}
                      />
                      <span className="text-[12px] font-medium leading-4 text-white">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {topRightStudy ? (
              <Link
                href={`/case-studies/${topRightStudy.slug}`}
                className="group flex flex-col rounded-[24px] border border-[#e5e5e5] bg-white px-[30px] pb-[30px] pt-9 dark:border-zinc-700 dark:bg-zinc-900 lg:h-[547px]"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666] dark:bg-zinc-800 dark:text-zinc-300">
                    {displayCategoryPill(topRightStudy.category)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111] dark:bg-zinc-100" aria-hidden />
                    <span className="text-[12px] font-medium leading-4 text-[#666666] dark:text-zinc-400">
                      {topRightStudy.date}
                    </span>
                  </div>
                </div>

                <h3 className="mt-[13px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a] dark:text-zinc-50">
                  {topRightStudy.title}
                </h3>
                <p className="mt-4 line-clamp-6 text-[16px] leading-6 text-[#666666] dark:text-zinc-400">
                  {topRightStudy.description}
                </p>

                <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px] dark:border-zinc-700">
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {topRightStudy.stat1.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {topRightStudy.stat1.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {topRightStudy.stat2.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {topRightStudy.stat2.label}
                    </p>
                  </div>
                  <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Read
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </Link>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lowerStudies.map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="group flex h-[494px] flex-col rounded-[24px] border border-[#e2e7f4] bg-white px-9 pb-6 pt-9 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666] dark:bg-zinc-800 dark:text-zinc-300">
                    {displayCategoryPill(study.category)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111] dark:bg-zinc-100" aria-hidden />
                    <span className="text-[12px] font-medium leading-4 text-[#666666] dark:text-zinc-400">
                      {study.date}
                    </span>
                  </div>
                </div>

                <h3 className="mt-[12px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a] dark:text-zinc-50">
                  {study.title}
                </h3>
                <p className="mt-[12px] line-clamp-6 text-[16px] leading-6 text-[#666666] dark:text-zinc-400">
                  {study.description}
                </p>

                <span className="mt-[21px] block h-px w-full bg-[#e5e5e5] dark:bg-zinc-700" aria-hidden />

                <div className="mt-auto flex items-end justify-between pt-[21px]">
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {study.stat1.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {study.stat1.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111] dark:text-zinc-50">
                      {study.stat2.value}
                    </p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666] dark:text-zinc-400">
                      {study.stat2.label}
                    </p>
                  </div>
                  <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Read
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
