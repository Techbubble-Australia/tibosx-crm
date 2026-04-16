import Link from "next/link";
import { ArrowRight, Zap, Check, Mail, Phone, Laptop, TrendingUp, Plus, Building2, Users } from "lucide-react";
import { IconCircle } from "@/components/ui/IconCircle";

const positions = [
  {
    title: "Senior ServiceNow Developer",
    location: "Australia",
    type: "Full-time",
    workMode: "Remote",
    flag: "🇦🇺",
  },
  {
    title: "Salesforce Solutions Architect",
    location: "USA",
    type: "Contract",
    workMode: "Remote",
    flag: "🇺🇸",
  },
  {
    title: "AI / ML Engineer",
    location: "India",
    type: "Full-time",
    workMode: "Hybrid",
    flag: "🇮🇳",
  },
  {
    title: "MuleSoft Integration Specialist",
    location: "Philippines",
    type: "Contract",
    workMode: "Remote",
    flag: "🇵🇭",
  },
];

const benefits = [
  "Competitive salary and benefits package",
  "Work with cutting-edge technologies",
  "Career growth and learning opportunities",
  "Flexible work arrangements",
  "Collaborative and inclusive culture",
];

const cultureCards = [
  { title: "Collaboration First", description: "Cross-functional teams working across geographies, sharing knowledge and lifting each other up." },
  { title: "Growth Without Limits", description: "Continuous learning, certification support, and a clear path to leadership for every team member." },
  { title: "Innovation Culture", description: "Your ideas get heard. We actively encourage experimentation, new approaches, and creative problem-solving." },
  { title: "Global Exposure", description: "Work with enterprise clients across Australia, USA, UK, India, Philippines, and Middle East." },
  { title: "Work-Life Balance", description: "Flexible arrangements, remote-friendly roles, and a management team that genuinely respects your time." },
  { title: "Recognition & Rewards", description: "Performance bonuses, spot awards, and a culture that celebrates wins — big and small." },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0a0a0a] text-white py-16">
        <div className="tb-container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Build the Future of Enterprise Technology With Us</h1>
          <p className="text-gray-400 max-w-2xl">
            At TechBubble, we celebrate creativity, collaboration, and continuous growth. Whether you&apos;re a seasoned professional or just starting out — your ideas matter here.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0a0a0a] text-white pb-12">
        <div className="tb-container">
          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-white p-8 text-black md:grid-cols-4 md:gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <IconCircle icon={Building2} size="lg" className="border-gray-200 bg-gray-50" />
              <div className="text-4xl font-bold tabular-nums">6</div>
              <div className="text-sm text-gray-500">Global Offices</div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <IconCircle icon={Users} size="lg" className="border-gray-200 bg-gray-50" />
              <div className="text-4xl font-bold tabular-nums">50+</div>
              <div className="text-sm text-gray-500">Team Members</div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-900">
                <Laptop className="h-6 w-6 stroke-[1.5]" aria-hidden />
              </span>
              <div className="text-sm font-medium text-gray-900">Remote-Friendly</div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-900">
                <TrendingUp className="h-6 w-6 stroke-[1.5]" aria-hidden />
              </span>
              <div className="text-sm font-medium text-gray-900">Fast Growth</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work Here */}
      <section className="py-20">
        <div className="tb-container">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Life at TechBubble
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why People Love Working Here</h2>
            <p className="text-gray-500 max-w-2xl">
              We&apos;ve built a culture where talented people do the best work of their careers — and have fun doing it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultureCards.map((item, index) => (
              <div key={index} className="rounded-xl bg-gray-50 p-6">
                <IconCircle icon={Zap} className="mb-4 border-amber-200 bg-amber-50/80 text-amber-600" />
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm text-gray-600 mb-4 border">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Open Positions
              </span>
              <h2 className="text-3xl font-bold mb-2">Current Opportunities</h2>
              <p className="text-gray-500">Find your perfect role and start your journey with us.</p>
            </div>
            <div className="flex gap-3">
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
                <option>All Locations</option>
                <option>Australia</option>
                <option>USA</option>
                <option>India</option>
                <option>Philippines</option>
              </select>
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Consulting</option>
                <option>Operations</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {positions.map((position, index) => (
              <div key={index} className="bg-white p-6 rounded-xl flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{position.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{position.flag} {position.location}</span>
                    <span>•</span>
                    <span>{position.type}</span>
                    <span>•</span>
                    <span>{position.workMode}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 transition-colors group-hover:border-black group-hover:bg-black group-hover:text-white"
                  aria-label="Expand role"
                >
                  <Plus className="h-5 w-5 stroke-[1.5]" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Don&apos;t see a role that fits? We&apos;re always open to exceptional talent.
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 bg-[#0a0a0a] text-white">
        <div className="tb-container">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Apply Now
              </span>
              <h2 className="text-3xl font-bold mb-4">Take the First Step</h2>
              <p className="text-gray-400 mb-8">
                Fill out the form and share your details, CV, and portfolio. We can&apos;t wait to learn more about you!
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-gray-400">
                Need help? Contact us at <a href="mailto:recruitment@techbubble.com.au" className="text-white underline">recruitment@techbubble.com.au</a>
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-2xl">
              <h3 className="font-semibold mb-2">Submit Your Application</h3>
              <p className="text-gray-400 text-sm mb-6">Our team will review and reach out within 48 hours.</p>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="text"
                  placeholder="Position interested in *"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <div className="bg-gray-800 border border-dashed border-gray-700 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">Upload your resume</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX (max. 5MB)</p>
                </div>
                <textarea
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Submit Application <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your dream<br />team in under 24 hours?</h2>
              <p className="text-gray-500">
                Join 50+ enterprises who trust TechBubble to power their most critical<br />technology initiatives.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email Us
                </Link>
                <a
                  href="tel:+611300934031"
                  className="inline-flex items-center gap-2 border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  (+61) 1300 934 031
                </a>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> No commitment required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Response within 2 hours
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Free consultation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
