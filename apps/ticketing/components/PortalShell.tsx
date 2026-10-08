"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LifeBuoy, LogOut, Plus, Ticket, Users } from "lucide-react";

type User = {
  name: string;
  email: string;
  role: string;
  tbosRole?: string | null;
  organization?: { name: string } | null;
};

const clientNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "My tickets", icon: Ticket },
  { href: "/tickets/new", label: "New ticket", icon: Plus },
];

const consultantNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/tickets/new", label: "New ticket", icon: Plus },
  { href: "/consultant", label: "By company", icon: Users },
];

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  if (href === "/tickets") {
    return pathname.startsWith("/tickets/") && !pathname.startsWith("/tickets/new");
  }
  return pathname.startsWith(`${href}/`);
}

export function PortalShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isConsultant = user.role === "CONSULTANT";
  const isTbosAdmin = (user.tbosRole || "").toLowerCase() === "admin";
  const nav = isConsultant ? consultantNav : clientNav;

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">TechBubble Support</p>
              <p className="text-xs text-slate-500">
                {isConsultant
                  ? isTbosAdmin
                    ? "TBOS admin · all companies"
                    : "Consultant workspace"
                  : user.organization?.name ?? "Client portal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {nav.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {nav.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function EmptyTickets() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
      <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <p className="font-medium text-slate-700">No tickets yet</p>
      <p className="mt-1 text-sm">Submit a request and our team will respond shortly.</p>
      <Link
        href="/tickets/new"
        className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        Create ticket
      </Link>
    </div>
  );
}
