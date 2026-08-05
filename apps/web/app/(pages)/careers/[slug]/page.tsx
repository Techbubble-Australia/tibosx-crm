import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublishedJobBySlug } from "@/lib/api/public";
import { JobDescription } from "@/components/careers/JobDescription";
import { JobDetailActions } from "@/components/careers/JobDetailActions";
import { JobLocationFlags } from "@/components/careers/JobLocationFlags";
import { normalizeJobLocations, formatLocationEntryDisplay } from "@/lib/job-locations";
import { formatJobCategoryTechnology } from "@/lib/job-taxonomy";

function formatType(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CareerJobDetailPage({ params }: { params: { slug: string } }) {
  const job = await getPublishedJobBySlug(params.slug);
  if (!job) {
    notFound();
  }

  const locations = normalizeJobLocations(job);
  const locationText = locations
    .map((e) => formatLocationEntryDisplay(e))
    .filter(Boolean)
    .join(" · ");
  const meta = [locationText, formatType(job.type), formatType(job.workMode)].filter(Boolean).join(" · ");
  const categoryTech = formatJobCategoryTechnology(job.category, job.technology);
  const eyebrow = [job.referenceNumber, categoryTech].filter(Boolean).join(" · ");

  return (
    <main className="min-h-[60vh] bg-white dark:bg-neutral-950">
      <section className="border-b border-[#e5e5e5] bg-[#fafafa] py-10 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="tb-container max-w-[800px]">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#666666] transition-colors hover:text-[#111111] dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to careers
          </Link>
          {eyebrow ? (
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-wider text-[#666666] dark:text-zinc-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-[-0.02em] text-[#111111] dark:text-zinc-50">
            {job.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[16px] text-[#666666] dark:text-zinc-400">
            <JobLocationFlags locations={locations} flagHeight={22} />
            <span>{meta}</span>
          </div>
        </div>
      </section>

      <section className="tb-container max-w-[800px] py-12">
        <JobDescription description={job.description} />

        <div className="mt-8">
          <JobDetailActions slug={job.slug} title={job.title} initialLikeCount={job.likeCount ?? 0} />
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={`/careers?position=${encodeURIComponent(job.title)}#apply`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#111111] px-6 text-[15px] font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Apply for this role
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-white px-6 text-[15px] font-semibold text-[#111111] dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-100"
          >
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
