import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import aboutUs1 from "@image/techbubble_-_about_us_1.jpg";
import aboutUs2 from "@image/techbubble_-_about_us_2.jpg";
import aboutUs3 from "@image/techbubble_-_about_us_3.jpg";
import aboutUs4 from "@image/techbubble_-_about_us_4.png";
import aboutUs5 from "@image/techbubble_-_about_us_5.jpg";
import aboutUs6 from "@image/techbubble_-_about_us_6.png";
import aboutUs7 from "@image/techbubble_-_about_us_7.png";
import aboutUs8 from "@image/techbubble_-_about_us_8.png";
import aboutUs9 from "@image/techbubble_-_about_us_9.jpg";

const missionCards = [
  {
    title: "Speed First",
    text: "AI-matched specialists deployed in under 24 hours — no waiting, no ramp-up.",
  },
  {
    title: "Top 1% Only",
    text: "Every consultant passes rigorous multi-stage vetting before we put them forward.",
  },
  {
    title: "Timezone Aligned",
    text: "Resources matched to your working hours — real-time collaboration guaranteed.",
  },
  {
    title: "SLA-Backed",
    text: "Contractual guarantees, 24/7 support, and dedicated governance on every engagement.",
  },
  {
    title: "AI-Infused",
    text: "Our AI-matching engine reduces time-to-hire by 70% versus traditional models.",
  },
  {
    title: "Innovation-Led",
    text: "Continuous upskilling ensures our talent stays ahead of every platform curve.",
  },
];

const leadershipCards = [
  { name: "Nikita T", role: "Founder & Director, Australia", image: aboutUs1 },
  { name: "Jeet Bhatt", role: "Founder & Director, Australia", image: aboutUs2 },
  { name: "Dhruv Bhatt", role: "Head of Product, Australia", image: aboutUs3 },
];

const workforceTabs = [
  { label: "Management Team (5)", width: 215, active: true },
  { label: "Sales Team (4)", width: 157, active: false },
  { label: "Recruitment Team (4)", width: 209, active: false },
  { label: "ServiceNow Developers (16)", width: 260, active: false },
  { label: "Salesforce Developers (8)", width: 243, active: false },
  { label: "MuleSoft Developers (8)", width: 232, active: false },
  { label: "Workday Team (5)", width: 183, active: false },
  { label: "Product Team (8)", width: 176, active: false },
  { label: "Other Techstack Developers (12)", width: 295, active: false },
];

