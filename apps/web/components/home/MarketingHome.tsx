"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  Key,
  MessageSquare,
  BadgeCheck,
  Zap,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import heroNetworkPattern from "@image/home-hero-network.svg";

const featuredPartnerCard = [
  {
    id: "vic",
    logoLines: ["Victoria", "State Government"],
    lineClass: "text-[10px] font-bold uppercase leading-tight tracking-wide text-neutral-800 sm:text-[11px]",
    blurb: "Approved Supplier — Victorian Government procurement & digital programs.",
  },
  {
    id: "qld",
    logoLines: ["Queensland", "Government"],
    lineClass: "text-[10px] font-bold leading-tight text-neutral-800 sm:text-[11px]",
    blurb: "Approved Supplier — Queensland Government supplier panels.",
  },
  {
    id: "sn",
    logoLines: ["servicenow"],
    lineClass: "text-base font-semibold lowercase tracking-tight text-neutral-800 sm:text-lg",
    blurb: "Specialists",
  },
  {
    id: "mule",
    logoLines: ["MuleSoft"],
    lineClass: "text-sm font-bold tracking-tight text-neutral-800",
    blurb: "Specialists",
  },
  {
    id: "sfdc",
    logoLines: ["salesforce"],
    lineClass: "text-base font-semibold lowercase tracking-tight text-sky-600 sm:text-lg",
    blurb: "Specialists",
  },
];

const trustedLogoStrip = [
  { name: "Standard Chartered", short: "standard chartered" },
  { name: "VHA Home HealthCare", short: "VHA" },
  { name: "US Foods", short: "US FOODS", highlight: "bg-neutral-200" },
  { name: "Toyota", short: "TOYOTA" },
  { name: "University of Sydney", short: "USYD", highlight: "bg-neutral-200" },
  { name: "CRMIT", short: "CRMIT" },
  { name: "HDFC Bank", short: "HDFC BANK", highlight: "bg-neutral-900 text-white" },
  { name: "Tech Mahindra", short: "Tech Mahindra" },
  { name: "FINXL", short: "FINXL", highlight: "bg-slate-800 text-white" },
  { name: "Endeavour Energy", short: "Endeavour Energy" },
  { name: "Oracle", short: "ORACLE", highlight: "bg-neutral-400 text-white" },
];

const engagementModels = [
  {
    id: "staff",
    navLabel: "STAFFING SERVICES",
    label: "AI-Infused Staff Augmentation",
    description:
      "Time & Material-based model — embed senior engineers and architects who work as part of your team, with AI-accelerated sourcing, vetting, and onboarding.",
    bullets: ["Lightning Onboarding", "Top 1% Talent Only", "Timezone Aligned", "No Lock-in"],
    tags: ["ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Snowflake", "Power BI", "React", "Java", "AI/ML", "AWS/Azure"],
  },
  {
    id: "delivery",
    navLabel: "PROJECT DELIVERY",
    label: "Project Delivery",
    description:
      "Fixed-scope programmes with defined milestones — discovery, build, test, and hypercare — predictable delivery without compromising quality.",
    bullets: ["Discovery-led", "Milestone billing", "Governance built in", "Knowledge transfer"],
    tags: ["ITSM", "CSM", "Integrations", "CRM", "Custom apps", "QA", "DevOps"],
  },
  {
    id: "product",
    navLabel: "PRODUCT ENGINEERING",
    label: "Product Engineering",
    description:
      "Outcome-based product pods — design, build, and run modern applications on your stack with clear ownership from roadmap to production.",
    bullets: ["Product trio", "CI/CD embedded", "Observability", "Continuous delivery"],
    tags: ["React", "Node", "Java", "AWS", "Azure", "Kubernetes", "Data", "AI/ML"],
  },
];

