import { ChevronLeft, ChevronRight } from "lucide-react";

export function ClientStoriesSection() {
  return (
    <section className="bg-white py-[120px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1139px]">
          <div className="mb-12">
            <div className="mb-6 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#111111]">Client Stories</p>
            </div>
            <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
              Trusted by people <br />who know technology best
            </h2>
          </div>

          <p className="text-[28px] font-medium leading-9 tracking-[-0.0025em] text-[#666666]">
            &ldquo;TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism, creativity, and technical expertise. What impressed us most was their ability to adapt to unforeseen challenges without compromising timelines or quality.&rdquo;
          </p>

          <div className="my-10 h-px w-full bg-[#e5e5e5]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full bg-[#e5e5e5]" />
              <div>
                <p className="text-[18px] font-bold leading-6 tracking-[-0.0025em] text-[#06091a]">Haima Prakash</p>
                <p className="mt-1 text-[16px] leading-6 text-[#838383]">Sr. Manager, Chief Technology Office · University of Sydney</p>
                <p className="mt-1 text-[14px] tracking-[2px] text-[#f59e0b]">★★★★★</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                aria-label="Previous testimonial"
                className="flex h-10 w-14 items-center justify-center rounded-[100px] border border-[#585858] bg-transparent transition-colors hover:bg-[#f5f5f5]"
              >
                <ChevronLeft className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
              </button>
              <button
                aria-label="Next testimonial"
                className="flex h-10 w-14 items-center justify-center rounded-[100px] border border-[#585858] bg-transparent transition-colors hover:bg-[#f5f5f5]"
              >
                <ChevronRight className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