const managementTeam = [
  { name: "Yogesh Panchal", role: "Delivery Manager, USA", image: aboutUs4 },
  { name: "Lakshminarayanan", role: "Sr. Manager - Talent Acquisition, India", image: aboutUs6 },
  { name: "Dinky Rajpal", role: "Sr. Manager - Business Development, India", image: aboutUs7 },
  { name: "Kamal Rajput", role: "Sr. Account Manager, APAC & UK", image: aboutUs8 },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">
              Trusted Technology Partner
              <br />
              Not Just a Vendor
            </h1>
            <p className="mt-[4px] max-w-[890px] text-[18px] leading-7 text-[#e5e5e5]">
              Founded by engineers, powered by AI. We connect the world&apos;s most ambitious enterprises with top 1% tech talent — fast, transparent, and measurably better.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {[
              { n: "150+", l: "Expert Technicians", labelClass: "text-[12px] font-medium leading-4" },
              { n: "50+", l: "Enterprise Clients", labelClass: "text-[12px] font-medium leading-4" },
              { n: "24/7", l: "Support Available", labelClass: "text-[12px] font-medium leading-4" },
              { n: "98%", l: "Client Satisfaction Rate", labelClass: "text-[14px] font-normal leading-5 tracking-[0.035px]" },
            ].map((stat, idx) => (
              <div key={stat.l} className="flex h-[104px] flex-1 items-center justify-center">
                <div className="w-[250px] text-center">
                  <p className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{stat.n}</p>
                  <p className={`${stat.labelClass} text-[#666666]`}>{stat.l}</p>
                </div>
                {idx < 3 ? <span className="h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative h-[862px] bg-white">
        <div className="tb-container h-full">
          <div className="relative mx-auto grid max-w-[1139px] grid-cols-[557px_504px] gap-[131px] pt-[197px]">
            <div className="pt-1">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Mission</p>
              </div>
              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Empowering enterprises with world-class technology talent
              </h2>
              <p className="mt-2 max-w-[532px] whitespace-pre-line text-[18px] leading-7 text-[#666666]">
                {"At TechBubble, we provide tailored AI-powered IT solutions and digital strategies to help Australian and global enterprises thrive. Our focus is on efficiency, security, and innovation.\nPartner with TechBubble to unlock tailored, innovative solutions that drive success and position your business for long-term growth."}
              </p>
              <Link
                href="/services"
                className="mt-4 inline-flex h-[52px] w-[182px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
              >
                Explore Services
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            <div className="relative -mt-[54px] h-[656px]">
              <div className="mt-8 h-[602px] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] space-y-4">
                {missionCards.map((card) => (
                  <div key={card.title} className="h-[150px] rounded-[24px] border border-[#e5e5e5] bg-white px-4 py-[15px]">
                    <div className="flex items-start gap-5">
                      <span className="mt-9 flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#f7f7f7]">
                        <span className="h-3 w-3 rounded-[3px] bg-[#111111]" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">{card.title}</h3>
                        <p className="mt-0.5 max-w-[392px] text-[16px] leading-6 text-[#838383]">{card.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section
        className="bg-[#fafafa] py-[120px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d4d4d4' stroke-width='0.5'%3E%3Cpath d='M40 0 L80 20 L80 60 L40 80 L0 60 L0 20 Z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "120px",
        }}
      >
        <div className="tb-container">
          <div className="mx-auto mb-16 max-w-[1139px] text-center">
            <div className="mx-auto inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Team</p>
            </div>
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Meet The Leadership</h2>
            <p className="mt-1 text-[18px] leading-7 text-[#666666]">
              The visionaries driving TechBubble&apos;s mission to transform businesses through technology.
            </p>
          </div>

          <div className="mx-auto grid max-w-[1558px] grid-cols-3 gap-10">
            {leadershipCards.map((leader) => (
              <div key={leader.name} className="rounded-[21px] bg-[#111111] px-[30px] pb-9 text-white">
                <div className="mx-auto mb-5 mt-[-45px] h-[241px] w-[241px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-700">
                  <Image src={leader.image} alt={leader.name} width={241} height={241} className="h-full w-full object-cover" />
                </div>
                <h3 className="text-[35px] font-semibold leading-[42px] tracking-[-0.09px]">{leader.name}</h3>
                <p className="mt-[3px] text-[14px] font-bold leading-[21px] text-white">{leader.role}</p>
                <p className="mt-3 text-[12px] leading-[17.6px] text-white">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="text-center">
              <div className="mx-auto inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Complete Team</p>
              </div>
              <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Meet Our Entire Workforce</h2>
              <p className="mx-auto mt-1 max-w-[923px] text-[18px] leading-7 text-[#666666]">
                With 150+ expert technicians across multiple specializations and global offices, we bring world-class expertise to every project. Our diverse team ensures excellence across every technology stack.
              </p>
            </div>

            <div className="mx-auto mt-8 flex h-[110px] w-[944px] items-center rounded-[21px] bg-[#111111] px-[79px]">
              {[
                { n: "150+", l: "Expert Team Members" },
                { n: "9", l: "Specialized Departments" },
                { n: "5", l: "Global Offices" },
                { n: "10+", l: "Years Experience" },
              ].map((s, idx) => (
                <div key={s.l} className="flex items-center">
                  <div className="w-[150px] text-center">
                    <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-white">{s.n}</p>
                    <p className="text-[12px] font-medium leading-4 text-[#f7f7f7]">{s.l}</p>
                  </div>
                  {idx < 3 ? <span className="mx-[30px] h-[78px] w-px bg-white/[0.17]" aria-hidden /> : null}
                </div>
              ))}
            </div>

            <div className="mt-16">
              <div className="ml-[10px] flex items-center gap-2">
                {workforceTabs.slice(0, 5).map((tab) => (
                  <span
                    key={tab.label}
                    className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[35px] border px-[23px] text-[16px] font-semibold leading-6 ${
                      tab.active ? "border-[#111111] bg-[#111111] text-white" : "border-[#e5e5e5] bg-white text-[#666666]"
                    }`}
                    style={{ width: `${tab.width}px` }}
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
              <div className="ml-[113px] mt-4 flex items-center gap-2">
                {workforceTabs.slice(5).map((tab) => (
                  <span
                    key={tab.label}
                    className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[35px] border border-[#e5e5e5] bg-white px-[23px] text-[16px] font-semibold leading-6 text-[#666666]"
                    style={{ width: `${tab.width}px` }}
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <div className="border-b border-[#e5e5e5] pb-2">
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">Management Team</h3>
              <p className="mt-1 text-[14px] leading-5 tracking-[0.035px] text-[#666666]">5 members</p>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-6">
                {managementTeam.map((person) => (
                  <div key={person.name} className="text-center">
                    <div className="mx-auto h-[145px] w-[145px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-200">
                      <Image src={person.image} alt={person.name} width={145} height={145} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-2 text-[16px] font-bold leading-6 text-[#111111]">{person.name}</p>
                    <p className="mx-auto mt-0.5 max-w-[190px] text-[14px] leading-5 tracking-[0.035px] text-[#666666]">{person.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#666666]">Why Choose Us</p>
            </div>
            <div className="mt-2 max-w-[898px]">
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Our Unique Selling Points</h2>
              <p className="mt-1 text-[18px] leading-7 text-[#666666]">Discover what makes TechBubble the preferred partner for businesses worldwide.</p>
            </div>
          </div>
          <div className="mx-auto mt-8 grid max-w-[1139px] grid-cols-3 gap-12">
            <div>
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">Technical Expertise That Spans Industries</h3>
              <p className="mt-2 text-[16px] leading-6 text-[#838383]">
                Our team is proficient across a wide spectrum of technologies, including SaaS platforms like ServiceNow, Salesforce, and MuleSoft, and programming languages such as Java, Ruby, and Laravel. Whether your business requires IT solutions for small projects or complex, large-scale initiatives, our experience and skills make us your go-to partner for any technology stack.
              </p>
            </div>
            <div>
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">World-Class Talent, Available When You Need It</h3>
              <p className="mt-2 text-[16px] leading-6 text-[#838383]">
                We connect you with a vast network of skilled professionals experienced in handling international projects of all complexities. Our resources work within your time zone, ensuring seamless collaboration during your business hours. By outsourcing your IT needs to us, you can focus on what you do best&mdash;running your business&mdash;while we handle the technical details.
              </p>
            </div>
            <div>
              <h3 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#0e0f11]">24/7 Support & Governance&mdash;At No Extra Cost</h3>
              <p className="mt-2 text-[16px] leading-6 text-[#838383]">
                At TechBubble, customer satisfaction is our priority. We deliver tailored solutions, regardless of your budget, while providing round-the-clock professional support and governance at no additional charge. From start to finish, we ensure a smooth, worry-free experience and guarantee exceptional service at every stage of the engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1139px] grid-cols-[526px_532px] items-center gap-[81px]">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">Our Values</p>
              </div>
              <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">What Drives Us Forward</h2>
              <p className="mt-2 text-[16px] leading-6 text-[#666666]">
                <strong>At TechBubble,</strong> we&apos;re passionate about innovation and committed to empowering businesses with cutting-edge technology solutions. We believe in fostering a culture that celebrates creativity, collaboration, and continuous growth.
              </p>

              <div className="mt-8 space-y-2">
                {[
                  { t: "Innovation", s: "Constantly pushing boundaries with cutting-edge solutions" },
                  { t: "Excellence", s: "Delivering exceptional quality in every project" },
                  { t: "Partnership", s: "Building lasting relationships with our clients" },
                  { t: "Integrity", s: "Operating with transparency and honesty" },
                ].map((item) => (
                  <div key={item.t} className="rounded-[15px] border border-[#e5e5e5] bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-[4px] bg-[#666666]" aria-hidden />
                      <span className="text-[16px] font-semibold leading-6 text-[#06091a]">{item.t}</span>
                    </div>
                    <p className="mt-1 pl-5 text-[12px] font-medium leading-4 text-[#666666]">{item.s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[36px] border border-[#e2e7f4] bg-white">
              <div className="bg-[#111111] px-[30px] py-[31px]">
                <h3 className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-white">Our Mission</h3>
              </div>
              <p className="px-[27px] pb-[37px] pt-6 text-[18px] leading-7 text-[#666666]">
                To empower businesses worldwide with innovative technology solutions that drive growth, efficiency, and success in an ever-evolving digital landscape.
              </p>
              <div className="flex gap-[18px] px-[27px] pb-[39px]">
                <div className="flex h-[85px] w-[228px] flex-col justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-[27px]">
                  <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">10+</p>
                  <p className="text-[12px] font-medium leading-4 text-[#666666]">Years Experience</p>
                </div>
                <div className="flex h-[85px] w-[228px] flex-col justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-[27px]">
                  <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">5</p>
                  <p className="text-[12px] font-medium leading-4 text-[#666666]">Global Offices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#111111]">Client Stories</p>
            </div>
            <h2 className="mt-4 whitespace-pre-line text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
              {"Trusted by people\nwho know technology best"}
            </h2>

            <p className="mt-14 whitespace-pre-line text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#666666]">
              {"\"TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism,\ncreativity, and technical expertise. What impressed us most was their ability to adapt\nto unforeseen challenges without compromising timelines or quality.\""}
            </p>

            <div className="mt-12 h-px w-full bg-[#e5e5e5]" />

            <div className="mt-12 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-[62px] w-[62px] overflow-hidden rounded-full bg-neutral-200">
                  <Image src={aboutUs9} alt="Haima Prakash" width={62} height={62} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">Haima Prakash</p>
                  <p className="text-[16px] leading-6 text-[#838383]">Sr. Manager, Chief Technology Office · University of Sydney</p>
                  <p className="mt-1 text-[13.6px] tracking-[2px] text-[#f59e0b]">★★★★★</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex h-10 w-14 items-center justify-center rounded-full border border-[#585858]" aria-label="Previous testimonial">
                  <ChevronLeft className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
                </button>
                <button className="flex h-10 w-14 items-center justify-center rounded-full border border-[#585858]" aria-label="Next testimonial">
                  <ChevronRight className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f7] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[751px_353px] gap-8">
            <div>
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">Ready to build something remarkable?</h2>
              <p className="mt-2 max-w-[751px] text-[18px] leading-7 text-[#666666]">
                Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link href="/contact" className="inline-flex h-[52px] w-[229px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white">
                  Book a Free Consultation
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
                <Link href="/services" className="inline-flex h-[52px] w-[161px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-white text-[16px] font-semibold text-[#111111]">
                  Explore Services
                </Link>
              </div>
            </div>

            <div>
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link href="/contact" className="inline-flex h-[51px] w-[118px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white">
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  Email Us
                </Link>
                <a href="tel:+611300934031" className="inline-flex h-[51px] w-[159px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-[#e5e5e5] text-[14px] font-semibold text-[#111111]">
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
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
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
