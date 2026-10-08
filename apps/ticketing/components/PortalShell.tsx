"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LifeBuoy, LogOut, Plus, Ticket } from "lucide-react";

type User = {
  name: string;
  email: string;
  role: string;
  organization?: { name: string } | null;
};

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

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-6 w-6" />
            <div>
              <p className="font-semibold">Client Support</p>
              <p className="text-xs text-gray-500">
                {isConsultant ? "Consultant console" : user.organization?.name ?? "Client portal"}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className={pathname === "/dashboard" ? "font-medium text-black" : "text-gray-600 hover:text-black"}
            >
              Dashboard
            </Link>
            <Link
              href="/tickets"
              className={pathname.startsWith("/tickets") ? "font-medium text-black" : "text-gray-600 hover:text-black"}
            >
              Tickets
            </Link>
            {isConsultant ? (
              <Link
                href="/consultant"
                className={pathname === "/consultant" ? "font-medium text-black" : "text-gray-600 hover:text-black"}
              >
                All clients
              </Link>
            ) : (
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-white"
              >
                <Plus className="h-4 w-4" />
                New ticket
              </Link>
            )}
            <span className="hidden text-gray-500 sm:inline">{user.name}</span>
            <button type="button" onClick={() => void logout()} className="text-gray-500 hover:text-black" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function EmptyTickets() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
      <Ticket className="mx-auto mb-2 h-8 w-8 text-gray-300" />
      <p>No tickets yet.</p>
    </div>
  );
}
