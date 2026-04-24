import Link from "next/link";
import {
  ArrowRight,
  Check,
  Phone,
  Search,
  User,
  Heart,
  Layers,
  Settings,
  Lightbulb,
  Cpu,
  Rocket,
} from "lucide-react";

const techPills = ["ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Power BI", "Snowflake", "Oracle", "Microsoft", "Azure", "AWS", "Java", "Informatica"];

const serviceHighlights = [
  {
    title: "Rapid Deployment",
    description: "Get started in under 24 hours with our streamlined onboarding process.",
    bodyWidth: "w-[213px]",
  },
  {
    title: "Timezone Aligned",
    description: "Our teams work in your timezone for seamless real-time collaboration.",
    bodyWidth: "w-[213px]",
  },
  {
    title: "Quality Assured",
    description: "Rigorous quality standards and governance at no additional cost.",
    bodyWidth: "w-[204px]",
  },
  {
    title: "Global Reach",
    description: "Offices in USA, Australia, India, and Philippines for local support.",
    bodyWidth: "w-[196px]",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">Your Trusted Partner at Every Step of the Journey</h1>
            <p className="mt-1 max-w-[1031px] text-[18px] leading-7 text-[#e5e5e5]">
              From AI-powered staff augmentation to fixed-fee project delivery and custom product engineering — we have the expertise and talent to accelerate your enterprise.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {serviceHighlights.map((item, idx) => (
              <div key={item.title} className="flex h-[108px] items-center">
                <div className={`${item.bodyWidth} px-2`}>
                  <h3 className="text-[18px] font-bold leading-7 text-[#111111]">{item.title}</h3>
                  <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#666666]">{item.description}</p>
                </div>
                {idx < serviceHighlights.length - 1 ? <span className="mx-[30px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-[120px] pt-[140px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1139px] grid-cols-[567px_532px] gap-10">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Project Delivery</p>
              </div>

              <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Project Services</h2>
              <p className="mt-0 text-[16px] font-semibold leading-6 text-[#111111]">Fixed-fee, Outcome-based Solutions</p>
              <p className="mt-2 text-[16px] leading-6 text-[#666666]">
                Our fixed-fee, outcome-based solutions are designed to cater to your unique business needs. We offer bespoke services across ServiceNow, Salesforce, and more. With expertise in AI-driven, cloud-based mobility solutions, our team ensures you achieve your goals with innovative, scalable strategies.
              </p>

              <div className="mt-8 space-y-1">
                {[
                  "ServiceNow: ITSM, ITOM, GRC, HRSD, CSM, Legal, Procurement",
                  "Fixed-fee pricing with clear deliverables",
                  "Salesforce: Service, Sales, Marketing, Commerce, Health Cloud",
                  "AI-driven automation and optimization",
                ].map((item) => (
                  <div key={item} className="flex h-[42px] items-center rounded-[11px] border border-[#e5e5e5] bg-white px-[11px]">
                    <span className="h-2 w-2 rounded-[4px] border border-[#666666] bg-white" aria-hidden />
                    <span className="ml-4 text-[16px] font-semibold leading-6 text-[#06091a]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-[16px] font-semibold leading-6 text-black">Technologies</p>
                <div className="mt-[15px] flex items-center gap-2">
                  {["ServiceNow", "Salesforce", "AI/ML", "Cloud", "Portal", "Custom Apps"].map((tech) => (
                    <span key={tech} className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-[12px] font-bold leading-4 text-[#666666]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 h-[78px] w-[460px] pt-[13px]">
                <div className="flex items-center gap-6">
                  <Link href="/contact" className="inline-flex h-[52px] w-[172px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white">
                    Request a Quote
                    <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </Link>
                  <div className="inline-flex items-center gap-1 text-[14px] leading-5 tracking-[0.035px] text-[#666666]">
                    <span>Response within 4 hours, guaranteed</span>
                    <Check className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-[146px] overflow-hidden rounded-[36px] border border-[#e2e7f4] bg-white shadow-[0_12px_28px_-20px_rgba(0,0,0,0.35)]">
              <div className="bg-[#111111] px-[30px] py-[31px]">
                <h3 className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-white">Our Mission</h3>
              </div>
              <p className="px-[27px] pb-[37px] pt-6 text-[18px] leading-7 text-[#666666]">
                To empower businesses worldwide with innovative technology solutions that drive growth, efficiency, and success in an ever-evolving digital landscape.
              </p>
              <div className="flex gap-[18px] px-[27px] pb-[39px]">
                <div className="flex h-[85px] w-[228px] flex-col justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-[27px]">
                  <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">10+</p>
                  <p className="text-[12px] font-medium leading-4 text-[#666666]">Years Experience</p>
                </div>
                <div className="flex h-[85px] w-[228px] flex-col justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-[27px]">
                  <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">5</p>
                  <p className="text-[12px] font-medium leading-4 text-[#666666]">Global Offices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f5f5f5]">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <h2 className="text-3xl font-bold">Product Development</h2>
            <p className="text-gray-600 max-w-xl text-sm">
              End-to-end product engineering — discovery, build, launch, and iterate — with a team sized to your roadmap.
            </p>
          </div>
          <div className="space-y-3 mb-10">
            {(
              [
                { Icon: Settings, line: "Greenfield builds with modern stacks" },
                { Icon: Lightbulb, line: "AI-assisted delivery without cutting corners on quality" },
                { Icon: Cpu, line: "DevSecOps pipelines and observability by default" },
                { Icon: Rocket, line: "Hypercare and continuous improvement" },
              ] as const
            ).map(({ Icon, line }) => (
              <div key={line} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 px-4 py-4 md:px-5">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-800">
                    <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
                  </span>
                  <span className="font-medium text-sm leading-snug">{line}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-[#1a1a1a] text-white p-8 grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { n: "150+", l: "Engineers available now" },
              { n: "18+", l: "Technology platforms" },
              { n: "AI", l: "AI-driven delivery model" },
              { n: "24/7", l: "Global support coverage" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold">{s.n}</div>
                <div className="text-xs text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Technologies</p>
              <div className="flex flex-wrap gap-2">
                {techPills.map((t) => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap">
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="tb-container">
          <div className="rounded-3xl bg-[#f5f5f5] p-8 md:p-12 grid lg:grid-cols-2 gap-12">
            <div>
              <span className="inline-block text-xs font-semibold bg-white border border-gray-200 px-3 py-1 rounded-full mb-4">
                Staff Augmentation
              </span>
              <h2 className="text-3xl font-bold mb-4">Staffing Services</h2>
              <p className="text-gray-600 mb-6">
                Embed specialists who behave like part of your team — with governance, reporting, and replacement guarantees.
              </p>
              <div className="space-y-3 mb-6">
                {["Access to 150+ skilled professionals", "Ramped in under 24 hours for most roles", "Timezone-aligned squads", "Flexible commercials"].map((x) => (
                  <div key={x} className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium">
                    {x}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {["ServiceNow", "Salesforce", "MuleSoft", "AWS", "Azure"].map((t) => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">Response within 4 hours, guaranteed.</p>
            </div>
            <div className="bg-black text-white rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Key Metrics
              </h3>
              <div className="space-y-6 flex-1">
                <div>
                  <div className="text-3xl font-bold">24h</div>
                  <div className="text-sm text-gray-400">Key Onboarding</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm text-gray-400">Retention Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">150+</div>
                  <div className="text-sm text-gray-400">Experts Available</div>
                </div>
              </div>
              <Link href="/contact" className="mt-8 inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium">
                Get Talent Fast
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-20 bg-white relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0 L40 20 L20 40 L0 20 Z' fill='none' stroke='%23e5e5e5' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "48px 48px",
        }}
      >
        <div className="tb-container text-center">
          <h2 className="text-3xl font-bold mb-3">From Request to Results in 4 Steps</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">A lightweight process designed for speed — with checkpoints your procurement and security teams will love.</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Phone className="w-6 h-6" />, t: "Submit Request", d: "Tell us the role, stack, and start window." },
              { icon: <Search className="w-6 h-6" />, t: "AI Matching", d: "Shortlists ranked for skills, fit, and timezone." },
              { icon: <User className="w-6 h-6" />, t: "You Choose", d: "Interview only the people you want to progress." },
              { icon: <Heart className="w-6 h-6" />, t: "Onboarded in 24h", d: "Contracts, access, and kickoff — fast." },
            ].map((s) => (
              <div key={s.t}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-300 text-gray-800 [&>svg]:stroke-[1.5]">
                  {s.icon}
                </div>
                <h3 className="font-semibold mb-2">{s.t}</h3>
                <p className="text-sm text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-100">
        <div className="tb-container text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Technology Expertise</h2>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">Platforms we deploy at scale — with certified practitioners and reusable accelerators.</p>
        </div>
        <div className="tb-container flex flex-wrap justify-center gap-3">
          {["ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "PowerBI", "Snowflake", "Oracle", "Microsoft", "Selenium", "Azure", "AWS", "Informatica", "Java"].map((t) => (
            <span key={t} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-800">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#f0f0f0]">
        <div className="tb-container flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-gray-600">Tell us your outcomes — we&apos;ll propose the right model and team shape.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
              Get in Touch
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex gap-2 mb-3">
                <span className="text-xs px-3 py-1 rounded-full bg-black text-white">Email us</span>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">+61 1300 934 031</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" /> No commitment required
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" /> Response within 2 hours
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" /> Free consultation
                </li>
              </ul>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-gray-800 underline underline-offset-4 self-center">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