const journeySteps = [
  {
    id: "step1",
    stepNum: "01",
    kicker: "SPEED & SCALE",
    navTitle: "Submit your request",
    badge: "Step 01 — Speed & Scale",
    title: "You submit a request. We start matching in hours.",
    body:
      "Tell us what you need — role, stack, timezone, and pace. Our engine starts sourcing complementary profiles while humans validate fit, compliance, and culture.",
    stats: [
      { value: "< 4h", label: "First shortlist delivered" },
      { value: "70%", label: "Faster than traditional hiring" },
      { value: "150+", label: "Specialists ready now" },
    ],
    features: [
      {
        title: "AI-powered matching",
        body: "Automated skills, timezone & culture fit scoring.",
        icon: "message" as const,
      },
      {
        title: "Pre-vetted only",
        body: "Multi-stage technical vetting before any proposal.",
        icon: "check" as const,
      },
    ],
  },
  {
    id: "step2",
    stepNum: "02",
    kicker: "CANDIDATE SELECTION",
    navTitle: "Choose your specialist",
    badge: "Step 02 — Candidate Selection",
    title: "You interview shortlisted experts — on your timeline.",
    body:
      "Review profiles, run interviews, and confirm fit before we lock anything in. We coordinate calendars and share structured scorecards after every round.",
    stats: [
      { value: "48h", label: "Typical interview window" },
      { value: "3+", label: "Profiles per shortlist" },
      { value: "100%", label: "Your hiring bar" },
    ],
    features: [
      { title: "Calendar sync", body: "We work around your team’s availability.", icon: "message" as const },
      { title: "Structured feedback", body: "Scorecards and notes after each round.", icon: "check" as const },
    ],
  },
  {
    id: "step3",
    stepNum: "03",
    kicker: "ONBOARDING",
    navTitle: "Productive in 24 hours",
    badge: "Step 03 — Onboarding",
    title: "Contracts, access, and kickoff — fast.",
    body:
      "Security packs, tooling, and ways-of-working tuned to your environment. Most roles move from acceptance to productive work within 24–72 hours.",
    stats: [
      { value: "24h", label: "Typical kickoff" },
      { value: "48h", label: "Replacement guarantee" },
      { value: "24/7", label: "Coverage options" },
    ],
    features: [
      { title: "Security & compliance", body: "Pre-built packs for enterprise procurement.", icon: "message" as const },
      { title: "Embedded with your team", body: "Slack/Teams, ceremonies, and reporting.", icon: "check" as const },
    ],
  },
  {
    id: "step4",
    stepNum: "04",
    kicker: "DELIVERY & GOVERNANCE",
    navTitle: "On-time. On-budget.",
    badge: "Step 04 — Delivery & Governance",
    title: "Delivery starts with clear outcomes and reporting.",
    body:
      "Weekly reporting, steering cadences, and transparent metrics. Scale the team up or down as needs change — with a single accountable partner.",
    stats: [
      { value: "Weekly", label: "Status reporting" },
      { value: "SLA", label: "Backed delivery" },
      { value: "48h", label: "Swap guarantee" },
    ],
    features: [
      { title: "Governance built in", body: "RACI, RAID, and exec-ready summaries.", icon: "message" as const },
      { title: "Continuous improvement", body: "Retros, backlog hygiene, and roadmap alignment.", icon: "check" as const },
    ],
  },
];

