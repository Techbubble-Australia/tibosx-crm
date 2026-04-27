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
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="h-2 w-2 rounded-full bg-black" />
              <div className="h-2 w-2 rounded-full bg-black" />
              <div className="h-2 w-2 rounded-full bg-black" />
              <div className="h-2 w-2 rounded-full bg-black" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900">TECHBUBBLE</span>
          </Link>
          <p className="mt-1 text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                window.location.href = "/login";
              });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
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
