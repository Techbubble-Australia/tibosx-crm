"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bug, CalendarRange, KanbanSquare, LogOut, Plus, Ticket } from "lucide-react";
import { TicketStatusesProvider } from "@/components/TicketStatusesProvider";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";

function navClass(active: boolean): string {
  return active ? "dp-nav-link dp-nav-link-active" : "dp-nav-link";
}

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const onTickets =
    pathname === "/tickets" || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new");
  const onNew = pathname === "/tickets/new";
  const onBoard = pathname === "/board";
  const onSprints = pathname === "/sprints";
  /** Ticket detail uses the wide layout so the activity column has room. */
  const onTicketDetail = pathname.startsWith("/tickets/") && pathname !== "/tickets/new";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/board" className="flex items-center gap-2 rounded-lg pr-2 transition-opacity hover:opacity-90">
              <span className="dp-brand-mark">
                <Bug className="h-5 w-5" aria-hidden />
              </span>
              <span className="hidden font-semibold text-slate-900 sm:inline">Debug portal</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Main">
              <Link href="/board" className={navClass(onBoard)}>
                <KanbanSquare className="mr-1.5 inline h-4 w-4 opacity-70" aria-hidden />
                Board
              </Link>
              <Link href="/sprints" className={navClass(onSprints)}>
                <CalendarRange className="mr-1.5 inline h-4 w-4 opacity-70" aria-hidden />
                Sprints
              </Link>
              <Link href="/tickets" className={navClass(onTickets)}>
                <Ticket className="mr-1.5 inline h-4 w-4 opacity-70" aria-hidden />
                Tickets
              </Link>
              <Link href="/tickets/new" className={navClass(onNew)}>
                <Plus className="mr-1.5 inline h-4 w-4 opacity-70" aria-hidden />
                New ticket
              </Link>
            </nav>
          </div>
          <button type="button" onClick={() => void logout()} className="dp-btn-secondary py-2">
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </header>
      <main
        className={`mx-auto ${
          onBoard || onTicketDetail ? "max-w-[100rem] px-3 py-5 sm:px-4" : "max-w-6xl px-4 py-8 sm:px-6"
        }`}
      >
        <ConfirmDialogProvider>
          <TicketStatusesProvider>{children}</TicketStatusesProvider>
        </ConfirmDialogProvider>
      </main>
    </div>
  );
}
