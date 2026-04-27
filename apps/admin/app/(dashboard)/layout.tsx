"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LogOut, Briefcase, Users, MessageSquare, HelpCircle, Mail, UserCheck, FileStack } from "lucide-react";

const navItems = [
  { href: "/pages", label: "Site pages", icon: FileStack },
  { href: "/case-studies", label: "Case Studies", icon: FileText },
  { href: "/jobs", label: "Job Listings", icon: Briefcase },
  { href: "/team", label: "Team Members", icon: Users },
  { href: "/testimonials", label: "Testimonials", icon: MessageSquare },
  { href: "/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/career-applications", label: "Career Applications", icon: UserCheck },
  { href: "/contact-submissions", label: "Contact Submissions", icon: Mail },
];

function headerTitle(pathname: string): string {
  const hit = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return hit?.label ?? "Admin";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="font-semibold text-lg tracking-tight">TECHBUBBLE</span>
          </Link>
          <p className="text-gray-400 text-xs mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                window.location.href = "/login";
              });
            }}
            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-semibold">{headerTitle(pathname)}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
