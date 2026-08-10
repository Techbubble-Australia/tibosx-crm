"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  Database,
  Globe,
  Settings,
  LayoutDashboard,
  UserCircle,
  ChevronDown,
  Layers,
  Cpu,
  Building,
} from "lucide-react";
import { AdminSessionProvider, useAdminSession } from "@/contexts/AdminSessionContext";
import { roleLabel } from "@/lib/admin-roles";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  roles: string[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: typeof Database;
  roles: string[];
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    id: "database",
    label: "Database",
    icon: Database,
    roles: ["admin", "editor", "viewer"],
    items: [
      { href: "/database/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor", "viewer"] },
      { href: "/database/profiles", label: "Profiles", icon: UserCircle, roles: ["admin", "editor", "viewer"] },
      { href: "/database/career-applications", label: "Career applications", icon: UserCheck, roles: ["admin", "editor", "viewer"] },
    ],
  },
  {
    id: "website",
    label: "Website",
    icon: Globe,
    roles: ["admin", "editor", "viewer"],
    items: [
      { href: "/pages", label: "Site pages", icon: FileStack, roles: ["admin", "editor", "viewer"] },
      { href: "/jobs", label: "Job Listings", icon: Briefcase, roles: ["admin", "editor", "viewer"] },
      { href: "/case-studies", label: "Case Studies", icon: FileText, roles: ["admin", "editor", "viewer"] },
      { href: "/testimonials", label: "Testimonials", icon: MessageSquare, roles: ["admin", "editor", "viewer"] },
      { href: "/faqs", label: "FAQs", icon: HelpCircle, roles: ["admin", "editor", "viewer"] },
      { href: "/contact-submissions", label: "Contact Submissions", icon: Mail, roles: ["admin", "editor", "viewer"] },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "editor", "viewer"],
    items: [
      { href: "/settings/categories", label: "Category", icon: Layers, roles: ["admin", "editor"] },
      { href: "/settings/technologies", label: "Technology", icon: Cpu, roles: ["admin", "editor"] },
      { href: "/settings/departments", label: "Department", icon: Building, roles: ["admin", "editor"] },
      { href: "/settings/security", label: "Security", icon: Shield, roles: ["admin", "editor", "viewer"] },
      { href: "/team", label: "Team members", icon: Users, roles: ["admin", "editor", "viewer"] },
      { href: "/clients", label: "Client", icon: Building2, roles: ["admin"] },
      { href: "/users", label: "Users", icon: UserCircle, roles: ["admin"] },
    ],
  },
];

function headerTitle(pathname: string): string {
  for (const group of navGroups) {
    const hit = group.items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    if (hit) return hit.label;
  }
  return "Admin";
}

function groupIsActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, email, canMutate, loading } = useAdminSession();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        if (groupIsActive(group, pathname)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.roles.includes(role)),
        }))
        .filter((group) => group.roles.includes(role) && group.items.length > 0),
    [role],
  );

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="min-w-0 p-6">
          <Link href="/database/dashboard" className="flex min-w-0 items-center gap-2">
            <div className="grid shrink-0 grid-cols-2 gap-0.5">
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
            </div>
            <span className="truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              TECHBUBBLE
            </span>
          </Link>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          {!loading && email ? (
            <div className="mt-3 min-w-0 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={email}>
                {email}
              </p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{roleLabel(role)}</p>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups[group.id] ?? false;
            const groupActive = groupIsActive(group, pathname);
            return (
              <div key={group.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    groupActive
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{group.label}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
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
        {!loading && !canMutate ? (
          <div className="border-b border-amber-200 bg-amber-50 px-8 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Read-only access ({roleLabel(role)}). You can view data but cannot create, edit, or delete content.
          </div>
        ) : null}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </AdminSessionProvider>
  );
}