const platforms = [
  {
    id: "servicenow",
    name: "ServiceNow",
    headline: "Unlock the full power of ServiceNow — ITSM to App Engine.",
    bullets: ["ITSM / CSM / HRSD", "Integration & data", "CMDB health", "Governed releases"],
    experts: "20+ Experts",
    since: "2011",
    projects: "400+ Projects",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    headline: "Sales, Service, and Industry Clouds — implemented the right way.",
    bullets: ["Sales & Service Cloud", "Experience Cloud", "Einstein & automation", "Data model discipline"],
    experts: "25+ Experts",
    since: "2012",
    projects: "350+ Projects",
  },
  {
    id: "atlassian",
    name: "Atlassian",
    headline: "Jira, Confluence, and agile at enterprise scale.",
    bullets: ["Scaled agile", "Migration & merge", "Apps & automation", "Managed upkeep"],
    experts: "15+ Experts",
    since: "2014",
    projects: "120+ Projects",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    headline: "Microsoft 365, Azure, and Power Platform — integrated securely.",
    bullets: ["M365 collaboration", "Azure workloads", "Power Platform", "Identity & access"],
    experts: "18+ Experts",
    since: "2013",
    projects: "200+ Projects",
  },
  {
    id: "aws",
    name: "AWS",
    headline: "Cloud foundations, modernisation, and FinOps-aware delivery.",
    bullets: ["Landing zones", "Containers & serverless", "Data on AWS", "Well-Architected"],
    experts: "22+ Experts",
    since: "2015",
    projects: "180+ Projects",
  },
  {
    id: "cisco",
    name: "Cisco",
    headline: "Network and collaboration outcomes with clear runbooks.",
    bullets: ["Secure connectivity", "Collaboration suites", "Observability", "Operational handover"],
    experts: "10+ Experts",
    since: "2016",
    projects: "60+ Projects",
  },
  {
    id: "snowflake",
    name: "Snowflake",
    headline: "Analytics platforms that business teams actually use.",
    bullets: ["Warehousing", "Data sharing", "Governance", "Performance tuning"],
    experts: "12+ Experts",
    since: "2018",
    projects: "90+ Projects",
  },
];

const faqItems = [
  {
    q: "How quickly can you onboard a resource?",
    a: "Most roles move from request to kickoff within 24–72 hours. Specialist profiles may take slightly longer — we’ll be explicit upfront.",
  },
  {
    q: "Do you work with startups or only enterprises?",
    a: "We work across growth-stage and enterprise. Models flex to your procurement and governance needs.",
  },
  {
    q: "What happens if a resource isn’t the right fit?",
    a: "We replace fast — typically within 48 hours — and stay accountable until you’re satisfied.",
  },
  {
    q: "How does pricing work?",
    a: "Transparent weekly or milestone billing depending on model. No surprise line items.",
  },
];

