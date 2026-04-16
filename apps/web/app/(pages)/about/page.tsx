import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gauge, Shield, Clock, Award } from "lucide-react";
import { IconCircle } from "@/components/ui/IconCircle";

const valueCards = [
  {
    Icon: Gauge,
    title: "Speed First",
    text: "From first call to vetted shortlist in hours — not weeks.",
  },
  {
    Icon: Shield,
    title: "Top 1% Only",
    text: "Every profile is scored, interviewed, and reference-checked.",
  },
  {
    Icon: Clock,
    title: "Timezone Aligned",
    text: "Overlap hours that work for your teams — globally.",
  },
  {
    Icon: Award,
    title: "SLA-Backed",
    text: "Clear runbooks for delivery, support, and escalation.",
  },
];

const leaders = [
  { name: "Nikita T.", role: "Founder & Director", loc: "Australia", img: "/images/avatar.jpg" },
  { name: "Leadership Name", role: "Chief Delivery Officer", loc: "USA", img: "/images/avatar.jpg" },
  { name: "Dhruv Bhatt", role: "Head of Engineering", loc: "India", img: "/images/avatar.jpg" },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative bg-[#0a0a0a] text-white pb-24 pt-8">
        <div className="tb-container text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight max-w-4xl mx-auto">
            Trusted Technology Partner Not Just a Vendor
          </h1>
          <p className="mt-6 text-gray-300 max-w-3xl mx-auto text-lg">
            Founded by engineers, powered by AI. We connect the world&apos;s most ambitious enterprises with top 1% tech talent — fast, transparent, and ridiculously better.
          </p>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mb-20 relative z-10 mt-14">
          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-[#f7f7f5] p-8 text-black shadow-xl md:grid-cols-4 md:gap-0 md:divide-x md:divide-gray-200 md:p-10">
            {[
              { n: "150+", l: "Expert Developers" },
              { n: "50+", l: "Enterprise Clients" },
              { n: "24/7", l: "Support Available" },
              { n: "98%", l: "Client Satisfaction Rate" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center justify-center px-2 text-center md:px-6">
                <div className="text-3xl font-bold tabular-nums md:text-4xl">{s.n}</div>
                <div className="mt-1 text-sm text-gray-600">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-28 pb-20 bg-white">
        <div className="tb-container">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Our Story</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-6">
                Empowering enterprises with world-class technology talent
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Efficiency, security, and innovation are non-negotiable. We help CIOs and programme leads ship on the platforms that run their business — with teams that integrate cleanly and communicate clearly.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                From ServiceNow and Salesforce to cloud, data, and custom engineering, TechBubble is structured for enterprise reality: governance, documentation, and outcomes you can defend in any steering committee.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-900"
              >
                Explore Services
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {valueCards.map((c) => (
                <div key={c.title} className="rounded-xl border border-gray-200 bg-white p-5">
                  <IconCircle icon={c.Icon} className="mb-3 border-sky-100 bg-sky-50 text-sky-600" />
                  <h3 className="mb-2 font-semibold">{c.title}</h3>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-20 bg-[#f0f0f0]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d4d4d4' stroke-width='0.5'%3E%3Cpath d='M40 0 L80 20 L80 60 L40 80 L0 60 L0 20 Z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "120px",
        }}
      >
        <div className="tb-container text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">The Team</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet The Leadership</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The visionaries driving TechBubble&apos;s mission to transform businesses through technology.
          </p>
        </div>
        <div className="tb-container grid md:grid-cols-3 gap-6">
          {leaders.map((l, i) => (
            <div
              key={l.name}
              className={`rounded-2xl bg-[#1a1a1a] text-white p-6 pt-0 overflow-hidden relative ${
                i === 2 ? "ring-2 ring-sky-400/40" : ""
              }`}
            >
              <div className="relative -mt-4 mb-4 mx-auto w-32 h-40 rounded-lg overflow-hidden border-4 border-[#1a1a1a] bg-gray-700">
                <Image src={l.img} alt={l.name} fill className="object-cover" sizes="128px" />
              </div>
              <h3 className="font-bold text-lg">{l.name}</h3>
              <p className="text-sm text-gray-400 mb-3">
                {l.role}, {l.loc}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Hands-on leaders who stay close to delivery — setting the bar for quality and accountability across every engagement.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="tb-container text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Team Members</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Entire Workforce</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A diverse team of engineers, consultants, and delivery leaders — organised into specialised practices.
          </p>
        </div>
        <div className="tb-container">
          <div className="rounded-2xl bg-[#1a1a1a] text-white p-8 grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { n: "150+", l: "Talent Pool Members" },
              { n: "9", l: "Specialized Departments" },
              { n: "5", l: "Global Offices" },
              { n: "10+", l: "Years Experience" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl md:text-3xl font-bold">{s.n}</div>
                <div className="text-xs text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {["Management Team (4)", "Sales Team (4)", "Recruitment Team (4)", "Service Delivery Developers (15)", "Salesforce Developers (5)"].map(
              (t, i) => (
                <span
                  key={t}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${
                    i === 0 ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {t}
                </span>
              )
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["Yogesh Panchal", "Sarah Mitchell", "James Okonkwo", "Priya Desai"].map((name, i) => (
              <div key={name} className="text-center">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden bg-gray-200 mb-3">
                  <Image src="/images/avatar.jpg" alt={name} fill className="object-cover" sizes="200px" />
                </div>
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-gray-500">{i % 2 === 0 ? "Senior Manager, USA" : "Director, Australia"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-t border-gray-100">
        <div className="tb-container">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Our USP</p>
          <h2 className="text-3xl font-bold mb-4">Our Unique Selling Points</h2>
          <p className="text-gray-600 mb-12 max-w-2xl">What enterprises get when they partner with TechBubble — beyond “extra hands on deck”.</p>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="font-semibold text-lg mb-3">Technical Expertise That Spans Industries</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Health, public sector, financial services, manufacturing — we speak stakeholder and engineer fluently.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">World-Class Talent, Available When You Need It</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Surge for a milestone or sustain a platform — engagement models flex without losing quality.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">24/7 Support &amp; Governance — At No Extra Cost</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Runbooks, reporting, and escalation paths included — so operations never fall through the cracks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f5f5f5]">
        <div className="tb-container grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Our Vision</p>
            <h2 className="text-3xl font-bold mb-4">What Drives Us Forward</h2>
            <p className="text-gray-600 mb-8">Principles we hire for, deliver against, and measure ourselves on.</p>
            <ul className="space-y-3">
              {["Innovation", "Excellence", "Partnership", "Integrity"].map((x) => (
                <li key={x} className="flex items-center gap-2 font-semibold text-[#0a0a0a]">
                  <span className="w-2 h-2 bg-black rounded-full" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-black text-white px-6 py-3 text-sm font-semibold">Our Mission</div>
            <div className="p-6">
              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                Empower businesses with technology that is secure, scalable, and measurable — delivered by teams who treat your outcomes as their own.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
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

      <section className="py-20 bg-white">
        <div className="tb-container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Trusted by people who know technology best</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed text-center">
              &ldquo;TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism, creativity, and technical expertise.&rdquo;
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <Image src="/images/avatar.jpg" alt="Haima Prakash" fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Haima Prakash</div>
                <div className="text-sm text-gray-500">Sr. Manager, Chief Technology Office — University of Sydney</div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-amber-400">
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f0f0f0]">
        <div className="tb-container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build something remarkable?</h2>
            <p className="text-gray-600 mb-8">Talk to our team about your next programme — we respond within hours.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 border border-gray-400 bg-white px-6 py-3 rounded-full text-sm font-medium">
                Explore Services
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex rounded-full bg-gray-100 p-1 mb-6">
              <span className="flex-1 text-center py-2 text-sm font-medium bg-black text-white rounded-full">Email Us</span>
              <span className="flex-1 text-center py-2 text-sm text-gray-600">Call 1800-856-918</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> No commitment required
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Response within 2 hours
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Free consultation
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
