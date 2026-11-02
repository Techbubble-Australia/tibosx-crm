"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bug, LogOut, Plus } from "lucide-react";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-sky-600" />
            <span className="font-semibold">Debug tickets</span>
            <Link
              href="/tickets"
              className={`ml-4 text-sm ${
                pathname === "/tickets" || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new")
                  ? "font-medium text-sky-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All tickets
            </Link>
            <Link
              href="/tickets/new"
              className={`inline-flex items-center gap-1 text-sm ${pathname === "/tickets/new" ? "font-medium text-sky-700" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Plus className="h-4 w-4" />
              New ticket
            </Link>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
