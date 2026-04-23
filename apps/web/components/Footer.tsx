import Image from "next/image";
import Link from "next/link";
import { Linkedin, Facebook, Instagram } from "lucide-react";
import footerLogo from "@image/techbubble_-_home_36.png";

const companyLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/contact", label: "Contact" },
];

const serviceLinks = [
  { href: "/services", label: "Staff Augmentation" },
  { href: "/services", label: "Project Delivery" },
  { href: "/services", label: "Product Engineering" },
  { href: "/services", label: "ServiceNow" },
  { href: "/services", label: "Salesforce" },
  { href: "/services", label: "MuleSoft" },
];

export function Footer() {
  return (
    <footer className="bg-[#111111] pt-[82px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1136px]">
          <div className="grid grid-cols-[264px_176px_176px_267px] gap-x-[56px]">
            <div>
              <Image src={footerLogo} alt="TechBubble" className="h-[68px] w-[145px] object-contain" />
              <p className="mt-[14px] text-[14px] leading-5 tracking-[0.035px] text-white">
                AI-driven digital transformation across Asia Pacific and North America. Top 1% tech talent, deployed fast.
              </p>
              <div className="mt-[32px] flex items-center gap-2">
                {[
                  { href: "#", label: "LinkedIn", Icon: Linkedin },
                  { href: "#", label: "Facebook", Icon: Facebook },
                  { href: "#", label: "Instagram", Icon: Instagram },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/10 bg-white/[0.06] text-white/90 transition-colors hover:bg-white/15"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-bold leading-6 text-white">Company</h3>
              <div className="mt-3 space-y-[18px]">
                {companyLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="block text-[12px] font-medium leading-4 text-[#666666]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-bold leading-6 text-white">Services</h3>
              <div className="mt-3 space-y-[18px]">
                {serviceLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="block text-[12px] font-medium leading-4 text-[#666666]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-bold leading-6 text-white">Our Offices</h3>

              <div className="mt-3 space-y-[19px]">
                <div>
                  <p className="text-[14px] font-semibold leading-5 text-white">🇦🇺 Australia (HQ) <span className="px-2 text-white/75">|</span> Techbubble Pty Ltd</p>
                  <p className="mt-[1px] text-[12px] font-medium leading-4 text-[#666666]">Level 1216/126 Banks Ave, Eastgardens, Sydney NSW 2000</p>
                </div>
                <div>
                  <p className="text-[14px] font-semibold leading-5 text-white">🇺🇸 USA <span className="px-2 text-white/75">|</span> Techbubble USA Inc.</p>
                  <p className="mt-[1px] text-[12px] font-medium leading-4 text-[#666666]">1846/1007 N Orange St, WL, De 19801, USA</p>
                </div>
                <div>
                  <p className="text-[14px] font-semibold leading-5 text-white">🇮🇳 India <span className="px-2 text-white/75">|</span> Techbubble India Pvt LtD</p>
                  <p className="mt-[1px] text-[12px] font-medium leading-4 text-[#666666]">Office 713, K.P. EPITOME Nr. Siddhi Vinayak Tower, Nr. DAV School, MaKarba, Ahmedabad, Gujarat India 380051</p>
                </div>
              </div>

              <h4 className="mt-[18px] text-[14px] font-semibold leading-5 text-white">Contact Info</h4>
              <div className="mt-[2px] space-y-0 text-[12px] font-medium leading-4 text-[#666666]">
                <a href="mailto:hello@techbubble.com.au" className="block">hello@techbubble.com.au</a>
                <a href="tel:+19797012995" className="block">USA: +1 (979)-701-2995</a>
                <a href="tel:+611300934031" className="block">Australia: (+61) 1300 934 031</a>
                <p className="pt-[2px]">🕐 Mon–Fri: 9AM – 5PM AEST</p>
              </div>
            </div>
          </div>

          <div className="mt-[28px] flex h-[50px] items-end justify-between border-t border-white/[0.06] pb-[4px]">
            <p className="text-[12px] font-bold leading-4 text-[#666666]">© 2026 TechBubble Pty Ltd · All Rights Reserved</p>
            <div className="flex items-center gap-5">
              <Link href="#" className="text-[12px] font-bold leading-4 text-[#666666]">Privacy</Link>
              <Link href="#" className="text-[12px] font-bold leading-4 text-[#666666]">Terms</Link>
              <Link href="#" className="text-[12px] font-bold leading-4 text-[#666666]">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
