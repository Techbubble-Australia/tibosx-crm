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
  FileStack,
  Building2,
  Handshake,
  CircleDollarSign,
  ScrollText,
  Shield,
  Globe,
  Settings,
  LayoutDashboard,
  UserCircle,
  ChevronDown,
  Layers,
  Cpu,
  Building,
  Target,
  ClipboardList,
  PanelLeftClose,
  PanelLeft,
  FolderKanban,
  FileCode,
  ClipboardCheck,
  Ticket,
} from "lucide-react";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { ImpersonationBanner } from "@/components/users/ImpersonationBanner";
import { ImpersonateUserModal } from "@/components/users/ImpersonateUserModal";
import { anyEffectiveRole, defaultLandingPath } from "@/lib/admin-roles";
import { AdminSessionProvider, useAdminSession } from "@/contexts/AdminSessionContext";
import { MfaEnrollmentGuard } from "@/components/MfaEnrollmentGuard";
import { MemberOnboardingGuard } from "@/components/MemberOnboardingGuard";
import { AgreementOnboardingGate } from "@/components/onboarding/AgreementOnboardingGate";
import { MemberProfileCompletionGate } from "@/components/onboarding/MemberProfileCompletionGate";
import { TechBubbleLogo } from "@/components/TechBubbleLogo";
import { InactivityLogout } from "@/components/InactivityLogout";
import { TicketPortalLink } from "@/components/TicketPortalLink";
import { isCareerApplicationsPath, isJobListingsPath } from "@/lib/job-routes";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  roles: string[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: typeof Globe;
  roles: string[];
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    id: "sales",
    label: "Sales",
    icon: Building2,
    roles: ["admin", "sales"],
    items: [
      { href: "/sales/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "sales"] },
      { href: "/clients/active", label: "Clients", icon: Handshake, roles: ["admin", "sales"] },
      { href: "/opportunities", label: "Opportunities", icon: CircleDollarSign, roles: ["admin", "sales"] },
      { href: "/contracts", label: "Contracts", icon: ScrollText, roles: ["admin", "sales"] },
      { href: "/invoices", label: "Invoices", icon: FileText, roles: ["admin", "sales"] },
    ],
  },
  {
    id: "project_management",
    label: "Project Management",
    icon: FolderKanban,
    roles: ["admin", "sales", "project_manager", "project_member"],
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "project_manager", "project_member"] },
      { href: "/timesheets", label: "Timesheets", icon: ClipboardCheck, roles: ["admin", "project_manager", "project_member"] },
    ],
  },
  {
    id: "workspace",
    label: "Customer support",
    icon: ClipboardList,
    roles: ["admin", "customer_support", "client"],
    items: [
      { href: "/workspace/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["customer_support", "client"] },
      { href: "/workspace/tickets", label: "Tickets", icon: Ticket, roles: ["customer_support", "client"] },
      { href: "/workspace/timesheets", label: "Timesheets", icon: ClipboardCheck, roles: ["customer_support", "client"] },
      { href: "/support-tickets/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
      { href: "/support-tickets", label: "Tickets", icon: Ticket, roles: ["admin"] },
    ],
  },
  {
    id: "recruitment",
    label: "Recruitment",
    icon: Target,
    roles: ["admin", "recruiter_admin", "recruiter", "website"],
    items: [
      { href: "/database/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "recruiter_admin", "recruiter"] },
      { href: "/jobs/active", label: "Job Listings", icon: Briefcase, roles: ["admin", "recruiter_admin", "recruiter", "website"] },
      { href: "/career-applications/active", label: "Career Applications", icon: ClipboardList, roles: ["admin", "recruiter_admin", "recruiter"] },
      { href: "/database/profiles", label: "Profiles", icon: UserCircle, roles: ["admin", "recruiter_admin", "recruiter"] },
    ],
  },
  {
    id: "website",
    label: "Website",
    icon: Globe,
    roles: ["admin", "website"],
    items: [
      { href: "/pages", label: "Site pages", icon: FileStack, roles: ["admin", "website"] },
      { href: "/case-studies", label: "Case Studies", icon: FileText, roles: ["admin", "website"] },
      { href: "/testimonials", label: "Testimonials", icon: MessageSquare, roles: ["admin", "website"] },
      { href: "/faqs", label: "FAQs", icon: HelpCircle, roles: ["admin", "website"] },
      { href: "/contact-submissions", label: "Contact Submissions", icon: Mail, roles: ["admin", "website"] },
      { href: "/team", label: "Team members", icon: Users, roles: ["admin", "website"] },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin"],
    items: [
      { href: "/settings/categories", label: "Category", icon: Layers, roles: ["admin", "website"] },
      { href: "/settings/technologies", label: "Technology", icon: Cpu, roles: ["admin", "website"] },
      { href: "/settings/departments", label: "Department", icon: Building, roles: ["admin", "website"] },
      { href: "/settings/levels", label: "Level", icon: Target, roles: ["admin", "website"] },
      { href: "/settings/templates", label: "Templates", icon: FileCode, roles: ["admin"] },
      { href: "/settings/notifications", label: "Email notifications", icon: Mail, roles: ["admin"] },
      { href: "/settings/groups", label: "Groups", icon: Users, roles: ["admin"] },
      { href: "/settings/security", label: "Security", icon: Shield, roles: ["admin"] },
      { href: "/users/active", label: "Users", icon: UserCircle, roles: ["admin"] },
    ],
  },
];

function headerTitle(pathname: string): string {
  if (pathname.startsWith("/settings/profile")) {
    return "My profile";
  }
  if (pathname.startsWith("/workspace")) {
    if (pathname.startsWith("/workspace/tickets/new")) return "Create ticket";
    if (pathname.startsWith("/workspace/tickets/")) return "Ticket";
    if (pathname.startsWith("/workspace/tickets")) return "Tickets";
    if (pathname.startsWith("/workspace/timesheets")) return "Timesheets";
    return "Dashboard";
  }
  if (pathname.startsWith("/support-tickets")) {
    if (pathname.startsWith("/support-tickets/new")) return "Create ticket";
    if (pathname.startsWith("/support-tickets/dashboard")) return "Dashboard";
    if (pathname.match(/^\/support-tickets\/[^/]+$/)) return "Ticket";
    if (pathname.startsWith("/support-tickets/projects")) return "Support projects";
    if (pathname.startsWith("/support-tickets/assignments")) return "Consultant access";
    return "Tickets";
  }
  if (pathname.startsWith("/users")) {
    return "Users";
  }
  if (isCareerApplicationsPath(pathname)) {
    return "Career Applications";
  }
  if (isJobListingsPath(pathname)) {
    return "Job Listings";
  }
  if (pathname.startsWith("/opportunities")) {
    return "Opportunities";
  }
  if (pathname.startsWith("/contracts")) {
    return "Contracts";
  }
  if (pathname.startsWith("/invoices")) {
    return "Invoices";
  }
  if (pathname.startsWith("/sales/dashboard")) {
    return "Sales Dashboard";
  }
  if (pathname.startsWith("/clients")) {
    return "Clients";
  }
  for (const group of navGroups) {
    const hit = group.items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    if (hit) return hit.label;
  }
  return "TIBOSX.AI";
}

function pathUnder(prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** PM timesheets live at /timesheets — never treat /support-tickets or /workspace as PM. */
function isProjectManagementPath(pathname: string): boolean {
  if (pathUnder("/support-tickets", pathname) || pathUnder("/workspace", pathname)) {
    return false;
  }
  return (
    pathUnder("/projects", pathname) ||
    pathUnder("/timesheets", pathname) ||
    pathUnder("/agreement", pathname)
  );
}

function isWorkspacePath(pathname: string): boolean {
  return pathUnder("/workspace", pathname) || pathUnder("/support-tickets", pathname);
}

function groupIsActive(group: NavGroup, pathname: string): boolean {
  if (group.id === "recruitment" && (isJobListingsPath(pathname) || isCareerApplicationsPath(pathname))) {
    return true;
  }
  if (
    group.id === "sales" &&
    (pathname.startsWith("/sales") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/opportunities") ||
      pathname.startsWith("/contracts") ||
      pathname.startsWith("/invoices"))
  ) {
    return true;
  }
  if (group.id === "project_management") {
    return isProjectManagementPath(pathname);
  }
  if (group.id === "workspace") {
    return isWorkspacePath(pathname);
  }
  return group.items.some((item) => navItemIsActive(item, pathname));
}

function navItemIsActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/jobs/active") {
    return isJobListingsPath(pathname);
  }
  if (item.href === "/career-applications/active") {
    return isCareerApplicationsPath(pathname);
  }
  if (item.href === "/clients/active") {
    return pathname.startsWith("/clients");
  }
  if (item.href === "/opportunities") {
    return pathname === "/opportunities" || pathname.startsWith("/opportunities/");
  }
  if (item.href === "/contracts") {
    return pathname === "/contracts" || pathname.startsWith("/contracts/");
  }
  if (item.href === "/timesheets") {
    return pathUnder("/timesheets", pathname) && !pathUnder("/support-tickets", pathname);
  }
  if (item.href === "/support-tickets/dashboard") {
    return pathUnder("/support-tickets/dashboard", pathname);
  }
  if (item.href === "/support-tickets") {
    return (
      pathUnder("/support-tickets", pathname) &&
      !pathUnder("/support-tickets/dashboard", pathname) &&
      !pathUnder("/support-tickets/new", pathname) &&
      !pathUnder("/support-tickets/projects", pathname) &&
      !pathUnder("/support-tickets/assignments", pathname)
    );
  }
  if (item.href.startsWith("/workspace")) {
    return pathUnder(item.href, pathname);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    role,
    additionalRoles,
    email,
    userName,
    profilePhotoUrl,
    userId,
    loading,
    impersonation,
    canAccessProjectManagementTimesheets,
    canAccessWorkspaceTimesheets,
  } = useAdminSession();
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        const active = groupIsActive(group, pathname);
        if (active) {
          next[group.id] = true;
        } else if (group.id === "project_management" || group.id === "workspace") {
          next[group.id] = false;
        }
      }
      return next;
    });
  }, [pathname]);

  const visibleGroups = useMemo(() => {
    function itemVisible(item: NavItem): boolean {
      if (item.href === "/timesheets") {
        return anyEffectiveRole(role, additionalRoles, item.roles) || canAccessProjectManagementTimesheets;
      }
      if (item.href === "/workspace/timesheets") {
        if (anyEffectiveRole(role, additionalRoles, ["admin"])) return true;
        return canAccessWorkspaceTimesheets;
      }
      return anyEffectiveRole(role, additionalRoles, item.roles);
    }
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(itemVisible),
      }))
      .filter((group) => {
        const groupAllowed =
          anyEffectiveRole(role, additionalRoles, group.roles) ||
          (group.id === "project_management" && canAccessProjectManagementTimesheets) ||
          (group.id === "workspace" && canAccessWorkspaceTimesheets);
        return groupAllowed && group.items.length > 0;
      });
  }, [role, additionalRoles, canAccessProjectManagementTimesheets, canAccessWorkspaceTimesheets]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`flex shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 dark:border-gray-700 dark:bg-gray-900 ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        <div className={`min-w-0 p-4 ${sidebarCollapsed ? "px-2" : "p-6"}`}>
          <div className="flex items-center justify-between gap-2">
            <Link href={defaultLandingPath(role)} className="flex min-w-0 items-center gap-2">
              <TechBubbleLogo variant="sidebar" compact={sidebarCollapsed} />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          {!sidebarCollapsed ? (
            <p className="mt-1 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
              AI-powered Business Operating System
            </p>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {sidebarCollapsed ? (
            <div className="space-y-1">
              {visibleGroups.flatMap((group) =>
                group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = navItemIsActive(item, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                        isActive
                          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  );
                }),
              )}
            </div>
          ) : (
            visibleGroups.map((group) => {
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
                      const isActive = navItemIsActive(item, pathname);
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
          })
          )}
        </nav>

        <div className={`border-t border-gray-200 dark:border-gray-700 ${sidebarCollapsed ? "p-2" : "p-4"}`}>
          <button
            type="button"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                window.location.href = "/login";
              });
            }}
            className={`flex w-full items-center rounded-lg text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
              sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-4 py-3"
            }`}
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-gray-50 dark:bg-gray-950">
        <ImpersonationBanner />
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{headerTitle(pathname)}</h1>
          <div className="flex items-center gap-3">
            <TicketPortalLink />
            {!loading && email ? (
              <UserAccountMenu
                name={userName}
                email={email}
                photoUrl={profilePhotoUrl}
                profileHref="/settings/profile"
                canImpersonate={role === "admin" && !impersonation}
                onImpersonate={() => setImpersonateOpen(true)}
                onSignOut={() => {
                  void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                    window.location.href = "/login?signin=1";
                  });
                }}
              />
            ) : null}
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
      <ImpersonateUserModal open={impersonateOpen} onClose={() => setImpersonateOpen(false)} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <MfaEnrollmentGuard>
        <MemberOnboardingGuard>
          <AgreementOnboardingGate />
          <MemberProfileCompletionGate />
          <InactivityLogout />
          <DashboardChrome>{children}</DashboardChrome>
        </MemberOnboardingGuard>
      </MfaEnrollmentGuard>
    </AdminSessionProvider>
  );
}
