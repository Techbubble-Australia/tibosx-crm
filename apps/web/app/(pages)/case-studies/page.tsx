import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Workflow, Share2, FileStack, Braces, Handshake } from "lucide-react";
import caseStudyFeaturedImage from "@/src/image/frame_1_2.jpg";
import { ClientStoriesSection } from "@/components/ClientStoriesSection";

const categories = ["All", "ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Staffing"];

const caseStudies = [
  {
    slug: "university-of-sydney-rapid-it-talent",
    category: "ServiceNow",
    title: "University of Sydney — Rapid IT Talent Deployment Across CTO Office",
    description: "How TechBubble rebuilt NextCare's fragmented Salesforce environment from the ground up — delivering regulatory compliance, 60% faster reporting, and a care worker-first UX within a non-negotiable deadline.",
    image: "/images/case-studies/university-sydney.jpg",
    stat1: { value: "40%", label: "Efficiency gains" },
    stat2: { value: "3", label: "Domains delivered" },
    date: "Wednesday, 9 April 2025",
    featured: true,
    sidebar: [
      { label: "Background", href: "#background" },
      { label: "The Challenge", href: "#challenge" },
      { label: "Our Solution", href: "#solution" },
      { label: "Technology Stack", href: "#tech-stack" },
      { label: "Results", href: "#results" },
      { label: "Key Takeaways", href: "#takeaways" },
    ],
  },
  {
    slug: "toyota-usa-servicenow",
    category: "ServiceNow",
    title: "Toyota USA — Enterprise ServiceNow Implementation",
    description: "Toyota USA required a ServiceNow partner who could combine deep technical expertise with the agility to handle a complex, multi-domain rollout. TechBubble delivered a comprehensive implementation covering ITSM, CSM, and custom workflows — with post-launch support that ensured zero business disruption.",
    image: "/images/case-studies/toyota.jpg",
    stat1: { value: "40%", label: "Efficiency gains" },
    stat2: { value: "3", label: "Domains delivered" },
    date: "Wednesday, 9 April 2025",
    featured: false,
  },
  {
    slug: "nextcare-salesforce",
    category: "Salesforce",
    title: "NextCare Aged Services — Salesforce UX Overhaul",
    description: "NextCare needed a complete re-architecture of their Salesforce environment to support growing operational complexity across multiple care facilities. TechBubble rebuilt their data model, redesigned user-facing flows, and delivered a custom reporting layer — meeting tight regulatory deadlines.",
    image: "/images/case-studies/nextcare.jpg",
    stat1: { value: "60%", label: "Faster reporting" },
    stat2: { value: "5 star", label: "Client rating" },
    date: "Wednesday, 9 April 2025",
    featured: false,
  },
  {
    slug: "brainpower-offshore",
    category: "Staffing",
    title: "BrainPower LLC — Offshore Talent Program at Scale",
    description: "Skeptical of offshore models, BrainPower LLC partnered with TechBubble to pilot an offshore staffing program across five concurrent client engagements. TechBubble's governance model and timezone-aligned teams removed every hesitation — delivering consistent quality across all projects.",
    image: "/images/case-studies/brainpower.jpg",
    stat1: { value: "5", label: "Clients served" },
    stat2: { value: "35%", label: "Cost reduction" },
    date: "Wednesday, 9 April 2025",
    featured: false,
  },
  {
    slug: "nidi-tech-salesforce",
    category: "Salesforce",
    title: "Nidi Tech Solutions — Salesforce Process Transformation",
    description: "Nidi Tech required a highly configurable Salesforce solution aligned to complex business logic across their sales and service operations. TechBubble delivered an end-to-end implementation that significantly improved operational efficiency and customer satisfaction scores within the first quarter post-launch.",
    image: "/images/case-studies/nidi.jpg",
    stat1: { value: "45%", label: "Op. efficiency uplift" },
    stat2: { value: "Q1", label: "ROI realised in" },
    date: "Wednesday, 9 April 2025",
    featured: false,
  },
];

const practices = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "ServiceNow",
    description: "Cross-functional teams working across geographies, sharing knowledge and lifting each other up.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Salesforce",
    description: "Comprehensive implementation across Sales, Service, Marketing, Commerce, Health & Education Cloud — plus Omnistudio and Vlocity.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "MuleSoft",
    description: "Expert API-led integration services covering Anypoint Platform, API management, cloud-based solutions, and B2B integrations.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "SharePoint",
    description: "SharePoint Online, Server & Power Platform integrations — collaboration, document management, and workflow automation.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Custom & AI Apps",
    description: "Java, D365, React, Mobile (iOS/Android), AI/ML, Python — custom solutions built to your exact requirements.",
  },
];

