import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublishedJobBySlug } from "@/lib/api/public";

export default async function CareerJobDetailPage({ params }: { params: { slug: string } }) {
  const job = await getPublishedJobBySlug(params.slug);
  if (!job) {
    notFound();
  }

  const meta = `${job.flag} ${job.location} · ${job.type} · ${job.workMode}`;

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
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-wider text-[#666666]">{job.department}</p>
          <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-[-0.02em] text-[#111111]">{job.title}</h1>
          <p className="mt-3 text-[16px] text-[#666666]">{meta}</p>
        </div>
      </section>

      <section className="tb-container max-w-[800px] py-12">
        {job.description?.trim() ? (
          <div className="prose prose-gray max-w-none text-[16px] leading-7 text-[#333]">
            {job.description.split("\n\n").map((para, i) => (
              <p key={i} className="mb-4">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[16px] leading-7 text-[#666666]">
            Full description coming soon. Apply below and mention this role in your message.
          </p>
        )}

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
