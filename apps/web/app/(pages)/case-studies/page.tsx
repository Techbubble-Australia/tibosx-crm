import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0a0a0a] text-white py-16">
        <div className="tb-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Real Results for Real Enterprises</h1>
          <p className="text-gray-400 max-w-2xl">
            From government-scale ServiceNow transformations to Salesforce CRM overhauls — see how TechBubble delivers measurable outcomes across industries and platforms.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0a0a0a] text-white pb-12">
        <div className="tb-container">
          <div className="bg-white text-black rounded-2xl p-6 grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <p className="text-sm text-gray-600">
                Deep-dives into how TechBubble has helped enterprises across Asia-Pacific and North America transform their technology operations — with measurable outcomes.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm text-gray-500">Clients served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-gray-500">Projects delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-gray-500">Satisfaction rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16 bg-gray-50">
        <div className="tb-container">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm text-gray-600 mb-4 border">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Our Work
            </span>
            <h2 className="text-3xl font-bold mb-2">Case Studies by Practice</h2>
            <p className="text-gray-500">Explore how we&apos;ve helped leading enterprises transform operations, reduce costs, and accelerate growth.</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat, index) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  index === 0
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Case Studies Grid - First Row with Featured + Sidebar */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Featured Case Study with Sidebar */}
            {featuredStudy && (
              <>
                <Link
                  href={`/case-studies/${featuredStudy.slug}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group md:col-span-1"
                >
                  <div className="aspect-video bg-gray-200 relative">
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                      {featuredStudy.category.toUpperCase()}
                    </div>
                    <div className="absolute top-4 right-4 text-xs text-gray-500">
                      • {featuredStudy.date}
                    </div>
                    {/* Placeholder for image */}
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-400">Case Study Image</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-gray-600 transition-colors">
                      {featuredStudy.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {featuredStudy.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex gap-4">
                        <div>
                          <div className="font-bold text-lg">{featuredStudy.stat1.value}</div>
                          <div className="text-xs text-gray-500">{featuredStudy.stat1.label}</div>
                        </div>
                        <div>
                          <div className="font-bold text-lg">{featuredStudy.stat2.value}</div>
                          <div className="text-xs text-gray-500">{featuredStudy.stat2.label}</div>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Sidebar Navigation Card */}
                <div className="bg-[#1a1a1a] text-white rounded-xl p-6 hidden md:block">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">ON THIS CASE STUDY</p>
                  <nav className="space-y-3">
                    {featuredStudy.sidebar?.map((item: any) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block text-sm text-gray-300 hover:text-white transition-colors py-1 border-b border-gray-800 pb-2"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </>
            )}

            {/* Regular Case Studies */}
            {regularStudies.slice(0, 1).map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                    {study.category.toUpperCase()}
                  </div>
                  <div className="absolute top-4 right-4 text-xs text-gray-500">
                    • {study.date}
                  </div>
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-400">Case Study Image</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-gray-600 transition-colors">
                    {study.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                    {study.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-4">
                      <div>
                        <div className="font-bold text-lg">{study.stat1.value}</div>
                        <div className="text-xs text-gray-500">{study.stat1.label}</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg">{study.stat2.value}</div>
                        <div className="text-xs text-gray-500">{study.stat2.label}</div>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* More Case Studies Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularStudies.slice(1).map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                    {study.category.toUpperCase()}
                  </div>
                  <div className="absolute top-4 right-4 text-xs text-gray-500">
                    • {study.date}
                  </div>
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-400">Case Study Image</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-gray-600 transition-colors">
                    {study.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                    {study.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-4">
                      <div>
                        <div className="font-bold text-lg">{study.stat1.value}</div>
                        <div className="text-xs text-gray-500">{study.stat1.label}</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg">{study.stat2.value}</div>
                        <div className="text-xs text-gray-500">{study.stat2.label}</div>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Expertise Section */}
      <section className="py-20">
        <div className="tb-container">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Our Practice Areas
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Deep Expertise Across 5<br />Platform Practices</h2>
            <p className="text-gray-500 max-w-2xl">
              Deep expertise across ServiceNow, Salesforce, integration, and custom engineering — with measurable outcomes you can trace to board-level metrics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practices.map((practice, index) => (
              <div key={index} className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  {practice.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{practice.title}</h3>
                <p className="text-gray-500 text-sm">{practice.description}</p>
                <button className="mt-4 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Explore Practice <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="bg-[#0a0a0a] text-white p-6 rounded-xl flex flex-col justify-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Ready to be our<br />next success<br />story?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Let&apos;s discuss your requirements and how we can deliver measurable results for your enterprise.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Talk to Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-white">
        <div className="tb-container">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Client Stories
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by people<br />who know technology best</h2>
          </div>
          
          <div className="max-w-4xl">
            <div className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed mb-8">
              &ldquo;TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism, creativity, and technical expertise. What impressed us most was their ability to adapt to unforeseen challenges without compromising timelines or quality.&rdquo;
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-semibold">HP</span>
                </div>
                <div>
                  <div className="font-semibold">Haima Prakash</div>
                  <div className="text-sm text-gray-500">Sr. Manager, Chief Technology Office - University of Sydney</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
