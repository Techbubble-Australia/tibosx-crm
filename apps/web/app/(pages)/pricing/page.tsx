import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { RemarkableCtaSection } from "@/components/RemarkableCtaSection";

const models = [
  {
    name: "STARTER",
    title: "Staff Augmentation",
    description: "Skilled engineers deployed to your team, fast. T&M pricing with full flexibility.",
    price: "Custom",
    priceNote: "based on role",
    features: [
      "1-10 engineers placed",
      "Onboarded in <24 hours",
      "Timezone-aligned resources",
      "Flexible scale up/down",
      "Dedicated account manager",
      "48-hour replacement guarantee",
    ],
    cta: "Get a Quote",
    popular: false,
  },
  {
    name: "Professional",
    title: "Project Delivery",
    description: "Fixed-fee SaaS implementations with full end-to-end delivery assurance.",
    price: "Fixed Fee",
    priceNote: "",
    features: [
      "ServiceNow or Salesforce project",
      "Dedicated project team assembled",
      "Milestone-based delivery plan",
      "99% on-budget delivery record",
      "3-month post-launch support",
      "Beat-any-quote guarantee",
    ],
    cta: "Start a Project",
    popular: true,
  },
  {
    name: "ENTERPRISE",
    title: "Product Engineering",
    description: "Full-scale product development with a dedicated AI-powered engineering team.",
    price: "Tailored",
    priceNote: "your scope",
    features: [
      "5-50+ dedicated engineers",
      "Full-stack & mobile development",
      "AI/ML integration included",
      "DevSecOps pipeline setup",
      "24/7 support & governance",
      "Dedicated VP of Engineering",
    ],
    cta: "Talk to Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "How quickly can you onboard a resource?",
    answer: "Our AI-matching engine can identify and propose a vetted candidate within hours of your request. Full onboarding — contracts signed, tools set up, team introductions — typically completes within one business day. For very specialised roles, allow up to 48 hours."
  },
  {
    question: "Do you work with startups or only enterprises?",
    answer: "We work with organisations of all sizes — from funded startups to Fortune 500 enterprises. Our engagement models are flexible enough to accommodate different budgets and requirements."
  },
  {
    question: "What happens if a placed resource doesn't work out?",
    answer: "We offer a 48-hour replacement guarantee. If a resource isn't the right fit, we'll find a replacement at no additional cost. Your satisfaction is our priority."
  },
  {
    question: "How does your pricing work?",
    answer: "We offer three engagement models: Staff Augmentation (time & materials), Project Delivery (fixed fee), and Product Engineering (custom scope). Each is designed to provide maximum value and zero surprises."
  },
  {
    question: "Do your resources work in my timezone?",
    answer: "Yes, we provide timezone-aligned resources. With offices across APAC, North America, and Europe, we can provide coverage for most timezone requirements."
  },
  {
    question: "What industries do you serve?",
    answer: "We serve a wide range of industries including healthcare, finance, government, retail, manufacturing, and technology. Our consultants bring relevant industry experience to every engagement."
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero — matched to selected services dark header node 205:3850 */}
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">
              Flexible Pricing for Every Enterprise
            </h1>
            <p className="mt-[4px] text-[18px] font-normal leading-[28px] text-[#e5e5e5]">
              No rate cards on the shelf — every engagement is tailored to your exact requirements. Tell us what you need and we&apos;ll price it competitively within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Value highlights strip — selected node 205:3855 */}
      <section className="relative z-10 -mt-[84px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {[
              { text: "Rapid No lock-in contracts", width: "w-[162px]" },
              { text: "Response within 24 hours", width: "w-[152px]" },
              { text: "48-hour Replacement guarantee", width: "w-[227px]" },
              { text: "Transparent weekly reporting", width: "w-[193px]" },
              { text: "Timezone-aligned delivery", width: "w-[161px]" },
            ].map((item, idx) => (
              <div key={item.text} className="flex h-[72px] items-center">
                <div className={`${item.width} text-center`}>
                  <p className="text-[18px] font-bold leading-7 text-[#111111]">{item.text}</p>
                </div>
                {idx < 4 ? <span className="mx-[22.625px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="tb-container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
              Our Engagement Models
            </span>
            <h2 className="text-3xl font-bold mb-4">Choose the Model That Fits Your Needs</h2>
            <p className="text-gray-500">Three proven engagement models — each designed to give you maximum value and zero surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {models.map((model, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  model.popular
                    ? "bg-[#0a0a0a] text-white ring-2 ring-black"
                    : "bg-white border border-gray-100"
                }`}
              >
                {model.popular && (
                  <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-4">
                    Most Popular
                  </div>
                )}
                <div className={`text-xs font-medium mb-2 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                  {model.name}
                </div>
                <h3 className="text-2xl font-bold mb-2">{model.title}</h3>
                <p className={`text-sm mb-6 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                  {model.description}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{model.price}</span>
                  {model.priceNote && (
                    <span className={`text-sm ml-2 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                      / {model.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {model.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${model.popular ? "text-gray-400" : "text-gray-500"}`} />
                      <span dangerouslySetInnerHTML={{ __html: feature }} />
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-full font-medium transition-colors ${
                    model.popular
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {model.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + demo form — selected node 205:3546 */}
      <section className="relative overflow-hidden py-[162px] text-white" style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}>
        <div className="pointer-events-none absolute -left-[120px] bottom-[-120px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(76,76,76,0.12)_0%,rgba(56,56,56,0)_65%)]" />
        <div className="pointer-events-none absolute -right-[120px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(127,127,127,0.1)_0%,rgba(142,142,142,0)_65%)]" />

        <div className="tb-container relative">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[604px_489px] gap-[43px]">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Rate Card</p>
              </div>

              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-white">Request a Detailed Rate Card</h2>
              <p className="mt-1 text-[18px] font-normal leading-7 text-[#e5e5e5]">
                Help us understand your requirements, so that we can offer you our best price. Our team will get back to you within 24 hours with a customized quote.
              </p>

              <div className="mt-4 space-y-[10px]">
                {[
                  "150+ skilled professionals across technologies",
                  "Personalized consultation with our experts",
                  "AI-powered resource matching for best fit",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-[10px]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white/12">
                      <span className="h-[10px] w-[10px] rounded-[2px] bg-white" />
                    </span>
                    <span className="text-[14px] font-normal leading-[23.1px] text-[#e5e5e5]" style={{ fontFamily: "Figtree, Geist, sans-serif" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-[54px] flex items-center gap-[26px]">
                {[
                  "Response within 24 hours",
                  "Free consultation call",
                  "Zero obligation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[9px] border border-[#e5e5e5] bg-[#fafafa]">
                      <span className="h-[10px] w-[10px] rounded-[2px] bg-[#111111]" />
                    </span>
                    <span className="text-[12px] font-medium leading-4 text-[#e5e5e5]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white/[0.06] px-[37px] py-8">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">Get Your Custom Quote</h3>
              <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#e5e5e5]">
                Fill out the form and we&apos;ll be in touch within 24 hours.
              </p>

              <form className="mt-8 space-y-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Work Email"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <div className="relative">
                  <select className="h-[46px] w-full appearance-none rounded-[14px] border border-white/15 bg-white/[0.08] px-4 pr-10 text-[14px] text-white/65 focus:outline-none">
                    <option value="">Select service type</option>
                    <option>Staff Augmentation</option>
                    <option>Project Delivery</option>
                    <option>Product Engineering</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" aria-hidden />
                </div>

                <button
                  type="submit"
                  className="mt-[18px] inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  Request Rate Card
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — selected node 205:3618 */}
      <section className="bg-white py-[112px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[360px_704px] gap-[72px]">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">FAQ</p>
              </div>

              <h2 className="mt-[6px] whitespace-pre-line text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                {"Questions we\nhear all the\ntime"}
              </h2>

              <p className="mt-4 text-[18px] font-normal leading-7 text-[#666666]">
                Can&apos;t find what you&apos;re looking for? Our team is happy to answer any questions directly.
              </p>

              <Link
                href="/contact"
                className="mt-8 inline-flex h-[43px] w-[125px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white"
              >
                Talk to us
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="rounded-[16px] border border-[#f7f7f7] bg-[#fafafa]">
                <div className="flex h-16 items-center justify-between px-[22px]">
                  <h3 className="text-[16px] font-bold leading-6 text-[#111111]">{faqs[0]?.question}</h3>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#111111] bg-[#111111] text-white">
                    <Minus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="px-[22px] pb-5">
                  <p className="text-[16px] font-normal leading-6 text-[#666666]">{faqs[0]?.answer}</p>
                </div>
              </div>

              {faqs.slice(1).map((faq, index) => (
                <div key={faq.question} className="rounded-[16px] border border-[#f7f7f7] bg-[#fafafa]">
                  <div className="flex h-16 items-center justify-between px-[22px]">
                    <h3 className="text-[16px] font-bold leading-6 text-[#666666]">{faq.question}</h3>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#fafafa] text-[#666666]">
                      <Plus className="h-[14px] w-[14px]" strokeWidth={2.25} aria-hidden />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RemarkableCtaSection
        title="Ready to Transform Your Business?"
        description="Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives."
        primaryLabel="Request a Free Consultation"
        primaryHref="/contact"
        secondaryLabel="View Pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
