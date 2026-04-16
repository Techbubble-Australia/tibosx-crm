import Link from "next/link";
import { Linkedin, Facebook, Instagram } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
    <footer className="bg-[#0a0a0a] text-white pt-16 pb-8">
      <div className="tb-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex mb-4">
              <BrandLogo variant="onDark" />
            </Link>
            <p className="text-gray-400 text-sm mb-6">
              AI-driven digital transformation across Asia Pacific and North America. Top 1% tech talent, deployed fast.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700 [&>svg]:stroke-[1.5]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700 [&>svg]:stroke-[1.5]"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700 [&>svg]:stroke-[1.5]"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offices */}
          <div>
            <h4 className="font-semibold mb-4">Our Offices</h4>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">🇦🇺 Australia (HQ) | Techbubble Pty Ltd</p>
                <p className="text-gray-400">Level 12/16 126 Banks Ave, Eastgardens, Sydney NSW 2000</p>
              </div>
              <div>
                <p className="font-medium">🇺🇸 USA | Techbubble USA Inc.</p>
                <p className="text-gray-400">1846/1007 N Orange St, WI, DE 19801, USA</p>
              </div>
              <div>
                <p className="font-medium">🇮🇳 India | Techbubble India Pvt LTD</p>
                <p className="text-gray-400">Office 713, K.P. EPITOME Nr. Siddhi Vinayak Tower, Nr. DAV School, Makarba, Ahmedabad, Gujarat India 380051</p>
              </div>
              <div className="pt-2">
                <p className="font-medium">Contact Info</p>
                <p className="text-gray-400">hello@techbubble.com.au</p>
                <p className="text-gray-400">USA: +1 (979) 701-2995</p>
                <p className="text-gray-400">Australia: (+61) 1300 934 031</p>
                <p className="text-gray-400">Mon-Fri: 9AM — 5PM AEST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Techbubble Pty Ltd — All Rights Reserved
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-500 text-sm hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-gray-500 text-sm hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-gray-500 text-sm hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