export function MarketingHome() {
  const [engagementId, setEngagementId] = useState<string>(engagementModels[0]!.id);
  const [journeyId, setJourneyId] = useState<string>("step1");
  const [platformId, setPlatformId] = useState<string>(platforms[0]!.id);
  const [faqOpen, setFaqOpen] = useState(0);
  const [caseFilter, setCaseFilter] = useState("All");

  const engagement = engagementModels.find((m) => m.id === engagementId) ?? engagementModels[0]!;
  const journey = journeySteps.find((s) => s.id === journeyId) ?? journeySteps[0]!;
  const platform = platforms.find((p) => p.id === platformId) ?? platforms[0]!;

  return (
    <>
      {/* Hero — Figma: off-white + network pattern, NEW pill, trust chips, social proof */}
      <section className="relative overflow-hidden bg-[#fafafa]">
        <div
          className="pointer-events-none absolute inset-0 bg-[length:880px_auto] bg-top opacity-60"
          style={{ backgroundImage: `url(${heroNetworkPattern})` }}
        />
        <div className="relative tb-container py-16 text-center md:py-24 lg:py-28">
          <div className="mb-8 inline-flex overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm">
            <span className="bg-black px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">NEW</span>
            <span className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-neutral-700">
              AI-matched talent placement in 24–48 hrs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-[#0a0a0a] md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            We Deliver World-Class Digital Transformations powered by AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            AI-driven digital transformation across Asia Pacific and North America — connecting ambitious enterprises with the top 1% of platform talent, fast.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="tb-btn-primary px-8 shadow-md shadow-black/10">
              Schedule a Free Consultation
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href="/services"
              className="tb-btn-ghost border-neutral-300 px-8 shadow-sm"
            >
              Explore Services
            </Link>
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              "No lock-in contracts",
              "Onboard in <24 hours",
              "Best-any-quote guarantee",
              "24/7 support included",
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-800 shadow-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
                </span>
                {label}
              </span>
            ))}
          </div>
          <div className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex -space-x-2">
              {["TY", "SC", "TL", "DF", "MK"].map((initials) => (
                <span
                  key={initials}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-xs font-semibold text-neutral-700"
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="font-semibold text-neutral-800">50+ enterprise clients</span>
            <span className="hidden h-4 w-px bg-neutral-300 sm:block" aria-hidden />
            <span className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              ))}
            </span>
            <span className="font-medium text-neutral-700">5.0 avg. rating</span>
            <span className="hidden h-4 w-px bg-neutral-300 sm:block" aria-hidden />
            <span className="inline-flex items-center gap-2 text-neutral-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Available now
            </span>
          </div>
        </div>
      </section>

      {/* Trusted partners — elevated card + pill + logo strip */}
      <section className="bg-[#f9f9f9] pb-16 pt-2 md:pb-24 md:pt-4">
        <div className="tb-container">
          <div className="relative z-0">
            <div className="rounded-2xl bg-white p-4 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/5 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 divide-y divide-neutral-100 md:grid-cols-5 md:divide-x md:divide-y-0">
                {featuredPartnerCard.map((p) => (
                  <div
                    key={p.id}
                    className="flex min-h-[4.5rem] items-center gap-3 py-4 sm:min-h-[5.25rem] md:gap-4 md:px-3 md:py-5 lg:px-4"
                  >
                    <div className="flex w-[6.75rem] shrink-0 flex-col justify-center sm:w-28">
                      {p.logoLines.map((line) => (
                        <span key={line} className={p.lineClass}>
                          {line}
                        </span>
                      ))}
                    </div>
                    <div className="h-10 w-px shrink-0 bg-neutral-200 sm:h-12" aria-hidden />
                    <p className="min-w-0 flex-1 text-left text-[11px] leading-snug text-neutral-600 sm:text-xs">
                      {p.blurb}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 -mt-4 flex justify-center px-4">
              <span className="rounded-full border border-neutral-200/80 bg-[#f0f0f0] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 shadow-sm">
                Trusted by leading companies
              </span>
            </div>
          </div>

          <div className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-9 sm:gap-x-8 md:justify-between lg:max-w-none">
            {trustedLogoStrip.map((logo) => (
              <div
                key={logo.name}
                className={`flex min-h-[2.25rem] items-center justify-center rounded-md px-1 ${logo.highlight ?? ""}`}
                title={logo.name}
              >
                <span
                  className={`max-w-[6.5rem] text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-neutral-600 sm:max-w-[7rem] sm:text-[10px] ${logo.highlight ? "rounded px-2 py-1.5" : "opacity-90 grayscale"}`}
                >
                  {logo.short}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — black */}
      <section className="bg-black py-16 text-white">
        <div className="tb-container text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            The rapidly growing company
          </p>
          <h2 className="mb-12 text-2xl font-bold md:text-3xl">
            Transforming Today&apos;s Enterprises for Tomorrow&apos;s Innovation
          </h2>
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-0">
            {[
              { n: "150+", l: "Tech Specialists Globally" },
              { n: "50+", l: "Enterprise Clients" },
              { n: "6", l: "Global Offices" },
              { n: "98%", l: "Client Satisfaction Rate" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`relative px-2 ${i > 0 ? "md:border-l md:border-white/15" : ""}`}
              >
                <div className="text-4xl font-bold md:text-5xl">{s.n}</div>
                <div className="mt-1 text-sm text-neutral-400">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale text-xs font-medium">
            {["NAB", "Westpac", "Telstra", "Atlassian", "ServiceNow", "Salesforce"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement models — Figma services: sidebar + detail */}
      <section className="bg-white py-20">
        <div className="tb-container">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            • Our services
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            End-to-end delivery, every engagement model
          </h2>
          <p className="mx-auto mb-14 max-w-3xl text-center text-lg text-neutral-600">
            Whether you need a single specialist or an entire product team, we have the model that fits — AI-matched,
            timezone-aligned, and ready in hours.
          </p>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="flex flex-col lg:col-span-4">
              <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {engagementModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setEngagementId(m.id)}
                    className={`w-full px-5 py-4 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
                      engagementId === m.id ? "bg-black text-white" : "bg-white text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {m.navLabel}
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="font-bold text-neutral-900">Not sure which fits?</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Talk to our solutions team — we&apos;ll find the right engagement model for your needs.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-neutral-900"
                >
                  Book a Free Call
                </Link>
              </div>
            </div>
            <div className="lg:col-span-8">
              <h3 className="mb-4 text-2xl font-bold text-neutral-900">{engagement.label}</h3>
              <p className="mb-8 text-neutral-600">{engagement.description}</p>
              <ul className="mb-8 grid gap-4 sm:grid-cols-2">
                {engagement.bullets.map((b, i) => {
                  const staffIcons = [Zap, Shield, Clock, DollarSign];
                  const IconComp = engagement.id === "staff" ? staffIcons[i] ?? Check : Check;
                  return (
                    <li key={b} className="flex items-start gap-3 text-sm text-neutral-800">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                        <IconComp className="h-4 w-4 text-neutral-700" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="pt-1.5 font-semibold">{b}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500 underline decoration-neutral-300 underline-offset-4">
                Available expertise
              </p>
              <div className="mb-8 flex flex-wrap gap-2">
                {engagement.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Link href="/contact" className="tb-btn-primary">
                Let&apos;s Talk
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 steps */}
      <section className="py-20 bg-[#f5f5f5]">
        <div className="tb-container text-center">
          <h2 className="text-3xl font-bold mb-4">From first call to go-live in 4 steps</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">A simple path from your first conversation to production outcomes — with clear owners and reporting at every stage.</p>
          <div className="grid md:grid-cols-4 gap-8 text-left">
            {[
              { n: "1", t: "Discovery & Design", d: "We align on outcomes, constraints, and the fastest path to value." },
              { n: "2", t: "Match & Validate", d: "AI shortlists; you interview. We handle contracts and compliance." },
              { n: "3", t: "Onboard & Embed", d: "Tooling, access, and ways-of-working — tuned to your environment." },
              { n: "4", t: "Deliver & Optimise", d: "Ship milestones, measure results, and scale the team as needs change." },
            ].map((step) => (
              <div key={step.n}>
                <div className="text-5xl font-bold text-gray-200 mb-2">{step.n}</div>
                <h3 className="font-semibold text-lg mb-2">{step.t}</h3>
                <p className="text-sm text-gray-600">{step.d}</p>
              </div>
            ))}
          </div>
          <Link href="/contact" className="inline-flex mt-12 items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-900">
            Let&apos;s Talk
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Customer journey — Figma: grey panel, step list + detail */}
      <section className="bg-white py-20">
        <div className="tb-container">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            • The TechBubble Advantage
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-neutral-900">
            Your journey from request to results — broken down
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-neutral-600">
            We&apos;ve stripped out every unnecessary step so you can focus on building, not bureaucracy.
          </p>
          <div className="rounded-3xl bg-neutral-100 p-4 sm:p-6 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="flex flex-col gap-0 lg:col-span-5">
                {journeySteps.map((s) => {
                  const active = journeyId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setJourneyId(s.id)}
                      className={`relative flex w-full gap-4 border-b border-neutral-200 py-5 text-left last:border-b-0 lg:border-b-0 lg:py-4 ${
                        active ? "lg:border-l-4 lg:border-black lg:pl-4" : "lg:border-l-4 lg:border-transparent lg:pl-4"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active ? "bg-black text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200"
                        }`}
                      >
                        {s.stepNum}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{s.kicker}</p>
                        <p className={`font-bold leading-snug text-neutral-900 ${active ? "" : "text-neutral-700"}`}>
                          {s.navTitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
                <span className="inline-block rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {journey.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-neutral-900">{journey.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{journey.body}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {journey.stats.map((st) => (
                    <div
                      key={st.label}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center"
                    >
                      <div className="text-xl font-bold text-neutral-900 sm:text-2xl">{st.value}</div>
                      <div className="mt-1 text-xs text-neutral-500">{st.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid gap-6 border-t border-neutral-100 pt-8 sm:grid-cols-2">
                  {journey.features.map((f) => (
                    <div key={f.title} className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                        {f.icon === "message" ? (
                          <MessageSquare className="h-5 w-5 text-neutral-700" strokeWidth={1.5} aria-hidden />
                        ) : (
                          <BadgeCheck className="h-5 w-5 text-neutral-700" strokeWidth={1.5} aria-hidden />
                        )}
                      </span>
                      <div>
                        <p className="font-bold text-neutral-900">{f.title}</p>
                        <p className="mt-1 text-sm text-neutral-600">{f.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/contact" className="tb-btn-primary">
                    Let&apos;s Talk
                    <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </Link>
                  <Link href="/contact" className="tb-btn-ghost border-neutral-300">
                    Book a Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform expertise */}
      <section className="border-t border-gray-100 bg-white py-20">
        <div className="tb-container">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            • Across the technology offerings
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-neutral-900">Multi-Platform Expertise</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-neutral-600">
            Certified specialists across the enterprise stack — from workflow platforms to cloud, data, and custom
            engineering.
          </p>
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformId(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  platformId === p.id ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h3 className="text-2xl font-bold mb-4">{platform.headline}</h3>
              <ul className="space-y-2">
                {platform.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="inline-flex mt-8 items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
                Talk to an expert
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 p-8 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{platform.name} Expertise</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{platform.experts}</div>
                  <div className="text-xs text-gray-500">Experts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{platform.since}</div>
                  <div className="text-xs text-gray-500">Since</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{platform.projects}</div>
                  <div className="text-xs text-gray-500">Projects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech grid */}
      <section className="py-16 bg-white">
        <div className="tb-container text-center">
          <p className="text-sm font-semibold text-gray-500 mb-6">Technology expertise</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["ServiceNow", "Salesforce", "Atlassian", "Microsoft", "AWS", "Cisco", "Snowflake", "Google Cloud", "SAP", "Oracle", "MuleSoft", "Java", "Azure"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-800">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why us bento */}
      <section className="py-20 bg-[#f5f5f5]">
        <div className="tb-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">We&apos;re more than a vendor. We&apos;re your tech partner.</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-black text-white p-8 rounded-2xl">
              <p className="text-lg font-medium leading-relaxed">
                The world&apos;s top 1% of tech talent — vetted, available, and aligned to how your enterprise actually ships.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold mb-2">Team of Tech Talent</h3>
              <p className="text-sm text-gray-600">Pods built around your stack — not generic &quot;resources&quot;.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold mb-2">Stay Ahead</h3>
              <p className="text-sm text-gray-600">Roadmaps that track platform releases and your backlog.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold mb-2">99% Talent Retention</h3>
              <p className="text-sm text-gray-600">Governance that keeps teams stable through delivery.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-semibold mb-2">Time Zone Alignment</h3>
              <p className="text-sm text-gray-600">Follow-the-sun or overlap — your choice.</p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-black p-6 text-white">
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <Phone className="h-5 w-5 opacity-90 stroke-[1.5]" aria-hidden />
              </span>
              <h3 className="font-semibold mb-2">24/7 Support &amp; Maintenance</h3>
              <p className="text-sm text-gray-300">Run and enhance — with clear SLAs.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 md:row-span-1">
              <h3 className="font-semibold mb-2">Flexible Pricing</h3>
              <p className="text-sm text-gray-600">Augmentation, fixed fee, or hybrid — structured for procurement reality.</p>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 md:col-span-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-900">
                <Key className="h-5 w-5 stroke-[1.5]" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold mb-2">Innovation &amp; Cutting-Edge Tech</h3>
                <p className="text-sm text-gray-600">AI-assisted delivery, automation, and modern engineering practices — where they create measurable ROI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global */}
      <section className="bg-black text-white py-16">
        <div className="tb-container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">6 offices. 3 continents. One standard of excellence.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { f: "🇦🇺", n: "Australia" },
              { f: "🇺🇸", n: "USA" },
              { f: "🇮🇳", n: "India" },
              { f: "🇵🇭", n: "Philippines" },
              { f: "🇬🇧", n: "UK & EU" },
            ].map((o) => (
              <div key={o.n} className="rounded-xl bg-white p-6 text-black">
                <div className="mb-3 flex h-10 w-10 items-center justify-center text-2xl leading-none">{o.f}</div>
                <div className="font-semibold">{o.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial — Figma: Client Stories */}
      <section className="bg-[#f5f5f5] py-20">
        <div className="tb-container max-w-4xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-800">
            <span className="h-1.5 w-1.5 rounded-full bg-black" aria-hidden />
            Client Stories
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Trusted by people who know technology best
          </h2>
          <p className="mt-8 text-2xl font-normal leading-snug text-neutral-800 md:text-[1.65rem] md:leading-relaxed">
            <span className="mr-1 font-serif text-5xl leading-none text-neutral-400">&ldquo;</span>
            <strong className="font-semibold">TechBubble</strong> moves at the speed our programmes demand — without
            compromising governance or quality.
          </p>
          <div className="my-10 h-px w-full bg-neutral-200" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-300 text-sm font-semibold text-neutral-700">
                HP
              </span>
              <div>
                <p className="font-bold text-neutral-900">Haima Prakash</p>
                <p className="text-sm text-neutral-500">
                  Sr. Manager, Chief Technology Office — University of Sydney
                </p>
                <div className="mt-2 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Case studies strip */}
      <section className="py-20 bg-white">
        <div className="tb-container">
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", "ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Staffing"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCaseFilter(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  caseFilter === c ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 mb-2">SERVICENOW</p>
              <h3 className="font-bold text-lg mb-2">Enterprise workflow reset — 3 days to first hire</h3>
              <p className="text-sm text-gray-600 mb-4">Rapid team stand-up and governance that satisfied audit and delivery leads.</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-600">3 days to hire</span>
                <Link href="/case-studies" className="text-sm font-medium inline-flex items-center gap-1">
                  Read <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 mb-2">SALESFORCE</p>
              <h3 className="font-bold text-lg mb-2">CRM overhaul with 100% cutover success</h3>
              <p className="text-sm text-gray-600 mb-4">Data model rebuilt, users retrained, reporting trusted by finance.</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-600">100% success</span>
                <Link href="/case-studies" className="text-sm font-medium inline-flex items-center gap-1">
                  Read <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#f0f0f0]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Questions we hear all the time</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={item.q} className="border border-gray-200 rounded-xl bg-white">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-5 py-4 text-left font-medium text-sm"
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                >
                  {item.q}
                  <span className="text-xl text-gray-400">{faqOpen === i ? "×" : "+"}</span>
                </button>
                {faqOpen === i && <p className="px-5 pb-4 text-sm text-gray-600">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule demo — black */}
      <section className="bg-black text-white py-16">
        <div className="tb-container grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4">Schedule a Free Demo with Our Experts</h2>
            <p className="text-gray-400 mb-6">See how AI-matched talent and governed delivery come together — with a walkthrough tailored to your stack.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium">
                Book a Demo
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 border border-gray-600 px-6 py-3 rounded-full text-sm font-medium">
                Let&apos;s Talk
              </Link>
            </div>
          </div>
          <form className="space-y-3 bg-[#141414] p-6 rounded-2xl border border-gray-800">
            <div className="grid grid-cols-2 gap-3">
              <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm" placeholder="First & Last Name" />
              <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm" placeholder="Work Email" />
            </div>
            <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm" placeholder="Company" />
            <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm min-h-[100px]" placeholder="How can we help?" />
            <button type="button" className="w-full bg-white text-black py-3 rounded-full text-sm font-medium">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Careers teaser */}
      <section className="py-16 bg-white">
        <div className="tb-container flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Join Our Global Team</h2>
            <p className="text-gray-600">We&apos;re hiring across delivery, consulting, and engineering.</p>
          </div>
          <div className="space-y-3 w-full md:w-auto md:min-w-[320px]">
            {["Senior ServiceNow Developer", "Salesforce Solutions Architect", "AI/ML Engineer"].map((role) => (
              <Link
                key={role}
                href="/careers"
                className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                {role}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-[#f5f5f5]">
        <div className="tb-container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to build your dream team in under 24 hours?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-sm font-medium">
              Let&apos;s Talk
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-gray-300 bg-white px-8 py-3 rounded-full text-sm font-medium">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
