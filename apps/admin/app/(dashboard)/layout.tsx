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
  Bug,
  Home,
} from "lucide-react";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { HelpSupportHeaderButton } from "@/components/HelpSupportHeaderButton";
import { ImpersonationBanner } from "@/components/users/ImpersonationBanner";
import { ImpersonateUserModal } from "@/components/users/ImpersonateUserModal";
import { DebugModeGate } from "@/components/debug/DebugModeGate";
import {
  anyEffectiveRole,
  defaultLandingPath,
  formatRolesLabel,
  isRestrictedToWorkspaceOnly,
} from "@/lib/admin-roles";
import { AdminSessionProvider, useAdminSession } from "@/contexts/AdminSessionContext";
import { MfaEnrollmentGuard } from "@/components/MfaEnrollmentGuard";
import { MemberOnboardingGuard } from "@/components/MemberOnboardingGuard";
import { AgreementOnboardingGate } from "@/components/onboarding/AgreementOnboardingGate";
import { MemberProfileCompletionGate } from "@/components/onboarding/MemberProfileCompletionGate";
import { AppAlertProvider } from "@/components/ui/AppAlertProvider";
import { TechBubbleLogo } from "@/components/TechBubbleLogo";
import { InactivityLogout } from "@/components/InactivityLogout";
import { TicketPortalLink } from "@/components/TicketPortalLink";
import { isCareerApplicationsPath, isJobListingsPath } from "@/lib/job-routes";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { useIsDevelopmentAppEnv } from "@/lib/use-is-development-app-env";

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

