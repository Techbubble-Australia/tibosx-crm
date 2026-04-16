import Link from "next/link";
import { ArrowRight, Mail, Phone, Linkedin, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email Us",
    content: "hello@techbubble.com.au",
    href: "mailto:hello@techbubble.com.au",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "Australia",
    content: "(+61) 1300 934 031",
    href: "tel:+611300934031",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "USA",
    content: "+1 (979) 701-2995",
    href: "tel:+19797012995",
  },
  {
    icon: <Linkedin className="w-5 h-5" />,
    title: "LinkedIn",
    content: "linkedin.com/company/techbubbleptyltd",
    href: "https://linkedin.com/company/techbubbleptyltd",
  },
];

const offices = [
  {
    flag: "🇦🇺",
    country: "Australia (HQ)",
    address: "Level 12/16 126 Banks Ave, Eastgardens, Sydney NSW 2000",
  },
  {
    flag: "🇺🇸",
    country: "USA",
    address: "1846/1007 N Orange St, WI, DE 19801, USA",
  },
  {
    flag: "🇮🇳",
    country: "India",
    address: "K.P. EPITOME Nr. Siddhi Vinayak Tower, Makarba, Ahmedabad, Gujarat 380051",
  },
  {
    flag: "🌏",
    country: "Philippines - UK - ME",
    address: "Regional delivery offices across Asia, Europe & Middle East",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0a0a0a] text-white py-16">
        <div className="tb-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Let&apos;s Build Something Remarkable Together</h1>
          <p className="text-gray-400 max-w-2xl">
            Whether you need a single specialist tomorrow or want to discuss a complex enterprise transformation — our team is ready to help within 4 hours.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="tb-container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Side - Contact Info */}
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden />
                Contact Information
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">We&apos;d Love to Hear<br />From You</h2>
              <p className="text-gray-500 mb-8">
                Our team responds to every enquiry within 4 business hours. For urgent staffing requests, we can mobilise within 24 hours.
              </p>

              {/* Contact Cards */}
              <div className="space-y-4 mb-8">
                {contactInfo.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="flex items-start gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm [&>svg]:stroke-[1.5]">
                      {item.icon}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="font-medium leading-tight">{item.title}</div>
                      <div className="mt-1 text-sm leading-snug text-gray-500">{item.content}</div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Offices */}
              <div>
                <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  Our Offices
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {offices.map((office, index) => (
                    <div key={index} className="rounded-xl bg-gray-50 p-4">
                      <div className="mb-1 flex items-start gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-base leading-none" aria-hidden>
                          {office.flag}
                        </span>
                        <span className="text-sm font-medium leading-snug">{office.country}</span>
                      </div>
                      <p className="pl-9 text-xs leading-relaxed text-gray-500">{office.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <div className="mt-6 rounded-xl bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white [&>svg]:stroke-[1.5]">
                    <Clock className="h-4 w-4 text-gray-800" aria-hidden />
                  </span>
                  <span className="font-medium">Business Hours</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monday – Friday</span>
                    <span>9:00 AM – 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saturday – Sunday</span>
                    <span className="text-gray-400">Closed</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Urgent staffing requests</span>
                    <span>24/7 via email</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="bg-[#0a0a0a] text-white p-8 rounded-2xl">
              <h3 className="text-xl font-semibold mb-2">Send Us a Message</h3>
              <p className="text-gray-400 text-sm mb-6">
                Fill in your details and we&apos;ll get back to you within 4 business hours.
              </p>

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
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <input
                  type="text"
                  placeholder="Country / Region"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
                />
                <textarea
                  placeholder="Your Message *"
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                >
                  Send Message <ArrowRight className="ml-2 inline h-4 w-4" aria-hidden />
                </button>
              </form>

              <p className="text-gray-500 text-xs mt-4 text-center">
                We respond to every enquiry within 4 business hours. Your information is kept strictly confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Talent CTA */}
      <section className="py-20 bg-gray-50">
        <div className="tb-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Need talent urgently?</h2>
              <p className="text-gray-500">
                Our AI-matching engine can shortlist qualified specialists within hours of your<br />request. No waiting, no lengthy procurement process.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="mailto:hello@techbubble.com.au"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </Link>
              <a
                href="tel:+611300934031"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-gray-50"
              >
                <Phone className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                (+61) 1300 934 031
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
