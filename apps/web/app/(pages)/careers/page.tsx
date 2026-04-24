import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Laptop, TrendingUp, Users, Lightbulb, Globe, Clock, Award, Mail, Phone } from "lucide-react";

const positions = [
  { title: "Senior ServiceNow Developer", location: "Australia", type: "Full-time", workMode: "Remote", flag: "🇦🇺" },
  { title: "Salesforce Solutions Architect", location: "USA", type: "Contract", workMode: "Remote", flag: "🇺🇸" },
  { title: "AI / ML Engineer", location: "India", type: "Full-time", workMode: "Hybrid", flag: "🇮🇳" },
  { title: "MuleSoft Integration Specialist", location: "Philippines", type: "Contract", workMode: "Remote", flag: "🇵🇭" },
];

const benefits = [
  "Competitive salary and benefits package",
  "Work with cutting-edge technologies",
  "Career growth and learning opportunities",
  "Flexible work arrangements",
  "Collaborative and inclusive culture",
];

const cultureCards = [
  { title: "Collaboration First", description: "Cross-functional teams working across geographies, sharing knowledge and lifting each other up.", Icon: Users },
  { title: "Growth Without Limits", description: "Continuous learning, certification support, and a clear path to leadership for every team member.", Icon: TrendingUp },
  { title: "Innovation Culture", description: "Your ideas get heard. We actively encourage experimentation, new approaches, and creative problem-solving.", Icon: Lightbulb },
  { title: "Global Exposure", description: "Work with enterprise clients across Australia, USA, UK, India, Philippines, and Middle East.", Icon: Globe },
  { title: "Work-Life Balance", description: "Flexible arrangements, remote-friendly roles, and a management team that genuinely respects your time.", Icon: Clock },
  { title: "Recognition & Rewards", description: "Performance bonuses, spot awards, and a culture that celebrates wins — big and small.", Icon: Award },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero — node 205:3319 */}
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-white">
              Build the Future of Enterprise Technology With Us
            </h1>
            <p className="mt-1 max-w-[968px] text-[18px] leading-7 text-[#e5e5e5]">
              At TechBubble, we celebrate creativity, collaboration, and continuous growth. Whether you&apos;re a seasoned professional or just starting out — your ideas matter here.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip — node 205:3345 */}
      <section className="relative z-10 -mt-[85px] bg-transparent pb-[120px]">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            <div className="flex h-[100px] items-center">
              <div className="w-[250px] text-center">
                <p className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">6</p>
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Global Offices</p>
              </div>
              <span className="h-[78px] w-px bg-[#e5e5e5]" aria-hidden />
            </div>
            <div className="flex h-[100px] items-center">
              <div className="w-[250px] text-center">
                <p className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">50+</p>
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Team Members</p>
              </div>
              <span className="h-[78px] w-px bg-[#e5e5e5]" aria-hidden />
            </div>
            <div className="flex h-[100px] items-center">
              <div className="flex w-[250px] flex-col items-center justify-center text-center">
                <Laptop className="h-[56px] w-[56px] text-[#111111] stroke-[1.5]" aria-hidden />
                <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">Remote-Friendly</p>
              </div>
              <span className="h-[78px] w-px bg-[#e5e5e5]" aria-hidden />
            </div>
            <div className="flex h-[100px] items-center">
              <div className="flex w-[250px] flex-col items-center justify-center text-center">
                <TrendingUp className="h-[56px] w-[56px] text-[#111111] stroke-[1.5]" aria-hidden />
                <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#666666]">Fast Growth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work Here — node 205:2977 */}
      <section className="bg-white pb-10">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Life at TechBubble</p>
            </div>
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
              Why People Love Working Here
            </h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">
              We&apos;ve built a culture where talented people do the best work of their careers — and have fun doing it.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {cultureCards.map((item, index) => (
                <div key={index} className="rounded-[15px] border border-[#e5e5e5] bg-[#f7f7f7] px-[22px] pb-6 pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-white">
                    <item.Icon className="h-6 w-6 text-[#111111] stroke-[1.5]" aria-hidden />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.07px] text-[#06091a]">{item.title}</h3>
                    <p className="mt-1 text-[16px] leading-6 text-[#666666]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions — node 205:3029 */}
      <section className="bg-[#e5e5e5] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="mb-8">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Open Positions</p>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Current Opportunities</h2>
                  <p className="mt-1 text-[18px] leading-7 text-[#666666]">Find your perfect role and start your journey with us.</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 pb-1">
                  <div className="relative">
                    <select className="h-[51px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666]">
                      <option>All Locations</option>
                      <option>Australia</option>
                      <option>USA</option>
                      <option>India</option>
                      <option>Philippines</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666]" aria-hidden />
                  </div>
                  <div className="relative">
                    <select className="h-[51px] appearance-none rounded-[18px] border border-[#e5e5e5] bg-white pl-4 pr-10 text-[14px] font-semibold text-[#666666]">
                      <option>All Departments</option>
                      <option>Engineering</option>
                      <option>Consulting</option>
                      <option>Operations</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#666666]" aria-hidden />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {positions.map((position, index) => (
                <div
                  key={index}
                  className="flex h-[78px] items-center justify-between rounded-[24px] border border-[#e5e5e5] bg-white px-6"
                >
                  <div>
                    <p className="text-[16px] font-bold leading-6 text-[#111111]">{position.title}</p>
                    <p className="text-[14px] leading-5 tracking-[0.035px] text-[#7a7f8e]">
                      {position.flag} {position.location} · {position.type} · {position.workMode}
                    </p>
                  </div>
                  <ArrowRight className="h-[18px] w-[18px] shrink-0 stroke-[1.5] text-[#111111]" aria-hidden />
                </div>
              ))}
            </div>

            <p className="mt-14 text-center text-[16px] font-bold leading-6 text-[#666666]">
              Don&apos;t see a role that fits? We&apos;re always open to exceptional talent.
            </p>
          </div>
        </div>
      </section>

      {/* Application Form — node 205:3074 */}
      <section className="relative overflow-hidden py-[120px] text-white" style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}>
        <div className="pointer-events-none absolute -left-[120px] bottom-[-120px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(76,76,76,0.12)_0%,rgba(56,56,56,0)_65%)]" />
        <div className="pointer-events-none absolute -right-[120px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(127,127,127,0.1)_0%,rgba(142,142,142,0)_65%)]" />

        <div className="tb-container relative">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[536px_487px] justify-between gap-0">
            <div className="pt-[143px]">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Apply Now</p>
              </div>

              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-white">Take the First Step</h2>
              <p className="mt-1 text-[18px] font-normal leading-7 text-[#e5e5e5]">
                Fill out the form and share your details, CV, and portfolio. We can&apos;t wait to learn more about you!
              </p>

              <div className="mt-8 space-y-[10px]">
                {benefits.map((item) => (
                  <div key={item} className="flex items-center gap-[10px]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white">
                      <Check className="h-[10px] w-[10px] text-[#111111]" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white">{item}</span>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-[16px] font-normal leading-6 text-[#e5e5e5]">
                Need help? Contact us at <a href="mailto:recruitment@techbubble.com.au" className="font-bold text-white">recruitment@techbubble.com.au</a>
              </p>
            </div>

            <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.06] px-[37px] py-8">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">Submit Your Application</h3>
              <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#e5e5e5]">
                Our team will review and reach out within 48 hours.
              </p>

              <form className="mt-8 space-y-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Position interested in *"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />

                <div className="flex h-[100px] items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.08] text-center">
                  <div>
                    <p className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white/35">Upload your resume</p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-white/35">PDF, DOC, DOCX (max 5MB)</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Tell us about yourself..."
                  className="h-12 w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[21px] text-[14px] text-white placeholder:text-white/60 focus:outline-none"
                />

                <button
                  type="submit"
                  className="mt-[18px] inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  Submit Application
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — node 205:3151 */}
      <section className="bg-[#f7f7f7] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[751px_353px] gap-8">
            <div>
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Ready to build your dream team in under 24 hours?
              </h2>
              <p className="mt-2 max-w-[751px] text-[18px] leading-7 text-[#666666]">
                Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives.
              </p>
            </div>

            <div>
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-[51px] w-[118px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
                >
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  Email Us
                </Link>
                <a
                  href="tel:+611300934031"
                  className="inline-flex h-[51px] w-[159px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-[#e5e5e5] text-[14px] font-semibold text-[#111111]"
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
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[9px] border border-[#e5e5e5] bg-[#fafafa]">
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