/** Personal home for every non-client user; client/support-portal-only users land on their portal dashboard. */
const workspaceNavItem: NavItem = {
  href: "/my-workspace",
  label: "Workspace",
  icon: Home,
  roles: [],
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
      { href: "/projects/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "project_manager"] },
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
      { href: "/workspace/client", label: "Client workspace", icon: Building2, roles: ["client"] },
      { href: "/workspace/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["customer_support", "client"] },
      { href: "/workspace/tickets", label: "Tickets", icon: Ticket, roles: ["customer_support", "client"] },
      { href: "/workspace/timesheets", label: "Approve/Reject Timesheets", icon: ClipboardCheck, roles: ["client"] },
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
      { href: "/users/active", label: "Internal users", icon: UserCircle, roles: ["admin"] },
      { href: "/customer-users/active", label: "Customer users", icon: UserCircle, roles: ["admin"] },
      { href: "/debug-capture", label: "Debug captures", icon: Bug, roles: ["admin"] },
    ],
  },
];

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
  if (item.href === "/projects") {
    return pathUnder("/projects", pathname) && !pathUnder("/projects/dashboard", pathname);
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
  const pathname = usePathname() ?? "";
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
    canAccessClientWorkspace,
  } = useAdminSession();
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const isDevAppEnv = useIsDevelopmentAppEnv();
  const accessLabel = loading ? null : formatRolesLabel(role, additionalRoles);

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
      const hasAdmin = anyEffectiveRole(role, additionalRoles, ["admin"]);
      const useInternalSupportTickets = hasAdmin;
      const useWorkspacePortal =
        anyEffectiveRole(role, additionalRoles, ["customer_support", "client"]) && !useInternalSupportTickets;

      if (item.href === "/timesheets") {
        return anyEffectiveRole(role, additionalRoles, item.roles) || canAccessProjectManagementTimesheets;
      }
      if (item.href === "/workspace/timesheets") {
        if (anyEffectiveRole(role, additionalRoles, ["customer_support"])) return false;
        return canAccessWorkspaceTimesheets;
      }
      if (item.href === "/debug-capture" && !isDevAppEnv) {
        return false;
      }
      if (item.href === "/workspace/client") {
        // Admins reach it under Workspace; clients need "Access to client workspace" on their contact.
        return canAccessClientWorkspace && !hasAdmin;
      }
      if (item.href.startsWith("/workspace/")) {
        if (hasAdmin) return false;
        if (item.href === "/workspace/timesheets") {
          return canAccessWorkspaceTimesheets;
        }
        return useWorkspacePortal && anyEffectiveRole(role, additionalRoles, item.roles);
      }
      if (item.href.startsWith("/support-tickets")) {
        return useInternalSupportTickets && anyEffectiveRole(role, additionalRoles, item.roles);
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
          (group.id === "workspace" && (canAccessWorkspaceTimesheets || canAccessClientWorkspace));
        return groupAllowed && group.items.length > 0;
      });
      }, [
        role,
        additionalRoles,
        canAccessProjectManagementTimesheets,
        canAccessWorkspaceTimesheets,
        canAccessClientWorkspace,
        impersonation,
        isDevAppEnv,
      ]);

  const showWorkspaceHome =
    !loading && role !== "client" && !isRestrictedToWorkspaceOnly(role, additionalRoles);
  const workspaceHomeActive = pathUnder("/my-workspace", pathname);
  /** Admins get Workspace as a group: their home plus the Client workspace preview. */
  const workspaceSubItems: NavItem[] = anyEffectiveRole(role, additionalRoles, ["admin"])
    ? [
        { href: "/my-workspace", label: "Home", icon: Home, roles: [] },
        { href: "/workspace/client", label: "Client workspace", icon: Building2, roles: [] },
      ]
    : [];
  const workspaceGroupActive = workspaceSubItems.some((item) => pathUnder(item.href, pathname));
  const workspaceGroupOpen = openGroups["my-workspace"] ?? workspaceGroupActive;

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
        <div className={`min-w-0 ${sidebarCollapsed ? "px-2 py-3" : "border-b border-gray-100 px-4 py-5 dark:border-gray-800"}`}>
          <div
            className={
              sidebarCollapsed
                ? "flex flex-col items-center gap-2"
                : "flex items-start justify-between gap-3"
            }
          >
            <Link
              href={defaultLandingPath(role, additionalRoles)}
              className={sidebarCollapsed ? "shrink-0" : "min-w-0 flex-1 rounded-lg outline-offset-2 hover:opacity-95"}
              title="TechBubble TIBOSX"
            >
              <TechBubbleLogo
                variant="sidebar"
                compact={sidebarCollapsed}
                showProductLabel={!sidebarCollapsed}
              />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          {!sidebarCollapsed ? (
            <>
              {!loading && accessLabel ? (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Signed in as
                  </p>
                  <p className="mt-0.5 text-xs font-medium leading-snug text-gray-800 dark:text-gray-200">
                    {accessLabel}
                  </p>
                  {impersonation ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                      Impersonating another user
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : !loading && accessLabel ? (
            <div
              className="mt-2 w-full rounded-md bg-gray-50 px-1 py-1.5 text-center dark:bg-gray-950/60"
              title={`Signed in as: ${accessLabel}${impersonation ? " (impersonating)" : ""}`}
            >
              <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-gray-400">Role</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-tight text-gray-700 dark:text-gray-300">
                {accessLabel}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {showWorkspaceHome && workspaceSubItems.length && sidebarCollapsed ? (
            <div className="mb-2 space-y-1">
              {workspaceSubItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label === "Home" ? workspaceNavItem.label : item.label}
                    className={`flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                      pathUnder(item.href, pathname)
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : showWorkspaceHome && workspaceSubItems.length ? (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, "my-workspace": !workspaceGroupOpen }))}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  workspaceGroupActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Home className="h-4 w-4 shrink-0" />
                  <span className="truncate">{workspaceNavItem.label}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${workspaceGroupOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {workspaceGroupOpen ? (
                <div className="mt-1 space-y-0.5 pl-2">
                  {workspaceSubItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          pathUnder(item.href, pathname)
                            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : showWorkspaceHome ? (
            <Link
              href={workspaceNavItem.href}
              title={sidebarCollapsed ? workspaceNavItem.label : undefined}
              className={`mb-2 flex items-center rounded-lg text-sm font-semibold transition-colors ${
                sidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2.5"
              } ${
                workspaceHomeActive
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              {sidebarCollapsed ? null : <span className="truncate">{workspaceNavItem.label}</span>}
            </Link>
          ) : null}
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
        <header className="flex flex-wrap items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900 lg:px-8">
          <div className="flex items-center gap-3">
            <TicketPortalLink />
            {!loading && email ? <HelpSupportHeaderButton /> : null}
            {!loading && email ? (
              <UserAccountMenu
                name={userName}
                email={email}
                photoUrl={profilePhotoUrl}
                profileHref="/settings/profile"
                accessLabel={accessLabel}
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
      <AppAlertProvider>
        <MfaEnrollmentGuard>
          <MemberOnboardingGuard>
            <AgreementOnboardingGate />
            <MemberProfileCompletionGate />
            <InactivityLogout />
            <DashboardChrome>{children}</DashboardChrome>
            <DebugModeGate />
          </MemberOnboardingGuard>
        </MfaEnrollmentGuard>
      </AppAlertProvider>
    </AdminSessionProvider>
  );
}
