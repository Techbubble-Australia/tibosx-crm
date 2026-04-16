import Link from "next/link";
import {
  ArrowRight,
  Check,
  Phone,
  Search,
  User,
  Heart,
  Layers,
  Target,
  Shield,
  Users,
  Settings,
  Lightbulb,
  Cpu,
  Rocket,
} from "lucide-react";
import { IconCircle } from "@/components/ui/IconCircle";

const techPills = ["ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Power BI", "Snowflake", "Oracle", "Microsoft", "Azure", "AWS", "Java", "Informatica"];

const heroPillars = [
  { Icon: Phone, t: "Rapid Deployment", d: "From signed SOW to kickoff in days." },
  { Icon: Target, t: "Timezone Aligned", d: "Overlap that matches your ceremonies." },
  { Icon: Shield, t: "Quality Assured", d: "Reviews, docs, and handover you can audit." },
  { Icon: Users, t: "Global Reach", d: "APAC, North America, UK & EU coverage." },
];

export default function ServicesPage() {
  return (
    <>
      <section className="relative bg-black text-white pb-28 pt-10">
        <div className="tb-container text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-4xl mx-auto leading-tight">
            Your Trusted Partner at Every Step of the Journey
          </h1>
          <p className="mt-6 text-gray-300 max-w-3xl mx-auto">
            AI-accelerated staff augmentation, fixed-fee programmes, and managed delivery — structured for enterprise governance and speed.
          </p>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mb-24 relative z-10 mt-14">
          <div className="bg-white text-black rounded-2xl shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8 p-8 md:p-10">
            {heroPillars.map(({ Icon, t, d }) => (
              <div key={t} className="flex flex-col items-center text-center gap-3 px-2 md:px-4 first:pl-2 last:pr-2">
                <IconCircle icon={Icon} size="lg" className="border-gray-200 bg-gray-50 shadow-none" />
                <h3 className="font-semibold text-sm md:text-base leading-snug">{t}</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-32 pb-20 bg-white">
        <div className="tb-container grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-sm font-semibold text-sky-600 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Project Delivery
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Project Services</h2>
            <p className="text-gray-600 mb-6">
              Fixed-fee, outcome-based delivery for implementations, migrations, and modernisation — with clear milestones and governance.
            </p>
            <ul className="space-y-2 mb-6">
              {["ServiceNow programmes", "Salesforce & CRM", "Integration & APIs", "Automation & AI"].map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-sky-600" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Technologies</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {techPills.slice(0, 8).map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {t}
                </span>
              ))}
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
              Request a Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-500 mt-4">Response within 4 hours, guaranteed.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-black text-white px-6 py-4 text-sm font-semibold">Our Mission</div>
            <div className="p-6 bg-white">
              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                Help enterprises ship measurable outcomes — not just artefacts — with teams accountable end-to-end.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 text-center">
                <div>
                  <div className="text-2xl font-bold">10+</div>
                  <div className="text-xs text-gray-500">Years Experience</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-xs text-gray-500">Global Offices</div>
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
