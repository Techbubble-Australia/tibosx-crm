import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Zap, Workflow, Share2, FileStack, Braces, Handshake } from "lucide-react";
import { notFound } from "next/navigation";
import caseStudyHeaderImage from "@/src/image/frame_1_2.jpg";

// This would normally fetch from the database
async function getCaseStudy(slug: string) {
  // Simulated data - replace with actual DB fetch
  const caseStudies: Record<string, any> = {
    "university-of-sydney-rapid-it-talent": {
      slug: "university-of-sydney-rapid-it-talent",
      title: "University of Sydney — Rapid IT Talent Deployment Across CTO Office",
      subtitle: "How TechBubble rebuilt NextCare's fragmented Salesforce environment from the ground up — delivering regulatory compliance, 60% faster reporting, and a care worker-first UX within a non-negotiable deadline.",
      category: "ServiceNow",
      heroStats: [
        { value: "SERVICENOW", label: "CATEGORY" },
        { value: "40%", label: "EFFICIENCY GAINS" },
        { value: "3", label: "DOMAINS DELIVERED" },
      ],
      sidebar: [
        { label: "Background", href: "#background" },
        { label: "The Challenge", href: "#challenge" },
        { label: "Our Solution", href: "#solution" },
        { label: "Technology Stack", href: "#tech-stack" },
        { label: "Results", href: "#results" },
        { label: "Key Takeaways", href: "#takeaways" },
      ],
      background: {
        title: "A Growing Organisation Held Back by Legacy Systems",
        content: `NextCare Aged Services operates multiple residential care facilities across Australia, providing essential support to elderly residents and their families. As the organisation grew through new facility acquisitions and expanded service offerings, their technology stack — anchored by an aging, heavily customised Salesforce implementation — increasingly became a liability rather than an enabler.

Despite holding significant operational data across sales, intake, and service functions, the existing Salesforce org had been customised piecemeal over several years. The result was a fragile, poorly documented environment that was slow to use, difficult to maintain, and — critically — unable to produce the compliance reports required by the NDIS (National Disability Insurance Scheme) and the Aged Care Quality and Safety Commission.

With a scheduled compliance audit on the horizon and a growing roster of facilities requiring unified visibility, NextCare's leadership made the decision to re-architect entirely — and called on TechBubble to lead the engagement.`,
      },
      challenge: {
        title: "Four Interconnected Problems to Solve Simultaneously",
        content: "The engagement wasn't a simple configuration project. It required a complete rethinking of NextCare's Salesforce data architecture, user experience, compliance posture, and operational workflow — all while keeping the existing system running and avoiding disruption to front-line care staff.",
        stats: [
          { value: "6+", label: "Years of legacy customisations stacked on an unstable data model" },
          { value: "0", label: "Real-time compliance reports available before the project" },
          { value: "12+", label: "Weeks until the NDIS compliance audit deadline" },
        ],
        problems: [
          {
            title: "Fragmented, unmaintainable data architecture",
            content: "Six years of ad-hoc customisations had created a labyrinthine data model with duplicated objects, broken validation rules, and no documentation. Every change risked breaking something else."
          },
          {
            title: "No compliance-ready reporting",
            content: "NDIS and Aged Care Quality Commission reporting was being generated manually from Salesforce exports into Excel — a process that took 3-4 days per report cycle, introduced human error, and would not satisfy auditors."
          },
          {
            title: "Care workers refusing to use the system",
            content: "The Salesforce UI had been designed for sales teams, not care workers. Navigation was counterintuitive, screens were cluttered with irrelevant fields, and mobile access was non-functional — leading to widespread workarounds and incomplete data entry."
          },
          {
            title: "Non-negotiable regulatory deadline",
            content: "A compliance audit was scheduled within 12 weeks of project kickoff. Any delays would expose NextCare to regulatory penalties and reputational risk with both residents and referral partners."
          },
        ],
      },
      solution: {
        title: "A Four-Phase Rebuild Built Around People First",
        content: `TechBubble's approach began not with code, but with people. Before any technical work commenced, the team ran discovery workshops with care workers, facility managers, and executives at NextCare — building a shared understanding of how the organisation actually operated day-to-day, rather than how the system had been configured to assume it would.

This grounding shaped every design decision that followed. The re-architecture was then executed across four tightly sequenced phases, with compliance reporting as the first deliverable to de-risk the regulatory deadline from the outset.`,
        phases: [
          {
            number: "1",
            title: "Discovery & Architecture Design",
            duration: "Weeks 1-2",
            content: "Comprehensive technical audit of the existing Salesforce org, cataloguing all customisations, data quality issues, and integration dependencies. Stakeholder workshops with care workers, managers, and compliance officers. A full re-architecture blueprint was produced and signed off before any development commenced.",
            tags: ["Salesforce Org Audit", "Stakeholder Workshops", "Data Model Design", "Architecture Blueprint"],
          },
          {
            number: "2",
            title: "Compliance Reporting Layer",
            duration: "Weeks 3-7",
            content: "NDIS and Aged Care Quality Commission reporting built first — as a standalone priority — to meet the regulatory deadline. Salesforce Reports and Dashboards were configured with Tableau CRM to provide real-time compliance views, replacing the manual Excel process entirely. Audit documentation prepared in parallel.",
            tags: ["Salesforce Reports", "Tableau CRM", "NDIS Compliance", "Audit Documentation"],
          },
          {
            number: "3",
            title: "Data Model Rebuild & Migration",
            duration: "Weeks 8-14",
            content: "The core Salesforce data model was rebuilt from scratch — removing six years of technical debt, merging duplicate objects, and establishing clean record types for residents, facilities, referrals, and care plans. A full data quality and deduplication exercise migrated 100% of historical records into the new model with no data loss.",
            tags: ["Data Model Re-architecture", "Deduplication", "Data Cleansing"],
          },
        ],
      },
      techStack: {
        title: "Purpose-Selected Tools for the Job",
        content: "Every platform and tool used in this engagement was selected to serve a specific function — nothing was added for its own sake. The stack prioritises maintainability by NextCare's internal team after project completion.",
        technologies: [
          { name: "Salesforce Service Cloud", description: "Core case management, care tracking, and resident records", icon: "S" },
          { name: "Salesforce Sales Cloud", description: "Referral and intake pipeline management across facilities", icon: "S" },
          { name: "Tableau CRM", description: "Real-time NDIS and compliance dashboards for executives and auditors", icon: "T" },
          { name: "Salesforce Flow", description: "All automation — replacing Apex triggers and legacy Process Builder entirely", icon: "F" },
          { name: "Lightning Web Components", description: "Custom UI components for care plan workflows and mobile ward views", icon: "L" },
          { name: "Data Loader + Apex", description: "Bulk data migration, deduplication logic, and historical record cleansing", icon: "D" },
        ],
      },
      testimonial: {
        quote: "Working with TechBubble has been outstanding from start to finish. Their technical expertise, attention to detail, and ability to meet tight deadlines were truly remarkable. The code quality, the design, and the overall user experience reflect their genuine commitment to excellence.",
        author: {
          name: "Steven Fan",
          title: "Head of Technology, Information Technology Services",
          company: "NextCare Aged Services",
          initials: "SF",
        },
      },
      cta: {
        title: "Ready to achieve results like Toyota?",
        subtitle: "Our ServiceNow team can mobilise within 24 hours. Tell us your challenge and we'll respond with a tailored approach within 4 hours.",
      },
    },
  };

  return caseStudies[slug] || null;
}

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  const caseStudy = await getCaseStudy(params.slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0a0a0a] text-white py-12">
        <div className="tb-container">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Studies
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl">
            {caseStudy.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mb-8">
            {caseStudy.subtitle}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
            {caseStudy.heroStats.map((stat: any, index: number) => (
              <div key={index}>
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Header media section — node 205:5085 */}
      <section className="bg-white pb-[60px] pt-[30px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="relative h-[307px] overflow-hidden rounded-[8px]">
              <Image
                src={caseStudyHeaderImage}
                alt="University of Sydney campus"
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1136px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="tb-container">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">ON THIS PAGE</p>
                <nav className="space-y-2">
                  {caseStudy.sidebar.map((item: any) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block text-sm text-gray-600 hover:text-black transition-colors py-1"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-3xl">
              {/* Background */}
              <div id="background" className="mb-16">
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium mb-6">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  Background
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{caseStudy.background.title}</h2>
                <div className="prose prose-gray max-w-none">
                  {caseStudy.background.content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-gray-600 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-8 aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-400">Case Study Image</span>
                  </div>
                </div>
              </div>

              {/* Challenge */}
              <div id="challenge" className="mb-16">
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium mb-6">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  The Challenge
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{caseStudy.challenge.title}</h2>
                <p className="text-gray-600 mb-8">{caseStudy.challenge.content}</p>

                {/* Challenge Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {caseStudy.challenge.stats.map((stat: any, index: number) => (
                    <div key={index} className="text-center">
                      <div className="text-4xl font-bold mb-2">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Problems */}
                <div className="space-y-6">
                  {caseStudy.challenge.problems.map((problem: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-gray-400 text-sm">0{index + 1}</span>
                        <h3 className="font-semibold">{problem.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm ml-8">{problem.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution */}
              <div id="solution" className="mb-16">
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium mb-6">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  Our Solution
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{caseStudy.solution.title}</h2>
                <div className="prose prose-gray max-w-none mb-8">
                  {caseStudy.solution.content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-gray-600 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Phases */}
                <div className="space-y-8">
                  {caseStudy.solution.phases.map((phase: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 border-2 border-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                          {phase.number}
                        </div>
                      </div>
                      <div className="flex-1 pb-8 border-l-2 border-gray-100 pl-6 -ml-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{phase.title}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{phase.duration}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{phase.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.tags.map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div id="tech-stack" className="mb-16">
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium mb-6">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  Technology Stack
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{caseStudy.techStack.title}</h2>
                <p className="text-gray-600 mb-8">{caseStudy.techStack.content}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  {caseStudy.techStack.technologies.map((tech: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl flex gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-400 shadow-sm">
                        {tech.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{tech.name}</h4>
                        <p className="text-xs text-gray-500">{tech.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-[#0a0a0a] text-white p-8 rounded-2xl mb-16">
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-6">
                  Client Testimonial
                </span>
                <blockquote className="text-xl md:text-2xl mb-8 leading-relaxed">
                  &ldquo;{caseStudy.testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-semibold">
                    {caseStudy.testimonial.author.initials}
                  </div>
                  <div>
                    <div className="font-semibold">{caseStudy.testimonial.author.name}</div>
                    <div className="text-sm text-gray-400">{caseStudy.testimonial.author.title}</div>
                  </div>
                  <div className="ml-auto text-sm text-gray-400">
                    {caseStudy.testimonial.author.company}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas — node 205:2669 */}
      <section className="bg-white py-[120px]">
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

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{caseStudy.cta.title}</h2>
              <p className="text-gray-500">
                {caseStudy.cta.subtitle}
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
                View ServiceNow Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
