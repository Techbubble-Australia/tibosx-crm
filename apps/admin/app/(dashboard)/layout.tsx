"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileText,
  LogOut,
  Briefcase,
  Users,
  MessageSquare,
  HelpCircle,
  Mail,
  UserCheck,
  FileStack,
  Building2,
  Shield,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

const navItems = [
  { href: "/pages", label: "Site pages", icon: FileStack, roles: ["admin", "editor", "viewer"] },
  { href: "/case-studies", label: "Case Studies", icon: FileText, roles: ["admin", "editor", "viewer"] },
  { href: "/jobs", label: "Job Listings", icon: Briefcase, roles: ["admin", "editor", "viewer"] },
  { href: "/clients", label: "Clients", icon: Building2, roles: ["admin"] },
  { href: "/team", label: "Team Members", icon: Users, roles: ["admin", "editor", "viewer"] },
  { href: "/testimonials", label: "Testimonials", icon: MessageSquare, roles: ["admin", "editor", "viewer"] },
  { href: "/faqs", label: "FAQs", icon: HelpCircle, roles: ["admin", "editor", "viewer"] },
  { href: "/career-applications", label: "Career Applications", icon: UserCheck, roles: ["admin", "editor", "viewer"] },
  { href: "/contact-submissions", label: "Contact Submissions", icon: Mail, roles: ["admin", "editor", "viewer"] },
  { href: "/users", label: "Users", icon: Shield, roles: ["admin"] },
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
  const [userRole, setUserRole] = useState<string>("admin");

  useEffect(() => {
    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const role = data?.data?.user?.role;
        if (role) setUserRole(role);
      })
      .catch(() => undefined);
  }, []);

  const visibleNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">TECHBUBBLE</span>
          </Link>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                window.location.href = "/login";
              });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        <header className="border-b border-gray-200 bg-white px-8 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{headerTitle(pathname)}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
