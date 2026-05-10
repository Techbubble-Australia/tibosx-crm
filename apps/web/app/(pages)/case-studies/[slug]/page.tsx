import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Zap, Workflow, Share2, FileStack, Braces, Handshake } from "lucide-react";
import { notFound } from "next/navigation";
import { getCaseStudyBySlug } from "@/lib/api/public";
import { CaseStudyBannerGallery } from "@/components/case-study/CaseStudyBannerGallery";
import { SectionPill } from "@/components/ui/SectionPill";
import { mapCaseStudyApiToPageModel, type CaseStudyPageModel } from "@/lib/case-study-mapper";

export default async function CaseStudyPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const preview = typeof searchParams.preview === "string" ? searchParams.preview : undefined;
  const raw = await getCaseStudyBySlug(params.slug, preview);
  if (!raw) {
    notFound();
  }
  const caseStudy: CaseStudyPageModel = mapCaseStudyApiToPageModel(raw);

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
            {caseStudy.heroStats.map((stat, index: number) => (
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
            <CaseStudyBannerGallery images={caseStudy.bannerImages} title={caseStudy.title} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-12">
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
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium mb-6 text-gray-900">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  Background
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">{caseStudy.background.title}</h2>
                <div className="prose prose-gray max-w-none">
                  {caseStudy.background.content.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="text-gray-600 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {caseStudy.contentImage ? (
                  <div className="mt-8 aspect-video relative rounded-xl overflow-hidden ring-1 ring-black/5">
                    <Image
                      src={caseStudy.contentImage}
                      alt={caseStudy.background.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                ) : (
                  <div className="mt-8 aspect-video bg-neutral-200 rounded-xl overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                      <span className="text-neutral-500 text-sm">No case study image</span>
                    </div>
                  </div>
                )}
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
            <SectionPill label="Our Practice Areas" />

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
