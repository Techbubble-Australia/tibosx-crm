"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type SearchRow = { id: string; email: string; name: string | null; role: string };

export function ImpersonateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setRows([]);
      return;
    }
    if (q.trim().length < 2) {
      setRows([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setLoading(true);
      void adminFetch(`/api/auth/impersonate/search?q=${encodeURIComponent(q.trim())}`)
        .then((res) => res.json())
        .then((data) => setRows((data.data as SearchRow[]) ?? []))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, q]);

  async function startImpersonation(userId: string) {
    setStarting(userId);
    try {
      const res = await fetch("/api/auth/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed");
      window.location.href = "/settings/profile";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to impersonate");
    } finally {
      setStarting(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Impersonate user</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search active users by name or email…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {q.trim().length < 2 ? (
            <li className="px-3 py-4 text-center text-sm text-gray-500">Type at least 2 characters to search.</li>
          ) : loading ? (
            <li className="flex justify-center py-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </li>
          ) : rows.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-gray-500">No matching users.</li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.name || row.email}</p>
                  <p className="truncate text-xs text-gray-500">{row.email}</p>
                </div>
                <button
                  type="button"
                  disabled={starting === row.id}
                  onClick={() => void startImpersonation(row.id)}
                  className="shrink-0 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {starting === row.id ? "…" : "View as"}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
