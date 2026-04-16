import Link from "next/link";
import { ArrowRight, Check, FileText, Clock, RefreshCw, BarChart3, Globe2 } from "lucide-react";

const models = [
  {
    name: "STARTER",
    title: "Staff Augmentation",
    description: "Skilled engineers deployed to your team, fast. T&M pricing with full flexibility.",
    price: "Custom",
    priceNote: "based on role",
    features: [
      "1-10 engineers placed",
      "Onboarded in <24 hours",
      "Timezone-aligned resources",
      "Flexible scale up/down",
      "Dedicated account manager",
      "48-hour replacement guarantee",
    ],
    cta: "Get a Quote",
    popular: false,
  },
  {
    name: "Professional",
    title: "Project Delivery",
    description: "Fixed-fee SaaS implementations with full end-to-end delivery assurance.",
    price: "Fixed Fee",
    priceNote: "",
    features: [
      "ServiceNow or Salesforce project",
      "Dedicated project team assembled",
      "Milestone-based delivery plan",
      "99% on-budget delivery record",
      "3-month post-launch support",
      "Beat-any-quote guarantee",
    ],
    cta: "Start a Project",
    popular: true,
  },
  {
    name: "ENTERPRISE",
    title: "Product Engineering",
    description: "Full-scale product development with a dedicated AI-powered engineering team.",
    price: "Tailored",
    priceNote: "your scope",
    features: [
      "5-50+ dedicated engineers",
      "Full-stack & mobile development",
      "AI/ML integration included",
      "DevSecOps pipeline setup",
      "24/7 support & governance",
      "Dedicated VP of Engineering",
    ],
    cta: "Talk to Sales",
    popular: false,
  },
];

const benefits: { Icon: typeof FileText; text: string }[] = [
  { Icon: FileText, text: "Rapid No lock-in contracts" },
  { Icon: Clock, text: "Response within 24 hours" },
  { Icon: RefreshCw, text: "48-hour Replacement guarantee" },
  { Icon: BarChart3, text: "Transparent weekly reporting" },
  { Icon: Globe2, text: "Timezone-aligned delivery" },
];

const faqs = [
  {
    question: "How quickly can you onboard a resource?",
    answer: "Our AI-matching engine can identify and propose a vetted candidate within hours of your request. Full onboarding — contracts signed, tools set up, team introductions — typically completes within one business day. For very specialised roles, allow up to 48 hours."
  },
  {
    question: "Do you work with startups or only enterprises?",
    answer: "We work with organisations of all sizes — from funded startups to Fortune 500 enterprises. Our engagement models are flexible enough to accommodate different budgets and requirements."
  },
  {
    question: "What happens if a placed resource doesn't work out?",
    answer: "We offer a 48-hour replacement guarantee. If a resource isn't the right fit, we'll find a replacement at no additional cost. Your satisfaction is our priority."
  },
  {
    question: "How does your pricing work?",
    answer: "We offer three engagement models: Staff Augmentation (time & materials), Project Delivery (fixed fee), and Product Engineering (custom scope). Each is designed to provide maximum value and zero surprises."
  },
  {
    question: "Do your resources work in my timezone?",
    answer: "Yes, we provide timezone-aligned resources. With offices across APAC, North America, and Europe, we can provide coverage for most timezone requirements."
  },
  {
    question: "What industries do you serve?",
    answer: "We serve a wide range of industries including healthcare, finance, government, retail, manufacturing, and technology. Our consultants bring relevant industry experience to every engagement."
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero — off-white, centered (PDF p8) */}
      <section className="bg-[#f7f7f6] py-16 md:py-20">
        <div className="tb-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a0a0a] mb-6">Flexible Pricing for Every Enterprise</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10">
            No rate cards on the shelf — every engagement is tailored to your exact requirements. Tell us what you need and we&apos;ll price it competitively within 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {benefits.map(({ Icon, text }, index) => (
              <div
                key={index}
                className="flex max-w-[200px] flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-center leading-snug"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 [&>svg]:stroke-[1.5]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[#0a0a0a] md:text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="tb-container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
              Our Engagement Models
            </span>
            <h2 className="text-3xl font-bold mb-4">Choose the Model That Fits Your Needs</h2>
            <p className="text-gray-500">Three proven engagement models — each designed to give you maximum value and zero surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {models.map((model, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  model.popular
                    ? "bg-[#0a0a0a] text-white ring-2 ring-black"
                    : "bg-white border border-gray-100"
                }`}
              >
                {model.popular && (
                  <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-4">
                    Most Popular
                  </div>
                )}
                <div className={`text-xs font-medium mb-2 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                  {model.name}
                </div>
                <h3 className="text-2xl font-bold mb-2">{model.title}</h3>
                <p className={`text-sm mb-6 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                  {model.description}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{model.price}</span>
                  {model.priceNote && (
                    <span className={`text-sm ml-2 ${model.popular ? "text-gray-400" : "text-gray-500"}`}>
                      / {model.priceNote}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {model.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${model.popular ? "text-gray-400" : "text-gray-500"}`} />
                      <span dangerouslySetInnerHTML={{ __html: feature }} />
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-full font-medium transition-colors ${
                    model.popular
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {model.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Card CTA */}
      <section className="py-20 bg-[#0a0a0a] text-white">
        <div className="tb-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Rate Card
              </span>
              <h2 className="text-3xl font-bold mb-4">Request a Detailed Rate Card</h2>
              <p className="text-gray-400 mb-6">
                Help us understand your requirements, so that we can offer you our best price. Our team will get back to you within 24 hours with a customized quote.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "150+ skilled professionals across technologies",
                  "Personalized consultation with our experts",
                  "AI-powered resource matching for best fit",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Response within 24 hours
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Free consultation call
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Zero obligation
                </span>
              </div>
            </div>
            <div className="bg-gray-900 p-8 rounded-2xl">
              <h3 className="font-semibold mb-2">Get Your Custom Quote</h3>
              <p className="text-gray-400 text-sm mb-6">Fill out the form and we&apos;ll be in touch within 24 hours.</p>
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
                  placeholder="Work Email *"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 text-gray-400">
                  <option>Select service type</option>
                  <option>Staff Augmentation</option>
                  <option>Project Delivery</option>
                  <option>Product Engineering</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Request Rate Card <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="tb-container">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
                FAQ
              </span>
              <h2 className="text-3xl font-bold mb-4">Questions we hear all the time</h2>
              <p className="text-gray-500 mb-8">
                Can&apos;t find what you&apos;re looking for? Our team is happy to answer any questions directly.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Talk to us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium">{faq.question}</h3>
                    <button className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your<br />Business?</h2>
              <p className="text-gray-500">
                Let us tailor a package that meets your unique needs. Whether you&apos;re exploring staff<br />augmentation, managed services, or custom solutions, we&apos;re here to help you succeed.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Free consultation
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> No commitment
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> 24hr response
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
