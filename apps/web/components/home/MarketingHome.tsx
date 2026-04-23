"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Minus,
  PhoneCall,
  FileText,
  Plus,
  Rocket,
  ShieldCheck,
  Zap,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import heroNetworkPattern from "@image/home-hero-network.svg";
import featuredVicLogo from "@image/techbubble_-_home_1.png";
import featuredQldLogo from "@image/techbubble_-_home_2.png";
import featuredServiceNowLogo from "@image/techbubble_-_home_3.png";
import featuredMuleSoftLogo from "@image/techbubble_-_home_4.png";
import featuredSalesforceLogo from "@image/techbubble_-_home_5.png";
import crmitLogo from "@image/techbubble_-_home_11.png";
import endeavourLogo from "@image/techbubble_-_home_15.png";
import finxlLogo from "@image/techbubble_-_home_14.png";
import hdfcBankLogo from "@image/techbubble_-_home_12.png";
import standardCharteredLogo from "@image/techbubble_-_home_6.png";
import techMahindraLogo from "@image/techbubble_-_home_13.png";
import toyotaLogo from "@image/techbubble_-_home_9.png";
import usFoodsLogo from "@image/techbubble_-_home_8.png";
import universityOfSydneyLogo from "@image/techbubble_-_home_10.png";
import vhaLogo from "@image/techbubble_-_home_7.png";
import caseStudyCampusImage from "@image/techbubble_-_home_34.jpg";
import caseStudyCampusImageAlt from "@image/techbubble_-_home_35.jpg";
import testimonialAvatar from "@image/techbubble_-_home_33.jpg";
import techServiceNowLogo from "@image/techbubble_-_home_17.png";
import techSalesforceLogo from "@image/techbubble_-_home_18.png";
import techMuleSoftLogo from "@image/techbubble_-_home_19.png";
import techSharePointLogo from "@image/techbubble_-_home_20.png";
import techPowerBILogo from "@image/techbubble_-_home_21.png";
import techSnowflakeLogo from "@image/techbubble_-_home_22.png";
import techOracleLogo from "@image/techbubble_-_home_23.png";
import techMicrosoftAILogo from "@image/techbubble_-_home_24.png";
import techSeleniumLogo from "@image/techbubble_-_home_25.png";
import techAzureLogo from "@image/techbubble_-_home_26.png";
import techAwsLogo from "@image/techbubble_-_home_27.png";
import techInformaticaLogo from "@image/techbubble_-_home_28.png";
import techReactLogo from "@image/techbubble_-_home_29.png";
import techJavaLogo from "@image/techbubble_-_home_30.png";
import techAppleAndroidLogo from "@image/techbubble_-_home_31.png";
import techDynamicsLogo from "@image/techbubble_-_home_32.jpg";
import innovationImage from "@image/Innovation_Cutting_Edge_Tech.png";

const featuredPartnerCard = [
  {
    id: "vic",
    image: featuredVicLogo,
    imageClass: "w-[193px]",
  },
  {
    id: "qld",
    image: featuredQldLogo,
    imageClass: "w-[220px]",
  },
  {
    id: "sn",
    image: featuredServiceNowLogo,
    imageClass: "w-[208px]",
  },
  {
    id: "mule",
    image: featuredMuleSoftLogo,
    imageClass: "w-[204px]",
  },
  {
    id: "sfdc",
    image: featuredSalesforceLogo,
    imageClass: "w-[177px]",
  },
];

const trustedLogoStrip = [
  { name: "Standard Chartered", image: standardCharteredLogo, width: 174, height: 68 },
  { name: "VHA Home HealthCare", image: vhaLogo, width: 160, height: 68 },
  { name: "US Foods", image: usFoodsLogo, width: 72, height: 78 },
  { name: "Toyota", image: toyotaLogo, width: 150, height: 40 },
  { name: "University of Sydney", image: universityOfSydneyLogo, width: 150, height: 60 },
  { name: "CRMIT", image: crmitLogo, width: 128, height: 55 },
  { name: "HDFC Bank", image: hdfcBankLogo, width: 224, height: 56 },
  { name: "Tech Mahindra", image: techMahindraLogo, width: 117, height: 80 },
  { name: "FINXL", image: finxlLogo, width: 150, height: 56 },
  { name: "Endeavour Energy", image: endeavourLogo, width: 170, height: 64 },
  { name: "Oracle", image: techOracleLogo, width: 150, height: 48 },
];

