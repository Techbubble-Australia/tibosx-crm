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
      {/* Hero — node 205:11133 */}
      <section className="bg-[#111111] pb-[59px] pt-20 text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">Let&apos;s Build Something Remarkable Together</h1>
            <p className="mt-1 max-w-[968px] text-[18px] leading-7 text-[#e5e5e5]">
              Whether you need a single specialist tomorrow or want to discuss a complex enterprise transformation — our team is ready to help within 4 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section — node 205:11234 */}
      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-10 lg:grid-cols-[536px_1fr] lg:gap-[113px]">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Contact Information</p>
              </div>

              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">We&apos;d Love to Hear From You</h2>
              <p className="mt-1 text-[18px] leading-7 text-[#666666]">
                Our team responds to every enquiry within 4 business hours. For urgent staffing requests, we can mobilise within 24 hours.
              </p>

              <div className="mt-4 space-y-2">
                {contactInfo.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="block w-full rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-4 transition-colors hover:bg-[#f5f5f5]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-[4px] bg-[#666666]" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold leading-6 text-[#06091a]">{item.title}</p>
                        <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{item.content}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-12">
                <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#111111] px-3">
                  <span className="h-1.5 w-1.5 rounded-[3px] bg-white" aria-hidden />
                  <p className="text-[12px] font-medium leading-4 text-white">Our Offices</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {offices.map((office, index) => (
                    <div key={index} className="rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-[16px] leading-6" aria-hidden>{office.flag}</span>
                        <span className="text-[16px] font-semibold leading-6 text-[#06091a]">{office.country}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{office.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-[16px] w-[16px] text-[#06091a]" aria-hidden />
                  <p className="text-[16px] font-semibold leading-6 text-[#06091a]">Business Hours</p>
                </div>

                <div className="mt-1 space-y-1">
                  <div className="flex justify-between text-[12px] leading-4">
                    <span className="font-medium text-[#666666]">Monday – Friday</span>
                    <span className="font-bold text-[#111111]">9:00 AM – 5:00 PM</span>
                  </div>
                  <div className="flex justify-between text-[12px] leading-4">
                    <span className="font-medium text-[#666666]">Saturday – Sunday</span>
                    <span className="font-bold text-[#111111]">Closed</span>
                  </div>
                  <div className="my-1 h-px bg-[#e5e5e5]" />
                  <div className="flex justify-between text-[12px] leading-4">
                    <span className="font-medium text-[#666666]">Urgent staffing requests</span>
                    <span className="font-bold text-[#111111]">24/7 via email</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.12] bg-[#111111] px-[37px] py-8 text-white">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px]">Send Us a Message</h3>
              <p className="mt-1 max-w-[327px] text-[14px] leading-5 tracking-[0.035px] text-[#e5e5e5]">
                Fill in your details and we&apos;ll get back to you within 4 business hours.
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
                  placeholder="Work Email *"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Country / Region"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <textarea
                  placeholder="Your Message *"
                  rows={4}
                  className="h-[100px] w-full resize-none rounded-[14px] border border-white/15 bg-white/[0.08] px-[19px] py-[14px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                ></textarea>
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  Submit Application
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </form>

              <p className="mt-4 text-center text-[12px] font-medium leading-4 text-[#e5e5e5]">
                We respond to every enquiry within 4 business hours. Your information is kept strictly confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Talent CTA — node 205:11311 */}
      <section className="bg-[#fafafa] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto flex max-w-[1136px] items-start justify-between">
            <div>
              <h2 className="w-[751px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Need talent urgently?</h2>
              <p className="mt-2 max-w-[666px] text-[18px] leading-7 text-[#666666]">
                Our AI-matching engine can shortlist qualified specialists within hours of your request. No waiting, no lengthy procurement process.
              </p>
            </div>
            <div className="w-[353px] pt-[38px]">
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link
                  href="mailto:hello@techbubble.com.au"
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
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