export default function CaseStudiesPage() {
  const featuredStudy = caseStudies.find(s => s.featured);
  const regularStudies = caseStudies.filter(s => !s.featured);
  const topRightStudy = regularStudies[0];
  const lowerStudies = regularStudies.slice(1, 4);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-white">Real Results for Real Enterprises</h1>
            <p className="mt-1 max-w-[976px] text-[18px] leading-7 text-[#e5e5e5]">
              From government-scale ServiceNow transformations to Salesforce CRM overhauls — see how TechBubble delivers measurable outcomes across industries and platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip — node 205:2838 */}
      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            <div className="w-[530px] px-2">
              <p className="text-[16px] font-bold leading-6 text-[#111111]">
                Deep-dives into how TechBubble has helped enterprises across Asia Pacific and North America transform their technology operations — with measurable outcomes.
              </p>
            </div>

            <span className="mx-[6px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden />

            <div className="w-[169px] text-center">
              <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#111111]">200+</p>
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Clients served</p>
            </div>

            <span className="mx-[6px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden />

            <div className="w-[169px] text-center">
              <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#111111]">500+</p>
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Projects delivered</p>
            </div>

            <span className="mx-[6px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden />

            <div className="w-[169px] text-center">
              <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#111111]">98%</p>
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Satisfaction rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies by Practice — node 205:2573 */}
      <section className="py-[100px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Work</p>
            </div>
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Case Studies by Practice</h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">
              Explore how we&apos;ve helped leading enterprises transform operations, reduce costs, and accelerate growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((cat, index) => (
                <button
                  key={cat}
                  className={`inline-flex h-10 items-center rounded-[35px] border border-[#e5e5e5] px-[23px] text-[16px] font-semibold leading-6 transition-colors ${
                    index === 0 ? "bg-[#111111] text-white" : "bg-white text-[#666666] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {featuredStudy && topRightStudy ? (
              <div className="mt-8">
                <div className="grid grid-cols-[746px_377px] gap-4">
                  <Link
                    href={`/case-studies/${featuredStudy.slug}`}
                    className="group flex h-[547px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white"
                  >
                    <div className="flex h-full w-[518px] flex-col px-[33px] pb-6 pt-[26px]">
                      <div className="flex w-[451px] items-center justify-between">
                        <div className="inline-flex h-7 items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          SERVICENOW
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-[#666666]">Wednesday, 8 April 2026</span>
                        </div>
                      </div>

                      <div className="relative mt-[14px] h-[150px] w-[451px] overflow-hidden rounded-[8px]">
                        <Image
                          src={caseStudyFeaturedImage}
                          alt="University of Sydney campus"
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 1200px) 100vw, 451px"
                        />
                      </div>

                      <h3 className="mt-[18px] w-[446px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                        University of Sydney — Rapid IT Talent Deployment Across CTO Office
                      </h3>
                      <p className="mt-[6px] w-[446px] line-clamp-5 text-[16px] leading-6 text-[#666666]">
                        The University&apos;s CTO Office needed specialized ServiceNow and SharePoint professionals on short notice to support a critical digital transformation initiative. TechBubble leveraged its AI-matching process to deliver pre-vetted, senior-level engineers within days — fully aligned to the University&apos;s working hours and internal delivery standards.
                      </p>

                      <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">40%</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Efficiency gains</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">3</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">Domains delivered</p>
                        </div>
                        <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                          Read
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                    </div>

                    <div className="w-[228px] bg-[#111111] px-[25px] pt-[49px] text-white">
                      <p className="text-[12px] font-bold leading-4">ON THIS CASE STUDY</p>
                      <div className="mt-[15px]">
                        {featuredStudy.sidebar?.map((item, idx) => (
                          <div key={item.label} className={`flex h-[42px] items-center border-[#e5e5e5] ${idx < 5 ? "border-b" : ""}`}>
                            <span className={`mr-[10px] h-[14px] w-[3px] rounded-[2px] ${idx === featuredStudy.sidebar.length - 1 ? "bg-[#086eff]" : "bg-white"}`} />
                            <span className="text-[12px] font-medium leading-4 text-white">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/case-studies/${topRightStudy.slug}`}
                    className="group flex h-[547px] flex-col rounded-[24px] border border-[#e5e5e5] bg-white px-[30px] pb-[30px] pt-9"
                  >
                    <div className="flex items-center justify-between">
                      <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                        {topRightStudy.category.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                        <span className="text-[12px] font-medium leading-4 text-[#666666]">Wednesday, 8 April 2026</span>
                      </div>
                    </div>

                    <h3 className="mt-[13px] w-[317px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                      {topRightStudy.title}
                    </h3>
                    <p className="mt-4 w-[319px] line-clamp-6 text-[16px] leading-6 text-[#666666]">
                      {topRightStudy.description}
                    </p>

                    <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px]">
                      <div>
                        <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{topRightStudy.stat1.value}</p>
                        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{topRightStudy.stat1.label}</p>
                      </div>
                      <div>
                        <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{topRightStudy.stat2.value}</p>
                        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{topRightStudy.stat2.label}</p>
                      </div>
                      <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                        Read
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  {lowerStudies.map((study, index) => (
                    <Link
                      key={study.slug}
                      href={`/case-studies/${study.slug}`}
                      className="group flex h-[494px] flex-col rounded-[24px] border border-[#e2e7f4] bg-white px-9 pb-6 pt-9"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          {study.category.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-[#666666]">Wednesday, 8 April 2026</span>
                        </div>
                      </div>

                      <h3 className="mt-[12px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                        {study.title}
                      </h3>
                      <p className="mt-[12px] line-clamp-6 text-[16px] leading-6 text-[#666666]">
                        {study.description}
                      </p>

                      <span className="mt-[21px] block h-px w-full bg-[#e5e5e5]" aria-hidden />

                      <div className="mt-auto flex items-end justify-between pt-[21px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{study.stat1.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{study.stat1.label}</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{study.stat2.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{study.stat2.label}</p>
                        </div>
                        <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                          Read
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Deep Expertise Section — node 205:2669 */}
      <section className="bg-[#e5e5e5] py-[100px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Practice Areas</p>
            </div>

            <h2 className="mt-2 max-w-[898px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
              Deep Expertise Across 5 Platform
              <br />
              Practices
            </h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">
              We&apos;ve built a culture where talented people do the best work of their careers — and have fun doing it.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { title: "ServiceNow", description: "Cross-functional teams working across geographies, sharing knowledge and lifting each other up.", icon: <Zap className="h-6 w-6 text-[#111111]" /> },
                { title: "Salesforce", description: "Comprehensive implementation across Sales, Service, Marketing, Commerce, Health & Education Cloud — plus Omnistudio and Vlocity.", icon: <Workflow className="h-6 w-6 text-[#111111]" /> },
                { title: "MuleSoft", description: "Expert API-led integration services covering Anypoint Platform, API management, cloud-based solutions, and B2B integrations.", icon: <Share2 className="h-6 w-6 text-[#111111]" /> },
                { title: "SharePoint", description: "SharePoint Online, Server & Power Platform integrations — collaboration, document management, and workflow automation.", icon: <FileStack className="h-6 w-6 text-[#111111]" /> },
                { title: "Custom & AI Apps", description: "Java, D365, React, Mobile (iOS/Android), AI/ML, Python — custom solutions built to your exact requirements.", icon: <Braces className="h-6 w-6 text-[#111111]" /> },
              ].map((item) => (
                <div key={item.title} className="h-[305px] rounded-[15px] border border-[#e5e5e5] bg-[#f7f7f7] px-[22px] pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-white">{item.icon}</div>

                  <h3 className="mt-4 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">{item.title}</h3>
                  <p className="mt-1 text-[16px] leading-6 text-[#666666]">{item.description}</p>

                  <button className="mt-4 inline-flex h-[29px] items-center gap-[10px] rounded-[18px] text-[14px] font-semibold leading-5 text-[#666666]">
                    Explore Practice
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </button>
                </div>
              ))}

              <div className="h-[305px] rounded-[15px] border border-[#e5e5e5] bg-[#111111] px-[22px] pt-8 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-[72px] w-[72px] items-center justify-center">
                    <Handshake className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="max-w-[235px] text-[28px] font-bold leading-9 tracking-[-0.07px]">Ready to be our next success story?</h3>
                </div>

                <p className="mt-3 text-[16px] leading-6 text-[#e5e5e5]">
                  Let&apos;s discuss your requirements and how we can deliver measurable results for your enterprise.
                </p>

                <Link
                  href="/contact"
                  className="mt-3 inline-flex h-[43px] w-[208px] items-center justify-center gap-2 rounded-[18px] bg-white text-[14px] font-semibold leading-5 text-[#111111]"
                >
                  Talk to Us
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientStoriesSection />

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to write your own success story?</h2>
              <p className="text-gray-500">
                Tell us about your challenge and we&apos;ll show you how TechBubble can deliver measurable results.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Start a Conversation
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