const engagementModels = [
  {
    id: "staff",
    navLabel: "STAFFING SERVICES",
    label: "AI-Infused Staff Augmentation",
    description:
      "Our Time & Material-based model deploys rigorously vetted specialists directly into your team — within one business day. We use AI to match the exact skill profile, experience level, and timezone to your requirements.",
    bullets: ["Lightning Onboarding", "Top 1% Talent Only", "Timezone Aligned", "No Lock-in"],
    tags: ["ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Snowflake", "Power BI", "React", "Power BI", "Java", "AI/ML", "AWS/Azure"],
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

const deliverySteps = [
  {
    title: "Book a Free Call",
    body: "Zero commitment. Talk through your requirements, timeline, and budget with our solutions team — we'll listen first, advise second.",
    icon: PhoneCall,
  },
  {
    title: "Get a Tailored Quote",
    body: "Receive a detailed, fixed-price or T&M proposal within 1–2 business days. No ambiguity — every cost line is explained clearly.",
    icon: FileText,
  },
  {
    title: "Confirm & Kickoff",
    body: "AI-matched team assembled in under 24 hours. A smooth, structured kickoff makes sure everyone is aligned from the very first day.",
    icon: Rocket,
  },
  {
    title: "Deliver & Support",
    body: "We ship on time, on budget — then stay with you. 24/7 post-launch governance ensures your systems run flawlessly,long-term.",
    icon: ShieldCheck,
  },
];

const platforms = [
  {
    id: "servicenow",
    name: "ServiceNow",
    headline: "Unlock the full power of\nServiceNow your Enterprise",
    body: "TechBubble offers end-to-end ServiceNow implementation, testing, and support services to help organisations unlock the full potential of the ServiceNow platform — from IT Service Management to HR Service Delivery, Customer Service Management, and custom applications.",
    features: [
      { title: "IT Service Management (ITSM)", sub: "Incident, problem, change, and request management across your enterprise" },
      { title: "SecOps, GRC & ITOM", sub: "Security operations, risk management, and IT operations in one unified platform" },
      { title: "HR Service Delivery (HRSD) & CSM", sub: "Streamline HR workflows and deliver world-class customer service experiences" },
    ],
    ctaLabel: "Explore ServiceNow Solutions",
    cardTitle: "ServiceNow Expertise",
    cardSubtitle: "Certified specialists · All modules",
    stats: [
      { value: "35+", label: "Certified engineers" },
      { value: "20+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["ITSM", "ITOM", "SecOps", "GRC", "HRSD", "CSM", "Portal", "Custom Apps", "CMDB", "ITAM"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    headline: "Sales, Service & Industry Clouds —\nimplemented the right way",
    body: "TechBubble delivers Salesforce implementations across Sales Cloud, Service Cloud, and Einstein — helping organisations accelerate revenue operations and deliver personalised customer experiences at scale.",
    features: [
      { title: "Sales & Service Cloud", sub: "Lead-to-close, case management, and omnichannel service delivery" },
      { title: "Einstein & Automation", sub: "AI-powered forecasting, scoring, and workflow automation" },
      { title: "Experience Cloud & CPQ", sub: "Partner portals, self-service, and configure-price-quote solutions" },
    ],
    ctaLabel: "Explore Salesforce Solutions",
    cardTitle: "Salesforce Expertise",
    cardSubtitle: "Certified specialists · All clouds",
    stats: [
      { value: "25+", label: "Certified experts" },
      { value: "15+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["Sales Cloud", "Service Cloud", "Experience Cloud", "CPQ", "Einstein", "Automation", "Data Cloud"],
  },
  {
    id: "mulesoft",
    name: "MuleSoft",
    headline: "Integration, APIs & data —\nconnected and governed",
    body: "TechBubble architects and delivers MuleSoft integration solutions that connect your enterprise systems, expose governed APIs, and unlock data across your organisation — from ERP to cloud SaaS.",
    features: [
      { title: "API-led Connectivity", sub: "Experience, process, and system layer API design and build" },
      { title: "Enterprise Integration", sub: "ERP, CRM, cloud, and legacy system integration at scale" },
      { title: "DataWeave & Monitoring", sub: "Advanced transformation, observability, and platform-ops support" },
    ],
    ctaLabel: "Explore MuleSoft Solutions",
    cardTitle: "MuleSoft Expertise",
    cardSubtitle: "Certified architects · All tiers",
    stats: [
      { value: "20+", label: "Certified experts" },
      { value: "12+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["Anypoint Platform", "API Gateway", "DataWeave", "CloudHub", "RTF", "Event-Driven", "EDI"],
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    headline: "Collaboration, intranets &\ncontent management at scale",
    body: "TechBubble builds and modernises SharePoint environments — from intranet portals and document management to governance frameworks and Microsoft 365 integration — delivering user adoption and measurable collaboration outcomes.",
    features: [
      { title: "Intranet & Portals", sub: "Modern communication sites, departmental hubs, and branded intranets" },
      { title: "Document & Records Management", sub: "Retention policies, metadata taxonomy, and compliance workflows" },
      { title: "M365 Integration & Governance", sub: "Teams, OneDrive, Power Automate, and enterprise governance frameworks" },
    ],
    ctaLabel: "Explore SharePoint Solutions",
    cardTitle: "SharePoint Expertise",
    cardSubtitle: "Certified specialists · All versions",
    stats: [
      { value: "18+", label: "Certified experts" },
      { value: "10+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["Modern SharePoint", "SPFx", "Power Automate", "Teams", "OneDrive", "M365", "Governance"],
  },
  {
    id: "sharepoint2",
    name: "SharePoint",
    headline: "Collaboration, intranets &\ncontent management at scale",
    body: "TechBubble builds and modernises SharePoint environments — from intranet portals and document management to governance frameworks and Microsoft 365 integration — delivering user adoption and measurable collaboration outcomes.",
    features: [
      { title: "Intranet & Portals", sub: "Modern communication sites, departmental hubs, and branded intranets" },
      { title: "Document & Records Management", sub: "Retention policies, metadata taxonomy, and compliance workflows" },
      { title: "M365 Integration & Governance", sub: "Teams, OneDrive, Power Automate, and enterprise governance frameworks" },
    ],
    ctaLabel: "Explore SharePoint Solutions",
    cardTitle: "SharePoint Expertise",
    cardSubtitle: "Certified specialists · All versions",
    stats: [
      { value: "18+", label: "Certified experts" },
      { value: "10+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["Modern SharePoint", "SPFx", "Power Automate", "Teams", "OneDrive", "M365", "Governance"],
  },
  {
    id: "other",
    name: "Other Technologies",
    headline: "More platforms, one trusted\ndelivery partner",
    body: "Beyond specialised platforms, TechBubble delivers outcomes across a wide range of enterprise technologies — cloud infrastructure, data & analytics, custom development, and QA automation.",
    features: [
      { title: "Cloud Infrastructure", sub: "AWS, Azure, and GCP — architecture, migration, and managed operations" },
      { title: "Data & Analytics", sub: "Snowflake, Power BI, and modern data warehousing for actionable insight" },
      { title: "Custom Development & QA", sub: "React, Java, Node, Kubernetes, and automated testing frameworks" },
    ],
    ctaLabel: "Explore All Solutions",
    cardTitle: "Full-Stack Expertise",
    cardSubtitle: "Certified specialists · All technologies",
    stats: [
      { value: "100+", label: "Certified experts" },
      { value: "400+", label: "Projects delivered" },
      { value: "100%", label: "Client satisfaction" },
    ],
    tags: ["AWS", "Azure", "Snowflake", "Power BI", "React", "Java", "Kubernetes", "QA", "DevOps"],
  },
];

const testimonialItems = [
  {
    quote:
      "The Techbubble team helped us transform our ServiceNow implementation in weeks, not months. Their delivery quality and governance discipline were exceptional.",
    name: "Vandana K",
    role: "Director, Digital Programs",
  },
];

const caseStudyItems = [
  {
    title: "University of Sydney — Digital transformation uplift",
    category: "Strategy + Delivery",
    summary:
      "End-to-end modernisation program across workflows, integrations, and student-facing digital experiences.",
    image: caseStudyCampusImage,
  },
  {
    title: "Major Energy Utility — Field ops optimisation",
    category: "ServiceNow",
    summary: "Improved dispatch speed, SLA adherence, and cross-team visibility with governed release cycles.",
    image: caseStudyCampusImageAlt,
  },
  {
    title: "National Retail Group — CRM unification",
    category: "Salesforce",
    summary: "Consolidated customer operations and launched automated journeys across key business units.",
    image: caseStudyCampusImage,
  },
  {
    title: "Health Provider — Integration modernization",
    category: "MuleSoft",
    summary: "Built resilient APIs and event-driven integrations across critical care and business systems.",
    image: caseStudyCampusImageAlt,
  },
  {
    title: "Enterprise Bank — Data platform acceleration",
    category: "Data + Cloud",
    summary: "Migrated analytics workloads with improved governance and faster business reporting cycles.",
    image: caseStudyCampusImage,
  },
];

const faqItems = [
  {
    question: "How quickly can you onboard a resource?",
    answer:
      "Our AI-matching engine can identify and propose a vetted candidate within hours of your request. Full onboarding — contracts signed, tools set up, team introductions — typically completes within one business day. For very specialised roles, allow up to 48 hours.",
  },
  {
    question: "Do you work with startups or only enterprises?",
    answer: "",
  },
  {
    question: "What happens if a placed resource doesn't work out?",
    answer: "",
  },
  {
    question: "How does your pricing work?",
    answer: "",
  },
  {
    question: "Do your resources work in my timezone?",
    answer: "",
  },
  {
    question: "What industries do you serve?",
    answer: "",
  },
];

const openRoles = [
  "Senior ServiceNow Consultant",
  "Salesforce Technical Architect",
  "MuleSoft Integration Lead",
  "Data Engineer (Azure/AWS)",
  "Senior React Developer",
];

const technologyCards = [
  // Row 1
  { name: "ServiceNow", image: techServiceNowLogo },
  { name: "Salesforce", image: techSalesforceLogo },
  { name: "MuleSoft", image: techMuleSoftLogo },
  { name: "SharePoint", image: techSharePointLogo },
  { name: "Power BI", image: techPowerBILogo },
  { name: "Snowflake", image: techSnowflakeLogo },
  { name: "Oracle", image: techOracleLogo },
  { name: "Microsoft AI", image: techMicrosoftAILogo },
  // Row 2
  { name: "Selenium", image: techSeleniumLogo },
  { name: "Azure", image: techAzureLogo },
  { name: "AWS", image: techAwsLogo },
  { name: "Informatica", image: techInformaticaLogo },
  { name: "React", image: techReactLogo },
  { name: "Java", image: techJavaLogo },
  { name: "Mobile Dev", image: techAppleAndroidLogo },
  { name: "MS Dynamics", image: techDynamicsLogo },
];

export function MarketingHome() {
  const [engagementId, setEngagementId] = useState<string>(engagementModels[0]!.id);
  const [platformId, setPlatformId] = useState<string>(platforms[0]!.id);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number>(0);
  const [roleOpenIndex, setRoleOpenIndex] = useState<number>(0);

  const engagement = engagementModels.find((m) => m.id === engagementId) ?? engagementModels[0]!;
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
            <div className="rounded-[24px] border border-[#e5e5e5] bg-white px-6 py-12 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.22)] md:px-8">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
                {featuredPartnerCard.map((p) => (
                  <div
                    key={p.id}
                    className="flex min-h-[71px] items-center justify-center"
                  >
                    <Image src={p.image} alt={p.id} className={`${p.imageClass} h-auto max-w-full object-contain`} />
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

          <div className="mt-14 w-full overflow-hidden">
            <div className="flex w-max animate-[marquee_30s_linear_infinite] items-center gap-[18px]">
              {[...trustedLogoStrip, ...trustedLogoStrip].map((logo, i) => (
                <div key={`${logo.name}-${i}`} className="flex shrink-0 items-center justify-center" style={{ width: `${logo.width}px`, height: `${logo.height}px` }}>
                  <Image src={logo.image} alt={logo.name} width={logo.width} height={logo.height} className="h-auto w-auto max-h-full max-w-full object-contain" sizes={`${logo.width}px`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats — black */}
      <section className="bg-[#111111] py-20 text-white md:py-24">
        <div className="tb-container text-center">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-transparent px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#666666]" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#e5e5e5]">
              THE RAPIDLY GROWING COMPANY
            </p>
          </div>
          <h2 className="mx-auto mb-12 max-w-[1139px] text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl lg:text-[56px] lg:leading-[64px]">
            Transforming Today&apos;s Enterprises for Tomorrow&apos;s Innovation
          </h2>
          <div className="mx-auto grid max-w-[1036px] grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-x-[96px] md:gap-y-0">
            {[
              { n: "150+", l: "Tech Specialists Globally" },
              { n: "50+", l: "Enterprise Clients" },
              { n: "6", l: "Global Offices" },
              { n: "98%", l: "Client Satisfaction Rate" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`relative px-2 ${i > 0 ? "md:before:absolute md:before:-left-[48px] md:before:top-1 md:before:h-[78px] md:before:w-px md:before:bg-white/20 md:before:content-['']" : ""}`}
              >
                <div className="text-5xl font-bold leading-none tracking-[-0.02em] md:text-[56px]">{s.n}</div>
                <div className="mt-2 text-xs font-medium uppercase tracking-[0.02em] text-[#f7f7f7]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement models — Figma services: sidebar + detail */}
      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto w-full max-w-[1139px]">
            <div className="mb-16">
              <div className="mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-xs font-medium uppercase leading-4 text-[#666666]">OUR SERVICES</p>
              </div>
              <h2 className="mb-1 text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
                End-to-end delivery, <br />
                every engagement model
              </h2>
              <p className="max-w-[898px] text-[18px] leading-7 text-[#666666]">
                Whether you need a single specialist or an entire product team, we have the model that fits - AI-matched, timezone-aligned, and ready in hours.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-[300px_776px] lg:gap-[63px]">
              <div className="w-full">
                {engagementModels.map((m, index) => (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => setEngagementId(m.id)}
                      className={`flex h-[74px] w-full items-center rounded-[16px] px-[21px] text-left text-base font-bold leading-6 ${
                        engagementId === m.id ? "bg-[#111111] text-white" : "bg-white text-[#111111]"
                      }`}
                    >
                      {m.navLabel}
                    </button>
                    {index === 0 ? <div className="mb-3 mt-[17px] h-px w-full bg-[#e5e5e5]" /> : null}
                    {index === 1 ? <div className="mb-[13px] mt-2 h-px w-full bg-[#e5e5e5]" /> : null}
                  </div>
                ))}

                <div className="mt-6 rounded-[16px] border border-[#e5e5e5] px-[21px] py-[22px]">
                  <p className="text-sm font-semibold leading-5 text-[#06091a]">Not sure which fits?</p>
                  <p className="mt-3 whitespace-pre-line text-xs font-medium leading-4 text-[#666666]">
                    {"Talk to our solutions team - we'll find the\nright engagement model for your needs."}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-[17px] inline-flex h-[42px] w-[258px] items-center justify-center rounded-full bg-[#111111] text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Book a Free Call
                  </Link>
                </div>
              </div>

              <div className="w-full">
                <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.0025em] text-[#0e0f11]">{engagement.label}</h3>
                <p className="mt-1 text-base leading-6 text-[#838383]">{engagement.description}</p>

                <ul className="mt-8 grid gap-x-[11px] gap-y-4 sm:grid-cols-2">
                  {engagement.bullets.map((b, i) => {
                    const staffIcons = [Zap, Shield, Clock, DollarSign];
                    const IconComp = engagement.id === "staff" ? staffIcons[i] ?? Check : Check;
                    return (
                      <li key={b} className="flex items-center gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa]">
                          <IconComp className="h-[18px] w-[18px] text-[#111111]" strokeWidth={1.6} aria-hidden />
                        </span>
                        <span className="text-[28px] font-medium leading-[36px] tracking-[-0.0025em] text-[#111111]">{b}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 w-full max-w-[731px] rounded-[13px] border border-[#e5e5e5] bg-[#f7f7f7] px-5 py-5">
                  <p className="text-base font-semibold leading-6 text-black">Available expertise</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {engagement.tags.map((t, idx) => (
                      <span
                        key={`${t}-${idx}`}
                        className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-xs font-bold leading-4 text-[#666666]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — selected Figma section */}
      <section className="bg-[#fafafa] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto w-full max-w-[1139px]">
            <div className="text-center">
              <div className="mx-auto mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-xs font-medium leading-4 text-[#666666]">How It Works</p>
              </div>
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
                From first call to go-live in 4 steps
              </h2>
              <p className="mx-auto mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">
                We&apos;ve stripped out every unnecessary step so you can focus on building, not bureaucracy.
              </p>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-4 lg:gap-0">
              {deliverySteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative flex w-full flex-col items-center">
                    {/* left half connector: from cell left to icon left edge */}
                    {idx > 0 ? <div className="pointer-events-none absolute top-[28px] left-0 hidden h-px w-[calc(50%-28px)] bg-[#e5e5e5] lg:block" /> : null}
                    {/* right half connector: from icon right edge to cell right */}
                    {idx < deliverySteps.length - 1 ? <div className="pointer-events-none absolute top-[28px] left-[calc(50%+28px)] hidden h-px w-[calc(50%-28px)] bg-[#e5e5e5] lg:block" /> : null}
                    <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-[28px] border border-[#e5e5e5] bg-white">
                      <Icon className="h-[22px] w-[22px] text-[#111111]" strokeWidth={1.8} aria-hidden />
                    </div>
                    <h3 className="text-center text-base font-bold leading-6 text-[#111111]">{step.title}</h3>
                    <p className="mt-[10px] text-center text-sm leading-5 tracking-[0.0025em] text-[#666666]">{step.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex h-[52px] w-[262px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] text-sm font-semibold text-white"
              >
                Schedule a Free Consultation
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Your journey from request to results — sidebar nav */}
      <JourneySection />

      {/* Multi-Platform Expertise — Figma node 130:2046 */}
      <section className="bg-[#fafafa] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto w-full max-w-[1139px]">
            {/* Header */}
            <div className="mb-10">
              <div className="mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-xs font-medium leading-4 text-[#111111]">SOLUTIONS BY TECHNOLOGY</p>
              </div>
              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
                Multi-Platform Expertise
              </h2>
              <p className="mt-4 text-[18px] leading-7 text-[#666666]">
                Whether you need end-to-end implementation, integration, or specialist talent — we deliver certified expertise across the platforms that power enterprise business.
              </p>
            </div>

            {/* Tab nav */}
            <div className="mb-10 flex flex-wrap gap-3">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformId(p.id)}
                  className={`inline-flex h-[40px] items-center rounded-[35px] border px-5 text-base font-semibold transition-colors ${
                    platformId === p.id
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-[#e5e5e5] bg-white text-[#666666]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Content — left 607px / right 532px */}
            <div className="flex gap-0">
              {/* Left column */}
              <div className="w-[607px] shrink-0 pr-8">
                {/* Heading + body */}
                <div className="mb-8">
                  <h3 className="whitespace-pre-line text-[40px] font-semibold leading-[48px] tracking-[-0.0025em] text-[#111111]">
                    {platform.headline}
                  </h3>
                  <p className="mt-6 text-[16px] leading-6 text-[#666666]">{platform.body}</p>
                </div>

                {/* Feature rows */}
                <div className="flex flex-col gap-[8px]">
                  {platform.features.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-[15px] border border-[#e5e5e5] bg-white px-4 py-[16px]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 shrink-0 rounded-[4px] bg-[#666666]" aria-hidden />
                        <span className="text-[16px] font-semibold leading-6 text-[#06091a]">{f.title}</span>
                      </div>
                      <p className="mt-1.5 pl-5 text-[12px] font-medium leading-4 text-[#666666]">{f.sub}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <Link
                    href="/contact"
                    className="inline-flex h-[43px] w-[263px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
                  >
                    {platform.ctaLabel}
                    <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Right column — expertise card */}
              <div className="flex-1">
                <div className="rounded-[36px] border border-[#e2e7f4] bg-white overflow-hidden">
                  {/* Dark header */}
                  <div className="bg-[#111111] px-[30px] py-[22px]">
                    <p className="text-[28px] font-medium leading-[36px] tracking-[-0.0025em] text-white">{platform.cardTitle}</p>
                    <p className="mt-1 text-[12px] font-medium leading-4 text-[#e5e5e5]">{platform.cardSubtitle}</p>
                  </div>

                  {/* Stat cards */}
                  <div className="flex gap-[12px] px-[30px] pt-[24px]">
                    {platform.stats.map((s) => (
                      <div
                        key={s.label}
                        className="flex flex-1 flex-col items-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] py-[16px]"
                      >
                        <span className="text-[28px] font-medium leading-[36px] tracking-[-0.0025em] text-[#111111]">{s.value}</span>
                        <span className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Module tags */}
                  <div className="px-[30px] pb-[24px] pt-[20px]">
                    <p className="mb-3 text-[12px] font-medium leading-4 text-[#666666]">Modules &amp; Products</p>
                    <div className="flex flex-wrap gap-2">
                      {platform.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex h-[32px] items-center rounded-[100px] border border-[#e5e5e5] bg-[#fafafa] px-3 text-[12px] font-semibold text-[#111111]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech grid — Figma node 130:2512 */}
      <section className="bg-white py-[120px]">
        <div className="tb-container text-center">
          {/* Badge */}
          <div className="mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
            <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
            <p className="text-xs font-medium leading-4 text-[#666666]">ACROSS THE TECHNOLOGY OFFERINGS</p>
          </div>
          <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
            Technology Expertise
          </h2>
          <p className="mx-auto mt-2 text-[18px] leading-7 text-[#666666]">
            We work across the full enterprise technology stack.
          </p>
        </div>

        {/* Full-bleed grid */}
        <div className="mx-auto mt-12 max-w-[1591px] bg-[#e7e5e0]">
          <div className="grid grid-cols-4 gap-px md:grid-cols-8">
            {technologyCards.map((t) => (
              <div
                key={t.name}
                className="flex h-[112px] flex-col items-center justify-center bg-white"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  className="max-h-[48px] w-auto max-w-[130px] object-contain"
                />
                <span className="mt-2 text-[10px] font-medium tracking-[0.01em] text-[#737370]">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us bento — Figma node 144:60 */}
      <section className="bg-[#f7f7f7] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto w-full max-w-[1139px]">
            {/* Header */}
            <div className="mb-14">
              <div className="mb-5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-xs font-medium leading-4 text-[#111111]">Why Choose TechBubble</p>
              </div>
              <div className="flex items-start gap-10">
                <h2 className="w-[541px] shrink-0 text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
                  We&apos;re more than a<br />vendor. We&apos;re your tech partner.
                </h2>
                <p className="mt-3 text-[18px] leading-7 text-[#666666]">
                  We are more than a service provider — we&apos;re your trusted technology partner. Six reasons why 50+ enterprise clients choose TechBubble and stay with us year after year.
                </p>
              </div>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-12 gap-4">

              {/* Row 1 */}

              {/* HERO TILE — dark, 5 cols */}
              <div className="relative col-span-5 overflow-hidden rounded-[24px] bg-[#111111] p-8">
                {/* radial gradient decoration */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(54,54,54,0.2)_0%,rgba(88,88,88,0)_65%)]" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(90,90,90,0.1)_0%,rgba(52,52,52,0)_65%)]" />
                <p className="relative text-[28px] font-medium leading-[36px] tracking-[-0.0025em] text-[#e5e5e5]">
                  The world&apos;s top 1% of tech talent — AI-matched, timezone&#x2011;aligned, deployed in under 24 hours.
                </p>
              </div>

              {/* SCALE SPEED — 4 cols */}
              <div className="col-span-4 flex flex-col rounded-[24px] border border-[#e5e5e5] bg-white p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#f7f7f7]">
                  <Zap className="h-6 w-6 text-[#111111]" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Scale at Rapid Speed</h3>
                <p className="mt-3 flex-1 text-[16px] leading-6 text-[#838383]">
                  Deploy tailored tech solutions quickly with our AI-powered processes and global talent pool. Scale up or down with complete flexibility
                </p>
                <div className="mt-6 inline-flex h-[29px] items-center gap-2 rounded-[100px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                  <Zap className="h-3 w-3 text-[#111111]" strokeWidth={2} aria-hidden />
                  <span className="text-[12px] font-bold leading-4 text-[#111111]">AI-matched in &lt;24 hours</span>
                </div>
              </div>

              {/* HIRE THE BEST — 3 cols */}
              <div className="col-span-3 flex flex-col rounded-[24px] border border-[#e5e5e5] bg-white p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#f7f7f7]">
                  <Star className="h-6 w-6 text-[#111111]" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Hire the Best</h3>
                <p className="mt-3 flex-1 text-[16px] leading-6 text-[#838383]">
                  Rigorously vetted specialists with certified skills and enterprise experience — not generalists.
                </p>
                <div className="mt-6 inline-flex h-[29px] items-center gap-2 rounded-[100px] border border-[#e5e5e5] bg-[#666666] px-3">
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} aria-hidden />
                  <span className="text-[12px] font-bold leading-4 text-white">Top 1% globally, verified</span>
                </div>
              </div>

              {/* Row 2 */}

              {/* CLIENT RETENTION — 3 cols */}
              <div className="col-span-3 flex flex-col rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] p-8">
                <span className="text-[80px] font-black leading-[88px] tracking-[-0.01em] text-[#111111]">99%</span>
                <h3 className="mt-2 text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Client Retention</h3>
                <p className="text-[16px] leading-6 text-[#838383]">3 consecutive years</p>
                <div className="mt-5 rounded-[10px] border border-[#e5e5e5] bg-[#f7f7f7] p-4">
                  <p className="text-[12px] font-bold leading-4 text-[#666666]">Why clients stay</p>
                  <p className="mt-2 text-[14px] leading-5 tracking-[0.0025em] text-[#838383]">
                    Consistent quality, proactive governance, and a team that genuinely cares about your outcomes.
                  </p>
                </div>
              </div>

              {/* TIMEZONE — 6 cols */}
              <div className="col-span-6 rounded-[24px] border border-[#e5e5e5] bg-gradient-to-br from-[#f5f5f5] via-[#e9e9e9] to-[#eeeeee] p-8">
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Time Zone Alignment — Always</h3>
                <p className="mt-4 max-w-[305px] text-[16px] leading-6 text-[#666666]">
                  Your resources work your exact hours. Whether you&apos;re in Sydney, San Francisco, or London — real-time collaboration, zero overnight handoffs, maximum productivity every day.
                </p>
                {/* Timezone + world-clock row */}
                <div className="mt-6 flex items-end gap-6">
                  <div>
                    {/* Timezone pills row 1 */}
                    <div className="flex flex-wrap gap-2">
                      {["🇦🇺 AEST", "🇺🇸 EST / PST", "🇬🇧 GMT"].map((tz) => (
                        <span key={tz} className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-[12px] font-bold text-[#666666]">{tz}</span>
                      ))}
                    </div>
                    {/* Timezone pills row 2 */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["🇮🇳 IST", "🇵🇭 PHT"].map((tz) => (
                        <span key={tz} className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-[12px] font-bold text-[#666666]">{tz}</span>
                      ))}
                    </div>
                  </div>
                  {/* World clocks */}
                  <div className="flex flex-col gap-[8px]">
                    {[
                      { time: "17:08", city: "Sydney" },
                      { time: "06:08", city: "London" },
                      { time: "02:08", city: "New York" },
                      { time: "11:38", city: "Ahmedabad" },
                    ].map((c) => (
                      <div key={c.city} className="flex w-[154px] items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-2">
                        <span className="text-[16px] font-bold leading-6 text-[#666666]">{c.time}</span>
                        <span className="text-[10px] font-medium tracking-[0.01em] text-[#666666]">{c.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRICING — 3 cols */}
              <div className="col-span-3 flex flex-col rounded-[24px] border border-[#e5e5e5] bg-white p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#f7f7f7]">
                  <DollarSign className="h-6 w-6 text-[#111111]" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Fair Pricing</h3>
                <p className="mt-3 flex-1 text-[16px] leading-6 text-[#838383]">
                  Exceptional value at every tier. Show us any comparable quote and we&apos;ll beat it — zero compromise on talent quality or delivery.
                </p>
                <div className="mt-5 flex items-center justify-center rounded-[100px] border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3">
                  <span className="text-[12px] font-bold text-[#111111]">Beat-any-quote guarantee</span>
                </div>
              </div>

              {/* Row 3: left stack (SUPPORT + CTA) col 1–8, INNOVATION col 9–12 */}

              {/* SUPPORT — dark, col-span-8 */}
              <div className="col-span-8 rounded-[24px] bg-[#111111] p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-[#fafafa]">
                  <Shield className="h-8 w-8 text-[#111111]" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-white">24/7 Support &amp; Governance</h3>
                <p className="mt-4 max-w-[516px] text-[16px] leading-6 text-white">
                  Year-round, around-the-clock support from a dedicated governance team. Your operations never stop — neither do we. Every SLA is backed by a contractual commitment, 365 days a year.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["⚡ <2hr response", "📋 SLA-backed", "🌏 365 days/year", "🛡️ Governance included"].map((tag) => (
                    <span key={tag} className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-[12px] font-bold text-[#666666]">{tag}</span>
                  ))}
                </div>
              </div>

              {/* INNOVATION — col-span-4, row-span-2 */}
              <div className="col-span-4 row-span-2 flex flex-col rounded-[24px] border border-[#e5e5e5] bg-gradient-to-br from-[#f4f4f4] to-[#ededed] p-8">
                <div className="mb-6 flex h-[232px] w-full items-center justify-center rounded-[16px] bg-[#f7f7f7]">
                  <Image src={innovationImage} alt="Innovation circuit graphic" className="h-[120px] w-[120px] object-contain" />
                </div>
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-[#06091a]">Innovation &amp; Cutting-Edge Tech</h3>
                <p className="mt-3 flex-1 text-[16px] leading-6 text-[#838383]">
                  We adopt emerging frameworks and AI tools before your competitors do. Our engineers are continuously upskilled — your solutions stay modern, scalable, and future-ready.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["AI / ML", "Cloud-Native", "DevSecOps", "Microservices"].map((tag) => (
                    <span key={tag} className="inline-flex h-8 items-center rounded-[35px] border border-[#e5e5e5] bg-white px-4 text-[12px] font-bold text-[#666666]">{tag}</span>
                  ))}
                </div>
              </div>

              {/* BOTTOM CTA — dark gradient, col-span-8 */}
              <div className="col-span-8 rounded-[24px] bg-gradient-to-b from-[#06091a] to-[#2e2e2e] p-[48px]">
                <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.0025em] text-white">
                  Ready to experience the TechBubble difference?
                </h3>
                <p className="mt-4 max-w-[634px] text-[16px] leading-6 text-white">
                  Join 50+ enterprise organisations who trust us to power their most critical technology initiatives — talent, projects, and products.
                </p>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex h-[54px] w-[475px] items-center justify-between rounded-[100px] border border-[#e5e5e5] bg-white px-8 text-[16px] font-bold text-[#111111]"
                >
                  Book a Free Consultation
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Global Presence — Figma node 150:382 */}
      <section
        className="py-[120px]"
        style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}
      >
        <div className="tb-container">
          <div className="mx-auto flex max-w-[1139px] flex-col items-center">
            {/* Badge */}
            <div className="mb-10 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Global Presence</p>
            </div>
            {/* Heading */}
            <h2 className="text-center text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-white">
              6 offices. 3 continents.<br />One standard of excellence.
            </h2>
            {/* Subtext */}
            <p className="mt-6 max-w-[923px] text-center text-[18px] leading-7 text-[#e5e5e5]">
              A truly global delivery model — local expertise, international reach, and seamless collaboration across every timezone.
            </p>
            {/* Office cards */}
            <div className="mt-12 flex w-full gap-4">
              {[
                { flag: "🇦🇺", name: "Australia",   addr: "HQ · Sydney, NSW\nLevel 12, 126 Banks Ave" },
                { flag: "🇺🇸", name: "USA",          addr: "Wilmington, Delaware\n1007 N Orange St" },
                { flag: "🇮🇳", name: "India",        addr: "Ahmedabad, Gujarat\nK.P. Epitome Office" },
                { flag: "🇵🇭", name: "Philippines",  addr: "SE Asia Hub\nDelivery Centre" },
                { flag: "🇬🇧", name: "UK & ME",      addr: "London · Dubai\nRegional Offices" },
              ].map((o) => (
                <div
                  key={o.name}
                  className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-[#666666] bg-[#fafafa] py-8 text-center"
                >
                  <span className="text-[35px] leading-none">{o.flag}</span>
                  <p className="mt-4 text-[28px] font-bold leading-9 tracking-[-0.0025em] text-[#111111]">{o.name}</p>
                  <p className="mt-3 whitespace-pre-line text-[12px] font-medium leading-4 text-[#666666]">{o.addr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial — Figma node 150:465 */}
      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            {/* Header */}
            <div className="mb-12">
              <div className="mb-6 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Client Stories</p>
              </div>
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
                Trusted by people <br />who know technology best
              </h2>
            </div>
            {/* Quote */}
            <p className="text-[28px] font-medium leading-9 tracking-[-0.0025em] text-[#666666]">
              &ldquo;TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism, creativity, and technical expertise. What impressed us most was their ability to adapt to unforeseen challenges without compromising timelines or quality.&rdquo;
            </p>
            {/* Divider */}
            <div className="my-10 h-px w-full bg-[#e5e5e5]" />
            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full bg-[#e5e5e5]" />
                <div>
                  <p className="text-[18px] font-bold leading-6 tracking-[-0.0025em] text-[#06091a]">Haima Prakash</p>
                  <p className="mt-1 text-[16px] leading-6 text-[#838383]">
                    Sr. Manager, Chief Technology Office · University of Sydney
                  </p>
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

      {/* Case Studies — Figma node 150:622 */}
      <section className="bg-[#fafafa] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            {/* Header */}
              <div className="mb-8 flex items-end justify-between gap-8">
              <div>
                <div className="mb-6 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                  <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                  <p className="text-[12px] font-medium leading-4 text-[#111111]">Proven Results</p>
                </div>
                <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">Case Studies</h2>
                <p className="mt-3 text-[18px] leading-7 text-[#666666]">Proven success across diverse industries and challenges.</p>
              </div>
              <Link
                href="/case-studies"
                  className="inline-flex h-[43px] w-[206px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
              >
                View All Case Studies
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            {/* Filter tabs */}
              <div className="mb-8 flex items-center gap-2">
              {["All", "ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Staffing"].map((tab, i) => (
                <button
                  key={tab}
                    className={`inline-flex h-10 items-center rounded-[35px] border px-[23px] text-[16px] font-semibold leading-6 ${
                    i === 0
                        ? "border-[#e5e5e5] bg-[#111111] text-white"
                        : "border-[#e5e5e5] bg-white text-[#666666]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

              <div className="grid grid-cols-[746px_377px] gap-4">
                {/* Featured card */}
                <div className="flex h-[547px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white">
                  <div className="flex w-[518px] flex-col px-[37px] pb-[22px] pt-[26px]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-7 items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                        SERVICENOW
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[#666666]">
                        <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                        Wednesday, 8 April 2026
                      </span>
                    </div>
                    <div className="mt-[14px] h-[150px] w-[451px] overflow-hidden rounded-[15px] bg-[#e5e5e5]">
                      <Image src={caseStudyCampusImage} alt="University of Sydney campus" className="h-full w-full object-cover" />
                    </div>
                    <h3 className="mt-[19px] w-[446px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                      University of Sydney — Rapid IT Talent Deployment Across CTO Office
                    </h3>
                    <p className="mt-[7px] w-[446px] text-[16px] leading-6 text-[#666666]">
                      How TechBubble rebuilt NextCare&apos;s fragmented Salesforce environment from the ground up — delivering regulatory compliance, 60% faster reporting, and a care-worker-first UX within a non-negotiable deadline.
                    </p>
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex gap-[59px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-black">40%</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Efficiency gains</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-black">3</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Domains delivered</p>
                        </div>
                      </div>
                      <Link
                        href="/case-studies/university-of-sydney"
                        className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                      >
                        Read
                        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                      </Link>
                    </div>
                  </div>
                  <div className="flex w-[228px] shrink-0 flex-col bg-[#111111] px-[25px] py-[49px] text-white">
                    <p className="text-[12px] font-bold leading-4">ON THIS CASE STUDY</p>
                    <div className="mt-[15px]">
                      {[
                        { label: "Background", active: false },
                        { label: "The Challenge", active: false },
                        { label: "Our Solution", active: false },
                        { label: "Technology Stack", active: false },
                        { label: "Results", active: false },
                        { label: "Key Takeaways", active: true },
                      ].map((item) => (
                        <div key={item.label} className="flex h-[42px] items-center border-b border-[#e5e5e5] last:border-b-0">
                          <span className={`mr-[10px] h-[14px] w-[3px] rounded-[2px] ${item.active ? "bg-[#086eff]" : "bg-white"}`} aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-white">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toyota card */}
                <div className="flex h-[547px] flex-col rounded-[24px] border border-[#e5e5e5] bg-white px-[30px] pb-[26px] pt-9">
                  <div className="flex flex-1 flex-col border-b border-[#eff2f7] pb-[52px]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                        SERVICENOW
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[#666666]">
                        <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                        Wednesday, 8 April 2026
                      </span>
                    </div>
                    <h3 className="mt-[13px] w-[317px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                      Toyota USA — Enterprise ServiceNow Implementation
                    </h3>
                    <p className="mt-[16px] w-[319px] text-[16px] leading-6 text-[#666666]">
                      Toyota USA required a ServiceNow partner who could combine deep technical xpertise with the agility to handle a complex, multi-domain rollout. TechBubble delivered a comprehensive implementation covering ITSM, CSM, and custom workflows — with post-launch support that ensured zero business disruption.
                    </p>
                  </div>
                  <div className="flex items-end justify-between pt-[21px]">
                    <div className="flex gap-[31px]">
                      <div>
                        <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-black">40%</p>
                        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Efficiency gains</p>
                      </div>
                      <div>
                        <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-black">3</p>
                        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Domains delivered</p>
                      </div>
                    </div>
                    <Link
                      href="/case-studies/toyota-usa"
                      className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                    >
                      Read
                      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="mt-4 grid grid-cols-3 gap-4">
              {[
                {
                  tag: "SALESFORCE",
                  title: "NextCare Aged Services — Salesforce UX Overhaul",
                    body: "NextCare needed a complete re-architecture of their Salesforce environment to support growing operational complexity across multiple care facilities. TechBubble rebuilt their data model, redesigned user-facing flows, anddelivered a custom reporting layer — meeting tight regulatory deadlines.",
                  stats: [{ v: "60%", l: "Faster reporting" }, { v: "5 star", l: "Client rating" }],
                  slug: "nextcare",
                },
                {
                  tag: "STAFFING",
                  title: "BrainPower LLC — Offshore Talent Program at Scale",
                    body: "Skeptical of offshore models, Brainpower LLC partnered with TechBubble to pilot an offshore staffing program across five concurrent client engagements. TechBubble's governance model and timezone-aligned teams removed every hesitation — delivering consistent quality across all projects.",
                  stats: [{ v: "5", l: "Clients served" }, { v: "35%", l: "Cost reduction" }],
                  slug: "brainpower",
                },
                  {
                    tag: "SALESFORCE",
                    title: "Nidi Tech Solutions — Salesforce Process Transformation",
                    body: "Nidi Tech required a highly configurable Salesforce solution aligned to complex business logic across their sales and service operations. TechBubble delivered an end-to-end implementation that significantly improved operational efficiency and customer satisfaction scores within the first quarter post-launch.",
                    stats: [{ v: "45%", l: "Ops efficiency uplift" }, { v: "Q1", l: "ROI realised in" }],
                    slug: "nidi-tech",
                  },
              ].map((c) => (
                  <div key={c.slug} className="flex h-[494px] flex-col rounded-[24px] border border-[#e2e7f4] bg-white px-9 pb-[23px] pt-9">
                    <div className="flex flex-1 flex-col border-b border-[#eff2f7] pb-[19px]">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex h-[28px] w-fit items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          {c.tag}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[#666666]">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          Wednesday, 8 April 2026
                        </span>
                      </div>
                      <h3 className="mt-[9px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">{c.title}</h3>
                      <p className="mt-[13px] flex-1 text-[16px] leading-6 text-[#666666]">{c.body}</p>
                    </div>
                    <div className="flex items-end justify-between pt-4">
                      <div className="flex gap-[44px]">
                        {c.stats.map((s) => (
                          <div key={s.l}>
                            <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-black">{s.v}</p>
                            <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{s.l}</p>
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/case-studies/${c.slug}`}
                        className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                      >
                        Read
                        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/case-studies"
                  className="inline-flex h-[43px] w-[224px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                >
                  Explore All Case Studies
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="bg-[#e5e5e5] py-[112px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[360px_704px] gap-[72px]">
            <div>
              <div className="mb-[6px] inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">FAQ</p>
              </div>
              <h2 className="max-w-[385px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Questions we
                <br />
                hear all the
                <br />
                time
              </h2>
              <p className="mt-4 max-w-[369px] text-[18px] leading-7 text-[#666666]">
                Can&apos;t find what you&apos;re looking for? Our team is happy to answer any questions directly.
              </p>
              <Link
                href="/contact"
                className="mt-[31px] inline-flex h-[43px] w-[125px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
              >
                Talk to us
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>
            <div className="space-y-[8.83px]">
              {faqItems.map((item, idx) => {
                const open = faqOpenIndex === idx;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-[16px] border border-[#f7f7f7] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpenIndex(open ? -1 : idx)}
                      className={`flex w-full items-start justify-between text-left ${open ? "px-[22px] pb-0 pt-[19px]" : "px-[22px] py-[18px]"}`}
                    >
                      <span className={`pr-6 text-[16px] font-bold leading-6 ${open ? "text-[#111111]" : "text-[#666666]"}`}>
                        {item.question}
                      </span>
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-[14px] ${open ? "h-[39.6px] w-[39.6px] border border-[#111111] bg-[#111111]" : "h-7 w-7 border border-[#e5e5e5] bg-[#fafafa]"}`}
                        aria-hidden
                      >
                        {open ? (
                          <Minus className="h-[19.8px] w-[19.8px] text-white" strokeWidth={2} />
                        ) : (
                          <Plus className="h-[14px] w-[14px] text-[#666666]" strokeWidth={2} />
                        )}
                      </span>
                    </button>
                    {open ? (
                      <div className="px-[22px] pb-[19px] pt-0">
                        <p className="max-w-[658px] text-[16px] leading-6 text-[#666666]">{item.answer}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule demo */}
      <section
        className="relative overflow-hidden py-[186px] text-white"
        style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}
      >
        <div className="pointer-events-none absolute left-[-125px] top-[456px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_rgba(76,76,76,0.12)_0%,_rgba(56,56,56,0)_65%)]" />
        <div className="pointer-events-none absolute left-[1545px] top-[-106px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_rgba(127,127,127,0.10)_0%,_rgba(142,142,142,0)_65%)]" />
        <div className="relative tb-container">
          <div className="mx-auto grid max-w-[1137px] grid-cols-[604px_420px] items-start justify-between gap-[63px]">
            <div className="pt-[67px]">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">GET STARTED TODAY</p>
              </div>
              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-white">
                Schedule a Free Demo
                <br />
                with Our Experts
              </h2>
              <p className="mt-1 max-w-[604px] text-[18px] leading-7 text-[#e5e5e5]">
                Book a no-obligation consultation and discover exactly how TechBubble can accelerate your next initiative — talent, technology, or transformation.
              </p>
              <div className="mt-12 flex items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-[49px] w-[208px] items-center justify-center gap-[12px] whitespace-nowrap rounded-[18px] bg-white px-5 text-[16px] font-semibold text-[#111111]"
                >
                  Book a Free Demo
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-[49px] w-[163px] items-center justify-center gap-[12px] whitespace-nowrap rounded-[18px] border border-[#666666] px-5 text-[16px] font-semibold text-[#e5e5e5]"
                >
                  View Pricing
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
                {[
                  "Response within 24 hours",
                  "Free consultation call",
                  "Zero obligation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
                      <Check className="h-[10px] w-[10px] text-[#111111]" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="text-[12px] font-medium leading-4 text-[#e5e5e5]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <form className="rounded-[28px] border border-white/10 bg-white/[0.06] px-[37px] pb-[31px] pt-[31px] backdrop-blur-[20px]">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">Get in Touch</h3>
              <p className="mt-1 max-w-[329px] text-[14px] leading-5 tracking-[0.035px] text-[#e5e5e5]">
                Fill in your details and our team will reach out within 24 hours.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-[14px]">
                <input
                  aria-label="First Name"
                  placeholder="First Name"
                  className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  aria-label="Last Name"
                  placeholder="Last Name"
                  className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  aria-label="Work Email"
                  placeholder="Work Email"
                  className="col-span-2 h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  aria-label="Phone Number"
                  placeholder="Phone Number"
                  className="col-span-2 h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  aria-label="Company Name"
                  placeholder="Company Name"
                  className="col-span-2 h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <div className="relative col-span-2">
                  <select
                    aria-label="What are you looking for?"
                    defaultValue=""
                    className="h-[48px] w-full appearance-none rounded-[14px] border border-white/15 bg-white/[0.08] px-[21px] pr-12 text-[14px] text-white/60 focus:outline-none"
                  >
                    <option value="" disabled>
                      What are you looking for?
                    </option>
                    <option>Staff Augmentation</option>
                    <option>Project Delivery</option>
                    <option>Managed Services</option>
                    <option>Platform Consulting</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/60" strokeWidth={1.8} aria-hidden />
                </div>
                <button
                  type="button"
                  className="col-span-2 inline-flex h-[48px] items-center justify-center gap-3 whitespace-nowrap rounded-[18px] bg-white px-5 text-[16px] font-semibold text-[#111111]"
                >
                  Get Started Free
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Careers — Figma node 156:1278 */}
      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[691px_413px] gap-8">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">We&apos;re Hiring</p>
              </div>
              <h2 className="mt-2 max-w-[640px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Join Our Global Team of Tech Innovators
              </h2>
              <p className="mt-2 max-w-[590px] text-[18px] leading-7 text-[#666666]">
                Work on enterprise-scale projects alongside world-class engineers and AI specialists. Remote-friendly roles across Australia, India, Philippines, USA and beyond.
              </p>

              <Link
                href="/careers"
                className="mt-10 inline-flex h-[51px] w-[191px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
              >
                Browse Open Roles
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { title: "Senior ServiceNow Developer", meta: "🇦🇺 Australia · Full-time · Remote" },
                { title: "Salesforce Solutions Architect", meta: "🇺🇸 USA · Contract · Remote" },
                { title: "AI / ML Engineer", meta: "🇮🇳 India · Full-time · Hybrid" },
                { title: "MuleSoft Integration Specialist", meta: "🇵🇭 Philippines · Contract · Remote" },
              ].map((role) => (
                <Link
                  key={role.title}
                  href="/careers"
                  className="flex h-[78px] items-center justify-between rounded-[24px] border border-[#e5e5e5] bg-white px-6"
                >
                  <div>
                    <p className="text-[16px] font-bold leading-6 text-[#111111]">{role.title}</p>
                    <p className="text-[14px] leading-5 tracking-[0.035px] text-[#7a7f8e]">{role.meta}</p>
                  </div>
                  <ArrowRight className="h-[18px] w-[18px] text-[#111111]" strokeWidth={2} aria-hidden />
                </Link>
              ))}

              <Link href="/careers" className="mt-[2px] inline-flex items-center gap-2 px-[23px] py-[9px]">
                <span className="text-[16px] font-bold leading-6 text-[#666666]">View all open positions</span>
                <ArrowRight className="h-4 w-4 text-[#666666]" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Careers CTA — Figma node 159:1355 */}
      <section className="bg-[#f7f7f7] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[751px_353px] gap-8">
            <div>
              <h3 className="max-w-[751px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Ready to build your dream team in under 24 hours?
              </h3>
              <p className="mt-2 max-w-[751px] whitespace-pre-line text-[18px] leading-7 text-[#666666]">
                {"Join 50+ enterprises who trust TechBubble to power their most critical\ntechnology initiatives."}
              </p>
            </div>

            <div className="pt-[0px]">
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-[51px] w-[118px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                >
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  Email Us
                </Link>
                <a
                  href="tel:+611300934031"
                  className="inline-flex h-[51px] w-[159px] items-center justify-center whitespace-nowrap rounded-[18px] border border-[#e5e5e5] bg-[#e5e5e5] px-4 text-[14px] font-semibold text-[#111111]"
                >
                  (+61) 1300 934 031
                </a>
              </div>

              <div className="ml-8 mt-8 space-y-4">
                {[
                  "No commitment required",
                  "Response within 2 hours",
                  "Free consultation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
                      <Check className="h-[10px] w-[10px] text-[#111111]" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="text-[14px] font-semibold leading-5 text-[#666666]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

const journeySteps = [
  {
    num: "01",
    category: "SPEED & SCALE",
    title: "Submit your request",
    badgeLabel: "Step 01 — Speed & Scale",
    heading: "You submit a request.\nWe start matching in hours.",
    body: "Traditional hiring takes weeks of job posts, screeners, and interviews. Our AI-matching engine identifies the ideal candidate profile within hours of your request — pre-vetted, certified, and timezone-aligned.",
    stats: [
      { value: "<4h", label: "First shortlist delivered" },
      { value: "70%", label: "Faster than traditional hiring" },
      { value: "150+", label: "Specialists ready now" },
    ],
    features: [
      { title: "AI-powered matching", sub: "Automated skills, timezone & culture fit scoring" },
      { title: "Pre-vetted only", sub: "Multi-stage technical vetting before any proposal" },
      { title: "Timezone Aligned", sub: "Resources matched to your exact working hours" },
      { title: "Scale anytime", sub: "No minimum contract — flex up or down freely" },
    ],
    cta: "Submit a request",
    ctaNote: "Response within 4 hours, guaranteed",
  },
  {
    num: "02",
    category: "CANDIDATE SELECTION",
    title: "Choose your specialist",
    badgeLabel: "Step 02 — Candidate Selection",
    heading: "Review shortlist.\nPick who you want.",
    body: "You receive a curated shortlist of pre-vetted specialists who match your exact requirements — skills, experience, timezone, and cultural fit. Review profiles and conduct a quick intro call before you commit.",
    stats: [
      { value: "3–5", label: "Candidates per shortlist" },
      { value: "100%", label: "Pre-vetted profiles" },
      { value: "48h", label: "Shortlist turnaround" },
    ],
    features: [
      { title: "Curated shortlists", sub: "Only the best-matched profiles for your request" },
      { title: "Intro calls included", sub: "Meet candidates before you make a decision" },
      { title: "Skills verified", sub: "Technical assessments completed before proposal" },
      { title: "No commitment", sub: "Review and decide with zero pressure" },
    ],
    cta: "Submit a request",
    ctaNote: "Response within 4 hours, guaranteed",
  },
  {
    num: "03",
    category: "ONBOARDING",
    title: "Productive in 24 hours",
    badgeLabel: "Step 03 — Onboarding",
    heading: "Signed today.\nDelivering tomorrow.",
    body: "Our structured onboarding playbook gets your specialist integrated into your team fast — access provisioned, tools configured, and your first standup completed within 24 hours of contract sign.",
    stats: [
      { value: "24h", label: "From sign to first delivery" },
      { value: "100%", label: "Governance embedded" },
      { value: "0", label: "Disruption to your team" },
    ],
    features: [
      { title: "Lightning Onboarding", sub: "Access provisioned and tools configured in hours" },
      { title: "Governance built in", sub: "Delivery standards enforced from day one" },
      { title: "Team integration", sub: "Standup, docs, and comms channels set up immediately" },
      { title: "Knowledge transfer", sub: "Structured docs ensure continuity at any time" },
    ],
    cta: "Submit a request",
    ctaNote: "Response within 4 hours, guaranteed",
  },
  {
    num: "04",
    category: "DELIVERY & GOVERNANCE",
    title: "On-time. On-budget.",
    badgeLabel: "Step 04 — Delivery & Governance",
    heading: "Predictable delivery.\nFull transparency.",
    body: "Weekly reporting, milestone tracking, and proactive risk management keep your project on track. You get full visibility into progress with no surprises — and a dedicated account manager who genuinely cares.",
    stats: [
      { value: "98%", label: "On-time delivery rate" },
      { value: "Weekly", label: "Progress reports" },
      { value: "24/7", label: "Support availability" },
    ],
    features: [
      { title: "Weekly reporting", sub: "Progress, risks, and milestones at every step" },
      { title: "Milestone billing", sub: "You only pay when deliverables are met" },
      { title: "Dedicated AM", sub: "A single point of accountability throughout" },
      { title: "Risk management", sub: "Issues flagged and resolved before they escalate" },
    ],
    cta: "Submit a request",
    ctaNote: "Response within 4 hours, guaranteed",
  },
  {
    num: "05",
    category: "TECHNOLOGY DEPTH",
    title: "18+ certified platforms",
    badgeLabel: "Step 05 — Technology Depth",
    heading: "Deep expertise across\n18+ enterprise platforms.",
    body: "From ServiceNow to Salesforce, MuleSoft to Azure — our certified specialists bring deep platform knowledge and real-world delivery experience across the full enterprise technology stack.",
    stats: [
      { value: "18+", label: "Certified platforms" },
      { value: "150+", label: "Certified specialists" },
      { value: "10+", label: "Years of delivery" },
    ],
    features: [
      { title: "Certified specialists", sub: "Platform-certified across every major technology" },
      { title: "Real-world delivery", sub: "Hands-on project experience, not just certificates" },
      { title: "Full stack coverage", sub: "Frontend, backend, data, cloud, and integration" },
      { title: "Continuous learning", sub: "Teams stay current with every platform release" },
    ],
    cta: "Submit a request",
    ctaNote: "Response within 4 hours, guaranteed",
  },
];

function JourneySection() {
  const [activeStep, setActiveStep] = useState(0);
  const step = journeySteps[activeStep]!;

  return (
    <section className="bg-white py-[120px]">
      <div className="tb-container">
        <div className="mx-auto w-full max-w-[1139px]">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-xs font-medium leading-4 text-[#666666]">The TechBubble Advantage</p>
            </div>
            <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
              Your journey from request
              <br />
              to results — broken down
            </h2>
            <p className="mx-auto mt-1 max-w-[923px] text-[18px] leading-7 text-[#666666]">
              Five steps. One trusted partner. See exactly how TechBubble turns a talent or technology request into measurable outcomes — faster and more transparently than any traditional model.
            </p>
          </div>

          {/* Card */}
          <div className="mt-16 flex overflow-hidden rounded-[36px] border border-[#e5e5e5]">
            {/* Left nav */}
            <div className="w-[339px] shrink-0 border-r border-[#e5e5e5] bg-white">
              <div className="pt-[48px] pb-[48px]">
                {journeySteps.map((s, idx) => (
                  <div key={s.num}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      className={`flex h-[86px] w-full items-center gap-3 px-6 text-left transition-colors ${
                        activeStep === idx ? "bg-[#f7f7f7]" : "bg-transparent hover:bg-[#fafafa]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] text-[14px] font-semibold leading-5 ${
                          activeStep === idx
                            ? "bg-[#111111] text-white"
                            : "border border-[#e5e5e5] bg-[#f7f7f7] text-[#666666]"
                        }`}
                      >
                        {s.num}
                      </span>
                      <div>
                        <p className="text-[10px] font-medium leading-[14px] tracking-[0.01em] text-[#666666]">
                          {s.category}
                        </p>
                        <p className="text-[16px] font-bold leading-6 text-[#000000]">{s.title}</p>
                      </div>
                    </button>
                    {idx < journeySteps.length - 1 && (
                      <div className="flex h-[33px] items-center pl-[40px]">
                        <div className="h-[33px] w-[1.5px] bg-[#e2e7f4]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right content */}
            <div className="flex flex-1 flex-col px-12 py-12">
              {/* Badge */}
              <div className="inline-flex h-7 items-center gap-2 self-start rounded-[24px] border border-[#e5e5e5] bg-[#111111] px-3">
                <p className="text-xs font-medium leading-4 text-white">{step.badgeLabel}</p>
              </div>

              {/* Heading + body */}
              <h3 className="mt-9 whitespace-pre-line text-[40px] font-semibold leading-[48px] tracking-[-0.0025em] text-[#0e0f11]">
                {step.heading}
              </h3>
              <p className="mt-3 text-[16px] leading-6 text-[#838383]">{step.body}</p>

              {/* Stat cards */}
              <div className="mt-10 flex flex-wrap gap-4">
                {step.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col justify-center rounded-[16px] border border-[#e5e5e5] bg-white px-4 py-5"
                  >
                    <p className="text-[28px] font-medium leading-9 tracking-[-0.0025em] text-[#111111]">
                      {stat.value}
                    </p>
                    <p className="text-[12px] font-medium leading-4 text-[#666666]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Feature grid */}
              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
                {step.features.map((feat) => (
                  <div key={feat.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white">
                      <Check className="h-[18px] w-[18px] text-[#111111]" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div>
                      <p className="text-[28px] font-medium leading-9 tracking-[-0.0025em] text-[#111111]">
                        {feat.title}
                      </p>
                      <p className="text-[12px] font-medium leading-4 text-[#838383]">{feat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div className="mt-auto pt-10 flex items-center gap-6">
                <Link
                  href="/contact"
                  className="inline-flex h-[43px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] bg-[#111111] px-4 text-[14px] font-semibold text-white"
                >
                  {step.cta}
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
                <p className="text-[14px] leading-5 text-[#666666]">{step.ctaNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
