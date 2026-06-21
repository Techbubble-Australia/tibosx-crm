import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublishedJobBySlug } from "@/lib/api/public";
import { JobDescription } from "@/components/careers/JobDescription";
import { displayCategory } from "@/lib/display-category";

export default async function CareerJobDetailPage({ params }: { params: { slug: string } }) {
  const job = await getPublishedJobBySlug(params.slug);
  if (!job) {
    notFound();
  }

  const meta = `${job.flag} ${job.location} · ${job.type} · ${job.workMode}`;
  const eyebrow = [job.referenceNumber, displayCategory(job.category), job.department || undefined]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="min-h-[60vh] bg-white">
      <section className="border-b border-[#e5e5e5] bg-[#fafafa] py-10">
        <div className="tb-container max-w-[800px]">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#666666] transition-colors hover:text-[#111111]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to careers
          </Link>
          {eyebrow ? (
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-wider text-[#666666]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-[-0.02em] text-[#111111]">{job.title}</h1>
          <p className="mt-3 text-[16px] text-[#666666]">{meta}</p>
        </div>
      </section>

      <section className="tb-container max-w-[800px] py-12">
        <JobDescription description={job.description} />

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={`/careers#apply`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#111111] px-6 text-[15px] font-semibold text-white"
          >
            Apply for this role
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-white px-6 text-[15px] font-semibold text-[#111111]"
          >
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
